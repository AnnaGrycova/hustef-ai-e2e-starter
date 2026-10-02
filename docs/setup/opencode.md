---
id: opencode
title: opencode
order: 8
---

# opencode

## 1. Plan

No subscription needed: opencode has free models. Their limits are not guaranteed for a full day, and free models may use your data for training (fine for our demo app, not for company code). You can also connect a provider account you already have.

## 2. Install

```bash
npm install -g opencode-ai
```

(macOS and Linux also: `curl -fsSL https://opencode.ai/install | bash`; Homebrew, Scoop and Chocolatey packages exist.) Docs: https://opencode.ai/docs

## 3. Open the repo

```bash
cd hustef-ai-e2e-starter
opencode
```

Pick a model with `/models`. opencode reads `AGENTS.md` as the project guide.

## 4. Start the MCP servers

`opencode.json` defines both servers and starts them with the session:

- `playwright`: browser tools (`npx playwright mcp`), opens a visible Chrome window
- `playwright-test`: the test runner and the tools of the planner, generator and healer

The `playwright-test` tools are hidden from the main agent (`"tools": { "playwright-test*": false }`) and switched on only inside the three subagents, as `npx playwright init-agents` sets it up. The repo narrowed that pattern from `playwright*` to `playwright-test*`, otherwise the browser tools of the `playwright` server would be hidden too. Both servers have a 30 s timeout for listing their tools (the default of 5 s is short for a first `npx` start).

## 5. Check the connection

In a second terminal: `opencode mcp list` shows both servers and their status. In the session, ask: `List the MCP servers and tools you can use right now.`

## 6. Planner, generator, healer

Subagents are defined in `opencode.json` with their prompts in `.opencode/prompts/`. Call one with an `@` mention:

```text
@playwright-test-planner Explore Gremlin Bank using the seed test seed.spec.ts. ...
```

(Playwright 1.63 writes the agents' tool lists with the `tools` field, which opencode marks as deprecated in favour of `permission` but still supports.)

## 7. playwright-cli skill

opencode reads skills from `.opencode/skills/`, `.claude/skills/` and `.agents/skills/` and loads them through its `skill` tool. Ask: "Use the playwright-cli skill to ...".

## 8. Token and context usage

The session view shows the context and token use of the current session (sidebar). After a session, `opencode stats` shows token usage and cost. (The exact place in the TUI is not described in the opencode docs.)

## 9. Lab 4: governed healer

Copy `labs/lab-4/governed-healer/opencode/playwright-test-governed-healer.md` to `.opencode/agents/` (create the folder), restart `opencode` and call `@playwright-test-governed-healer`.

## MCP not showing up

- `npx playwright mcp --help` must work in the same terminal. If not, run `npm ci`.
- `opencode mcp list` shows the error. A timeout on the first start: run `npx playwright mcp --help` once, then restart.
- Windows: if a server fails to start, run `node scripts/mcp-windows.mjs` (starts npx through `cmd /c`) and restart. Undo with `node scripts/mcp-windows.mjs --undo` before you commit. (Not verified whether opencode needs this.)

## Company laptop

- Free models send your prompts to the model provider: use only the demo app, never company code.
- Proxy: set `HTTPS_PROXY` (and `NODE_EXTRA_CA_CERTS` for TLS inspection) before you start `opencode`. Host to allow: `opencode.ai` plus your model provider.

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
