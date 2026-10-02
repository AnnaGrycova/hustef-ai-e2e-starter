import { expect, type BrowserContext, type Page } from '@playwright/test';
import { env } from '../fixtures';

// Helpers for the Lab 5 wall tests only. They work on every Gremlin Bank release, so that in Lab 5
// you can focus on the wall and not on the release the facilitator has shipped.
// Your own tests in tests/ do not use this file.

/** Transaction PIN of the demo users (test data), from GREMLIN_PIN in .env. */
export const TEST_PIN = env('GREMLIN_PIN');

/** IBAN of the saved payee Kiss Péter (fictional, valid checksum). */
export const KISS_PETER_IBAN = 'HU72 9990 1017 1618 0339 8874 9892';

/** Accessible names that differ between release 1 and releases 2 and 3. */
export const names = {
  username: /^(Username|User ID)$/,
  signIn: /^(Sign in|Log in)$/,
  payee: /^(Beneficiary name|Payee name)$/,
  reference: /^(Reference|Payment reference)$/,
  continue: /^(Continue|Review transfer)$/,
  confirm: /^(Confirm transfer|Send money)$/,
  approvalDialog: /^(Confirm payment|Payment approval)$/,
  approvalFrame: /^(Gremlin Secure|Payment approval)$/,
  approve: /^(Approve payment|Approve)$/,
  done: /^(Transfer submitted|Money sent)$/,
};

/**
 * Releases 2 and 3 show a cookie consent dialog on the first page view. The wall tests are not about
 * it, so they answer it in advance with the gb_consent cookie. Call this before the first page.goto().
 */
export async function skipCookieDialog(context: BrowserContext, baseURL: string): Promise<void> {
  await context.addCookies([{ name: 'gb_consent', value: 'necessary', url: baseURL }]);
}

/** Opens /login and submits the user name and password. Does not wait for the next page. */
export async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: names.username }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: names.signIn }).click();
}

/** Waits until the dashboard heading is shown. */
export async function expectDashboard(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
}

export interface TransferInput {
  from: 'Everyday Account' | 'Savings Account';
  payee: string;
  iban: string;
  amount: string;
  reference: string;
}

/** Fills the New transfer form (labels decide, the field order differs per release) and continues to review. */
export async function fillTransferForm(page: Page, input: TransferInput): Promise<void> {
  await page.goto('/transfer');
  await expect(page.getByRole('heading', { level: 1, name: 'New transfer' })).toBeVisible();
  await page.getByRole('combobox', { name: 'From account' }).selectOption({ label: input.from });
  await page.getByRole('textbox', { name: names.payee }).fill(input.payee);
  await page.getByRole('textbox', { name: 'IBAN' }).fill(input.iban);
  await page.getByRole('button', { name: 'Check IBAN' }).click();
  await page.getByRole('textbox', { name: 'Amount (HUF)' }).fill(input.amount);
  await page.getByRole('textbox', { name: names.reference }).fill(input.reference);
  await page.getByRole('button', { name: names.continue }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Review transfer' })).toBeVisible();
}

/** Clicks the confirm button and approves the payment inside the dialog's iframe. */
export async function confirmAndApprove(page: Page): Promise<void> {
  await page.getByRole('button', { name: names.confirm }).click();
  const dialog = page.getByRole('dialog', { name: names.approvalDialog });
  await expect(dialog).toBeVisible();
  const frame = dialog.getByTitle(names.approvalFrame).contentFrame();
  await frame.getByRole('button', { name: names.approve }).click();
  await expect(page.getByRole('heading', { level: 1, name: names.done })).toBeVisible();
}
