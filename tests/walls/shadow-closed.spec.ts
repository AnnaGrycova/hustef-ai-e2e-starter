import { test, expect, env } from '../fixtures';
import { KISS_PETER_IBAN, TEST_PIN, expectDashboard, fillTransferForm, names, signIn, skipCookieDialog } from './support';

// Lab 5, wall 3b: the Transaction PIN on the review page is a web component, <gb-secure-pin>, with a
// CLOSED shadow root. Locators and aria snapshots cannot see inside it, so neither can an agent.
// Keyboard focus still works. The real fix belongs to the developers (an open shadow root or a test
// hook): write it down as a testability request.

test('a transfer is confirmed with the PIN from the closed shadow root', async ({ page, context, baseURL }) => {
  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
  await expectDashboard(page);
  await fillTransferForm(page, {
    from: 'Everyday Account',
    payee: 'Kiss Péter',
    iban: KISS_PETER_IBAN,
    amount: '1000',
    reference: 'Lab 5 closed shadow',
  });

  // The wall: no locator finds the PIN field.
  await expect(page.getByLabel('Transaction PIN')).toHaveCount(0);

  // TODO (Lab 5, wall 3b): enter TEST_PIN with the keyboard. Keyboard focus reaches inside a closed shadow root:
  //   1. focus the confirm button:     await page.getByRole('button', { name: names.confirm }).focus();
  //   2. move focus back into the PIN: press Shift+Tab with page.keyboard.press(...)
  //   3. type the PIN:                 page.keyboard.type(...)
  void TEST_PIN;

  await page.getByRole('button', { name: names.confirm }).click();
  const dialog = page.getByRole('dialog', { name: names.approvalDialog });
  await expect(dialog, 'No payment approval dialog. Was the PIN entered? See the TODO above.').toBeVisible();
  await dialog.getByTitle(names.approvalFrame).contentFrame().getByRole('button', { name: names.approve }).click();

  await expect(page.getByRole('heading', { level: 1, name: names.done })).toBeVisible();
  const passed = page.getByText(/^PIN check passed: /);
  await expect(passed).toBeVisible();
  console.log(await passed.innerText());
});
