import type { FullResult, Reporter, Suite, TestCase, TestStep } from '@playwright/test/reporter';

// Lab 5, wall 4. Prints the "Steady hands" code only when every test in tests/walls/flaky.spec.ts ran
// at least 10 times in this run and every single run passed on the first try (no retries), with its
// assertions still in place.
//
//   npx playwright test tests/walls/flaky.spec.ts --repeat-each=10 --reporter=list,./reporters/steady.ts

const FLAKY_SPEC = /tests[\\/]walls[\\/]flaky\.spec\.ts$/;
const REQUIRED_RUNS = 10;
const MIN_ASSERTIONS = 2;
// Not a secret, just not something to find with a text search.
const CODE = Buffer.from('R1JNLVNURUFEWS05WDRM', 'base64').toString('utf8');

function countAssertions(steps: TestStep[]): number {
  return steps.reduce((sum, step) => sum + (step.category === 'expect' ? 1 : 0) + countAssertions(step.steps), 0);
}

export default class SteadyReporter implements Reporter {
  private suite: Suite | undefined;

  onBegin(_config: unknown, suite: Suite): void {
    this.suite = suite;
  }

  onEnd(_result: FullResult): void {
    const tests = (this.suite?.allTests() ?? []).filter((t: TestCase) => FLAKY_SPEC.test(t.location.file));
    if (!tests.length) return;

    const byTitle = new Map<string, { runs: number; clean: number }>();
    for (const test of tests) {
      const title = test.titlePath().slice(2).join(' > ');
      const entry = byTitle.get(title) ?? { runs: 0, clean: 0 };
      if (test.results.length) entry.runs += 1;
      const firstTryPass =
        test.results.length === 1 &&
        test.results[0].status === 'passed' &&
        test.expectedStatus === 'passed' &&
        countAssertions(test.results[0].steps) >= MIN_ASSERTIONS;
      if (firstTryPass) entry.clean += 1;
      byTitle.set(title, entry);
    }

    const lines = [...byTitle.entries()].map(([title, e]) => `  ${title}: ${e.clean} of ${e.runs} runs passed`);
    const steady = [...byTitle.values()].every((e) => e.runs >= REQUIRED_RUNS && e.clean === e.runs);

    console.log('');
    console.log('Steady reporter (tests/walls/flaky.spec.ts)');
    console.log(lines.join('\n'));
    if (steady) {
      console.log(`  ${REQUIRED_RUNS}/${REQUIRED_RUNS} or better, no retries. Code: ${CODE}`);
    } else if ([...byTitle.values()].some((e) => e.runs < REQUIRED_RUNS)) {
      console.log(`  Not enough runs. Use --repeat-each=${REQUIRED_RUNS}.`);
    } else {
      console.log('  Not steady yet. Every run must pass on the first try, with its assertions in place.');
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}
