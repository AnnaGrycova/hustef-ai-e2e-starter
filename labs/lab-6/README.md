---
id: lab6
title: "Lab 6: CI/CD and audit trail"
time: "15:15-15:45"
minutes: 30
goal: "Run the AI-generated suite in GitHub Actions with evidence a regulator would accept: traces, video, a heal report, and a human approval before any AI-made change is merged."
achievements: [green-pipeline, four-eyes, gremlin-tamer]
---

## Goal

Make the suite part of a pipeline that a bank's auditor would accept: every run leaves evidence, and every AI-made change to the tests needs a second person's approval before it is merged.

## The rule for the afternoon

AI writes and repairs tests at authoring time, on a branch. CI runs plain Playwright code, deterministic, with no model in the loop. A human approves every change. That keeps cost, flakiness and risk out of the pipeline.

## Steps

### 1. Connect your fork to the companion app (3 min)

In your fork on GitHub: Settings > Secrets and variables > Actions > New repository secret:

- Name `HUSTEF_TOKEN`, value: your personal token from the companion app ("Me" page).

Then enable Actions in the "Actions" tab if GitHub asks.

### 2. First pipeline run (6 min)

Run the workflow on the branch with your Lab 4 work: Actions > "E2E" > Run workflow, choose your `governed-heal` branch under "Use workflow from", and leave the release empty. On a checkpoint branch (`my-lab-4`, `my-lab-5`), push it first with `git push -u origin HEAD` and choose that branch. From now on every push runs the workflow too. Open the run and look at:

- **Job summary**: the audit record. Commit, author, Playwright version, Gremlin Bank release under test, test counts, and a summary of `heal-report.json` if one exists.
- **Artifacts**: the HTML report, traces (with aria and screen snapshots) and videos of failed tests. Download one trace and open it at https://trace.playwright.dev or with `npx playwright show-trace`.

A green run unlocks "Green pipeline" automatically. A green run against release 2 also unlocks "Gremlin tamer": run the workflow once more on the same branch with release `2`.

### 3. Require a second person (7 min)

Pair up with your neighbour. Each of you adds the other as a collaborator on your fork (Settings > Collaborators) and accepts the other's invitation (GitHub sends it by email and shows it on the fork's page).

Edit `.github/CODEOWNERS` on `main` so the tests are owned by your neighbour. GitHub takes the code owners from the branch a pull request goes into, so do this before you protect `main`, for example in the GitHub web editor (pencil icon, "Commit directly to the main branch"):

```
/tests/   @your-neighbours-username
/specs/   @your-neighbours-username
```

Then protect `main`: Settings > Rulesets > New ruleset > New branch ruleset (or the classic Settings > Branches). Give the ruleset a name, set Enforcement status to Active, and under Target branches choose Add target > Include default branch. Then turn on:

- Require a pull request before merging, with 1 approval.
- Dismiss stale pull request approvals when new commits are pushed.
- Require approval of the most recent reviewable push.
- Require review from Code Owners.
- Require the "E2E" status check to pass.

The two "approval" settings close a gap: without them the author can push a new commit after the approval and merge it unreviewed.

### 4. Open a pull request with an AI heal (7 min)

Open a pull request from your `governed-heal` branch (Lab 4, step 5: the governed heal for release 3 with `heal-report.json`) to `main` in your fork. On a checkpoint branch, open it from that branch (`my-lab-4` or `my-lab-5`).

The workflow runs `scripts/audit-heal.mjs` on the pull request. It fails the check if:

- a test file changed an expected value in an assertion, and
- `heal-report.json` does not list that change with a human sign-off (`humanSignOff`). An agent's own classification is never enough to change an expected value.

Read the bot's summary on the pull request. Your neighbour reviews the diff and the heal report, and approves. The approval unlocks "Four eyes" for the author.

### 5. Look at what you built (3 min)

For one AI-made change you can now show: who asked for it, which model and tool made it, what changed, why (the classification), the trace of the failing run, the green run after the change, and who approved it. That is an audit trail. Here the workflow keeps its artifacts for 30 days; real audit evidence goes to write-protected storage with the retention your policy sets.

## Done when

- A green pipeline run with artifacts and an audit summary.
- `main` is protected, CODEOWNERS points to your neighbour, and an AI heal went through a reviewed pull request.

## Hints

- The companion app didn't unlock anything? Check the secret name (`HUSTEF_TOKEN`) and look at the "Report to companion app" step log.
- You can't add branch protection? You need to be the owner of the fork. Rulesets work on free accounts for public repositories.
- No neighbour available? Ask the facilitator to review.
- Want the agent to run in CI too? That needs an API key and a budget. The repo also contains `copilot-setup-steps.yml` for the Copilot coding agent (paid plans). Keep the human approval either way.


## Checkpoint

```bash
git stash --include-untracked
git fetch upstream
git checkout -b my-lab-6 upstream/lab-6-done
```

`git stash` puts unfinished changes aside so that the checkout cannot fail on them; `git stash pop` brings them back.
