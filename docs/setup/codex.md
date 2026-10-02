---
id: codex
title: OpenAI Codex
order: 4
---

# OpenAI Codex (CLI or IDE extension)

## 1. Plan

ChatGPT Plus, $20/month. Codex is also in ChatGPT Free and Go ($8), but their limits are not published and may not last the day.

## 2. Install

```bash
npm install -g @openai/codex
```

(macOS and Linux also: `curl -fsSL https://chatgpt.com/codex/install.sh | sh`.) The IDE extension and the app use the same configuration. Docs: https://developers.openai.com/codex/cli

## 3. Open the repo

```bash
cd hustef-ai-e2e-starter
codex
```

Sign in with your ChatGPT account. When Codex asks whether you trust this folder, say yes: Codex loads the project's `.codex/` folder (MCP servers, agents) only for trusted projects.

## 4. Start the MCP servers

The servers are in `.codex/config.toml` and start with the session:

- `playwright`: browser tools (`npx playwright mcp`), opens a visible Chrome window
- `playwright-test`: the test runner (`tool_timeout_sec = 900`, because a full test run takes longer than the 60 s default)

The planner, generator and healer in `.codex/agents/` each start their own `playwright-test` server.

The same file sets `[sandbox_workspace_write] network_access = true`: shell commands such as `npx playwright cli` and `npx playwright test` must reach Gremlin Bank, and Codex's sandbox has no network by default. Remove it if your company does not allow that, and approve those commands one by one instead. (Not verified whether a project-level config can change this setting; if Codex still blocks the network, approve the command when it asks.)

## 5. Check the connection

Type `/mcp` (or `/mcp verbose`): both servers and their tools should be listed. In a normal terminal: `codex mcp list`.

## 6. Planner, generator, healer

Codex custom agents use snake_case names: `playwright_test_planner`, `playwright_test_generator`, `playwright_test_healer`. Ask for one by name:

```text
Spawn the playwright_test_planner agent with this task: Explore Gremlin Bank using the seed test seed.spec.ts. ...
```

`/agent` switches to the spawned agent's thread so you can watch it.

## 7. playwright-cli skill

Codex reads skills from `.agents/skills/`. Type `$` and pick `playwright-cli`, or open `/skills`.

## 8. Token and context usage

`/status` shows the model, the approval policy and the remaining context. `/usage` shows token use over time.

## 9. Lab 4: governed healer

Copy `labs/lab-4/governed-healer/codex/playwright_test_governed_healer.toml` to `.codex/agents/` and start a new session. Ask: "Spawn the playwright_test_governed_healer agent to run the tests, classify each failure, fix only DRIFT and write heal-report.json."

## MCP not showing up

- `npx playwright mcp --help` must work in the same terminal. If not, run `npm ci`.
- The project is not trusted, so `.codex/config.toml` was skipped: start `codex` in the repo root and accept the trust prompt (trust is stored in `~/.codex/config.toml`).
- Windows: if a server fails to start, run `node scripts/mcp-windows.mjs` (starts npx through `cmd /c`, as `npx playwright init-agents` does on Windows) and restart. Undo with `node scripts/mcp-windows.mjs --undo` before you commit.
- Slow first start: `startup_timeout_sec = 60` is already set.

## Company laptop

- Proxy: set `HTTPS_PROXY` (and `NODE_EXTRA_CA_CERTS` for TLS inspection) before you start `codex`.
- Hosts to allow: `api.openai.com`, `chatgpt.com` (sign-in).

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
