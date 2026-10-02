import { test, expect, env } from './tests/fixtures';

// Seed for the Playwright Test Agents. The planner and the generator run this test first
// and continue from the page it leaves open: the Gremlin Bank dashboard, signed in.
// The user and password come from .env (GREMLIN_USER, GREMLIN_PASSWORD).

test.describe('Gremlin Bank', () => {
  test('seed', async ({ page }) => {
    await page.goto('/login');
    // Until Tuesday 6 October 2026 8:30 Gremlin Bank shows only its "You can reach Gremlin Bank" page.
    test.skip(
      await page.getByRole('heading', { name: 'You can reach Gremlin Bank' }).isVisible(),
      'Gremlin Bank opens on Tuesday 6 October 2026 at 8:30 (your setup can reach it).',
    );
    await page.getByRole('textbox', { name: 'Username' }).fill(env('GREMLIN_USER'));
    await page.getByRole('textbox', { name: 'Password' }).fill(env('GREMLIN_PASSWORD'));
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
  });
});
