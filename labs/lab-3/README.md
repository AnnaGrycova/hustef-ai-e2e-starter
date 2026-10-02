---
id: lab3
title: "Lab 3: Generate and review"
time: "11:25-12:30"
minutes: 65
goal: "Turn the reviewed plan into executable Playwright tests, review the AI-generated code with a tester's checklist, refactor it into page objects, read a trace, and push to your fork."
achievements: [code-reviewer, page-object-pro, trace-detective, transfer-done]
---

## Goal

Turn your reviewed plan into real, executable Playwright tests with the generator agent. Then do the part that matters most: review the generated code, refactor it, and read a trace so you can explain a failure without the agent.

## Steps

### 1. Fork and set your remote (5 min)

You need your own copy on GitHub for Lab 6. On GitHub, fork `gyurmatag/hustef-ai-e2e-starter` to your account, then:

```bash
git remote rename origin upstream
git remote add origin https://github.com/<your-username>/hustef-ai-e2e-starter.git
git push -u origin HEAD
```

### 2. Generate tests (15 min)

Call the generator agent (see "[Planner, generator, healer](https://hustef.shiwa.io/setup#planner-generator-healer)" on your setup card) with:

```prompt
Use the playwright-test-generator agent. Generate Playwright tests from specs/gremlin-bank.md for these sections: sign in, dashboard, and domestic transfer (happy path, validation, fee boundaries). Use the seed test for setup. Take the user and password from env('GREMLIN_USER') and env('GREMLIN_PASSWORD') in tests/fixtures, never as literals. One test file per section in tests/. Write at most 12 tests in total, including the fee examples from the plan. Prefer getByRole and getByLabel locators and web-first assertions.
```

The generator executes each step in a live browser before writing it, so the locators are based on what it actually saw. An expected value it read from the page is only as correct as the page: check it against the plan and the business rule (step 4, point 3).

### 3. Run and stabilise (10 min)

```bash
npx playwright test
```

Some generated tests may fail on the first run. That is normal. Ask the healer to fix failures you agree are test mistakes, or fix them yourself. Do not accept a change you don't understand.

```bash
npx playwright test --ui
```

UI mode lets you step through each test and watch it.

### 4. Review the generated code (15 min)

Pick at least three tests and score each against this checklist (the companion app has the same list with checkboxes):

1. Locators use roles, labels or visible text (`getByRole`, `getByLabel`, `getByText`), not CSS or XPath. `getByTestId` is fine for test ids the developers keep stable.
2. Assertions are web-first (`await expect(locator).toHaveText(...)`) and every action and `expect` is awaited. No `waitForTimeout`, no `networkidle`, no `expect(await locator.isVisible()).toBe(true)`.
3. The test checks business values (fee, total, balance), and each expected value comes from the plan or the business rule, not from what the page showed.
4. One behaviour per test, and the name says which.
5. No dependency on other tests or on leftover data.
6. Nothing asserts random data (tip of the day, EUR/HUF rate).
7. No passwords or secrets in the code; they come from `.env`.
8. Make it fail once on purpose: does the error message tell a human what went wrong?

Submit your scores ("Code reviewer").

### 5. Refactor into page objects (8 min)

A page object is a class for one page of the app. It holds that page's locators and actions, for example `LoginPage.signIn(user, password)`. Tests call those methods and keep their own `expect` checks, so a test reads like the user's journey, and when the UI changes you fix one class instead of every test.

Behind schedule at 12:10? Skip this step and go to step 6. It is optional; the healer in Lab 4 also works without page objects.

```prompt
Refactor the tests in tests/ to use page objects: LoginPage, DashboardPage, TransferPage and ReviewPage in tests/pages/. Page objects hold locators and actions; keep the expect() checks on business values in the tests. Keep locators role- and label-based. Do not change any expected values. Run the tests after the refactor and show me the diff.
```

Review the diff before you accept it. Check point 3 of the checklist again: did any expected value change? Claim "Page objects".

### 6. Read a trace (6 min)

```bash
npx playwright test --trace on
npx playwright show-report
```

Open a transfer test and click its trace. In the trace viewer:

- Step through the actions and look at the DOM snapshot of each step.
- Switch the snapshot to **Display Aria** (new in Playwright 1.63) to see the accessibility snapshot the agent sees.
- Find the step that checks the fee.

Answer in the companion app: what is the fee for a 100,000 HUF transfer in release 1? ("Trace detective")

### 7. Commit and push (2 min)

```bash
git add -A
git commit -m "Generated and reviewed tests"
git push
```

## Done when

- The suite is green locally on release 1.
- You reviewed at least three tests (and refactored into page objects, if you had time).
- Your work is pushed to your fork.

## Hints

- The generator writes `page.locator('#...')`? Ask it to replace CSS locators with role-based ones and explain each change.
- A test fails only sometimes? Look for a missing wait on the "Loading accounts..." spinner or an assertion on random data. Web-first assertions wait automatically.
- The generator will not type the password while it writes the sign-in tests? Some tools refuse to type passwords into a website. Let it write those steps with `env('GREMLIN_PASSWORD')` without trying them in the browser, then run the tests yourself.
- The transfer test can't fill the Transaction PIN? Mark that test with `test.fixme()` and a comment for now (`fixme`, not `fail`: the test is unfinished, the application is not wrong). Lab 5 solves it.
- `git push` asks for credentials? Use GitHub Desktop, `gh auth login`, or a personal access token.


## Checkpoint

```bash
git stash --include-untracked
git fetch upstream
git checkout -b my-lab-3 upstream/lab-3-done
```

`git stash` puts unfinished changes (for example generated tests with the same file names) aside so that the checkout cannot fail on them; `git stash pop` brings them back.
