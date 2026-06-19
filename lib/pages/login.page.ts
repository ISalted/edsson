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
}
