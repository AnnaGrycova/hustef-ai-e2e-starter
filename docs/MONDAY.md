Write three steps you will take in your own project next week. Keep each one small enough to finish in a day.

## Template

1. **First step (Monday morning)**: for example "Run `npx playwright init-agents --loop=<your tool>` (vscode, copilot, claude, codex or opencode) in our repo and let the planner map one feature on the test environment."
2. **Second step (this week)**: for example "Generate tests for that feature, review them with the Lab 3 checklist, merge only what passes review."
3. **Third step (next two weeks)**: for example "Add the heal report and the approval rule to our pipeline, and agree with the team who reviews AI-made test changes."

## Before you point an agent at your own application

- Use a test environment and test accounts only. No production data, no real customer data.
- Check your company's AI policy: which tools and model endpoints are approved, and whether MCP servers are allowed (Copilot Business/Enterprise has MCP off by default).
- Keep the starter repo as your template: configs for every tool, the governed healer, the audit workflow.

## If your suite is not Playwright

- Cypress: try `cypress tap` with your agent, or `cy.prompt` if your data terms allow Cypress Cloud.
- Selenium or WebdriverIO: start a small Playwright suite for one new feature next to your existing suite, or try `@wdio/mcp`. The patterns from today (plan, review, governed heal, approval) do not depend on the framework.

See `docs/PORTING.md` in the starter repo for step-by-step instructions.
