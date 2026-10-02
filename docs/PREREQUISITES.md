# Prerequisites and setup

Please do this at home or at the office before Tuesday 6 October. It takes about 30 minutes. If something fails, come at 8:30 on the day and we fix it at the setup desk.

## 1. Laptop

- Windows 10/11, macOS 13 or newer, or Linux (Ubuntu 22.04+)
- Admin rights to install software
- About 5 GB free disk space
- A charger (there is power at every seat)
- A phone with a camera (for one exercise; a second browser window also works)

## 2. Software

| Software | Version | Check with |
|---|---|---|
| Git | any recent version, configured with your name and email | `git --version` |
| Node.js | 24 LTS recommended, 22 works. Node 20 still runs but is end-of-life since 30 April 2026 | `node --version` |
| Google Chrome | current stable | Chrome menu > About |
| A code editor | VS Code 1.105 or newer (1.140 is current), or Cursor | Help > About |
| Playwright 1.63.0 and its Chromium | installed by the setup script below | `npx playwright --version` |

## 3. Accounts

- **GitHub account** (free). You will fork a repo, push to it and run GitHub Actions, so make sure `git push` to github.com works from this laptop (GitHub Desktop, `gh auth login` or a personal access token).
- **One AI coding agent with MCP support**, on a plan that lasts a full day of agent use. Pick one:

| Tool | Plan that works for the day | Notes |
|---|---|---|
| GitHub Copilot in VS Code (or Copilot CLI) | Copilot Pro, $10/month | Copilot Free (about 50 chat requests a month) runs out within the first hour. Pro trials are paused by GitHub, so you need a paid month. On a company Copilot Business/Enterprise seat, MCP is off by default: ask your admin to enable "MCP servers in Copilot". |
| Claude Code (terminal or the Claude desktop app) | Claude Pro, $20/month ($17/month billed yearly) | The free Claude plan does not include Claude Code. |
| OpenAI Codex (CLI, IDE extension or the ChatGPT desktop app) | ChatGPT Plus, $20/month | Codex is also in ChatGPT Free and Go ($8), but their limits are not published and may not last the day. |
| Cursor | Cursor Pro, $20/month | The free Hobby plan has no MCP and no skills, so it does not work for this workshop. |
| Free fallback | opencode with its free models, or Google Antigravity CLI on the free plan | No subscription, but limits are not guaranteed for a full day, and free models may use your data for training (fine for our demo app, not for company code). |

Use a personal or approved account. You will only work with a fictional demo bank, no company code or data.

## 4. Install

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

The setup script checks Node and Git, installs the pinned packages (`npm ci`), downloads Playwright's Chromium, creates your `.env` file, and runs the doctor.

No terminal? With the Claude Code desktop app or the Codex desktop app, the agent can clone the repo and run the setup script for you: the setup cards for those two apps show the prompts.

Windows: if PowerShell later says `npm.ps1` or `npx.ps1` "cannot be loaded because running scripts is disabled on this system", allow local scripts for your user once with `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (the setup script warns you when you need it). If your company does not allow that, type `npm.cmd` and `npx.cmd` instead.

## 5. Verify (the checklist)

1. **Open the companion app in your browser:** https://hustef.shiwa.io/join. Enter the code `HUSTEF26`, pick a nickname, your OS and your AI tool. You should see "You're in". Copy your personal token.
2. **Paste the token into `.env`** in the repo: `HUSTEF_TOKEN=...`, and set `AI_TOOL` to your tool (for example `claude-code` or `copilot-vscode`; the file lists all values).
3. **Run the doctor:**

```bash
npm run doctor
```

It checks Node, Git, Chrome, the Playwright browser, and that your terminal and Playwright's browser can reach everything we use: hustef.shiwa.io, gremlin.shiwa.io, the npm registry, GitHub, Playwright's download server and your AI tool. All green unlocks your first two achievements, and the facilitator sees that you are ready.

4. **Open your AI tool in the repo folder** and follow its setup card in the companion app (https://hustef.shiwa.io/setup). Ask it: "List the MCP servers and tools you can use." You should see `playwright` and `playwright-test`.

## 6. Company laptops, proxies and firewalls

If the doctor shows red network checks, these hosts must be reachable (HTTPS, port 443):

- `hustef.shiwa.io`, `gremlin.shiwa.io` (workshop apps)
- `registry.npmjs.org` (packages)
- `github.com`, `api.github.com`, `objects.githubusercontent.com` (repo, Actions)
- `cdn.playwright.dev`, `playwright.download.prss.microsoft.com` (Playwright browser download)
- your AI tool's endpoints, for example `api.githubcopilot.com`, `api.anthropic.com`, `api.openai.com`, `cursor.com`

Behind a proxy, set `HTTPS_PROXY` (and `NODE_EXTRA_CA_CERTS` if your company inspects TLS). Node 24 also needs `NODE_USE_ENV_PROXY=1`. Claude Code does not support NTLM or Kerberos proxies. The doctor prints the exact fix for each failure.

If your company blocks something you cannot change, bring the laptop anyway and use your phone's hotspot, or use a personal laptop.

## 7. On the day

- Venue: Fortix office meeting room, Budapest (address in the organiser's email). Setup desk from 8:30, start at 9:00 sharp.
- Venue Wi-Fi is available; a mobile hotspot as backup is recommended.
- Coffee and lunch are provided.
