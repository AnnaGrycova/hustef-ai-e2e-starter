#!/usr/bin/env node
// Reports a CI event to the workshop companion app (Lab 6). Used by .github/workflows/e2e.yml and review.yml.
//
//   node scripts/report-to-companion.mjs --event run --status success|failure [--release 2] [--results test-results/results.json]
//   node scripts/report-to-companion.mjs --event review_approved
//
// Needs the repository secret HUSTEF_TOKEN (your personal token from the companion app). Without it,
// this script does nothing. It never fails the workflow: problems are printed, the exit code is 0.

import fs from 'node:fs';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const token = (process.env.HUSTEF_TOKEN ?? '').trim();
const baseUrl = (process.env.HUSTEF_URL || 'https://hustef.shiwa.io').replace(/\/$/, '');
const event = opt('event', 'run');
const status = opt('status', event === 'review_approved' ? 'success' : 'failure');

if (!token) {
  console.log('HUSTEF_TOKEN is not set: nothing reported to the companion app. Add it as a repository secret (Settings > Secrets and variables > Actions).');
  process.exit(0);
}
if (!['run', 'review_approved'].includes(event) || !['success', 'failure'].includes(status)) {
  console.log(`Unknown event "${event}" or status "${status}": nothing reported.`);
  process.exit(0);
}

function counts(file) {
  try {
    const stats = JSON.parse(fs.readFileSync(file, 'utf8')).stats ?? {};
    return { passed: (stats.expected ?? 0) + (stats.flaky ?? 0), failed: stats.unexpected ?? 0 };
  } catch {
    return { passed: null, failed: null };
  }
}

const releaseArg = opt('release', process.env.RELEASE_UNDER_TEST ?? '');
const release = ['1', '2', '3'].includes(String(releaseArg)) ? Number(releaseArg) : null;
const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
const repo = process.env.GITHUB_REPOSITORY || null;
const runUrl = repo && process.env.GITHUB_RUN_ID ? `${server}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
const sha = process.env.HEAD_SHA || process.env.GITHUB_SHA || null;
const { passed, failed } = event === 'run' ? counts(opt('results', 'test-results/results.json')) : { passed: null, failed: null };

const payload = { event, status, release, repo, runUrl, sha, passed, failed };
console.log(`Reporting to ${baseUrl}/api/ci: ${JSON.stringify(payload)}`);

try {
  const response = await fetch(`${baseUrl}/api/ci`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok) {
    const unlocked = Array.isArray(body.unlocked) ? body.unlocked : [];
    console.log(unlocked.length ? `Unlocked: ${unlocked.join(', ')}` : 'Stored. Nothing new unlocked.');
  } else if (response.status === 401 || response.status === 403) {
    console.log(`The companion app did not accept HUSTEF_TOKEN (HTTP ${response.status}). Copy the token again from ${baseUrl}/me into the repository secret.`);
  } else {
    console.log(`The companion app answered HTTP ${response.status}.`);
  }
} catch (error) {
  console.log(`Could not reach ${baseUrl}: ${error.cause?.code ?? error.name} ${error.cause?.message ?? error.message}`);
}
