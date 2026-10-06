# HUSTEF 2026: AI-driven end-to-end testing, starter repo

The attendee workspace for the HUSTEF 2026 tutorial **"AI Agents Take the Wheel: Hands-On End-to-End Testing with Browser MCP and Agentic Automation"** (Budapest, Tuesday 6 October 2026, 9:00-16:30, facilitator György Márk Varga, Shiwaforce).

You use it with your own AI coding agent to explore, plan, generate, heal and govern Playwright tests for **Gremlin Bank**, a fictional bank web app. Gremlin Bank is not a real bank: never enter real data.

| | |
|---|---|
| Companion app (agenda, labs, achievements, setup cards) | https://hustef.shiwa.io |
| Gremlin Bank (the app under test) | https://gremlin.shiwa.io |
| Slides | https://docs.google.com/presentation/d/15_55Eox-ui-JbErB3-dTFb3CSVlT7vqMt0A-9PQ3SZg/edit?usp=sharing |

## Quick start

Requirements: Node.js 24 LTS (22 works, 20 is the minimum), Git, Google Chrome, and one AI coding agent with MCP support. Details and plans: [docs/PREREQUISITES.md](docs/PREREQUISITES.md).

```bash
git clone https://github.com/gyurmatag/hustef-ai-e2e-starter.git
cd hustef-ai-e2e-starter
```

macOS / Linux:

```bash
./scripts/setup.sh
```

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

The setup script checks Node.js, Git and Chrome, runs `npm ci`, downloads Playwright's Chromium, creates `.env` and runs the doctor. Then:

1. Join the companion app at https://hustef.shiwa.io/join (code `HUSTEF26`) and paste your personal token into `.env` (`HUSTEF_TOKEN=...`). Set `AI_TOOL` to your tool.
2. `npm run doctor` until everything is green.
3. Open your AI tool in this folder and follow its setup card.

## Setup cards

| Tool | Card |
|---|---|
| GitHub Copilot in VS Code | [docs/setup/copilot-vscode.md](docs/setup/copilot-vscode.md) |
| GitHub Copilot CLI | [docs/setup/copilot-cli.md](docs/setup/copilot-cli.md) |
| Claude Code | [docs/setup/claude-code.md](docs/setup/claude-code.md) |
| Claude Code desktop app (no terminal) | [docs/setup/claude-code-desktop.md](docs/setup/claude-code-desktop.md) |
| OpenAI Codex | [docs/setup/codex.md](docs/setup/codex.md) |
| Codex desktop app (no terminal) | [docs/setup/codex-app.md](docs/setup/codex-app.md) |
| Cursor | [docs/setup/cursor.md](docs/setup/cursor.md) |
| opencode | [docs/setup/opencode.md](docs/setup/opencode.md) |
| Google Antigravity | [docs/setup/antigravity.md](docs/setup/antigravity.md) |
| Any other MCP client | [docs/setup/other.md](docs/setup/other.md) |

Every tool gets the same two MCP servers from Playwright 1.63.0: `playwright` (browser tools, `npx playwright mcp`) and `playwright-test` (test runner plus the planner, generator and healer tools, `npx playwright run-test-mcp-server`).

## Labs

| Time | Lab |
|---|---|
| 9:45 | [Lab 1: First drive](labs/lab-1/README.md) |
| 10:45 | [Lab 2: Explore and plan](labs/lab-2/README.md) |
| 11:25 | [Lab 3: Generate and review](labs/lab-3/README.md) |
| 13:30 | [Lab 4: Heal](labs/lab-4/README.md) |
| 14:20 | [Lab 5: Where agents break](labs/lab-5/README.md) |
| 15:15 | [Lab 6: CI/CD and audit trail](labs/lab-6/README.md) |

Full agenda: [docs/AGENDA.md](docs/AGENDA.md). After the day: [docs/MONDAY.md](docs/MONDAY.md) and [docs/PORTING.md](docs/PORTING.md).

Fell behind? Every lab ends with a checkpoint branch: `lab-1-done` to `lab-6-done`.

## Commands

| Command | What it does |
|---|---|
| `npm test` or `npx playwright test` | run the suite |
| `npm run test:ui` | Playwright UI mode |
| `npm run report` | open the last HTML report |
| `npm run doctor` | check the setup and the network, report to the companion app |
| `npm run setup` | run the setup script for your OS |
| `npm run typecheck` | type-check the TypeScript files (`tsc --noEmit`) |
| `npx playwright test tests/walls/totp.spec.ts` | run one Lab 5 wall (walls and `examples/` only run when named) |

Settings live in `.env` (copy of `.env.example`). `GREMLIN_RELEASE` empty follows the release the facilitator ships; `1`, `2` or `3` pins one.

## What is in here

```
seed.spec.ts            seed test for the planner and generator (signs in, stops on the dashboard)
tests/fixtures.ts       shared fixtures: release pinning with GREMLIN_RELEASE
tests/walls/            Lab 5 exercises
examples/               an old-style CSS-selector test (Lab 1)
specs/                  test plans (Lab 2)
labs/                   lab instructions, the governed healer (Lab 4) and the heal report schema
reporters/steady.ts     Lab 5 wall 4 reporter
scripts/                setup, doctor, heal audit, CI reporting
.github/                agents and prompts (Copilot), workflows, CODEOWNERS, PR template
.claude/ .codex/ .cursor/ .opencode/ .agents/ opencode.json .mcp.json .vscode/
                        agents, skills and MCP config for each AI tool
AGENTS.md, CLAUDE.md    project guide for the agents
```

The source code of Gremlin Bank is deliberately not in this repository: the agents have to explore the running application, like a tester. Problems: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## License

MIT, see [LICENSE](LICENSE). Built by Shiwaforce for HUSTEF 2026.
"" 
