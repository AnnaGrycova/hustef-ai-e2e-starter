#!/usr/bin/env node
// Windows only, and only if your AI tool reports the MCP servers as failed ("Connection closed").
//
//   node scripts/mcp-windows.mjs          rewrite the MCP configs to start npx through cmd /c
//   node scripts/mcp-windows.mjs --undo   back to plain npx (what is committed)
//
// Some tools start MCP servers without a shell and cannot run npx.cmd directly. On Windows,
// `npx playwright init-agents` itself writes `cmd /c npx ...` for Claude Code and Codex.
// This script does the same for the committed configs. VS Code (.vscode/mcp.json) is not changed.
// The rewritten files show up in `git status`: do not commit them, macOS and Linux need plain npx.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const undo = process.argv.includes('--undo');
const changed = [];

function rewriteJson(rel, getServers, isArrayCommand = false) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const servers = getServers(data) ?? {};
  let touched = false;
  for (const server of Object.values(servers)) {
    if (isArrayCommand) {
      const cmd = server.command;
      if (!Array.isArray(cmd)) continue;
      if (!undo && cmd[0] === 'npx') { server.command = ['cmd', '/c', ...cmd]; touched = true; }
      if (undo && cmd[0] === 'cmd' && cmd[1] === '/c') { server.command = cmd.slice(2); touched = true; }
    } else {
      if (!undo && server.command === 'npx') { server.command = 'cmd'; server.args = ['/c', 'npx', ...(server.args ?? [])]; touched = true; }
      if (undo && server.command === 'cmd' && server.args?.[0] === '/c') { server.command = server.args[1]; server.args = server.args.slice(2); touched = true; }
    }
  }
  if (touched) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    changed.push(rel);
  }
}

function rewriteToml(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, 'utf8');
  // Git for Windows checks files out with CRLF line endings by default: keep whichever the file has.
  const after = undo
    ? before.replace(/command = "cmd"(\r?\n)args = \["\/c", "npx", /g, 'command = "npx"$1args = [')
    : before.replace(/command = "npx"(\r?\n)args = \[/g, 'command = "cmd"$1args = ["/c", "npx", ');
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(rel);
  }
}

rewriteJson('.mcp.json', (d) => d.mcpServers);
rewriteJson('.cursor/mcp.json', (d) => d.mcpServers);
rewriteJson('.agents/mcp_config.json', (d) => d.mcpServers);
rewriteJson('opencode.json', (d) => d.mcp, true);
rewriteToml('.codex/config.toml');
const agentsDir = path.join(ROOT, '.codex', 'agents');
if (fs.existsSync(agentsDir)) {
  for (const f of fs.readdirSync(agentsDir).filter((n) => n.endsWith('.toml'))) rewriteToml(path.join('.codex', 'agents', f));
}

console.log(changed.length ? `${undo ? 'Restored' : 'Rewrote'}: ${changed.join(', ')}` : 'Nothing to change.');
if (changed.length && !undo) console.log('Restart your AI tool. Do not commit these files (run with --undo before you commit).');
