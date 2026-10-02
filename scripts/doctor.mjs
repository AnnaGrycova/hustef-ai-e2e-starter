#!/usr/bin/env node
// npm run doctor
//
// Checks the workshop setup: tools, Playwright's browser, and that this machine and Playwright's
// browser can reach everything the workshop uses. Prints a table with a fix for every red line, then
// sends the report to the companion app (HUSTEF_TOKEN in .env) so the facilitator sees who is ready.
//
// Plain Node.js (20+), no dependencies. The two browser checks use @playwright/test from node_modules
// (run `npm ci` first). Works on Windows, macOS and Linux.
//
// Options: --json (print the report as JSON), --no-send (do not POST to the companion app).

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const isWindows = process.platform === 'win32';
const NET_TIMEOUT_MS = 8000;
const BROWSER_TIMEOUT_MS = 20000;
// Printed for manual entry in the companion app when all checks pass and no token is set.
const MANUAL_CODE = Buffer.from('R1JNLVJFQURZLURPQzE=', 'base64').toString('utf8');

// ---------------------------------------------------------------------------------------------
// .env (same rules as dotenv for simple files: KEY=value, # comments, optional quotes)

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return false;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2];
    if (/^(['"`]).*\1/.test(value)) {
      value = value.slice(1, value.indexOf(value[0], 1));
    } else {
      value = value.replace(/(^|\s+)#.*$/, '').trim();
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
  return true;
}
const hasDotEnv = loadDotEnv(path.join(ROOT, '.env'));

const env = (name, fallback = '') => (process.env[name] ?? '').trim() || fallback;
const HUSTEF_URL = env('HUSTEF_URL', 'https://hustef.shiwa.io').replace(/\/$/, '');
const GREMLIN_URL = env('GREMLIN_URL', 'https://gremlin.shiwa.io').replace(/\/$/, '');
const HUSTEF_TOKEN = env('HUSTEF_TOKEN');
const AI_TOOL = env('AI_TOOL');

// ---------------------------------------------------------------------------------------------
// Proxy: Node's fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1 (Node 22.21+ and 24+).
// When a proxy is set, run the doctor again in a child process with that switch on.

const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
const proxyUrl = env('HTTPS_PROXY') || env('https_proxy') || env('HTTP_PROXY') || env('http_proxy');
const envProxySupported = nodeMajor >= 24 || (nodeMajor === 22 && nodeMinor >= 21);

// ---------------------------------------------------------------------------------------------

function maskProxy(url) {
  if (!url) return 'none';
  try {
    const u = new URL(url);
    if (u.username || u.password) {
      u.username = '***';
      u.password = '';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return 'set (not a valid URL)';
  }
}

function run(command, commandArgs) {
  // On Windows npm is npm.cmd, which Node only starts through a shell.
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', shell: isWindows, timeout: 15000, windowsHide: true });
  if (result.error || result.status !== 0) return undefined;
  return (result.stdout || '').trim();
}

function osName() {
  const release = os.release();
  if (process.platform === 'darwin') {
    const product = run('sw_vers', ['-productVersion']);
    return `macOS ${product ?? release} (${process.arch})`;
  }
  if (isWindows) return `Windows ${release} (${process.arch})`;
  let distro = '';
  try {
    distro = fs.readFileSync('/etc/os-release', 'utf8').match(/^PRETTY_NAME="?([^"\n]*)"?/m)?.[1] ?? '';
  } catch {}
  return `Linux ${distro || release} (${process.arch})`;
}

function findChrome() {
  const candidates = [];
  if (isWindows) {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (base) candidates.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    candidates.push(path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'));
  } else {
    candidates.push('/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable');
  }
  const found = candidates.find((file) => fs.existsSync(file));
  if (!found) return undefined;
  let version;
  if (isWindows) {
    // The version is the name of the folder next to chrome.exe.
    try {
      version = fs.readdirSync(path.dirname(found)).find((name) => /^\d+\.\d+\.\d+\.\d+$/.test(name));
    } catch {}
  } else {
    version = run(found, ['--version'])?.replace(/^Google Chrome\s*/, '');
  }
  return { path: found, version: version || 'installed' };
}

function loadPlaywright() {
  try {
    const require = createRequire(path.join(ROOT, 'package.json'));
    const pkg = require('@playwright/test/package.json');
    return { version: pkg.version, modulePath: require.resolve('@playwright/test') };
  } catch {
    return undefined;
  }
}

function describeError(error) {
  if (error?.name === 'TimeoutError') return { code: 'TIMEOUT', message: `no answer within ${NET_TIMEOUT_MS / 1000} s` };
  // fetch wraps the real reason in error.cause, sometimes several levels deep.
  const chain = [];
  for (let e = error, i = 0; e && i < 6; e = e.cause, i++) chain.push(e);
  const proxyError = chain.find((e) => /Proxy response \((\d+)\)/.test(String(e?.message)));
  if (proxyError) {
    const status = String(proxyError.message).match(/Proxy response \((\d+)\)/)[1];
    return { code: `PROXY_${status}`, message: `the proxy refused the connection (HTTP ${status})` };
  }
  const deepest = [...chain].reverse().find((e) => e?.code) ?? chain[chain.length - 1] ?? error;
  const code = deepest?.code || deepest?.name || 'ERROR';
  if (code === 'UND_ERR_CONNECT_TIMEOUT') return { code: 'TIMEOUT', message: 'connection timed out' };
  return { code, message: String(deepest?.message || error?.message || error).split('\n')[0] };
}

/** Any HTTP response means the host is reachable. DNS, TLS, proxy and timeout errors mean it is not. */
async function reach(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(NET_TIMEOUT_MS) });
    response.body?.cancel().catch(() => {});
    return { ok: true, ms: Date.now() - started, detail: `HTTP ${response.status}` };
  } catch (error) {
    const { code, message } = describeError(error);
    return { ok: false, ms: Date.now() - started, detail: `${code}: ${message}`, code };
  }
}

async function reachAll(urls, { any = false } = {}) {
  const results = await Promise.all(urls.map(async (url) => ({ url, ...(await reach(url)) })));
  const ok = any ? results.some((r) => r.ok) : results.every((r) => r.ok);
  const ms = Math.max(...results.map((r) => r.ms));
  const detail = results.map((r) => `${new URL(r.url).host} ${r.ok ? r.detail : `FAILED ${r.detail}`}`).join('; ');
  return { ok, ms, detail, codes: results.filter((r) => !r.ok).map((r) => r.code) };
}

// Endpoints per AI tool (the hosts each tool's own docs list, plus the sign-in host where it matters).
const AI_ENDPOINTS = {
  'copilot-vscode': ['https://api.githubcopilot.com', 'https://github.com'],
  'copilot-cli': ['https://api.githubcopilot.com', 'https://github.com'],
  'claude-code': ['https://api.anthropic.com', 'https://claude.ai', 'https://platform.claude.com'],
  codex: ['https://api.openai.com', 'https://chatgpt.com'],
  cursor: ['https://api2.cursor.sh', 'https://cursor.com'],
  opencode: ['https://opencode.ai'],
  antigravity: ['https://antigravity.google', 'https://cloudcode-pa.googleapis.com'],
};
const AI_COMMON = ['https://api.githubcopilot.com', 'https://api.anthropic.com', 'https://api.openai.com', 'https://api2.cursor.sh'];

async function browserChecks(playwright) {
  const fail = (detail) => ({ ok: false, ms: 0, detail });
  if (!playwright) {
    const detail = '@playwright/test is not installed';
    return { companion: fail(detail), gremlin: fail(detail) };
  }
  let chromium;
  try {
    ({ chromium } = createRequire(path.join(ROOT, 'package.json'))(playwright.modulePath));
  } catch (error) {
    const detail = `cannot load @playwright/test: ${error.message}`;
    return { companion: fail(detail), gremlin: fail(detail) };
  }
  let browser;
  const started = Date.now();
  try {
    browser = await chromium.launch({
      executablePath: env('PW_CHROMIUM_PATH') || undefined,
      proxy: env('PW_PROXY_SERVER') ? { server: env('PW_PROXY_SERVER'), bypass: env('PW_PROXY_BYPASS') || undefined } : undefined,
      timeout: BROWSER_TIMEOUT_MS,
    });
  } catch (error) {
    const detail = `Chromium did not start: ${String(error.message).split('\n')[0]}`;
    return { companion: { ...fail(detail), ms: Date.now() - started }, gremlin: { ...fail(detail), ms: Date.now() - started } };
  }
  const load = async (url, verify) => {
    const t = Date.now();
    const page = await browser.newPage();
    try {
      const response = await page.goto(url, { timeout: BROWSER_TIMEOUT_MS });
      const detail = await verify(response, page);
      return { ok: true, ms: Date.now() - t, detail };
    } catch (error) {
      return { ok: false, ms: Date.now() - t, detail: String(error.message).split('\n')[0].replace(/^page\.goto: /, '') };
    } finally {
      await page.close().catch(() => {});
    }
  };
  const companion = await load(`${HUSTEF_URL}/doctor-check`, async (_response, page) => {
    const code = (await page.locator('#doctor-code').textContent({ timeout: 5000 }))?.trim();
    if (code !== 'DOCTOR-BROWSER-OK') throw new Error(`#doctor-code is "${code}", expected DOCTOR-BROWSER-OK`);
    return `${new URL(HUSTEF_URL).host}/doctor-check shows ${code}`;
  });
  const gremlin = await load(`${GREMLIN_URL}/health`, async (response) => {
    const body = await response?.json().catch(() => undefined);
    if (body?.service !== 'gremlin-bank' || body?.ok !== true) throw new Error(`unexpected /health answer (HTTP ${response?.status()})`);
    return `${new URL(GREMLIN_URL).host}/health ok, release ${body.release}`;
  });
  await browser.close();
  return { companion, gremlin };
}

// ---------------------------------------------------------------------------------------------

function hintFor(check, codes = [], detail = '') {
  const tls = codes.some((c) => /CERT|SELF_SIGNED|UNABLE_TO|TLS|SSL/.test(String(c)));
  const dns = codes.some((c) => c === 'ENOTFOUND' || c === 'EAI_AGAIN');
  const timeout = codes.some((c) => c === 'TIMEOUT' || c === 'ETIMEDOUT' || c === 'ECONNRESET' || c === 'ECONNREFUSED');
  const proxyRefused = codes.find((c) => /^PROXY_\d+$/.test(String(c)));
  const netHint = [
    proxyRefused === 'PROXY_407' && 'The proxy wants a login (HTTP 407): put it into HTTPS_PROXY (http://user:password@proxy:port). NTLM or Kerberos proxies need a local helper (for example px or cntlm); Claude Code does not support them directly.',
    proxyRefused && proxyRefused !== 'PROXY_407' && `The proxy (${maskProxy(proxyUrl)}) refused this host. Ask IT to allow it (HTTPS, port 443), or use your phone hotspot.`,
    tls && 'TLS error: your network inspects HTTPS. Point NODE_EXTRA_CA_CERTS at your company CA bundle (PEM), or set NODE_USE_SYSTEM_CA=1 (Node 22.19+ / 24.6+).',
    dns && !proxyUrl && 'Name not resolved: if your company uses a proxy, set HTTPS_PROXY (for example HTTPS_PROXY=http://proxy.company.local:8080) and NO_PROXY=localhost,127.0.0.1.',
    proxyUrl && !envProxySupported && `HTTPS_PROXY is set but Node ${process.versions.node} cannot use it for fetch. Install Node 24 LTS (or 22.21+).`,
    (dns || timeout) && 'Blocked by the company network? Use your phone hotspot for the day, or ask IT to allow the host (port 443).',
  ].filter(Boolean);
  switch (check) {
    case 'node': return ['Install Node.js 24 LTS from https://nodejs.org (22 works, 20 is the minimum).'];
    case 'npm': return ['npm comes with Node.js. Reinstall Node.js 24 LTS from https://nodejs.org.'];
    case 'git': return ['Install Git from https://git-scm.com/downloads and set user.name and user.email.'];
    case 'chrome': return ['Install Google Chrome from https://www.google.com/chrome/. Playwright MCP and CLI open Chrome by default.'];
    case 'pw-browsers': return ['Run: npx playwright install chromium', 'Slow or blocked download? See docs/TROUBLESHOOTING.md (PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT, proxy).'];
    case 'browser-companion':
    case 'browser-gremlin': {
      const d = detail;
      if (/did not start|install-deps|shared librar/i.test(d)) return ['Chromium did not start. Run: npx playwright install chromium', 'On Linux, install its system libraries: sudo npx playwright install-deps chromium'];
      if (/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/.test(d)) return [`The proxy refused this host for the browser. Ask IT to allow it (HTTPS, port 443), or use your phone hotspot.`];
      if (/ERR_CERT|SSL/.test(d)) return ['The browser does not trust the certificate (TLS inspection). On Windows and macOS install the company CA in the system store; on Linux import it into ~/.pki/nssdb (certutil).'];
      if (/ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|ERR_TIMED_OUT|Timeout/.test(d)) {
        return [
          proxyUrl
            ? 'The browser does not use your proxy. Set PW_PROXY_SERVER in .env to the same value as HTTPS_PROXY, then run the doctor again.'
            : 'The browser cannot reach the host. If the net-* line for the same host is green, the browser needs the proxy: set PW_PROXY_SERVER in .env.',
          'Blocked by the company network? Use your phone hotspot for the day.',
        ];
      }
      return ['Open the URL in Chrome on this laptop. If it works there, set PW_PROXY_SERVER in .env (same value as HTTPS_PROXY).'];
    }
    case 'net-ai': return [...netHint, AI_TOOL ? `Your AI tool (${AI_TOOL}) needs these hosts. Ask IT or use a hotspot.` : 'Set AI_TOOL in .env to check only the hosts of your tool.'];
    default: return netHint.length ? netHint : ['Check your network connection.'];
  }
}

async function main() {
  const checks = [];
  const add = (id, label, result, extra = {}) => checks.push({ id, label, ok: !!result.ok, ms: result.ms ?? 0, detail: result.detail ?? '', warn: result.warn, ...extra });

  // Tools
  const nodeOk = nodeMajor >= 20;
  add('node', 'Node.js', {
    ok: nodeOk,
    detail: `v${process.versions.node}${nodeMajor < 22 ? ' (works, but Node 20 is end-of-life: install 24 LTS)' : nodeMajor === 22 ? ' (works, 24 LTS recommended)' : ''}`,
    warn: nodeOk && nodeMajor < 24,
  });
  const npmVersion = run('npm', ['--version']);
  add('npm', 'npm', { ok: !!npmVersion, detail: npmVersion ? `v${npmVersion}` : 'npm not found' });
  const gitVersion = run('git', ['--version']);
  const gitUser = gitVersion ? run('git', ['config', 'user.name']) : undefined;
  add('git', 'Git', {
    ok: !!gitVersion,
    detail: gitVersion ? `${gitVersion.replace('git version ', 'v')}${gitUser ? '' : ' (user.name is not set: git config --global user.name "Your Name")'}` : 'git not found',
    warn: !!gitVersion && !gitUser,
  });
  const chrome = findChrome();
  add('chrome', 'Google Chrome', { ok: !!chrome, detail: chrome ? `${chrome.version} (${chrome.path})` : 'Google Chrome not found' });

  const playwright = loadPlaywright();
  let pwBrowser = { ok: false, detail: 'run npm ci first (@playwright/test is not installed)' };
  if (playwright) {
    try {
      const { chromium } = createRequire(path.join(ROOT, 'package.json'))(playwright.modulePath);
      const executable = env('PW_CHROMIUM_PATH') || chromium.executablePath();
      pwBrowser = fs.existsSync(executable)
        ? { ok: true, detail: `Playwright ${playwright.version}, Chromium at ${executable}${env('PW_CHROMIUM_PATH') ? ' (PW_CHROMIUM_PATH)' : ''}` }
        : { ok: false, detail: `Playwright ${playwright.version}, Chromium missing (${executable})` };
      if (playwright.version !== '1.63.0') pwBrowser = { ok: false, detail: `Playwright ${playwright.version} installed, the workshop needs 1.63.0: run npm ci` };
    } catch (error) {
      pwBrowser = { ok: false, detail: `cannot load @playwright/test: ${error.message}` };
    }
  }
  add('pw-browsers', 'Playwright Chromium', pwBrowser);

  // Network from Node (the same path npm, git and most AI tools use)
  const [companion, gremlin, npm, github, pwcdn, ai] = await Promise.all([
    reachAll([`${HUSTEF_URL}/api/ping`]),
    reachAll([`${GREMLIN_URL}/health`]),
    reachAll(['https://registry.npmjs.org/-/ping']),
    reachAll(['https://github.com', 'https://api.github.com']),
    reachAll(['https://cdn.playwright.dev', 'https://playwright.download.prss.microsoft.com'], { any: true }),
    AI_TOOL && AI_ENDPOINTS[AI_TOOL] ? reachAll(AI_ENDPOINTS[AI_TOOL]) : reachAll(AI_COMMON, { any: true }),
  ]);
  add('net-companion', 'Companion app', companion);
  add('net-gremlin', 'Gremlin Bank', gremlin);
  add('net-npm', 'npm registry', npm);
  add('net-github', 'GitHub', github);
  add('net-pwcdn', 'Playwright download', pwcdn);
  add('net-ai', `AI tool${AI_TOOL ? ` (${AI_TOOL})` : ' (any of the common ones)'}`, ai);

  // Network from Playwright's browser (the path the tests and the agents use)
  const browser = await browserChecks(playwright);
  add('browser-companion', 'Browser: companion', browser.companion);
  add('browser-gremlin', 'Browser: Gremlin Bank', browser.gremlin);

  const allOk = checks.every((c) => c.ok);
  const report = {
    version: 1,
    os: osName(),
    node: process.versions.node,
    npm: npmVersion ?? null,
    git: gitVersion?.replace('git version ', '') ?? null,
    chrome: chrome?.version ?? null,
    playwright: playwright?.version ?? null,
    tool: AI_TOOL || null,
    proxy: maskProxy(proxyUrl),
    checks: checks.map(({ id, ok, ms, detail }) => ({ id, ok, ms, detail })),
  };

  if (args.has('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTable(checks, { allOk });
  }

  // In --json mode stdout carries only the report; messages go to stderr.
  const say = (...m) => (args.has('--json') ? console.error(...m) : console.log(...m));
  if (!hasDotEnv) say('\nNo .env file yet: copy .env.example to .env (the setup script does this).');

  // Report to the companion app
  let sent = false;
  if (HUSTEF_TOKEN && !args.has('--no-send')) {
    try {
      const response = await fetch(`${HUSTEF_URL}/api/doctor`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${HUSTEF_TOKEN}` },
        body: JSON.stringify(report),
        signal: AbortSignal.timeout(NET_TIMEOUT_MS),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        sent = true;
        const unlocked = Array.isArray(body.unlocked) ? body.unlocked : [];
        say(`\nReport sent to ${new URL(HUSTEF_URL).host}. The facilitator can see your checks.`);
        if (unlocked.includes('ready-to-roll')) say('Unlocked: "Ready to roll".');
        else if (allOk) say('All green. "Ready to roll" is unlocked (or was already).');
        else say('"Ready to roll" unlocks when every check is green. Fix the red lines and run npm run doctor again.');
      } else if (response.status === 401 || response.status === 403) {
        say(`\nThe companion app did not accept HUSTEF_TOKEN (HTTP ${response.status}). Copy the token again from ${HUSTEF_URL}/me into .env.`);
      } else {
        say(`\nThe companion app answered HTTP ${response.status}. Report not stored.`);
      }
    } catch (error) {
      const { code, message } = describeError(error);
      say(`\nCould not send the report to ${HUSTEF_URL} (${code}: ${message}).`);
    }
  } else if (!HUSTEF_TOKEN) {
    say(`\nHUSTEF_TOKEN is empty, so the report was not sent. Join at ${HUSTEF_URL}/join and paste your token into .env.`);
  }
  if (allOk && !sent) {
    say(`All checks are green. Enter this code in the companion app to unlock "Ready to roll": ${MANUAL_CODE}`);
  }

  process.exitCode = allOk ? 0 : 1;
}

function printTable(checks, { allOk }) {
  const color = process.stdout.isTTY && !process.env.NO_COLOR;
  const paint = (code, text) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
  const status = (c) => (!c.ok ? paint('31', 'FAIL') : c.warn ? paint('33', 'WARN') : paint('32', 'OK  '));
  const idWidth = Math.max(...checks.map((c) => c.id.length));
  console.log(`\nWorkshop doctor (Node ${process.versions.node}, ${osName()}, proxy: ${maskProxy(proxyUrl)})\n`);
  for (const c of checks) {
    const ms = c.ms ? `${String(c.ms).padStart(5)} ms` : '        ';
    console.log(`  ${status(c)}  ${c.id.padEnd(idWidth)}  ${ms}  ${c.detail}`);
  }
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.log(`\n${failed.length} check${failed.length > 1 ? 's' : ''} failed. How to fix:`);
    for (const c of failed) {
      const codes = (c.detail.match(/FAILED [A-Za-z0-9_]+|^[A-Za-z0-9_]+:/g) ?? []).map((s) => s.replace(/^FAILED /, '').replace(/:$/, ''));
      console.log(`\n  ${c.id} (${c.label})`);
      for (const hint of hintFor(c.id, codes, c.detail)) console.log(`    - ${hint}`);
    }
    console.log('\nMore help: docs/TROUBLESHOOTING.md, or come to the setup desk at 8:30.');
  } else {
    console.log(`\nAll ${checks.length} checks passed.`);
  }
  void allOk;
}

// ---------------------------------------------------------------------------------------------
// Entry point (at the end, after every declaration)

if (proxyUrl && envProxySupported && process.env.NODE_USE_ENV_PROXY !== '1') {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' },
  });
  child.on('exit', (code) => process.exit(code ?? 1));
  child.on('error', (error) => {
    console.error(`Could not restart the doctor with NODE_USE_ENV_PROXY=1: ${error.message}`);
    process.exit(1);
  });
} else {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
