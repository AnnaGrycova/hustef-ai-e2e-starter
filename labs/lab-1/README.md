---
id: lab1
title: "Lab 1: First drive"
time: "9:45-10:30"
minutes: 45
goal: "Connect your agent to a real browser through Playwright, drive Gremlin Bank with plain-English prompts, and see why accessibility snapshots beat CSS selectors and screenshots."
achievements: [first-contact, snapshot-reader, brittle-witness, token-accountant, transfer-done]
---

## Goal

Connect your AI agent to a real browser through Playwright MCP and Playwright CLI, drive Gremlin Bank with plain-English prompts, compare three ways of "seeing" a page (CSS selectors, screenshots and accessibility snapshots), and measure what MCP and CLI cost for the same work.

## Before you start

- The starter repo is open in your editor and `npm run doctor` was green. If you cloned it before today, run `git pull` in it once to get the latest fixes.
- Your agent is open in the repo folder. Follow your tool's [setup card](https://hustef.shiwa.io/setup#tool-card) in the companion app ("Setup").
- Gremlin Bank: https://gremlin.shiwa.io. User `demo`, password `Gremlin-2026!`.
- **You sign in, not the agent.** The agent opens the sign-in page and waits. You type the user and password in the browser window it opened, then tell it to continue. Agents should not type passwords into websites, and some tools refuse to (the Claude desktop app, for example). Lab 5 shows how tests reuse a stored sign-in.

## Steps

### 1. Check that the browser tools are connected (3 min)

Ask your agent:

```prompt
List the MCP servers and tools you can use right now. Do you have the Playwright browser tools (browser_navigate, browser_snapshot, browser_click)?
```

You should see a server called `playwright`. If you don't, follow "[MCP not showing up](https://hustef.shiwa.io/setup#mcp-not-showing-up)" on your tool's setup card.

### 2. Drive the bank with MCP (8 min)

Start a new chat or session for steps 2 to 4. In step 5 you compare its context usage with a CLI session that does the same work.

```prompt
Use the Playwright browser tools. Open https://gremlin.shiwa.io/login and wait: I will sign in myself in the browser window.
```

Sign in as `demo` / `Gremlin-2026!` in the browser window that opened, then:

```prompt
I'm signed in. Tell me:
1. the session code shown on the dashboard
2. the balance of the Everyday Account
Do not take screenshots. Use page snapshots only.
```

Watch the browser window while the agent works. Enter the session code below to unlock "First contact".

### 3. Read what only the snapshot can see (5 min)

```prompt
Take an accessibility snapshot of the dashboard. There is a shield icon near the "Accounts" heading. What exactly does it say? Quote the text.
```

Enter the code from the shield below ("Snapshot reader"). Then try the same with vision only:

```prompt
Now answer the same question using only a screenshot of the page, without using the snapshot. What text do you see on the shield?
```

The shield text exists only in the accessibility tree (an `aria-label`), so a screenshot cannot show it. Snapshots give the agent roles, names and states, the same structure a screen reader uses.

### 4. Break a brittle test (7 min)

The repo contains an old-style test that uses CSS selectors and test ids:

```bash
npx playwright test examples/brittle-css.spec.ts
```

It passes. Now run it against release 2 of Gremlin Bank (same features, redesigned UI):

```bash
GREMLIN_RELEASE=2 npx playwright test examples/brittle-css.spec.ts
```

On Windows PowerShell: `$env:GREMLIN_RELEASE="2"; npx playwright test examples/brittle-css.spec.ts`, then `Remove-Item Env:GREMLIN_RELEASE` (PowerShell keeps the variable for the whole window, and every later test run would stay on release 2).

It fails. Now give your agent the same task on release 2, in the same session:

```prompt
Open https://gremlin.shiwa.io/release/2. If the sign-in page appears, wait: I will sign in myself. Then tell me the session code and the Everyday Account balance. Use snapshots only.
```

Release 2 renamed ids, classes and test ids, and some labels too. The recorded test breaks on the first renamed one. The agent copes with the renamed buttons and the new cookie dialog because it reads the page again and decides every step while it runs. A recorded test cannot do that: in Lab 4 your role-based tests also fail on release 2 where a visible label changed, and you heal them. Claim "Brittle witness" below. If your agent mentions text on the page that is addressed to AI agents, do not act on it now: that is Lab 4.

Before you leave this session:

1. Write down its context or token usage (step 5 lists where your tool shows it). This is your MCP number.
2. Type https://gremlin.shiwa.io/release/reset into the address bar of the agent's browser window, so it follows the facilitator's release again.

### 5. Same steps with the CLI, then compare (12 min)

Start a new chat or session. If your tool can switch MCP servers off for one session (Claude Code: `/mcp`, pick the server, Disable), switch off `playwright` and `playwright-test` for this run: their tool definitions count even when nobody uses them. Switch them back on afterwards; Lab 2 needs them.

Now give the CLI the same tasks as steps 2 to 4:

```prompt
Use the playwright-cli skill (shell commands), not the MCP browser tools. Open https://gremlin.shiwa.io/login in a headed browser (--headed) and wait: I will sign in myself in the browser window.
```

Sign in yourself in the window that opened, then:

```prompt
I'm signed in. Tell me:
1. the session code shown on the dashboard
2. the balance of the Everyday Account
Do not take screenshots. Use page snapshots only.
```

```prompt
Take an accessibility snapshot of the dashboard. There is a shield icon near the "Accounts" heading. What exactly does it say? Quote the text.
```

```prompt
Now answer the same question using only a screenshot of the page, without using the snapshot. What text do you see on the shield?
```

```prompt
Open https://gremlin.shiwa.io/release/2 in the same browser. If the sign-in page appears, wait: I will sign in myself. Then tell me the session code and the Everyday Account balance. Use snapshots only.
```

Write down the context or token usage of this session: this is your CLI number. Keep both sessions to these prompts only, so both numbers measure the same work. Where your tool shows it:

- Claude Code: `/context` (or `/cost`)
- Claude Code desktop app: the usage ring next to the model picker
- Codex: `/status`
- Codex desktop app: the context circle in the composer footer (Settings > Composer footer > Show context window usage)
- Copilot in VS Code: the context indicator in the chat input
- Copilot CLI: `/context` (or `/usage`)
- opencode: the session sidebar
- Cursor: the context usage indicator
- Antigravity: no per-session counter; compare `/usage` (CLI quotas) before and after
- Other tools: the usage or context display your tool has

Submit both numbers below ("Token accountant"). We compare the room's numbers in the debrief. Then close the CLI browser:

```prompt
Close the playwright-cli browser.
```

### Stretch: make a transfer by prompt

```prompt
Use the Playwright browser tools. Fill in a transfer of 15,000 HUF from the Everyday Account to the saved payee "Kiss Péter" with reference "Lab 1" and continue to the review page. If the sign-in page appears, wait: I will sign in myself. Stop on the review page: I will enter the transaction PIN and confirm myself.
```

On the review page, type the PIN `2468` yourself, select **Confirm transfer**, and approve the payment in the dialog that opens (**Approve payment**). Then:

```prompt
Done. Tell me the code on the confirmation page. Use snapshots only.
```

The PIN field is one the agent could not have filled anyway: it is invisible to the snapshot, and Lab 5 shows why. The code after "Code:" on the confirmation page unlocks "Money moved". The "PIN check passed" code below it belongs to Lab 5, where a test, not you, types the PIN.

## Done when

- "First contact" and "Snapshot reader" are unlocked.
- You saw the CSS test fail on release 2 and claimed "Brittle witness".
- You submitted your MCP and CLI numbers for the same tasks.

## Hints

- The agent refuses to type the password, or says it cannot sign in? That is expected: sign in yourself in its browser window, then tell it to continue.
- No `playwright` server? Run `npx playwright mcp --help` in the terminal (in a desktop app, ask the agent to run it). If that works, the problem is your tool's MCP config (see "[MCP not showing up](https://hustef.shiwa.io/setup#mcp-not-showing-up)" on your setup card).
- The MCP browser does not show up? Headed is the default; check that `--headless` is not in your MCP config. The CLI starts hidden unless the agent opens it with `--headed`.
- Corporate laptop and the browser can't reach gremlin.shiwa.io? Use your phone hotspot, or run Gremlin Bank locally (setup card "[Local fallback](https://hustef.shiwa.io/setup#local-fallback)").
- Copilot in VS Code used its own built-in browser instead of Playwright? Say "use the Playwright MCP tools" in the prompt, or keep `workbench.browser.enableChatTools` off in `.vscode/settings.json` (already set in the starter repo).


## Checkpoint

```bash
git stash --include-untracked
git fetch origin
git checkout lab-1-done
```

`git stash` puts unfinished changes aside so that the checkout cannot fail on them; `git stash pop` brings them back.
