import { test, expect, env } from './tests/fixtures';

// Seed for the Playwright Test Agents. The planner and the generator run this test first
// and continue from the page it leaves open: the Gremlin Bank dashboard, signed in.
// The user and password come from .env (GREMLIN_USER, GREMLIN_PASSWORD).

test.describe('Gremlin Bank', () => {
  test('seed', async ({ page }) => {
    await page.goto('/login');
    const cookieDialog = page.getByRole('dialog', { name: 'Cookies' });
    try {
      await cookieDialog.waitFor({ state: 'visible', timeout: 2000 });
      await page.getByRole('button', { name: 'Accept all' }).click();
      await cookieDialog.waitFor({ state: 'hidden', timeout: 2000 });
    } catch {
      // Dialog not present or already dismissed
    }
    await page.getByRole('textbox', { name: 'User ID' }).fill(env('GREMLIN_USER'));
    await page.getByRole('textbox', { name: 'Password' }).fill(env('GREMLIN_PASSWORD'));
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
  });
});
