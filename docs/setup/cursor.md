---
id: cursor
title: Cursor
order: 5
---

# Cursor

## 1. Plan

Cursor Pro, $20/month. The free Hobby plan has no MCP, no skills and no hooks, so it does not work for this workshop.

## 2. Install

Download Cursor from https://cursor.com/download and sign in.

## 3. Open the repo

File > Open Folder > `hustef-ai-e2e-starter`. Cursor reads `AGENTS.md` as the project guide.

## 4. Start the MCP servers

Cursor reads the project servers from `.cursor/mcp.json`:

- `playwright`: browser tools (`npx playwright mcp`), opens a visible Chrome window
- `playwright-test`: the test runner and the tools of the planner, generator and healer

Open the MCP settings (Cursor Settings > MCP, or the Customize panel in newer versions) and switch both servers on. Cursor asks for approval before it uses an MCP tool; you can see the arguments first.

## 5. Check the connection

Both servers show a green status with their tool count in the MCP settings, and their tools appear under **Available Tools** in the Agent chat. Then ask: `List the MCP servers and tools you can use right now.`

## 6. Planner, generator, healer

Playwright has no `init-agents` loop for Cursor, so this repo carries two Cursor versions of the same three agents:

- **Subagents** in `.cursor/agents/` (preferred): type `/playwright-test-planner` followed by the lab prompt, or write "Use the playwright-test-planner subagent to ...". Subagents get all MCP tools of the parent chat. (Cursor also reads `.claude/agents/`; the `.cursor/agents/` copies take precedence.)
- **Manual rules** in `.cursor/rules/` (fallback): type `@playwright-test-planner` in the Agent chat to add the instructions to your current chat, then the prompt.

## 7. playwright-cli skill

Cursor reads skills from `.agents/skills/`, `.cursor/skills/` and, for compatibility, `.claude/skills/`. Type `/` in the Agent chat and pick `playwright-cli`.

## 8. Token and context usage

Click the context ring of the agent (Cursor 3.3 and newer): it shows how much context goes to rules, skills, MCP tools and messages. Send a message first if the ring is empty.

## 9. Lab 4: governed healer

Copy `labs/lab-4/governed-healer/cursor/playwright-test-governed-healer.md` to `.cursor/agents/` and call it with `/playwright-test-governed-healer`. Or copy the `.mdc` file of the same folder to `.cursor/rules/` and use `@playwright-test-governed-healer`.

## MCP not showing up

- You are on the Hobby plan: MCP is not available.
- Cursor warns about too many tools: `playwright-test` brings 89 tools and `playwright` 24. Switch `playwright-test` off for Lab 1 and back on for Lab 2 (the subagents need it).
- `npx playwright mcp --help` must work in Cursor's terminal. If not, run `npm ci`.
- The server is switched off in the MCP settings, or shows an error there: open its log from the same place.
- Windows: if a server fails to start, run `node scripts/mcp-windows.mjs` (starts npx through `cmd /c`) and restart Cursor. Undo with `node scripts/mcp-windows.mjs --undo` before you commit. (Not verified whether Cursor needs this.)

## Company laptop

- Your company may require Privacy Mode or block Cursor's backend. Hosts to allow: `cursor.com`, `api2.cursor.sh`.
- Proxy: Cursor uses the VS Code proxy setting (`http.proxy`); set `HTTPS_PROXY` in the terminal for npm.

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
