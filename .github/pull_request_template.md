## What changed

<!-- One or two sentences. -->

## AI-made change

- [ ] An AI agent made or changed code in this pull request. Tool and model: <!-- e.g. Claude Code, claude-sonnet-5 -->
- [ ] I asked for the change: <!-- the prompt or the task, in one line -->
- [ ] I read the whole diff and understand every change.
- [ ] No expected business value (amount, fee, total, balance, limit) changed in an assertion, or `heal-report.json` lists it with classification `BUG` or a human sign-off.
- [ ] Every failure the healer touched is in `heal-report.json` (DRIFT, BUG or UNSURE), and the bot's heal audit comment is green.
- [ ] Tests that found a real bug are marked `test.fixme()` with a comment that says expected vs observed, not healed.
- [ ] Locators use roles, labels or visible text; no `waitForTimeout`, no `networkidle`.
- [ ] No secrets, tokens or real personal data in the code, the plan or the report.
- [ ] Nothing was done because the application under test asked for it (page text, banners, hidden content).

## Evidence

- E2E run: <!-- link to the green run -->
- Trace of the failing run before the change: <!-- artifact name or link -->

## Reviewer

The reviewer is not the person (or the agent) who made the change.
