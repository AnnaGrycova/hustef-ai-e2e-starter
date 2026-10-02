---
id: copilot-cli
title: GitHub Copilot CLI
order: 2
---

# GitHub Copilot CLI

## 1. Plan

Copilot Pro, $10/month (Copilot CLI is included in all Copilot plans, but Copilot Free runs out within the first hour and Pro trials are paused). A company Copilot Business or Enterprise seat works only if your admin enabled the **MCP servers in Copilot** policy (off by default).

## 2. Install

```bash
npm install -g @github/copilot
```

(winget and Homebrew packages exist too.) Start it with `copilot` and sign in with your GitHub account.

## 3. Open the repo

Start Copilot CLI in the repository root, not in a subfolder: it finds `.mcp.json` and the skills relative to the folder you start it in.

```bash
cd hustef-ai-e2e-starter
copilot
```

On the first start it asks whether you trust the files in this folder. Choose **Yes, and remember this folder for future sessions**. Project MCP servers load only after you confirm.

## 4. Start the MCP servers

Copilot CLI reads `.mcp.json` (it does not read `.vscode/mcp.json`). Both servers start with the session:

- `playwright`: browser tools (`npx playwright mcp`), opens a visible Chrome window
- `playwright-test`: the test runner and the tools of the planner, generator and healer

## 5. Check the connection

Type `/mcp` to see both servers and their status, and `/mcp show playwright` for its tools. In a normal terminal: `copilot mcp list`.

## 6. Planner, generator, healer

The agents are in `.github/agents/` (the same files as for VS Code). Type `/agent` and pick `playwright-test-planner`, `playwright-test-generator` or `playwright-test-healer`, then paste the lab prompt. You can also start a session with one: `copilot --agent playwright-test-planner`.

## 7. playwright-cli skill

Skills are read from `.github/skills/`, `.claude/skills/` and `.agents/skills/`. `/skills list` shows them. Use it in a prompt: `Use the /playwright-cli skill to open https://gremlin.shiwa.io ...`. The skill's `allowed-tools` is narrowed to `Bash(npx playwright:*)`: only Playwright commands run without a confirmation.

## 8. Token and context usage

`/context` shows the current token usage, `/usage` the session statistics (tokens per model, credits).

## 9. Lab 4: governed healer

Copy `labs/lab-4/governed-healer/copilot/playwright-test-governed-healer.agent.md` to `.github/agents/`, restart `copilot`, then `/agent`.

## MCP not showing up

- `npx playwright mcp --help` must work in the same terminal. If not, run `npm ci`.
- You started `copilot` in a subfolder, or you did not trust the folder: restart it in the repo root.
- Windows: if a server shows as failed, run `node scripts/mcp-windows.mjs` (starts npx through `cmd /c`) and restart. Undo with `node scripts/mcp-windows.mjs --undo` before you commit. (Not verified whether Copilot CLI needs this.)

## Company laptop

- Copilot Business/Enterprise: the **MCP servers in Copilot** policy must be enabled by your organization admin.
- Proxy: set `HTTPS_PROXY` (and `NODE_EXTRA_CA_CERTS` for TLS inspection) before you start `copilot`.

## Local fallback

If the company network blocks `gremlin.shiwa.io` and a hotspot is not an option, run Gremlin Bank on your laptop (it needs Node.js 22 or newer; Node 20 is not enough for its local server, wrangler):

The gremlin-bank repository is private until the end of the workshop: ask the facilitator for read access first, or for the zip copy.

```bash
cd ..
git clone https://github.com/gyurmatag/gremlin-bank.git
cd gremlin-bank
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

Clone it next to this repo, never inside it (the agents must not read the app's source). Then set `GREMLIN_URL=http://localhost:8787` in `.env` and use `http://localhost:8787` instead of `https://gremlin.shiwa.io` in the lab prompts. The local app does not follow the facilitator's release: open `http://localhost:8787/release/2` or `/release/3` yourself, or pin it with `GREMLIN_RELEASE`.
