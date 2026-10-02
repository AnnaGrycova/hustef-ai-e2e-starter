# Project guide for AI agents

This repository is the attendee workspace of a hands-on workshop on AI-assisted end-to-end testing
(HUSTEF 2026). It contains Playwright tests for **Gremlin Bank**, a fictional bank web app that
exists only as practice material.

## The application under test

- URL: `GREMLIN_URL` in `.env` (default https://gremlin.shiwa.io). Users, password and the TOTP
  secret are in `.env` as well. They are test accounts of a demo app, not real credentials.
- The source code of Gremlin Bank is **not** in this repository, on purpose. Do not search the
  disk or the internet for it. Explore the application in the browser (Playwright MCP, Playwright
  CLI or the `playwright-test` MCP server), the way a user would.
- Gremlin Bank has several releases. `GREMLIN_RELEASE` in `.env` (empty, 1, 2 or 3) decides which
  one the tests see. Empty follows the release the workshop facilitator has shipped.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | install the pinned packages (Playwright 1.63.0) |
| `npx playwright install chromium` | download Playwright's Chromium |
| `npx playwright test` | run the suite |
| `npx playwright test <file>` | run one file, for example `npx playwright test seed.spec.ts` |
| `npx playwright test --ui` | UI mode |
| `npx playwright show-report` | open the last HTML report |
| `npx playwright cli <command>` | Playwright CLI (browser control from the shell, see the `playwright-cli` skill) |
| `npm run doctor` | check the local setup and the network |
| `npm run typecheck` | type-check all TypeScript files (`tsc --noEmit`); Playwright runs tests without a type check |

Use `npx playwright ...` from this repository, not a globally installed `playwright-cli` or
`@playwright/mcp`: they run a different Playwright version.

## Where things go

| Path | Content |
|---|---|
| `seed.spec.ts` | seed test for the planner and the generator: signs in as `GREMLIN_USER` and stops on the dashboard |
| `specs/` | test plans in Markdown, written by the planner and reviewed by a human |
| `tests/` | your tests. Page objects go in `tests/pages/` |
| `tests/fixtures.ts` | shared fixtures. Every test imports `test` and `expect` from here |
| `tests/walls/` | Lab 5 exercises. They run only when named: `npx playwright test tests/walls/totp.spec.ts` |
| `examples/` | an old-style test kept as a bad example. Runs only when named |
| `labs/` | the lab instructions |

## Conventions for test code

- Import `test` and `expect` from `tests/fixtures.ts` (or `./fixtures` inside `tests/`), not from `@playwright/test`.
- Locators: `getByRole`, `getByLabel`, `getByText` first. `getByTestId` only where no accessible role or name exists, for test ids the developers agreed to keep stable. No CSS or XPath selectors.
- Assertions: web-first (`await expect(locator).toHaveText(...)`), every action and `expect` awaited. No `waitForTimeout`, no `networkidle`, no `expect(await locator.isVisible()).toBe(true)`. An assertion must be able to fail: check a state that the action changes.
- Check business values (amounts, fees, totals, balances), not only that a page loaded. Expected values come from the plan in `specs/` or the business rule, never from what the page shows.
- One behaviour per test, named after that behaviour. Tests do not depend on each other.
- Do not assert random values (tip of the day, EUR/HUF rate, generated references): assert their format.
- No passwords, PINs or secrets in test code: read them from the environment (`env('GREMLIN_PASSWORD')`, `env('GREMLIN_PIN')` in `tests/fixtures.ts`). Never ask the user to paste a password into the chat and never type a real person's credentials: sign in through the seed test or a stored test-user state, or let the user sign in in the browser window.
- Page objects in `tests/pages/` hold locators and actions; the `expect` checks on business values stay in the tests.
- A test for a known application bug is marked `test.fail()` with a comment (expected vs observed), not skipped and not healed.
- Run `npm run typecheck` and the tests you changed before you commit.
- Every browser context starts with a fresh bank state (the state lives in a cookie), so tests can make transfers freely.
