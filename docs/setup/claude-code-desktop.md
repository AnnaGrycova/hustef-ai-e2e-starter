---
id: claude-code-desktop
title: Claude Code desktop app
order: 4
---

# Claude Code desktop app

The **Code** tab of the Claude desktop app runs the same Claude Code as the terminal version, with a graphical interface, and it reads the same project files: `CLAUDE.md`, `.mcp.json`, `.claude/agents/` and `.claude/skills/`. You do not need a terminal. When this card or a lab says to run a command, ask Claude to run it in the session (it asks before each command), or open the app's terminal pane with **Ctrl+`** if you prefer. Docs: https://code.claude.com/docs/en/desktop

## 1. Plan

Claude Pro, $20/month ($17/month billed yearly), the same plan as Claude Code in the terminal. The free Claude plan does not include the Code tab.

## 2. Install

- The Claude desktop app for macOS (Intel and Apple Silicon) or Windows (x64 and ARM64): https://claude.com/download. Linux has a beta (apt).
- Open Claude, sign in with your Claude account and click the **Code** tab at the top.
- The app includes Claude Code, but the labs still need Node.js 22 or newer (24 recommended), Git and Google Chrome on your laptop (see Prerequisites): Playwright and its MCP servers run on Node.

## 3. Open the repo

1. In the Code tab, choose **Local** as the environment, click **Select folder** and pick the `hustef-ai-e2e-starter` folder.
2. Leave the **worktree** option off. A worktree is a separate copy of the repo without your `.env` and `node_modules`.
3. In the mode selector next to the send button, choose **Manual** or **Accept edits**. Claude then asks before it runs a command such as `npx playwright test`, and you approve it in the session.

Not cloned yet? Select any folder (for example Documents) and ask:

```prompt
Clone https://github.com/gyurmatag/hustef-ai-e2e-starter.git into this folder.
```

Then start a new session (**+ New session**) on the new `hustef-ai-e2e-starter` folder and ask:

```prompt
Run the setup script for my operating system (scripts/setup.sh on macOS and Linux, scripts/setup.ps1 on Windows) and show me the doctor's output.
```

`CLAUDE.md` loads `AGENTS.md`, the project guide. To fill in `.env`, ask Claude to set `HUSTEF_TOKEN` to your token from the companion app and `AI_TOOL=claude-code-desktop`, then to run `npm run doctor`.

## 4. Start the MCP servers

The project servers are in `.mcp.json`, and local sessions in the Code tab load them as the terminal version does. The first session in the folder asks you to approve them: approve `playwright` (browser tools, opens a visible Chrome window) and `playwright-test` (test runner, planner, generator, healer).

## 5. Check the connection

Ask:

```prompt
List the MCP servers and tools you can use right now.
```

Both `playwright` and `playwright-test` should be listed with their tools. If not, see "MCP not showing up" below.

## 6. Planner, generator, healer

The subagents are in `.claude/agents/`. Name the one you want in the prompt:

```text
Use the playwright-test-planner subagent: explore Gremlin Bank using the seed test seed.spec.ts. ...
```

The tasks pane (**Views** menu) shows the running subagents; click one to see its output.

## 7. playwright-cli skill

The skill is in `.claude/skills/playwright-cli/`. Type `/` in the prompt box (or click **+** > **Slash commands**), pick `playwright-cli` and type the task after it, or write "Use the playwright-cli skill". Its `allowed-tools` only pre-approves `npx playwright` commands; Claude still asks before any other `npx` or `npm` command.

## 8. Token and context usage

Click the usage ring next to the model picker: it shows the session's context window usage and your plan usage. Start a new session (**+ New session**) before the CLI measurement in Lab 1, so that earlier messages do not count.

## 9. Lab 4: governed healer

It is the same file as for Claude Code in the terminal: copy `labs/lab-4/governed-healer/claude-code/playwright-test-governed-healer.md` to `.claude/agents/` (or ask Claude to copy it), start a new session and ask for the `playwright-test-governed-healer` subagent.

## MCP not showing up

- Ask Claude to run `npx playwright mcp --help`. If that fails, ask it to run `npm ci`.
- Claude cannot find `node` or `npm`: on macOS the app reads `PATH` from your shell profile when it starts. Install Node.js, quit the app completely (Cmd+Q) and open it again.
- You declined the servers, or the tools do not appear: ask Claude to add `"enabledMcpjsonServers": ["playwright", "playwright-test"]` to `.claude/settings.local.json` (your own settings file, not committed), then start a new session.
- Windows: if the servers fail to start, ask Claude to run `node scripts/mcp-windows.mjs` (it starts npx through `cmd /c`, as `npx playwright init-agents` does on Windows) and start a new session. Undo it with `node scripts/mcp-windows.mjs --undo` before you commit.
- Large pages: MCP tool output is capped at 25,000 tokens (`MAX_MCP_OUTPUT_TOKENS`). Larger snapshots are saved to a file.

## Company laptop

- The app needs `claude.ai`, `claude.com` and `anthropic.com` and their subdomains (HTTPS, port 443). The full list is in the docs under "Network access requirements".
- Proxy and TLS inspection: set `HTTPS_PROXY` (basic auth in the URL works) and, if needed, `NODE_EXTRA_CA_CERTS` in the local environment editor: open the environment dropdown in the prompt box, hover **Local** and click the gear icon. Those variables reach every local session. NTLM, Kerberos and SOCKS proxies are not supported.
- If **Local** is greyed out, your organization turned off local sessions. Use another tool for the workshop.

## Local fallback

If the company network blocks `gremlin.shiwa.io` and a hotspot is not an option, run Gremlin Bank on your laptop (it needs Node.js 22 or newer). The gremlin-bank repository is private until the end of the workshop: ask the facilitator for read access first, or for the zip copy. Then ask Claude:

```prompt
Clone https://github.com/gyurmatag/gremlin-bank.git next to this repo (in the parent folder, never inside this one), run npm ci there, copy .dev.vars.example to .dev.vars and start npm run dev in the background.
```

The agents must not read the app's source, so keep it outside this repo. Then set `GREMLIN_URL=http://localhost:8787` in `.env` and use `http://localhost:8787` instead of `https://gremlin.shiwa.io` in the lab prompts. The local app does not follow the facilitator's release: open `http://localhost:8787/release/2` or `/release/3` yourself, or pin it with `GREMLIN_RELEASE`.
