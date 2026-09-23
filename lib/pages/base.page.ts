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

  // Current URL path (e.g. "/login/") — for redirect/stay-on-page assertions.
  @step()
  async getCurrentPath(): Promise<string> {
    return new URL(this.page.url()).pathname;
  }

  @step()
  async waitForTimeout(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }
}
