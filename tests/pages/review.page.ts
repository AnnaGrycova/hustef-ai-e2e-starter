import { type Page, type Locator } from '@playwright/test';

/** The /transfer/review page: the transfer-details table and the Confirm button. */
export class ReviewPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly details: Locator;
  readonly confirmButton: Locator;
  readonly wrongPin: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Review transfer' });
    this.details = page.getByRole('table', { name: 'Transfer details' });
    this.confirmButton = page.getByRole('button', { name: 'Send money' });
    this.wrongPin = page.getByRole('alert').filter({ hasText: 'Wrong PIN.' });
  }

  /** A value cell in the details table by its visible text. */
  cell(name: string, exact = false): Locator {
    return this.details.getByRole('cell', { name, exact });
  }

  /** The value cell of the row whose rowheader is `label` (e.g. Amount, Fee, Total). */
  rowValue(label: string): Locator {
    return this.details
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name: label }) })
      .getByRole('cell')
      .nth(0);
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }
}
