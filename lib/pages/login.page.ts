import { step } from "@helpers/step";
import { BasePage } from "./base.page";
import { Locator, Response } from "@playwright/test";

export type LoginField = "Email" | "Password";

export class LoginPage extends BasePage {
  // ── Form controls ────────────────────────────────────────────────────────
  private readonly emailInput = this.page.getByRole("textbox", {
    name: "Email",
  });
  private readonly passwordInput = this.page.getByRole("textbox", {
    name: "Password",
  });
  private readonly submitButton = this.page.getByRole("button", {
    name: "Sign in",
  });
  // The login banner surfaces BOTH client-side validation and server-side
  // errors. Class prefix is stable across builds; substring match is
  // CSS-module-safe.
  private readonly errorMessage = this.page.locator('[class*="login_banner"]');

  private field(name: LoginField): Locator {
    return name === "Email" ? this.emailInput : this.passwordInput;
  }

  // ── Field interactions ───────────────────────────────────────────────────
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

  // Login via mouse-click submit. Returns the POST /account/login Response so
  // the test can assert on status codes (200 success, 400 invalid creds, …).
  @step()
  async login(email: string, password: string): Promise<Response> {
    const responsePromise = this.waitForLoginResponse();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    return responsePromise;
  }

  // Same as login() but submits via the Enter key from the Password field —
  // exercises the form's submit-on-enter path.
  @step()
  async loginWithEnter(email: string, password: string): Promise<Response> {
    const responsePromise = this.waitForLoginResponse();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.passwordInput.press("Enter");
    return responsePromise;
  }

  private waitForLoginResponse(): Promise<Response> {
    return this.page.waitForResponse(
      (res) =>
        res.url().includes("/api/account/login") &&
        res.request().method() === "POST",
    );
  }

  // ── Visibility / state inspectors ────────────────────────────────────────
  @step()
  async isFieldVisible(name: LoginField) {
    const input = this.field(name);
    await input.waitFor({ state: "visible" });
    return input.isVisible();
  }

  @step()
  async isSubmitVisible() {
    await this.submitButton.waitFor({ state: "visible" });
    return this.submitButton.isVisible();
  }

  @step()
  async isSubmitEnabled() {
    await this.submitButton.waitFor({ state: "visible" });
    return this.submitButton.isEnabled();
  }

  @step()
  async getFieldValue(name: LoginField) {
    return this.field(name).inputValue();
  }

  // Returns the rendered `type` attribute of the input — used to verify
  // Password is type=password (masked) and Email is not.
  @step()
  async getFieldType(name: LoginField) {
    return this.field(name).getAttribute("type");
  }

  // Returns the `autocomplete` attribute — meaningful for password-manager
  // integration (expected: Email=username, Password=current-password).
  @step()
  async getFieldAutocomplete(name: LoginField) {
    return this.field(name).getAttribute("autocomplete");
  }

  // ── Error banner ─────────────────────────────────────────────────────────
  @step()
  async isErrorVisible() {
    await this.errorMessage.waitFor({ state: "visible" });
    return this.errorMessage.isVisible();
  }

  // Non-blocking variant — returns whether the banner is in the DOM, without
  // waiting. Use for "no error shown on a fresh load" oracles.
  @step()
  async isErrorPresent() {
    return (await this.errorMessage.count()) > 0;
  }

  @step()
  async getErrorText() {
    await this.errorMessage.waitFor({ state: "visible" });
    return ((await this.errorMessage.textContent()) ?? "").trim();
  }
}
