---
id: antigravity
title: Google Antigravity
order: 9
---

# Google Antigravity (app or CLI)

## 1. Plan

The free plan works without a subscription, but its limits are not guaranteed for a full day.

## 2. Install

App: https://antigravity.google/download

CLI (`agy`), macOS and Linux:

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://antigravity.google/cli/install.ps1 | iex
```

Sign in with your Google account on the first start.

## 3. Open the repo

Open the folder `hustef-ai-e2e-starter` in the app, or run `agy` in it. Antigravity reads `AGENTS.md` as an always-on rule.

## 4. Start the MCP servers

The workspace servers are in `.agents/mcp_config.json`:

- `playwright`: browser tools (`npx playwright mcp`), opens a visible Chrome window
- `playwright-test`: the test runner and the tools of the planner, generator and healer

App: Settings > Customizations > **Installed MCP Servers**: check that both are enabled, use refresh after a change. CLI: `/mcp` opens the MCP manager with live status and logs. MCP tools run in Ask mode until you allow them: approve each call, or allow the server's tools in the permissions.

## 5. Check the connection

The MCP manager shows both servers as connected. Then ask: `List the MCP servers and tools you can use right now.`

## 6. Planner, generator, healer

Playwright has no `init-agents` loop for Antigravity. The three agents are manual rules in `.agents/rules/` (`trigger: manual`): `@`-mention one in the chat, then paste the lab prompt:

```text
@playwright-test-planner Explore Gremlin Bank using the seed test seed.spec.ts. ...
```

Antigravity also supports custom subagents (`.agents/agents/`), but how their tool list names MCP tools is not documented, so this repo does not ship them.

## 7. playwright-cli skill

Workspace skills are in `.agents/skills/`. Type `/playwright-cli` in the prompt panel, or the agent picks it when the task matches.

## 8. Token and context usage

Antigravity does not show per-session token use. In the CLI, `/usage` shows your model quotas (remaining requests and tokens per model). Note those before and after each Lab 1 run.

## 9. Lab 4: governed healer

Copy `labs/lab-4/governed-healer/antigravity/playwright-test-governed-healer.md` to `.agents/rules/` and `@`-mention `playwright-test-governed-healer`.

## MCP not showing up

- `npx playwright mcp --help` must work in the same terminal. If not, run `npm ci`.
- Refresh the server list, or restart `agy`.
- Windows: if a server fails to start, run `node scripts/mcp-windows.mjs` (starts npx through `cmd /c`) and restart. Undo with `node scripts/mcp-windows.mjs --undo` before you commit. (Not verified whether Antigravity needs this.)

## Company laptop

- Free plans may use your data to improve the product: use only the demo app, never company code.
- Proxy: set `HTTPS_PROXY` before you start the app or `agy`. Hosts to allow: `antigravity.google` and Google's model endpoints (not documented in one list; the doctor checks `cloudcode-pa.googleapis.com`, an assumption).

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
