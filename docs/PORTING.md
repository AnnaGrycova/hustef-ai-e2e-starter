# Porting this setup to your own project

What to take from this repository into an existing project, and what to do if your suite is not Playwright.

## An existing Playwright project

1. **Pin Playwright** to one exact version in `package.json` (no `^`), commit the lock file, and use the bundled MCP server and CLI (`npx playwright mcp`, `npx playwright cli`, Playwright 1.62 and newer) so that agents and tests run the same Playwright.
2. **Generate the agents for your tools** in the repo root:

   ```bash
   npx playwright init-agents --loop=vscode     # VS Code and Copilot (same files as --loop=copilot)
   npx playwright init-agents --loop=claude
   npx playwright init-agents --loop=codex
   npx playwright init-agents --loop=opencode
   npx playwright init-skills --loop=claude
   npx playwright init-skills --loop=agents
   ```

   With 1.63.0, fix two things afterwards: the generator's example code `async { page } =>` (should be `async ({ page }) =>`) and the `npx run build` step in `.github/workflows/copilot-setup-steps.yml`. Narrow the skills' `allowed-tools` from `Bash(npx:*) Bash(npm:*)` to `Bash(npx playwright:*)`. Check that `opencode.json` does not hide your browser server's tools (`"playwright*": false` matches both servers).
3. **Add the browser server** `playwright` (`npx playwright mcp`) next to `playwright-test` in each tool's config. Copy the files from this repo: `.vscode/mcp.json`, `.mcp.json`, `.cursor/mcp.json`, `.codex/config.toml`, `opencode.json`, `.agents/mcp_config.json`.
4. **A seed test** that brings the app into a known start state (signed in as a test user, on a start page). The planner and the generator start from it.
5. **Trace settings** in `playwright.config.ts`: `trace: { mode: 'on-first-retry', snapshots: { dom: true, aria: true, screen: true } }` is Playwright's recommendation for everyday CI. Use `'on'` (as this repo does) only where you keep traces of green runs as evidence, and `retain-on-failure` to save space. `video: 'retain-on-failure'`.
6. **The governed healer** (`labs/lab-4/governed-healer/`) instead of, or next to, the stock healer. Adapt the business values in rule 1 to your domain.
7. **CI**: `.github/workflows/e2e.yml` (evidence and audit record), `scripts/audit-heal.mjs` (heal audit on pull requests), `.github/CODEOWNERS`, the pull request template, and a branch rule on `main` that requires the check and one approval from someone other than the author, dismisses stale approvals when new commits are pushed, and requires approval of the most recent push. Add `tsc --noEmit` and the `@typescript-eslint/no-floating-promises` lint rule as blocking steps (Playwright's best practices), pin third-party actions to a full commit SHA, and keep passwords in CI secrets.
8. **Test accounts**: test accounts only, credentials from the environment or a secret store, storage state files (`playwright/.auth/`) in `.gitignore`. When tests change server-side data, give each parallel worker its own account (Playwright's authentication guide), and give lockout tests an account of their own.
9. **AGENTS.md**: how to run the tests, where tests and plans go, the conventions. Say whether the agent may read the application source. If it can read the source, the planner tends to read code instead of exploring the running app.

Before an agent touches your application: a test environment and test accounts only, no production or customer data, and your company's approval for the tool, the model endpoint and MCP.

## Cypress teams

- **Keep your suite.** Try `cypress tap` with your agent: it lets the agent drive a live `cypress open` session.
- `cy.prompt` (generally available since August 2026) writes natural-language steps that resolve at run time. It needs Cypress Cloud and is metered: check the data terms and the cost per run before you use it in CI, and remember that a step resolved at run time can resolve differently next time.
- The process from today does not depend on the framework: a reviewed plan, generated code that a person reviews, a heal step that classifies failures and never changes expected business values, a heal report, and an approval before merge. `scripts/audit-heal.mjs` works on any JavaScript or TypeScript test files under `tests/`; change the path for `cypress/e2e/`.

## Selenium and WebdriverIO teams

- Selenium has official guidance for AI agents (September 2026) but no official MCP server.
- WebdriverIO: `@wdio/mcp`; Appium: `appium-mcp`.
- A practical start: a small Playwright suite for one new feature next to the existing suite, with the setup from this repo. Compare maintenance effort after a few releases before you decide on more.
- Migrating existing tests with an agent: give it one test at a time, ask it to keep every assertion and expected value, review each result with the Lab 3 checklist, and keep the old test until the new one has been green for a while.

## Which tool for which job

See the decision framework in the companion app (hustef.shiwa.io/framework): local development (Playwright MCP and Test Agents), context-constrained agents (Playwright CLI and skills), cloud-scale execution (sharding, managed browser grids), managed platforms (prefer the ones that export plain Playwright code).
