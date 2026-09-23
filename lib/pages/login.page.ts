import { step } from "@helpers/step";
import { BasePage } from "./base.page";
import { Locator, Request, Response } from "@playwright/test";

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
    const [response] = await Promise.all([
      responsePromise,
      (async () => {
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.submit();
      })(),
    ]);
    return response;
  }

  @step()
  async isErrorVisible() {
    await this.errorMessage.waitFor({ state: "visible" });
    return this.errorMessage.isVisible();
  }

  @step()
  async getErrorText(): Promise<string> {
    await this.errorMessage.waitFor({ state: "visible" });
    return (await this.errorMessage.innerText()).trim();
  }

  // Clicks "Sign in" and returns the login POST if one fires within the window,
  // or null if none does — lets a test prove client validation blocked the call.
  @step()
  async submitAndGetLoginRequest(windowSeconds = 3): Promise<Request | null> {
    const requestPromise = this.page
      .waitForRequest(
        (req) =>
          req.url().includes("/api/account/login") && req.method() === "POST",
        { timeout: windowSeconds * 1000 },
      )
      .catch(() => null);
    await this.submit();
    return requestPromise;
  }

  @step()
  async isSignInFormVisible(): Promise<boolean> {
    await this.emailInput.waitFor({ state: "visible" });
    return (
      (await this.emailInput.isVisible()) &&
      (await this.passwordInput.isVisible()) &&
      (await this.submitButton.isVisible())
    );
  }

  // Session token the app writes to localStorage on a successful sign-in.
  @step()
  async getAuthToken(): Promise<string | null> {
    return this.page.evaluate(() =>
      localStorage.getItem("lscache-e-LS_AUTH_TOKEN"),
    );
  }
}
