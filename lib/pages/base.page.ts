import { step } from "@helpers/step";
import { Page, Locator, expect, test } from "@playwright/test";
export { Page, Locator, expect, test };

export class BasePage {
  public page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  @step()
  async waitForUrl(pattern: string | RegExp) {
    await this.page.waitForURL(pattern);
  }

  @step()
  async waitForTimeout(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }
}
