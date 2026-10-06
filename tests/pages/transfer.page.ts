import { type Page, type Locator } from '@playwright/test';

/** The /transfer page: the new-transfer form and its field errors. */
export class TransferPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly fromAccount: Locator;
  readonly beneficiaryName: Locator;
  readonly iban: Locator;
  readonly checkIbanButton: Locator;
  readonly ibanStatus: Locator;
  readonly amount: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'New transfer' });
    this.fromAccount = page.getByRole('combobox', { name: 'From account' });
    this.beneficiaryName = page.getByRole('textbox', { name: 'Payee name' });
    this.iban = page.getByRole('textbox', { name: 'IBAN' });
    this.checkIbanButton = page.getByRole('button', { name: 'Check IBAN' });
    this.ibanStatus = page.getByRole('status');
    this.amount = page.getByRole('textbox', { name: 'Amount (HUF)' });
    this.continueButton = page.getByRole('button', { name: 'Review transfer' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/transfer');
  }

  async selectFromAccount(name: string): Promise<void> {
    await this.fromAccount.selectOption(name);
  }

  async fillBeneficiary(name: string, iban: string): Promise<void> {
    await this.beneficiaryName.fill(name);
    await this.iban.fill(iban);
  }

  async checkIban(): Promise<void> {
    await this.checkIbanButton.click();
  }

  async fillAmount(amount: string): Promise<void> {
    await this.amount.fill(amount);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  /** The "Available: … HUF" line for the selected account. */
  available(text: string): Locator {
    return this.page.getByText(`Available: ${text}`);
  }

  /** A field validation error by its message text. */
  fieldError(text: string): Locator {
    return this.page.getByText(text);
  }
}
