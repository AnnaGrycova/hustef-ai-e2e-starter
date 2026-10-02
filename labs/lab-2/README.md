---
id: lab2
title: "Lab 2: Explore and plan"
time: "10:45-11:25"
minutes: 40
goal: "Let the planner agent map an application it has never seen, turn that into a structured test plan, and review the plan the way a tester would."
achievements: [cartographer, double-take]
---

## Goal

Let the Playwright planner agent explore Gremlin Bank and write a structured test plan. Then review it as a tester: what is missing, what is risky, what is wrong. Finally, run the planner twice and see how much the output changes.

## Background

`npx playwright init-agents` has already been run in the starter repo for every supported tool, so the three Playwright Test Agents are ready:

| Agent | What it does | Output |
|---|---|---|
| planner | explores the app in a real browser | a Markdown plan in `specs/` |
| generator | turns a plan into test code, checking each step live | test files in `tests/` |
| healer | runs failing tests, inspects the page, patches the test | edited test files |

They talk to the browser through a second MCP server, `playwright-test`, which can also run tests. The planner starts from `seed.spec.ts`, which signs in as `demo`.

## Steps

### 1. Check the seed test (2 min)

```bash
npx playwright test seed.spec.ts
```

It should pass. The planner uses it to get a signed-in page.

### 2. Run the planner (11 min)

Call the planner the way "[Planner, generator, healer](https://hustef.shiwa.io/setup#planner-generator-healer)" on your setup card describes (agent picker, subagent, `@` mention or prompt file), with this prompt. It names the agent, so in Claude Code, also in the desktop app, pasting it is enough:

```prompt
Use the playwright-test-planner agent. Explore Gremlin Bank using the seed test seed.spec.ts. Produce a test plan covering:
1. Sign in and sign out
2. The dashboard (accounts, recent transactions, chart data)
3. A domestic transfer: form validation, fees, limits, review page and confirmation
Include negative cases and boundary values. Keep it to at most 20 scenarios: put related values, for example the fee examples, into one scenario. Save the plan as specs/gremlin-bank.md.
```

It takes a few minutes. Watch the browser: the agent is mapping an application it has never seen. Gremlin Bank's source code is not in your repo on purpose; the agent has to explore it like a user.

### 3. Review the plan like a tester (14 min)

First start the second planner run for step 4 in a fresh chat: the same prompt, but save to `specs/gremlin-bank-run2.md`. It runs while you review.

Open `specs/gremlin-bank.md` and check it against this list. Fix gaps by editing the file yourself, or ask the agent once the second run has finished.

- [ ] Every scenario has steps and an expected result that can be checked.
- [ ] Negative cases: wrong password, empty beneficiary, invalid IBAN, zero amount, wrong PIN.
- [ ] Boundary values for the amount: 1, 2,000,000 (daily limit) and 2,000,001, 10,000,000 (single limit) and 10,000,001.
- [ ] The fee rule is tested with values that hit the minimum and the maximum: 0.3% of the amount, at least 200 HUF, at most 6,000 HUF. For example 10,000 -> 200, 100,000 -> 300, 2,000,000 -> 6,000.
- [ ] Insufficient funds.
- [ ] Expected values come from the business rule (fee rule, limits), not from what the planner happened to see on the page: the plan is the oracle for Lab 3.
- [ ] Nothing asserts random data (tip of the day, EUR/HUF rate).
- [ ] Each scenario has a risk tag: `[high]`, `[medium]` or `[low]`. Money movement is `[high]`.

Submit the number of scenarios in your plan in the companion app ("Cartographer"). Each scenario is a `####` heading; `git grep --no-index -c "^#### " specs/gremlin-bank.md` counts them.

### 4. Non-determinism: compare the two runs (5 min)

When the second run (started in step 3) has finished, compare the two plans:

```bash
git diff --no-index --stat specs/gremlin-bank.md specs/gremlin-bank-run2.md
git grep --no-index "^#### " specs/gremlin-bank.md specs/gremlin-bank-run2.md
```

The second command lists the scenario titles of both plans. The wording always differs, so match them by meaning. Count the scenarios that appear in only one of the two plans and submit the number ("Double take"). Same model, same prompt, same app, different plan. This is why we commit the generated plan and the generated code, review them, and run plain deterministic tests in CI, instead of asking an agent to test the app from scratch on every run.

### 5. Commit (2 min)

```bash
git add specs/
git commit -m "Test plan for Gremlin Bank"
```

Delete or keep `gremlin-bank-run2.md`; only `gremlin-bank.md` is used in Lab 3.

## Done when

- `specs/gremlin-bank.md` exists, reviewed against the checklist, with risk tags.
- "Cartographer" and "Double take" are unlocked.

## Hints

- The planner does not start? Check that the `playwright-test` MCP server is running ("[MCP not showing up](https://hustef.shiwa.io/setup#mcp-not-showing-up)" on your setup card). In VS Code, open the MCP server list and start it.
- The plan is still huge? Ask it to merge similar scenarios, at most 20.
- The plan only covers the happy path? Give it the boundary list above and ask for those cases explicitly.


## Checkpoint

```bash
git stash --include-untracked
git fetch origin
git checkout lab-2-done
```

`git stash` puts unfinished changes (for example a half-written `specs/gremlin-bank.md`) aside so that the checkout cannot fail on them; `git stash pop` brings them back.
