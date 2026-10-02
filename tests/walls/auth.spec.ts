import { test, expect, env } from '../fixtures';
import { expectDashboard, signIn, skipCookieDialog } from './support';

// Lab 5, wall 1. The same three dashboard tests run in two projects:
//   npx playwright test tests/walls/auth --project=chromium    signs in through the UI in every test
//   npx playwright test tests/walls/auth --project=with-auth   signs in once (setup project), then reuses the state
// Compare the durations in the output.

test.describe('dashboard, signed in', () => {
  test.beforeEach(async ({ page, context, baseURL }, testInfo) => {
    if (testInfo.project.use.storageState) {
      // with-auth: the saved state already contains the session cookie.
      await page.goto('/dashboard');
    } else {
      await skipCookieDialog(context, baseURL!);
      await signIn(page, env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
    }
    await expectDashboard(page);
  });

  test('shows the session code', async ({ page }) => {
    await expect(page.getByText(/^Session code: GRM-[A-Z0-9-]+$/)).toBeVisible();
  });

  test('shows five seeded recent transactions', async ({ page }) => {
    const rows = page.getByRole('table', { name: 'Recent transactions' }).getByRole('row');
    await expect(rows).toHaveCount(6); // header row + 5 transactions
  });

  test('offers a sign out button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});
