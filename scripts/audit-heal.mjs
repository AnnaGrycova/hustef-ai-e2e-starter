#!/usr/bin/env node
// Heal audit for pull requests (Lab 6). Plain Node.js, no dependencies.
//
//   node scripts/audit-heal.mjs [--base <ref>] [--head <ref>] [--report heal-report.json] [--out audit-heal.md]
//
// 1. Compares the test code under tests/ between the base and the head of the change (git diff).
//    Business values are literals that contain a digit (amounts, fees, totals, balances, limits, counts).
//    A business value that disappears from the test code is a changed (or deleted) expected value.
//    Values that only move between files (for example into a page object) do not count.
// 2. Validates heal-report.json (labs/lab-4/heal-report.schema.json): fields, classification,
//    expectedValueChanged.
// 3. Fails (exit code 1) when an expected business value changed and heal-report.json does not list that
//    change: an entry for the file with expectedValueChanged: true and classification BUG or a human
//    sign-off. Also fails when a DRIFT or UNSURE entry says expectedValueChanged: true without a human
//    sign-off, and when the report is invalid.
//
// Changed expected texts (toHaveText('...') and similar) are listed for review but do not fail the check:
// renamed messages are normal UI drift. The summary is written as Markdown for the GitHub job summary
// and the pull request comment.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryGit = (...a) => {
  try {
    return git(...a);
  } catch {
    return undefined;
  }
};

function resolveBase() {
  const explicit = opt('base');
  if (explicit) return explicit;
  const candidates = [process.env.GITHUB_BASE_REF && `origin/${process.env.GITHUB_BASE_REF}`, 'origin/main', 'main'].filter(Boolean);
  return candidates.find((ref) => tryGit('rev-parse', '--verify', '--quiet', `${ref}^{commit}`)) ?? 'HEAD~1';
}

const baseRef = resolveBase();
const headRef = opt('head', 'HEAD');
const reportPath = opt('report', 'heal-report.json');
const outPath = opt('out', 'audit-heal.md');
const mergeBase = tryGit('merge-base', baseRef, headRef) ?? baseRef;
const short = (ref) => tryGit('rev-parse', '--short', ref) ?? ref;

// ---------------------------------------------------------------------------------------------
// Literal extraction

/** Removes // and /* *\/ comments, keeping string contents intact. */
function stripComments(line, state) {
  let out = '';
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (state.block) {
      if (ch === '*' && next === '/') {
        state.block = false;
        i++;
      }
      continue;
    }
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i++;
      } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === '/' && next === '/') break;
    if (ch === '/' && next === '*') {
      state.block = true;
      i++;
      continue;
    }
    out += ch;
  }
  return out;
}

const IGNORED_NUMBER_CONTEXT = /(timeout\s*:\s*|setTimeout\(\s*|waitForTimeout\(\s*|\.nth\(\s*|repeatEach\s*:\s*|retries\s*:\s*|workers\s*:\s*|level\s*:\s*|padStart\(\s*|slice\(\s*)$/;

/** Literals that contain a digit: '300 HUF', 300, 100_000, "2,000,000". */
function businessLiterals(code) {
  const found = [];
  const stringRe = /(['"`])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = stringRe.exec(code))) {
    if (/\d/.test(m[2]) && !m[2].includes('${')) found.push({ value: normalize(m[2]), raw: m[2] });
  }
  const withoutStrings = code.replace(stringRe, (s) => ' '.repeat(s.length));
  const numberRe = /(?<![\w.$])(\d[\d_]*(?:\.\d+)?)(?![\w])/g;
  while ((m = numberRe.exec(withoutStrings))) {
    const before = withoutStrings.slice(0, m.index);
    if (IGNORED_NUMBER_CONTEXT.test(before)) continue;
    if (/\b(?:test|describe)\.(?:step|setTimeout)\($/.test(before)) continue;
    found.push({ value: normalize(m[1]), raw: m[1] });
  }
  return found;
}

/** Same value, same key: 100_000, 100000 and "100,000" are all 100000; "300 HUF" stays a text with its number normalized. */
function normalize(value) {
  const v = String(value).replace(/\s+/g, ' ').trim();
  return v.replace(/(\d)[_,](?=\d{3}\b)/g, '$1');
}

const MATCHER_TEXT_RE = /\.(?:toHaveText|toContainText|toBe|toEqual|toStrictEqual|toHaveValue|toHaveAttribute|toMatch|toHaveTitle|toHaveURL|toHaveAccessibleName|toHaveAccessibleDescription)\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
function expectedTexts(code) {
  const found = [];
  let m;
  while ((m = MATCHER_TEXT_RE.exec(code))) {
    if (!/\d/.test(m[2])) found.push(m[2].replace(/\s+/g, ' ').trim());
  }
  return found;
}

// ---------------------------------------------------------------------------------------------
// Diff

const changedFiles = (tryGit('diff', '--name-only', '--diff-filter=ADMR', mergeBase, headRef, '--', 'tests') ?? '')
  .split('\n')
  .filter((f) => /\.(m|c)?[jt]sx?$/.test(f));

const removed = []; // { file, line, value, text }
const added = [];
const removedTexts = [];
const addedTexts = [];

for (const file of changedFiles) {
  const diff = tryGit('diff', '-U0', '--no-color', mergeBase, headRef, '--', file) ?? '';
  let oldLine = 0;
  let newLine = 0;
  let hunkId = 0;
  const oldState = { block: false };
  const newState = { block: false };
  for (const raw of diff.split('\n')) {
    const hunk = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      hunkId++;
      continue;
    }
    if (raw.startsWith('---') || raw.startsWith('+++')) continue;
    if (raw.startsWith('-')) {
      const code = stripComments(raw.slice(1), oldState);
      for (const lit of businessLiterals(code)) removed.push({ file, hunk: hunkId, line: oldLine, ...lit });
      for (const value of expectedTexts(code)) removedTexts.push({ file, line: oldLine, value });
      oldLine++;
    } else if (raw.startsWith('+')) {
      const code = stripComments(raw.slice(1), newState);
      for (const lit of businessLiterals(code)) added.push({ file, hunk: hunkId, line: newLine, ...lit });
      for (const value of expectedTexts(code)) addedTexts.push({ file, line: newLine, value });
      newLine++;
    }
  }
}

/** Items of `a` whose value is not matched by an item of `b` (multiset difference). */
function missingFrom(a, b) {
  const pool = new Map();
  for (const item of b) pool.set(item.value, (pool.get(item.value) ?? 0) + 1);
  const result = [];
  for (const item of a) {
    const n = pool.get(item.value) ?? 0;
    if (n > 0) pool.set(item.value, n - 1);
    else result.push(item);
  }
  return result;
}

const changedValues = missingFrom(removed, added);
const newValues = missingFrom(added, removed);
const changedTexts = missingFrom(removedTexts, addedTexts);

// ---------------------------------------------------------------------------------------------
// heal-report.json

const CLASSIFICATIONS = ['DRIFT', 'BUG', 'UNSURE'];
const reportProblems = [];
let report;
let reportSource;
const reportInHead = tryGit('show', `${headRef}:${reportPath.replace(/\\/g, '/')}`);
if (headRef === 'HEAD' && fs.existsSync(reportPath)) {
  reportSource = fs.readFileSync(reportPath, 'utf8');
} else if (reportInHead !== undefined) {
  reportSource = reportInHead;
}
if (reportSource !== undefined) {
  try {
    report = JSON.parse(reportSource);
  } catch (error) {
    reportProblems.push(`not valid JSON: ${error.message}`);
  }
}

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const signedOff = (entry) => !!entry?.humanSignOff && isNonEmptyString(entry.humanSignOff.by);
const entries = Array.isArray(report?.entries) ? report.entries : [];

if (report) {
  if (report.version !== 1) reportProblems.push('version must be 1');
  if (!isNonEmptyString(report.createdAt)) reportProblems.push('createdAt is missing');
  if (![1, 2, 3, null].includes(report.release ?? null)) reportProblems.push('release must be 1, 2, 3 or null');
  if (!Array.isArray(report.entries)) reportProblems.push('entries must be an array');
  entries.forEach((e, i) => {
    const where = `entries[${i}]`;
    for (const field of ['test', 'file', 'error', 'change', 'tracePath', 'model', 'tool']) {
      if (!isNonEmptyString(e?.[field])) reportProblems.push(`${where}.${field} is missing`);
    }
    if (!CLASSIFICATIONS.includes(e?.classification)) reportProblems.push(`${where}.classification must be DRIFT, BUG or UNSURE`);
    if (typeof e?.expectedValueChanged !== 'boolean') reportProblems.push(`${where}.expectedValueChanged must be true or false`);
    if (e?.classification === 'BUG' && (!isNonEmptyString(e?.expected) || !isNonEmptyString(e?.observed))) {
      reportProblems.push(`${where}: a BUG entry needs "expected" and "observed"`);
    }
    if (e?.humanSignOff !== undefined && !signedOff(e)) reportProblems.push(`${where}.humanSignOff needs "by"`);
  });
}

const entriesForFile = (file) =>
  entries.filter((e) => [e?.file, e?.test, e?.change].some((v) => typeof v === 'string' && v.replace(/\\/g, '/').includes(file)));

const blocking = [];
const valueRows = changedValues.map((item) => {
  const matches = entriesForFile(item.file);
  const documented = matches.find((e) => e.expectedValueChanged === true && (e.classification === 'BUG' || signedOff(e)));
  const replacement = newValues.filter((n) => n.file === item.file && n.hunk === item.hunk).map((n) => n.raw);
  if (!documented) blocking.push(`${item.file}:${item.line}: expected value "${item.raw}" changed or removed, and ${reportPath} does not list it (an entry for this file with expectedValueChanged: true and classification BUG or a human sign-off)`);
  return {
    ...item,
    after: replacement.length ? replacement.join(', ') : '(removed)',
    status: documented ? `documented (${documented.classification}${signedOff(documented) ? `, signed off by ${documented.humanSignOff.by}` : ''})` : 'NOT DOCUMENTED',
  };
});

for (const [i, e] of entries.entries()) {
  if (e?.expectedValueChanged === true && e?.classification !== 'BUG' && !signedOff(e)) {
    blocking.push(`${reportPath} entries[${i}] (${e.test ?? e.file}): expectedValueChanged is true for a ${e.classification} entry without a human sign-off`);
  }
}
if (reportProblems.length) blocking.push(`${reportPath} is invalid: ${reportProblems.join('; ')}`);
if (changedValues.length && reportSource === undefined) blocking.push(`expected values changed, but there is no ${reportPath}`);

// The diff shows a changed value, but the matching entry says no expected value changed.
const inconsistent = valueRows.filter((r) => entriesForFile(r.file).some((e) => e.expectedValueChanged === false));

const bugWithoutFixme = entries.filter((e) => e?.classification === 'BUG' && isNonEmptyString(e?.file)).filter((e) => {
  const content = headRef === 'HEAD' && fs.existsSync(e.file) ? fs.readFileSync(e.file, 'utf8') : tryGit('show', `${headRef}:${e.file}`) ?? '';
  return !/test\.fixme\(/.test(content);
});

// ---------------------------------------------------------------------------------------------
// Summary

const counts = Object.fromEntries(CLASSIFICATIONS.map((c) => [c, entries.filter((e) => e?.classification === c).length]));
const escape = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const lines = [];
lines.push('## Heal audit');
lines.push('');
lines.push(`Result: **${blocking.length ? 'FAIL' : 'PASS'}**`);
lines.push('');
lines.push(`- Compared: \`${short(mergeBase)}\` (merge base with \`${baseRef}\`) to \`${short(headRef)}\``);
lines.push(`- Test files changed under \`tests/\`: ${changedFiles.length}`);
lines.push(`- Expected business values changed or removed: ${changedValues.length}`);
lines.push(`- Expected texts changed (review, not blocking): ${changedTexts.length}`);
if (reportSource === undefined) {
  lines.push(`- \`${reportPath}\`: not found`);
} else {
  lines.push(`- \`${reportPath}\`: ${reportProblems.length ? 'INVALID' : 'valid'}, ${entries.length} entries (DRIFT ${counts.DRIFT}, BUG ${counts.BUG}, UNSURE ${counts.UNSURE})${report?.tool ? `, tool ${escape(report.tool)}` : ''}${report?.model ? `, model ${escape(report.model)}` : ''}`);
}
if (valueRows.length) {
  lines.push('');
  lines.push('### Expected business values');
  lines.push('');
  lines.push('| Where (base) | Before | After (same file) | heal-report.json |');
  lines.push('|---|---|---|---|');
  for (const r of valueRows) lines.push(`| \`${r.file}:${r.line}\` | \`${escape(r.raw)}\` | \`${escape(r.after)}\` | ${r.status} |`);
}
if (changedTexts.length) {
  lines.push('');
  lines.push('### Expected texts (review)');
  lines.push('');
  lines.push('| Where (base) | Before | Now in the file |');
  lines.push('|---|---|---|');
  for (const t of changedTexts) {
    const now = missingFrom(addedTexts, removedTexts).filter((a) => a.file === t.file).map((a) => a.value);
    lines.push(`| \`${t.file}:${t.line}\` | ${escape(t.value)} | ${now.length ? escape(now.join('; ')) : '(removed)'} |`);
  }
}
if (entries.length) {
  lines.push('');
  lines.push('### heal-report.json entries');
  lines.push('');
  lines.push('| Test | Classification | Change | Expected value changed | Human sign-off |');
  lines.push('|---|---|---|---|---|');
  for (const e of entries) {
    lines.push(`| ${escape(e?.test ?? '')} | ${escape(e?.classification ?? '')} | ${escape(e?.change ?? '')} | ${e?.expectedValueChanged === true ? 'yes' : e?.expectedValueChanged === false ? 'no' : '?'} | ${signedOff(e) ? escape(e.humanSignOff.by) : '-'} |`);
  }
}
if (inconsistent.length) {
  lines.push('');
  lines.push(`Inconsistent: \`${reportPath}\` says \`expectedValueChanged: false\` for ${[...new Set(inconsistent.map((r) => `\`${r.file}\``))].join(', ')}, but the diff changes an expected value there. Check the report against the diff.`);
}
if (bugWithoutFixme.length) {
  lines.push('');
  lines.push(`Note: BUG entries whose test file has no \`test.fixme(\`: ${bugWithoutFixme.map((e) => `\`${e.file}\``).join(', ')}`);
}
if (blocking.length) {
  lines.push('');
  lines.push('### Why the check failed');
  lines.push('');
  for (const b of blocking) lines.push(`- ${escape(b)}`);
  lines.push('');
  lines.push('Fix: undo the changed expected value and mark the test with `test.fixme()` (BUG). If a person decided that the new value is correct, list the change in the matching entry (`expectedValueChanged: true`) and add a `humanSignOff` (`by`, `at`, `reason`).');
}
lines.push('');

const markdown = lines.join('\n');
fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, markdown);
console.log(markdown);
process.exitCode = blocking.length ? 1 : 0;
