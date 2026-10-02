---
id: other
title: Other MCP clients
order: 8
---

# Other AI tools with MCP support

## 1. Plan

Any AI coding agent that supports MCP servers (stdio) and can run shell commands, on a plan that lasts a full day of agent use.

## 2. Add the two MCP servers

Add these to your tool's MCP configuration (most tools accept this JSON shape; run them from the repository root):

```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["playwright", "mcp"] },
    "playwright-test": { "command": "npx", "args": ["playwright", "run-test-mcp-server"] }
  }
}
```

- `playwright`: browser tools, opens a visible Chrome window (headed is the default; do not add `--headless`)
- `playwright-test`: the test runner and the tools of the planner, generator and healer

Use the bundled `npx playwright mcp` from this repo (Playwright 1.63.0), not the standalone `@playwright/mcp` package: it runs a different Playwright version and browser build. On Windows, tools that start servers without a shell need `"command": "cmd", "args": ["/c", "npx", "playwright", "mcp"]`.

## 3. Check the connection

Ask: `List the MCP servers and tools you can use right now.` You should see `browser_navigate`, `browser_snapshot`, `browser_click` (from `playwright`) and `planner_setup_page`, `test_run` (from `playwright-test`).

## 4. Planner, generator, healer

Generic versions of the three agents are in `prompts/`. Start a chat with: "Follow the instructions in prompts/playwright-test-planner.md." and then the lab prompt. Or paste the file into the chat.

## 5. playwright-cli skill

`.agents/skills/playwright-cli/SKILL.md` follows the Agent Skills format that many tools read. If yours does not, tell the agent: "Read .agents/skills/playwright-cli/SKILL.md and use `npx playwright cli` as described there."

## 6. Token and context usage

Use whatever usage or context display your tool has. Note the number after each Lab 1 run.

## 7. Lab 4: governed healer

Use `labs/lab-4/governed-healer/generic/playwright-test-governed-healer.md` the same way as the other prompts.

## MCP not showing up

- `npx playwright mcp --help` and `npx playwright run-test-mcp-server --help` must work in a terminal in the repo folder. If not, run `npm ci`.
- The server must start in the repository root (where `playwright.config.ts` is), otherwise `playwright-test` finds no tests.

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
