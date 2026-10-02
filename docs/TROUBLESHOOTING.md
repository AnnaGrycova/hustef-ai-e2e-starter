# Troubleshooting

Start with the doctor. It prints a fix for every red line:

```bash
npm run doctor
```

## Proxy

Behind a company proxy, set the proxy before you run `npm`, the doctor or your AI tool.

macOS / Linux:

```bash
export HTTPS_PROXY=http://proxy.company.local:8080
export HTTP_PROXY=http://proxy.company.local:8080
export NO_PROXY=localhost,127.0.0.1
```

Windows PowerShell (current window only):

```powershell
$env:HTTPS_PROXY="http://proxy.company.local:8080"
$env:HTTP_PROXY="http://proxy.company.local:8080"
$env:NO_PROXY="localhost,127.0.0.1"
```

- **Node.js** ignores `HTTPS_PROXY` in `fetch` unless `NODE_USE_ENV_PROXY=1` is set (Node 24, or 22.21 and newer). The doctor sets it for itself when it sees a proxy. Node 20 cannot do it: install Node 24 LTS.
- **TLS inspection** (certificate errors such as `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` or `SELF_SIGNED_CERT_IN_CHAIN`): point `NODE_EXTRA_CA_CERTS` at your company CA bundle (a PEM file), or set `NODE_USE_SYSTEM_CA=1` (Node 22.19+ / 24.6+) to use the operating system's certificate store.
- **npm** uses `HTTPS_PROXY` too, or `npm config set proxy ...` / `npm config set https-proxy ...`.
- **Git**: `git config --global http.proxy http://proxy.company.local:8080`
- **Playwright's browser** normally uses the system proxy settings (Windows, macOS) or the proxy variables (Linux). If the doctor's `net-*` checks are green but `browser-*` checks are red, set `PW_PROXY_SERVER` in `.env` to the same value as `HTTPS_PROXY` (and `PW_PROXY_BYPASS=localhost,127.0.0.1`). `playwright.config.ts` and the doctor pass it to the browser.
- **Proxy login** (HTTP 407): put the user into the URL (`http://user:password@proxy:8080`). NTLM or Kerberos proxies need a local helper such as px or cntlm. Claude Code does not support NTLM, Kerberos or SOCKS proxies.

Hosts the workshop needs (HTTPS, port 443): `hustef.shiwa.io`, `gremlin.shiwa.io`, `registry.npmjs.org`, `github.com`, `api.github.com`, `objects.githubusercontent.com`, `cdn.playwright.dev`, `playwright.download.prss.microsoft.com`, and your AI tool's endpoints (for example `api.githubcopilot.com`, `api.anthropic.com`, `api.openai.com`, `cursor.com`).

If a host stays blocked, use your phone's hotspot for the day.

## Playwright's Chromium does not download (Windows timeouts)

The default download timeout is 30 seconds per connection. Slow networks and virus scanners that inspect the 190 MB archive need more:

macOS / Linux:

```bash
PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=120000 npx playwright install chromium
```

Windows PowerShell:

```powershell
$env:PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT="120000"
npx playwright install chromium
```

The setup scripts already set 120,000 ms. The browser comes from `cdn.playwright.dev` or `playwright.download.prss.microsoft.com`; both must be reachable (through your proxy). If your company runs a mirror, set `PLAYWRIGHT_DOWNLOAD_HOST` to it.

No download possible at all? Point `PW_CHROMIUM_PATH` at an existing Chromium or Chrome binary (`.env` or shell). The tests and the doctor use it. This is a fallback: the version may not match Playwright 1.63.

Linux: if Chromium is downloaded but does not start, install its system libraries:

```bash
sudo npx playwright install-deps chromium
```

## Google Chrome is missing

`npx playwright mcp` and `npx playwright cli` open Google Chrome by default. Install it from https://www.google.com/chrome/. If you cannot install it, use Playwright's own Chromium instead: in your tool's MCP config, change the `playwright` server's arguments to `["playwright", "mcp", "--browser", "chromium"]` (for the CLI: `npx playwright cli open --browser=chromium`). The tests do not need Chrome; they use Playwright's Chromium.

## The MCP servers do not show up

1. In a terminal in the repo folder, `npx playwright mcp --help` and `npx playwright run-test-mcp-server --help` must print their help. If not: `npm ci`.
2. Your tool must trust the folder before it starts project servers:
   - VS Code: Workspace Trust ("Yes, I trust the authors"). In Restricted Mode workspace MCP servers do not start.
   - Copilot CLI: answer the folder trust prompt with "Yes, and remember this folder". Start `copilot` in the repo root.
   - Codex: trust the project when asked; untrusted projects skip `.codex/config.toml` and `.codex/agents/`.
   - Claude Code: approve the project servers from `.mcp.json` (reset with `claude mcp reset-project-choices`).
3. **Copilot Business or Enterprise**: the organization policy **MCP servers in Copilot** is off by default. Your Copilot admin has to enable it. Without it no MCP server starts, whatever the config says.
4. **Cursor Hobby** (free) has no MCP. You need Cursor Pro.
5. **Windows**: tools that start servers without a shell cannot run `npx` directly. Run `node scripts/mcp-windows.mjs` to start them through `cmd /c` (what `npx playwright init-agents` writes on Windows), restart the tool, and run `node scripts/mcp-windows.mjs --undo` before you commit.

## Tests

- **"No tests found"** for `tests/walls/...` or `examples/...`: these folders only run when you name them, for example `npx playwright test tests/walls/totp.spec.ts`. `PW_RUN_ALL=1` includes them in a full run.
- **Everything fails at the sign-in page**: the release changed (Lab 4), or `GREMLIN_RELEASE` is still set in your shell from Lab 1. Check the footer of the page ("Release N"). PowerShell keeps `$env:GREMLIN_RELEASE` until you close the window or run `Remove-Item Env:GREMLIN_RELEASE`.
- **"Too many attempts. Wait 60 seconds."**: five wrong passwords in one browser session. A new browser context starts clean; in your own browser, wait a minute or open `/api/state/reset`.
- **Your own browser shows a different release** than the tests: you opened `/release/N`, which sets a cookie. Open `/release/reset` to follow the facilitator again.

## Local Gremlin Bank (fallback)

If `gremlin.shiwa.io` is blocked and a hotspot is not an option, run the app on your laptop (it needs Node.js 22 or newer: its local server, wrangler, does not run on Node 20). Clone it **next to** this repo, never inside it: the agents must explore the app in the browser, not read its source.

```bash
cd ..
git clone https://github.com/gyurmatag/gremlin-bank.git
cd gremlin-bank
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

Then set `GREMLIN_URL=http://localhost:8787` in this repo's `.env` and use `http://localhost:8787` in the lab prompts. The local app does not follow the facilitator's release; switch it yourself with `http://localhost:8787/release/2` (or 3, or `/release/reset`), or pin it with `GREMLIN_RELEASE`. The phone link of the push sign-in only works on port 8787.

## Setup script on Windows

`powershell -ExecutionPolicy Bypass -File scripts\setup.ps1` runs the script without changing your execution policy. If Node.js or Git were just installed, open a new PowerShell window first so they are on the `PATH`.

**`npx.ps1 cannot be loaded because running scripts is disabled on this system`** (or the same for `npm.ps1`): in PowerShell, `npm` and `npx` are PowerShell scripts, and the Windows default execution policy (`Restricted`) blocks them. The setup script warns about it. Allow local scripts for your user once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

If your company sets the policy (the command fails, or `Get-ExecutionPolicy -List` shows it under `MachinePolicy` or `UserPolicy`), type `npx.cmd` and `npm.cmd` instead (`npx.cmd playwright test`), or use a Command Prompt (`cmd`) window.

**`The token '&&' is not a valid statement separator`**: Windows PowerShell 5.1 does not support `&&`. Run the commands one per line (the labs write them that way), or use PowerShell 7 (`pwsh`).
