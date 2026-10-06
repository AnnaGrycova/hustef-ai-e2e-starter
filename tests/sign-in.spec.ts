// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect, env } from './fixtures';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Sign In and Sign Out', () => {
  test('Successful sign in', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // 1. Navigate to /login
    await login.goto();
    await expect(page).toHaveURL('/login');
    await expect(page).toHaveTitle('Sign in - Gremlin Bank');

    // 2-4. Fill credentials and sign in
    await login.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));

    // 5. Verify navigates to /dashboard with heading 'Accounts' visible
    await expect(page).toHaveURL('/dashboard');
    await expect(page).toHaveTitle('Accounts - Gremlin Bank');
    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.signedInAs).toBeVisible();
    await expect(dashboard.userName(env('GREMLIN_USER'))).toBeVisible();
  });

  test('Failed sign in with wrong credentials', async ({ page }) => {
    const login = new LoginPage(page);

    // 1. Navigate to /login
    await login.goto();
    await expect(page).toHaveURL('/login');

    // 2-3. Fill wrong credentials and sign in
    await login.signIn('wronguser', 'wrongpass');

    // 4. Verify error 'Wrong username or password.' is displayed
    await expect(page).toHaveURL('/login');
    await expect(login.error).toHaveText('Wrong username or password.');
  });

  test('Sign out and protected route', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // Sign in first
    await login.goto();
    await login.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
    await expect(dashboard.heading).toBeVisible();

    // 1. From the dashboard, click 'Sign out' button
    await dashboard.signOut();

    // 2. Verify navigates to /login
    await expect(page).toHaveURL('/login');
    await expect(page).toHaveTitle('Sign in - Gremlin Bank');
    await expect(dashboard.signedInAs).not.toBeVisible();

    // 3. Attempt to navigate to /dashboard without signing in
    await dashboard.goto();

    // 4. Verify redirects to /login (protected route)
    await expect(page).toHaveURL('/login');
  });
});
