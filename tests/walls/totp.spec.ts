import * as OTPAuth from 'otpauth';
import { test, expect, env } from '../fixtures';
import { expectDashboard, signIn, skipCookieDialog } from './support';

// Lab 5, wall 2a: an authenticator app code (TOTP, RFC 6238).
// GREMLIN_TOTP_SECRET is a TEST secret for a test user, so the test can compute the code itself.
// Never put the secret of a real person's authenticator into a test or an agent's context.

function currentCode(): string {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(env('GREMLIN_TOTP_SECRET')),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  return totp.generate();
}

test('totp.tester signs in with a generated authenticator code', async ({ page, context, baseURL }) => {
  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_TOTP_USER'), env('GREMLIN_PASSWORD'));

  await expect(page.getByRole('heading', { name: 'Two-step verification' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Authentication code' }).fill(currentCode());
  await page.getByRole('button', { name: 'Verify' }).click();

  await expectDashboard(page);
  const verified = page.getByText(/^Verified with authenticator: /);
  await expect(verified).toBeVisible();
  // Read the code here, in the HTML report (npm run report) or in the trace.
  console.log(await verified.innerText());
});

test('a wrong authenticator code is refused', async ({ page, context, baseURL }) => {
  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_TOTP_USER'), env('GREMLIN_PASSWORD'));

  await expect(page.getByRole('heading', { name: 'Two-step verification' })).toBeVisible();
  const wrong = String((Number(currentCode()) + 500_000) % 1_000_000).padStart(6, '0');
  await page.getByRole('textbox', { name: 'Authentication code' }).fill(wrong);
  await page.getByRole('button', { name: 'Verify' }).click();

  await expect(page.getByText('That code is not valid.')).toBeVisible();
});
