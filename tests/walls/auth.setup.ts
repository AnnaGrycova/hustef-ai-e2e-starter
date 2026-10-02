import path from 'node:path';
import { test as setup, env } from '../fixtures';
import { expectDashboard, signIn, skipCookieDialog } from './support';

// Lab 5, wall 1: sign in once, save the browser state, reuse it.
// This file is the `setup` project in playwright.config.ts. The `with-auth` project depends on it
// and starts every test with the saved state, so those tests begin already signed in.
// The state file holds a session cookie for a test user. It is git-ignored: never commit a real session.

const authFile = path.resolve(__dirname, '../../playwright/.auth/demo.json');

setup('sign in as the demo user and save the browser state', async ({ page, context, baseURL }) => {
  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
  await expectDashboard(page);
  await context.storageState({ path: authFile });
});
