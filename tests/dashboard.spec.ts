// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect } from './fixtures';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Dashboard', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Already signed in via the saved state (see the `signed-in` project in playwright.config.ts).
    dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.heading).toBeVisible();
  });

  test('Account information display', async ({ page }) => {
    // 1. View the dashboard after sign in
    await expect(page).toHaveURL('/dashboard');
    await expect(dashboard.heading).toBeVisible();

    // 2. Verify Everyday Account: IBAN 'HU39 9992 0265 3141 5926 5358 9797', balance '1,250,000 HUF'
    const everydayAccount = dashboard.account('Everyday Account');
    await expect(everydayAccount.getByRole('rowheader')).toHaveText('Everyday Account');
    await expect(everydayAccount.getByText('HU39 9992 0265 3141 5926 5358 9797')).toBeVisible();
    await expect(everydayAccount.getByText('1,250,000 HUF')).toBeVisible();

    // 3. Verify Savings Account: IBAN 'HU03 9992 0265 2718 2818 2845 9043', balance '5,400,000 HUF'
    const savingsAccount = dashboard.account('Savings Account');
    await expect(savingsAccount.getByRole('rowheader')).toHaveText('Savings Account');
    await expect(savingsAccount.getByText('HU03 9992 0265 2718 2818 2845 9043')).toBeVisible();
    await expect(savingsAccount.getByText('5,400,000 HUF')).toBeVisible();

    // 4. Verify session code format (assert format, not exact value)
    await expect(dashboard.sessionCode).toBeVisible();

    // 5. Verify security check image with code format
    await expect(dashboard.securityCheck).toBeVisible();
  });

  test('Recent transactions display', async ({ page }) => {
    // 1. View the 'Recent transactions' section on the dashboard
    await expect(page.getByRole('heading', { level: 2, name: 'Recent transactions' })).toBeVisible();

    const transactionsTable = dashboard.recentTransactions;
    await expect(transactionsTable).toBeVisible();

    // 2. Verify table has columns: Date, Description, Amount
    await expect(transactionsTable.getByRole('columnheader', { name: 'Date' })).toBeVisible();
    await expect(transactionsTable.getByRole('columnheader', { name: 'Description' })).toBeVisible();
    await expect(transactionsTable.getByRole('columnheader', { name: 'Amount' })).toBeVisible();

    // 3. Verify table contains at least one transaction
    const rows = transactionsTable.getByRole('row');
    await expect(rows.nth(1)).toBeVisible(); // First data row (after header)

    // 4. Verify specific transactions with amounts and +/- prefixes
    await expect(transactionsTable.getByRole('cell', { name: '2026-09-30' })).toBeVisible();
    await expect(transactionsTable.getByRole('cell', { name: 'Grocery store, Budapest' })).toBeVisible();
    await expect(transactionsTable.getByRole('cell', { name: '-18,450 HUF' })).toBeVisible();

    await expect(transactionsTable.getByRole('cell', { name: '2026-09-29' })).toBeVisible();
    await expect(transactionsTable.getByRole('cell', { name: 'Salary, Gremlin Works Ltd.' })).toBeVisible();
    await expect(transactionsTable.getByRole('cell', { name: '+685,000 HUF' })).toBeVisible();

    await expect(transactionsTable.getByRole('cell', { name: '2026-09-27' })).toBeVisible();
    await expect(transactionsTable.getByRole('cell', { name: 'Mobile phone bill' })).toBeVisible();
    await expect(transactionsTable.getByRole('cell', { name: '-7,990 HUF' })).toBeVisible();
  });
});
