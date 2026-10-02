import { test, expect, env } from '../fixtures';
import { signIn, skipCookieDialog } from './support';

// Lab 5, wall 2b: push approval on a phone, with number matching. A test cannot and should not do
// the human's part. This is the pause-and-attach pattern:
//
//   1. npx playwright test tests/walls/push-login.spec.ts --debug=cli
//      The test starts paused and prints: Run "playwright-cli attach tw-xxxxxx"
//   2. In a second terminal (or let your agent do it):
//      npx playwright cli attach tw-xxxxxx
//      npx playwright cli -s=tw-xxxxxx resume
//      The test signs in and pauses again on "Approve sign-in on your phone".
//   3. A human scans the QR code (or opens the "Can't scan?" link) and taps the number on the screen.
//   4. The attached agent reads the dashboard, then resumes the test: npx playwright cli -s=tw-xxxxxx resume
//
// Without --debug (in CI, or a plain `npx playwright test` run) there is no human, so the test is skipped.

// playwright.config.ts sets PW_DEBUG_MODE to "cli" or "inspector" when you run with --debug=cli or --debug.
const debugMode = process.env.PW_DEBUG_MODE;

// The human has to see the number on the laptop screen, so open a visible browser window.
if (debugMode) test.use({ headless: false });

test('push.tester approves the sign-in on a phone (pause and attach)', async ({ page, context, baseURL }) => {
  test.skip(!debugMode, 'Needs a human for the phone step: run it with --debug=cli (Lab 5, wall 2b).');
  test.setTimeout(10 * 60_000); // --debug=cli keeps the normal test timeout; a human needs longer

  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_PUSH_USER'), env('GREMLIN_PASSWORD'));
  await expect(page.getByRole('heading', { name: 'Approve sign-in on your phone' })).toBeVisible();

  // Human step: scan the QR code with your phone, or open the link under "Can't scan?" on your phone
  // or in a second browser window, and tap the number shown on this page. The request expires after 5 minutes.
  await page.pause();

  // The page polls every 2 seconds and continues to the dashboard once the phone approved.
  await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible({ timeout: 5 * 60_000 });
  const approved = page.getByText(/^Approved on your phone: /);
  await expect(approved).toBeVisible();
  console.log(await approved.innerText());
});
