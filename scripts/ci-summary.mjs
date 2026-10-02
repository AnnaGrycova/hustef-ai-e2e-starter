#!/usr/bin/env node
// Writes the audit record of a CI run as Markdown (Lab 6). The workflow appends it to $GITHUB_STEP_SUMMARY.
//
//   node scripts/ci-summary.mjs [--results test-results/results.json] [--report heal-report.json]
//
// Environment: RELEASE_UNDER_TEST, RELEASE_SOURCE, TEST_OUTCOME and the standard GITHUB_* variables.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
};

const e = process.env;
const server = e.GITHUB_SERVER_URL || 'https://github.com';
const runUrl = e.GITHUB_REPOSITORY && e.GITHUB_RUN_ID ? `${server}/${e.GITHUB_REPOSITORY}/actions/runs/${e.GITHUB_RUN_ID}` : '(local run)';
const sha = e.HEAD_SHA || e.GITHUB_SHA || '(unknown)';
let playwrightVersion = '(not installed)';
try {
  playwrightVersion = createRequire(path.resolve('package.json'))('@playwright/test/package.json').version;
} catch {}

const results = readJson(opt('results', 'test-results/results.json'));
const stats = results?.stats;
const report = readJson(opt('report', 'heal-report.json'));
const entries = Array.isArray(report?.entries) ? report.entries : [];
const count = (c) => entries.filter((x) => x?.classification === c).length;
const escape = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

const lines = [];
lines.push('## E2E audit record');
lines.push('');
lines.push('| | |');
lines.push('|---|---|');
lines.push(`| Result | **${e.TEST_OUTCOME === 'success' ? 'passed' : e.TEST_OUTCOME ? 'failed' : 'unknown'}** |`);
lines.push(`| Commit | \`${sha}\` ${e.GITHUB_REF_NAME ? `on \`${e.GITHUB_REF_NAME}\`` : ''} |`);
lines.push(`| Triggered by | ${escape(e.GITHUB_ACTOR || '(unknown)')} (${escape(e.GITHUB_EVENT_NAME || 'local')}) |`);
lines.push(`| Run | ${runUrl} |`);
lines.push(`| Playwright | ${playwrightVersion} |`);
lines.push(`| Gremlin Bank | ${escape(e.GREMLIN_URL || 'https://gremlin.shiwa.io')}, release ${escape(e.RELEASE_UNDER_TEST || '?')} (${escape(e.RELEASE_SOURCE || 'unknown source')}) |`);
// Tests marked test.fail() for a known bug: they count as "expected" in the stats, so list them on their own.
const knownBugs = [];
const walk = (suite) => {
  for (const child of suite?.suites ?? []) walk(child);
  for (const spec of suite?.specs ?? []) for (const t of spec.tests ?? []) if (t.expectedStatus === 'failed') knownBugs.push(spec.title);
};
for (const suite of results?.suites ?? []) walk(suite);
if (stats) {
  const passed = Math.max(0, (stats.expected ?? 0) - knownBugs.length);
  lines.push(`| Tests | ${passed} passed, ${knownBugs.length} known bugs (test.fail, failing as expected), ${stats.unexpected ?? 0} failed, ${stats.flaky ?? 0} flaky, ${stats.skipped ?? 0} skipped (fixme or skip) |`);
  lines.push(`| Duration | ${Math.round((stats.duration ?? 0) / 1000)} s |`);
} else {
  lines.push('| Tests | no results file (the test step did not finish) |');
}
lines.push(`| Evidence | artifacts \`playwright-report\` (HTML report) and \`test-results\` (traces with aria and screen snapshots, videos of failed tests), kept 30 days |`);
if (report) {
  lines.push(`| Heal report | ${entries.length} entries: DRIFT ${count('DRIFT')}, BUG ${count('BUG')}, UNSURE ${count('UNSURE')}; tool ${escape(report.tool ?? entries[0]?.tool ?? '?')}, model ${escape(report.model ?? entries[0]?.model ?? '?')} |`);
} else {
  lines.push('| Heal report | none in this commit |');
}

if (knownBugs.length) {
  lines.push('');
  lines.push(`Known bugs still failing as expected (test.fail): ${knownBugs.map((t) => escape(t)).join('; ')}. They turn red when the bug is fixed.`);
}

const bugs = entries.filter((x) => x?.classification === 'BUG');
if (bugs.length) {
  lines.push('');
  lines.push('### Open bugs from the heal report');
  lines.push('');
  lines.push('| Test | Expected | Observed |');
  lines.push('|---|---|---|');
  for (const b of bugs) lines.push(`| ${escape(b.test)} | ${escape(b.expected)} | ${escape(b.observed)} |`);
}
lines.push('');
console.log(lines.join('\n'));
