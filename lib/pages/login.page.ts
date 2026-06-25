import { step } from "@helpers/step";
import { BasePage } from "./base.page";
import { Locator, Response } from "@playwright/test";

export class LoginPage extends BasePage {
  private readonly emailInput = this.page.getByRole("textbox", {
    name: "Email",
  });
  private readonly passwordInput = this.page.getByRole("textbox", {
    name: "Password",
  });
  private readonly submitButton = this.page.getByRole("button", {
    name: "Sign in",
  });
  private readonly errorMessage = this.page.locator('[class*="login_banner"]');

  @step()
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  @step()
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  @step()
  async submit() {
    await this.submitButton.click();
  }

  @step()
  async login(email: string, password: string): Promise<Response> {
    const responsePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes("/api/account/login") &&
        res.request().method() === "POST",
    );
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    return responsePromise;
  }

  @step()
  async isErrorVisible() {
    await this.errorMessage.waitFor({ state: "visible" });
    return this.errorMessage.isVisible();
  }

  @step()
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: "visible" });
    return (await this.errorMessage.innerText()).trim();
  }

  @step()
  async getErrorRole(): Promise<string | null> {
    await this.errorMessage.waitFor({ state: "visible" });
    return this.errorMessage.getAttribute("role");
  }

  @step()
  async isPasswordMasked(): Promise<boolean> {
    return (await this.passwordInput.getAttribute("type")) === "password";
  }

  @step()
  async getEmailValue(): Promise<string> {
    return this.emailInput.inputValue();
  }

  @step()
  async getPasswordValue(): Promise<string> {
    return this.passwordInput.inputValue();
  }

  @step()
  async pressEnterInPassword(): Promise<void> {
    await this.passwordInput.focus();
    await this.passwordInput.press("Enter");
  }

  @step()
  async getEmailAccessibleName(): Promise<string> {
    return this.emailInput.evaluate((el) => {
      const input = el as HTMLInputElement;
      return (
        input.getAttribute("aria-label") ||
        input.labels?.[0]?.textContent?.trim() ||
        input.getAttribute("placeholder") ||
        ""
      );
    });
  }

  @step()
  async getPasswordAccessibleName(): Promise<string> {
    return this.passwordInput.evaluate((el) => {
      const input = el as HTMLInputElement;
      return (
        input.getAttribute("aria-label") ||
        input.labels?.[0]?.textContent?.trim() ||
        input.getAttribute("placeholder") ||
        ""
      );
    });
  }

  // Walks Tab focus from a neutral start (body) and returns the accessible name
  // of each focused element in order — for asserting form tab order without the
  // test having to drive keyboard.* itself.
  @step()
  async getFormFocusOrder(steps = 3): Promise<string[]> {
    await this.page.evaluate(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    });
    const order: string[] = [];
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press("Tab");
      const name = await this.page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return "";
        const aria = el.getAttribute("aria-label");
        if (aria) return aria;
        const input = el as HTMLInputElement;
        const labelText = input.labels?.[0]?.textContent?.trim();
        if (labelText) return labelText;
        return (el.textContent?.trim() || el.tagName.toLowerCase());
      });
      order.push(name);
    }
    return order;
  }

  // Awaits the POST /account/login response without sending it — pair with
  // pressEnterInPassword() or submit() when the test needs the response object
  // separately from the act that triggered it.
  @step()
  async waitForLoginResponse(): Promise<Response> {
    return this.page.waitForResponse(
      (res) =>
        res.url().includes("/api/account/login") &&
        res.request().method() === "POST",
    );
  }
}
