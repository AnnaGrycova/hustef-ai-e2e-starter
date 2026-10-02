---
id: codex-app
title: Codex desktop app
order: 6
---

# Codex desktop app

Codex now runs in the ChatGPT desktop app, which replaced the separate Codex app: open the **ChatGPT** dropdown and select **Codex**. It shares its configuration with the Codex CLI and the IDE extension (`~/.codex/config.toml`, plus the repo's `.codex/config.toml` for a trusted project), so this repo's MCP servers, agents and skills work without changes. You do not need a terminal. When this card or a lab says to run a command, ask Codex to run it in the chat, or open the integrated terminal with **Ctrl+`** if you prefer. Docs: https://learn.chatgpt.com/docs/app

## 1. Plan

ChatGPT Plus, $20/month. Codex is also in ChatGPT Free and Go ($8), but their limits are not published and may not last the day.

## 2. Install

- The ChatGPT desktop app for macOS or Windows: https://chatgpt.com/download/. Linux: see https://learn.chatgpt.com/docs/linux/linux-app
- Open the app, sign in with your ChatGPT account, open the **ChatGPT** dropdown and select **Codex**.
- The labs still need Node.js 22 or newer (24 recommended), Git and Google Chrome on your laptop (see Prerequisites): Playwright and its MCP servers run on Node.

## 3. Open the repo

1. Add the `hustef-ai-e2e-starter` folder as a local project (**Add new project**; on Windows also **Ctrl+O**) and start a **New chat** in it.
2. Under **Work in**, choose **This computer**, and leave **Worktree** off. A worktree is a separate copy of the repo without your `.env` and `node_modules`.
3. Below the composer, keep the permissions on **Ask for approval**: Codex works inside the repo and asks before it goes beyond it.
4. Codex loads the project's `.codex/` folder (MCP servers, agents) only for a trusted project. If it asks whether you trust this folder, trust it.

Not cloned yet? Start a chat in any folder (for example Documents) and ask:

```prompt
Clone https://github.com/gyurmatag/hustef-ai-e2e-starter.git into this folder.
```

Then add the new `hustef-ai-e2e-starter` folder as a project, start a new chat in it and ask:

```prompt
Run the setup script for my operating system (scripts/setup.sh on macOS and Linux, scripts/setup.ps1 on Windows) and show me the doctor's output.
```

To fill in `.env`, ask Codex to set `HUSTEF_TOKEN` to your token from the companion app and `AI_TOOL=codex-app`, then to run `npm run doctor`.

## 4. Start the MCP servers

The servers are in `.codex/config.toml` and start with the chat:

- `playwright`: browser tools (`npx playwright mcp`), opens a visible Chrome window
- `playwright-test`: the test runner (`tool_timeout_sec = 900`, because a full test run takes longer than the 60 s default)

The planner, generator and healer in `.codex/agents/` each start their own `playwright-test` server. **Settings** > **MCP servers** lists the servers as well; you do not need to add them there.

The same file sets `[sandbox_workspace_write] network_access = true`: commands such as `npx playwright cli` and `npx playwright test` must reach Gremlin Bank, and the sandbox has no network by default. If your company does not allow that, remove it and approve those commands one by one when Codex asks.

## 5. Check the connection

Type `/mcp` in the composer: both servers should be listed. Or ask:

```prompt
List the MCP servers and tools you can use right now.
```

## 6. Planner, generator, healer

Codex custom agents use snake_case names: `playwright_test_planner`, `playwright_test_generator`, `playwright_test_healer`. Ask for one by name:

```text
Spawn the playwright_test_planner agent with this task: Explore Gremlin Bank using the seed test seed.spec.ts. ...
```

The app shows each subagent's thread in the main chat: open it to follow its work, or ask Codex to stop it.

## 7. playwright-cli skill

Codex reads skills from `.agents/skills/`. Type `$` in the composer and pick `playwright-cli`, or write "Use the playwright-cli skill".

## 8. Token and context usage

The circle in the composer footer shows how much of the context window the chat has used; hover it for the numbers. If you do not see it, turn on **Settings** > **Composer footer** > **Show context window usage**. Your plan's limits are on https://chatgpt.com/codex/settings/usage. Start a **New chat** before the CLI measurement in Lab 1, so that earlier messages do not count.

## 9. Lab 4: governed healer

It is the same file as for the Codex CLI: copy `labs/lab-4/governed-healer/codex/playwright_test_governed_healer.toml` to `.codex/agents/` (or ask Codex to copy it) and start a new chat. Ask: "Spawn the playwright_test_governed_healer agent to run the tests, classify each failure, fix only DRIFT and write heal-report.json."

## MCP not showing up

- Ask Codex to run `npx playwright mcp --help`. If that fails, ask it to run `npm ci`.
- The project is not trusted, so `.codex/config.toml` was skipped: trust the project and start a new chat.
- After a change in **Settings** > **MCP servers**, select **Restart**.
- Windows: the app runs the agent in PowerShell by default. If a server fails to start, ask Codex to run `node scripts/mcp-windows.mjs` (it starts npx through `cmd /c`, as `npx playwright init-agents` does on Windows) and start a new chat. Undo it with `node scripts/mcp-windows.mjs --undo` before you commit.
- Slow first start: `startup_timeout_sec = 60` is already set.

## Company laptop

- Hosts to allow: `chatgpt.com` (sign-in and the app) and `api.openai.com`.
- Proxy and TLS inspection: set `HTTPS_PROXY` (and `NODE_EXTRA_CA_CERTS` if your company inspects TLS) as environment variables for your user, then start the app.

## Local fallback

If the company network blocks `gremlin.shiwa.io` and a hotspot is not an option, run Gremlin Bank on your laptop (it needs Node.js 22 or newer). The gremlin-bank repository is private until the end of the workshop: ask the facilitator for read access first, or for the zip copy. Then ask Codex:

```prompt
Clone https://github.com/gyurmatag/gremlin-bank.git next to this repo (in the parent folder, never inside this one), run npm ci there, copy .dev.vars.example to .dev.vars and start npm run dev in the background.
```

The agents must not read the app's source, so keep it outside this repo. Then set `GREMLIN_URL=http://localhost:8787` in `.env` and use `http://localhost:8787` instead of `https://gremlin.shiwa.io` in the lab prompts. The local app does not follow the facilitator's release: open `http://localhost:8787/release/2` or `/release/3` yourself, or pin it with `GREMLIN_RELEASE`.
