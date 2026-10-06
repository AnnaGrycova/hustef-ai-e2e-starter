// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect, env } from './fixtures';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';
import { TransferPage } from './pages/transfer.page';
import { ReviewPage } from './pages/review.page';

test.describe('Domestic Transfer', () => {
  let transfer: TransferPage;
  let review: ReviewPage;

  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    transfer = new TransferPage(page);
    review = new ReviewPage(page);
    await login.goto();
    await login.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
    await expect(dashboard.heading).toBeVisible();
  });

  // Plan 4.5 wants a full confirmation, but on this release the Transaction PIN is a secure
  // custom element (<gb-secure-pin>, no open shadow DOM) plus a "Gremlin Secure" iframe at
  // /secure/challenge — a deliberate wall, not a plain field. This test verifies the review
  // page's computed business values (amount, fee, total); confirming through the secure PIN is
  // out of scope here (see the walls labs).
  test('Domestic transfer review shows correct amount, fee and total', async ({ page }) => {
    // 1. Navigate to /transfer
    await transfer.goto();
    await expect(page).toHaveURL('/transfer');
    await expect(transfer.heading).toBeVisible();

    // 2. Select Savings Account
    await transfer.selectFromAccount('Savings Account');
    await expect(transfer.available('5,400,000 HUF')).toBeVisible();

    // 3. Fill beneficiary: Kiss Péter, IBAN: HU72 9990 1017 1618 0339 8874 9892
    await transfer.fillBeneficiary('Kiss Péter', 'HU72 9990 1017 1618 0339 8874 9892');

    // 4. Check IBAN
    await transfer.checkIban();
    await expect(transfer.ibanStatus.filter({ hasText: /IBAN verified: GRM-/ })).toBeVisible();

    // 5. Fill amount: 25,000
    await transfer.fillAmount('25000');

    // 6. Continue to review
    await transfer.continue();
    await expect(page).toHaveURL('/transfer/review');
    await expect(review.heading).toBeVisible();

    // 7. Verify Amount 25,000 / Fee 200 / Total 25,200
    await expect(review.cell('Savings Account')).toBeVisible();
    await expect(review.cell('Kiss Péter')).toBeVisible();
    await expect(review.cell('HU72 9990 1017 1618 0339 8874 9892')).toBeVisible();
    await expect(review.cell('25,000 HUF', true)).toBeVisible();
    await expect(review.cell('200 HUF', true)).toBeVisible();
    await expect(review.cell('25,200 HUF', true)).toBeVisible();
  });

  test('Required field validation', async ({ page }) => {
    // 1. Navigate to /transfer
    await transfer.goto();
    await expect(transfer.heading).toBeVisible();

    // 2. Fill IBAN without checking, leave name and amount empty
    await transfer.iban.fill('HU72 9990 1017 1618 0339 8874 9892');

    // 3. Click Continue
    await transfer.continue();

    // 4. Verify three field errors
    await expect(transfer.fieldError('Enter a payee name.')).toBeVisible();
    await expect(transfer.fieldError('Check the IBAN first.')).toBeVisible();
    await expect(transfer.fieldError('Enter an amount greater than 0.')).toBeVisible();
    await expect(page).toHaveURL('/transfer');
  });

  test('Invalid IBAN validation', async ({ page }) => {
    // 1. Navigate to /transfer
    await transfer.goto();
    await expect(transfer.heading).toBeVisible();

    // 2. Fill beneficiary, invalid IBAN 'HU99 9999 9999 9999 9999 9999 9999'
    await transfer.fillBeneficiary('Test User', 'HU99 9999 9999 9999 9999 9999 9999');

    // 3. Check IBAN
    await transfer.checkIban();

    // 4. Verify 'Invalid IBAN' error
    await expect(transfer.ibanStatus.filter({ hasText: 'Invalid IBAN' })).toBeVisible();
  });

  test('Insufficient funds validation', async ({ page }) => {
    // 1. Navigate to /transfer
    await transfer.goto();
    await expect(transfer.heading).toBeVisible();
    await expect(transfer.available('1,250,000 HUF')).toBeVisible();

    // 2. Fill valid beneficiary and IBAN, amount 2,000,000 (exceeds Everyday 1,250,000)
    await transfer.fillBeneficiary('Kiss Péter', 'HU72 9990 1017 1618 0339 8874 9892');
    await transfer.checkIban();
    await expect(transfer.ibanStatus.filter({ hasText: /IBAN verified: GRM-/ })).toBeVisible();
    await transfer.fillAmount('2000000');

    // 3. Continue
    await transfer.continue();

    // 4. Verify 'Insufficient funds.' error
    await expect(transfer.fieldError('Insufficient funds.')).toBeVisible();
    await expect(page).toHaveURL('/transfer');
  });

  test('Daily limit validation', async ({ page }) => {
    // 1. Navigate to /transfer, select Savings Account
    await transfer.goto();
    await expect(transfer.heading).toBeVisible();
    await transfer.selectFromAccount('Savings Account');
    await expect(transfer.available('5,400,000 HUF')).toBeVisible();

    // 2. Fill valid beneficiary and IBAN, amount 2,000,001 (exceeds daily limit)
    await transfer.fillBeneficiary('Kiss Péter', 'HU72 9990 1017 1618 0339 8874 9892');
    await transfer.checkIban();
    await expect(transfer.ibanStatus.filter({ hasText: /IBAN verified: GRM-/ })).toBeVisible();
    await transfer.fillAmount('2000001');

    // 3. Continue
    await transfer.continue();

    // 4. Verify 'Daily limit of 2,000,000 HUF exceeded.' error
    await expect(transfer.fieldError('Daily limit of 2,000,000 HUF exceeded.')).toBeVisible();
    await expect(page).toHaveURL('/transfer');
  });

  test('Wrong PIN validation', async ({ page }) => {
    // 1. Create transfer and reach the review page
    await transfer.goto();
    await transfer.selectFromAccount('Savings Account');
    await transfer.fillBeneficiary('Kiss Péter', 'HU72 9990 1017 1618 0339 8874 9892');
    await transfer.checkIban();
    await expect(transfer.ibanStatus.filter({ hasText: /IBAN verified: GRM-/ })).toBeVisible();
    await transfer.fillAmount('25000');
    await transfer.continue();
    await expect(page).toHaveURL('/transfer/review');

    // 2. Submit the confirm form without a PIN. The Transaction PIN is a secure custom element
    // (<gb-secure-pin>) that a test cannot type into; submitting with no PIN is rejected the same
    // way a wrong PIN is, so the app shows the "Wrong PIN." error.
    await review.confirm();

    // 3. Verify 'Wrong PIN.' error
    await expect(review.wrongPin).toBeVisible();
    await expect(page).toHaveURL('/transfer/review');
  });

  test('Fee calculation boundaries', async ({ page }) => {
    // Helper function to test a fee calculation
    const testFee = async (amount: string, expectedFee: string, expectedTotal: string, usesSavings = false) => {
      await transfer.goto();

      if (usesSavings) {
        await transfer.selectFromAccount('Savings Account');
      }

      await transfer.fillBeneficiary('Kiss Péter', 'HU72 9990 1017 1618 0339 8874 9892');
      await transfer.checkIban();
      await expect(transfer.ibanStatus.filter({ hasText: /IBAN verified: GRM-/ })).toBeVisible();
      await transfer.fillAmount(amount);
      await transfer.continue();
      await expect(page).toHaveURL('/transfer/review');

      await expect(review.rowValue('Amount')).toHaveText(`${parseInt(amount).toLocaleString('en-US')} HUF`);
      await expect(review.rowValue('Fee')).toHaveText(`${expectedFee} HUF`);
      await expect(review.rowValue('Total')).toHaveText(`${expectedTotal} HUF`);
    };

    // 1. Test amount: 100 → fee 200 → total 300
    await testFee('100', '200', '300');

    // 2. Test amount: 10,000 → fee 200 → total 10,200
    await testFee('10000', '200', '10,200');

    // 3. Test amount: 70,000 → fee 210 → total 70,210
    await testFee('70000', '210', '70,210');

    // 4. Test amount: 100,000 → fee 300 → total 100,300
    await testFee('100000', '300', '100,300');

    // 5. Test amount: 1,000,000 → fee 3,000 → total 1,003,000 (Savings Account)
    await testFee('1000000', '3,000', '1,003,000', true);

    // 6. Test amount: 2,000,000 → fee 6,000 → total 2,006,000 (Savings Account)
    await testFee('2000000', '6,000', '2,006,000', true);
  });
});
