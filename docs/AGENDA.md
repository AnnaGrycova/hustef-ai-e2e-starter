# AI Agents Take the Wheel: Hands-On End-to-End Testing with Browser MCP and Agentic Automation

HUSTEF 2026 Tutorial Day, Tuesday 6 October 2026, 9:00-16:30, Fortix office meeting room, Budapest. Facilitator: György Márk Varga, Shiwaforce.

Everything you need during the day is in the companion app: https://hustef.shiwa.io

| Time | Block | What you do |
|---|---|---|
| 8:30-9:00 | Setup desk | Arrive early if `npm run doctor` was not green at home. We fix installs, network and AI tool access together. Join the companion app with code `HUSTEF26`. |
| 9:00-9:15 | Kickoff | Who is in the room, what we build today, how the day works. Join the companion app. |
| 9:15-9:45 | M1 First principles and the MCP paradigm | How an LLM uses tools, what an agent loop is, what MCP is. Selectors vs screenshots vs accessibility snapshots, and why that changes the cost of test maintenance. A 5-minute live demo: an agent signs in to a bank and writes a test. |
| 9:45-10:30 | Lab 1 First drive | Connect your agent to Playwright MCP and Playwright CLI. Drive Gremlin Bank with prompts. Read what only the accessibility snapshot shows. Watch a CSS-selector test break on a UI release while the agent copes. Measure MCP vs CLI token use. |
| 10:30-10:45 | Coffee | |
| 10:45-11:25 | Lab 2 Explore and plan | The planner agent maps an application it has never seen and writes a structured test plan. You review it as a tester: negative cases, boundaries, risk tags. Run it twice and compare. |
| 11:25-12:30 | Lab 3 Generate and review | The generator turns the plan into executable Playwright tests. You review the code with a checklist, refactor it into page objects, read a trace, and push to your fork. |
| 12:30-13:30 | Lunch | |
| 13:30-14:20 | Lab 4 Heal | New releases of Gremlin Bank change the UI. The healer repairs your tests and you review every change it makes. Then you write a stricter healer that classifies every failure and writes a heal report. |
| 14:20-15:00 | Lab 5 Where agents break | Four walls: authentication, multi-factor flows (with the pause-and-attach handoff to a human), Shadow DOM and canvas, non-determinism. A pattern for each. |
| 15:00-15:15 | Coffee | |
| 15:15-15:45 | Lab 6 CI/CD and audit trail | Run the suite in GitHub Actions with traces, video and an audit summary. Protect `main`, require a second person's approval for AI-made changes, and pass a heal through a reviewed pull request. |
| 15:45-16:00 | M7 Decision framework | Local development, context-constrained agents, cloud-scale execution, managed platforms, and options for Cypress and Selenium teams. Scenario cards exercise. |
| 16:00-16:20 | M8 Strategy canvas | Teams of three design an AI agent testing strategy for a bank, insurer, telco, healthcare or fintech scenario: governance, oversight, the QA engineer's new role. 90-second pitches. |
| 16:20-16:30 | Monday plan and wrap-up | Three steps for your own project, awards, feedback. |

You leave with: a working setup on your laptop, a repo with configs for every major AI coding tool, a reviewed and healed test suite, a pipeline with an approval gate, and a plan for Monday.
