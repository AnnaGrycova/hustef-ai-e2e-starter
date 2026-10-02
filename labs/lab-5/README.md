---
id: lab5
title: "Lab 5: Where agents break"
time: "14:20-15:00"
minutes: 40
goal: "Hit the four walls that rarely appear in demos (authentication, multi-factor flows, Shadow DOM and canvas, non-determinism), learn the workaround for each, and hand a paused test over to a human and back."
achievements: [wall-auth, wall-totp, handoff, shadow-open, shadow-closed, chart-reader, steady-hands]
---

## Goal

Everyone does all four walls. Each wall has a ready-made test in `tests/walls/` that fails or cannot be written the naive way. Your job: recognise the wall, apply the pattern, and know when the right fix is to ask the developers for a change.

## Wall 1: Authentication (7 min)

Signing in through the UI in every test is slow and a common place for agents to waste tokens. Sign in once, save the browser state, reuse it.

1. Open `tests/walls/auth.setup.ts`. It signs in as `demo` and saves the state to `playwright/.auth/demo.json`.
2. Look at the `setup` project and `dependencies` in `playwright.config.ts`.
3. Run the same dashboard tests without and with the stored state and compare the duration of each test (in brackets after the test name; the total of the second run also contains the one-time sign-in):

```bash
npx playwright test tests/walls/auth --project=chromium
npx playwright test tests/walls/auth --project=with-auth
```

The first run signs in through the UI in every test. The second runs the `setup` project once, then starts each test already signed in.

For agents the same idea applies: Playwright MCP accepts `--storage-state`, and the CLI has `state-load` / `state-save`. Never give an agent a real person's credentials or session. The state file holds a session cookie: it is git-ignored, keep it that way. Here every test shares one stored test user, which works because Gremlin Bank keeps each browser's data separate; an app with server-side state needs one test account per parallel worker.

Claim "Logged in once".

## Wall 2: Multi-factor flows and pause and attach (12 min)

### 2a. TOTP: automate it

`totp.tester` uses an authenticator app code. The secret is a test secret in `.env`, so the test can generate the code itself:

```bash
npx playwright test tests/walls/totp.spec.ts
```

Open the file and see how `otpauth` generates the 6-digit code. Read the code on the dashboard and enter it in the companion app ("Authenticator").

In a real project, keep the TOTP secret of each test account in your secret store, and give each parallel worker its own test account: two workers with the same code in the same 30 seconds can block each other.

### 2b. Push approval: hand over to a human

`push.tester` must approve the sign-in on a phone, by choosing the number shown on the screen. A test cannot and should not do that. This is the **pause and attach** pattern: the test pauses, a human does the step only a human can do, and the automation (or an agent) attaches to the same browser and continues.

1. Start the test in CLI debug mode:

```bash
npx playwright test tests/walls/push-login.spec.ts --debug=cli
```

2. A browser window opens and the test pauses at its start. The terminal prints debugging instructions with a session name, for example `playwright-cli attach tw-1a2b3c`.
3. In a second terminal (or let your agent run it), attach to that session and let the test continue:

```bash
npx playwright cli attach <name-from-the-instructions>
npx playwright cli -s=<name-from-the-instructions> resume
```

The test signs in and pauses again on the "Approve sign-in on your phone" page.

4. Scan the QR code with your phone (or open the "Can't scan?" link on your phone) and tap the number you see on the laptop screen.
5. Let your agent take over the paused browser:

```prompt
You are attached to a paused Playwright test in the playwright-cli session <name-from-the-instructions>. Using playwright-cli (npx playwright cli -s=<name> ...), take a snapshot of the current page and tell me the code next to "Approved on your phone". Then resume the test.
```

Enter the code in the companion app ("Human handoff"). The same pattern works with `--extension` (attach to your own Chrome) and with Chrome DevTools MCP `--autoConnect`.

In CI, no test should wait for a phone. Run the regular suite with test accounts that use TOTP, and test the push flow itself in a test environment where the push service is replaced by a test double or approved through a test-only API. Pause and attach is for exploring with an agent, for debugging and for the rare check that needs a person; that is why `push-login.spec.ts` skips itself unless you run it with `--debug=cli`.

## Wall 3: Invisible to the snapshot: Shadow DOM and canvas (9 min)

### 3a. Open Shadow DOM: works

The IBAN field on the transfer page is a web component with an open shadow root. Playwright locators pierce open shadow roots:

```bash
npx playwright test tests/walls/shadow-open.spec.ts
```

Read the code shown after "IBAN verified" ("Open shadow").

### 3b. Closed Shadow DOM: the wall

The Transaction PIN on the review page uses a closed shadow root. Ask your agent:

```prompt
Use the Playwright browser tools. Start a transfer of 1,000 HUF from the Everyday Account to the saved payee "Kiss Péter" and continue to the review page. If the sign-in page appears, wait: I will sign in myself. On the review page, take a snapshot. Can you see the Transaction PIN field? Do not type anything or confirm; tell me what the snapshot shows between the amount and the confirm button.
```

The PIN is not in the snapshot, and `getByLabel('Transaction PIN')` finds nothing. Workaround: keyboard focus still works. Open `tests/walls/shadow-closed.spec.ts`, complete the `TODO` (focus the confirm button, press Shift+Tab, type the PIN), and run it. The code on the confirmation page unlocks "Closed shadow".

The real fix belongs to the developers: an open shadow root, or a test hook. Write it down as a testability request.

### 3c. Canvas

The spending chart on the dashboard is drawn on a canvas. Snapshots see nothing in it. Use the accessible alternative ("Show chart data") and read the code in the table caption ("Chart reader"). No accessible alternative means no reliable test and no screen reader support: also a request for the developers.

## Wall 4: Non-determinism (9 min)

The dashboard has a spinner with a random delay, a random tip of the day and a random EUR/HUF rate. `tests/walls/flaky.spec.ts` passes sometimes. Prove it:

```bash
npx playwright test tests/walls/flaky.spec.ts --repeat-each=10 --reporter=list,./reporters/steady.ts
```

Fix it: wait with web-first assertions instead of fixed timeouts, and stop asserting random values (assert the format of the rate, not the number). If a value matters to users, make it deterministic instead: mock the response with `page.route()`, or ask the developers for a test setting. When 10 out of 10 runs pass, the steady reporter prints a code ("Steady hands").

Retries do not fix flakiness. With retries on (the CI config uses one), Playwright reports a test that passes only on the retry as "flaky": watch that number in the job summary in Lab 6. A flaky test gets quarantined with a ticket and an owner, and its cause gets fixed. Atlassian found flaky tests behind up to 21% of master build failures in its Jira frontend repository (December 2025).

The model is non-deterministic too: you saw that with the two planner runs in Lab 2. Generated code is reviewed and committed once, then runs the same way every time.

## Done when

All four walls are done and their badges are unlocked: Logged in once, Authenticator, Human handoff, Open shadow, Closed shadow, Chart reader, Steady hands.

## Hints

- `--debug=cli` prints nothing useful? Make sure you are on Playwright 1.63.0 (`npx playwright --version`).
- No phone at hand? Use the "Can't scan?" link in a second browser window on your laptop. It counts as the human step.
- `attach` cannot find the browser? Copy the exact name (`tw-...`) from the debugging instructions; the paused test keeps running only while its terminal is open. After `attach`, `npx playwright cli list` shows the session. Every later command needs the session: `npx playwright cli -s=<name> snapshot`.


## Checkpoint

```bash
git stash --include-untracked
git fetch upstream
git checkout -b my-lab-5 upstream/lab-5-done
```

`git stash` puts unfinished changes (for example your edited wall tests) aside so that the checkout cannot fail on them; `git stash pop` brings them back.
