import { test, expect, env } from '../fixtures';
import { KISS_PETER_IBAN, expectDashboard, signIn, skipCookieDialog } from './support';

// Lab 5, wall 3a: the IBAN field is a web component, <gb-iban-input>, with an OPEN shadow root.
// Playwright's role, label and text locators pierce open shadow roots, and the aria snapshot shows
// what is inside. Nothing special is needed.

test('the IBAN check works inside the open shadow root', async ({ page, context, baseURL }) => {
  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
  await expectDashboard(page);
  await page.goto('/transfer');

  const iban = page.getByRole('textbox', { name: 'IBAN' });
  const check = page.getByRole('button', { name: 'Check IBAN' });

  // Same digits, wrong check digits: the mod-97 check fails.
  await iban.fill('HU00 9990 1017 1618 0339 8874 9892');
  await check.click();
  await expect(page.getByText('Invalid IBAN', { exact: true })).toBeVisible();

  await iban.fill(KISS_PETER_IBAN);
  await check.click();
  const verified = page.getByText(/^IBAN verified: /);
  await expect(verified).toBeVisible();
  console.log(await verified.innerText());

  // The element really is a shadow host with an open shadow root.
  expect(await page.locator('gb-iban-input').evaluate((el) => el.shadowRoot?.mode)).toBe('open');
});
