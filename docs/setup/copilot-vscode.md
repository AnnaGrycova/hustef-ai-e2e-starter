---
id: copilot-vscode
title: GitHub Copilot in VS Code
order: 1
---

# GitHub Copilot in VS Code

## 1. Plan

Copilot Pro, $10/month. Copilot Free (about 50 chat requests a month) runs out within the first hour, and Pro trials are paused, so you need a paid month. A company Copilot Business or Enterprise seat works only if your admin enabled the **MCP servers in Copilot** policy (it is off by default).

## 2. Install

- VS Code 1.105 or newer (1.140 is current): https://code.visualstudio.com/download
- Sign in to GitHub in VS Code (Accounts menu, bottom left). Copilot chat is built in.
- Recommended: the Playwright Test extension (`ms-playwright.playwright`). VS Code offers it when you open the repo.

## 3. Open the repo

File > Open Folder > `hustef-ai-e2e-starter`. When VS Code asks, choose **Yes, I trust the authors**. In Restricted Mode, workspace MCP servers do not start.

## 4. Start the MCP servers

VS Code reads `.vscode/mcp.json` (VS Code 1.140 also reads the portable `.mcp.json` in the repo root; both define the same two servers):

- `playwright`: browser tools (`npx playwright mcp`), opens a visible Chrome window
- `playwright-test`: the test runner and the tools of the planner, generator and healer (`npx playwright run-test-mcp-server`)

Open `.vscode/mcp.json` and click **Start** above each server, or run **MCP: List Servers** from the Command Palette, pick a server and start it. New servers usually start on their own (`chat.mcp.autostart`).

## 5. Check the connection

Open the Chat view, switch to **Agent**, and click **Configure Tools**: you should see the tools of `playwright` and `playwright-test`. Then ask: `List the MCP servers and tools you can use right now.`

`.vscode/settings.json` turns off VS Code's own browser tools (`"workbench.browser.enableChatTools": false`) so that Copilot uses Playwright MCP, as the labs expect. To get them back after the workshop, delete that line or set it to `true` (Settings: search for `enableChatTools`).

## 6. Planner, generator, healer

The agents are in `.github/agents/`. In the Chat view, open the **Agent** dropdown and pick `playwright-test-planner`, `playwright-test-generator` or `playwright-test-healer`, then paste the lab prompt.

Prompt files with the lab prompts are in `.github/prompts/`: type `/playwright-test-plan`, `/playwright-test-generate` or `/playwright-test-heal` in the chat.

## 7. playwright-cli skill

Skills are read from `.github/skills/`, `.claude/skills/` and `.agents/skills/`. Type `/playwright-cli` in the chat, or write "Use the playwright-cli skill". Copilot asks before it runs each terminal command.

## 8. Token and context usage

Hover over (or click) the context window control in the chat input: it shows the session's context token usage and credits.

## 9. Lab 4: governed healer

Copy `labs/lab-4/governed-healer/copilot/playwright-test-governed-healer.agent.md` to `.github/agents/` and pick it in the Agent dropdown (reload the window if it does not appear: **Developer: Reload Window**).

## MCP not showing up

- `npx playwright mcp --help` in the terminal must work. If not, run `npm ci`.
- **MCP: List Servers** > the server > **Show Output** shows why it stopped.
- If a server appears twice (from `.vscode/mcp.json` and `.mcp.json`), stop one of them. (Not verified how VS Code 1.140 merges two workspace files with the same server names.)
- **"Cannot have more than 128 tools per request"** (or "Tool limit exceeded"): `playwright-test` brings 89 tools and `playwright` 24, on top of Copilot's own tools. VS Code groups tools automatically above 128 (`github.copilot.chat.virtualTools.threshold`), but some versions still stop with this error. Click **Configure Tools** and deselect the `playwright-test` server while you work with the default agent (Lab 1). The planner, generator and healer list their own tools in `.github/agents/`.
- Copilot uses its own browser instead of Playwright: write "use the Playwright MCP tools" in the prompt, and keep `workbench.browser.enableChatTools` off.

## Company laptop

- Copilot Business/Enterprise: the **MCP servers in Copilot** policy must be enabled by your organization admin (GitHub > organization Settings > Copilot > Policies). Without it, no MCP server starts.
- Proxy: set VS Code's `http.proxy` setting, and `HTTPS_PROXY` in the terminal for npm.
- The agent definitions do not pin a model: the model picker decides. Your company may limit which models you can pick.

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
