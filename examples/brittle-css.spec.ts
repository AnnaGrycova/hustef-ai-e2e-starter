import { test, expect } from '../tests/fixtures';

// An old-style test, written the way many suites still are: CSS ids, classes and test ids
// that describe the implementation, a fixed wait, a password in the code, and no accessible names.
// It passes on release 1. Run it against release 2 to see what a UI redesign does to it:
//
//   GREMLIN_RELEASE=2 npx playwright test examples/brittle-css.spec.ts
//
// Do not copy this style. Lab 1 shows the alternative.

test('demo user sees the Everyday Account balance (CSS selectors)', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#username').fill('demo');
  await page.locator('#password').fill('Gremlin-2026!');
  await page.locator('button.btn-primary.login-submit').click();

  await page.waitForTimeout(3000);

  await expect(page.locator('[data-testid="session-code"]')).toContainText('GRM-');
  await expect(page.locator('[data-testid="account-card-everyday"] .account-name')).toHaveText('Everyday Account');
  await expect(page.locator('[data-testid="account-balance-everyday"]')).toHaveText('1,250,000 HUF');
  await expect(page.locator('a.btn.btn-primary[href="/transfer"]')).toBeVisible();
});
