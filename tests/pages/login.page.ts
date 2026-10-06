import { type Page, type Locator } from '@playwright/test';

/** The /login page: username, password and the Sign in button. */
export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.getByRole('textbox', { name: 'User ID' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Log in' });
    this.error = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.dismissCookieConsent();
  }

  async dismissCookieConsent(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Cookies' });
    try {
      await dialog.waitFor({ state: 'visible', timeout: 2000 });
      await this.page.getByRole('button', { name: 'Accept all' }).click();
      await dialog.waitFor({ state: 'hidden', timeout: 2000 });
    } catch {
      // Dialog not present or already dismissed
    }
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.signInButton.click();
  }
}
