#!/usr/bin/env node
// npm run setup: runs scripts/setup.ps1 on Windows and scripts/setup.sh on macOS and Linux.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const result =
  process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(dir, 'setup.ps1')], { stdio: 'inherit' })
    : spawnSync('bash', [path.join(dir, 'setup.sh')], { stdio: 'inherit' });
if (result.error) {
  console.error(`Could not start the setup script: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
