import { type Page, type Locator } from '@playwright/test';

/** The /dashboard page: accounts, recent transactions and the signed-in header. */
export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly signedInAs: Locator;
  readonly signOutButton: Locator;
  readonly recentTransactions: Locator;
  readonly sessionCode: Locator;
  readonly securityCheck: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Accounts' });
    this.signedInAs = page.getByText('Signed in as');
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
    this.recentTransactions = page.getByRole('table', { name: 'Recent transactions' });
    this.sessionCode = page.getByText(/Session code: GRM-[A-Z]+-[A-Z0-9]+/);
    this.securityCheck = page.getByRole('img', {
      name: /Security check passed\. Code GRM-[A-Z]+-[A-Z0-9]+/,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  /** The account row that contains the given account name. */
  account(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name });
  }

  /** The signed-in user name shown in the header, matched exactly. */
  userName(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }
}
