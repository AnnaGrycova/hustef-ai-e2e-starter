---
id: claude-code
title: Claude Code
order: 3
---

# Claude Code

## 1. Plan

Claude Pro, $20/month ($17/month billed yearly). The free Claude plan does not include Claude Code.

## 2. Install

macOS, Linux, WSL:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://claude.ai/install.ps1 | iex
```

(Homebrew: `brew install --cask claude-code`. WinGet: `winget install Anthropic.ClaudeCode`.) Open a new terminal and check with `claude --version`. Docs: https://code.claude.com/docs/en/setup

## 3. Open the repo

```bash
cd hustef-ai-e2e-starter
claude
```

Sign in with your Claude account on the first start and confirm that you trust the folder. `CLAUDE.md` loads `AGENTS.md`, the project guide.

## 4. Start the MCP servers

Claude Code reads the project servers from `.mcp.json`. On the first start it asks you to approve them: approve `playwright` (browser tools, opens a visible Chrome window) and `playwright-test` (test runner, planner, generator, healer). Declined by mistake? Run `claude mcp reset-project-choices` and start `claude` again.

## 5. Check the connection

Type `/mcp`: both servers should be **connected**. `/mcp reconnect playwright` restarts one.

## 6. Planner, generator, healer

The subagents are in `.claude/agents/`. Type `@` and pick one from the list, or write it out:

```text
@agent-playwright-test-planner Explore Gremlin Bank using the seed test seed.spec.ts. ...
```

"Use the playwright-test-healer subagent to ..." works too, but the `@` mention always calls it.

## 7. playwright-cli skill

The skill is in `.claude/skills/playwright-cli/`. Type `/playwright-cli` followed by the task, or "Use the playwright-cli skill". `/skills` lists the skills and their size in tokens.

Its `allowed-tools` was narrowed from `Bash(npx:*) Bash(npm:*)` to `Bash(npx playwright:*)`: Claude can run Playwright commands without asking, but any other `npx` or `npm` command still needs your approval. Pre-approving `npx:*` would let a skill run any package from the internet.

## 8. Token and context usage

`/context` shows the context window as a grid (system prompt, MCP tools, messages). `/usage` (alias `/cost`) shows the session usage and plan limits. Start a fresh session with `/clear` before the CLI measurement in Lab 1.

## 9. Lab 4: governed healer

Copy `labs/lab-4/governed-healer/claude-code/playwright-test-governed-healer.md` to `.claude/agents/`. Claude Code picks up the new file within seconds; call it with `@agent-playwright-test-governed-healer`.

## MCP not showing up

- `npx playwright mcp --help` must work in the same terminal. If not, run `npm ci`.
- You declined the project servers: `claude mcp reset-project-choices`.
- Windows: if `/mcp` shows "failed" or "Connection closed", run `node scripts/mcp-windows.mjs` (starts npx through `cmd /c`, as `npx playwright init-agents` does on Windows) and restart `claude`. Undo with `node scripts/mcp-windows.mjs --undo` before you commit.
- Large pages: MCP tool output is capped at 25,000 tokens (`MAX_MCP_OUTPUT_TOKENS`). Larger snapshots are saved to a file.

## Company laptop

- Proxy: set `HTTPS_PROXY` before you start `claude` (basic auth in the URL works). NTLM and Kerberos proxies and SOCKS proxies are not supported; an LLM gateway is the documented workaround.
- TLS inspection: Claude Code trusts the operating system's certificate store; otherwise set `NODE_EXTRA_CA_CERTS`.
- Hosts to allow: `api.anthropic.com`, `claude.ai`, `platform.claude.com` (sign-in).

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
