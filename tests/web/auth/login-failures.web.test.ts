import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

test.describe("Auth — Login Failures @web @auth @security @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-014: a wrong password returns 400, shows the banner, and stays on /login/ @web @auth", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    const response = await lp.login(env.adminEmail, "wrongpassword");

    expect(response.status()).toBe(400);
    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-015: an unknown email yields the SAME generic error as a wrong password (no user enumeration) @web @auth @security", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;

    const unknown = await lp.login("nobody.unknown@edsson.com", "any-password");
    expect(unknown.status()).toBe(400);
    const unknownMessage = await lp.getErrorMessage();

    await webClient.goTo("/login/");
    const wrongPw = await lp.login(env.adminEmail, "wrongpassword");
    expect(wrongPw.status()).toBe(400);
    const wrongPwMessage = await lp.getErrorMessage();

    expect(unknownMessage).toBe(wrongPwMessage);
  });

  test("AUT-016: a valid email in different letter case logs in — email is case-insensitive @web @auth", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(
      env.adminEmail.toUpperCase(),
      env.adminPassword,
    );

    expect(response.status()).toBe(200);
    expect(await webClient.userAccountsPage.header.isLogoVisible()).toBeTruthy();
  });

  test("AUT-017: a valid email with the password in different case returns 400 — password is case-sensitive @web @auth @security", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    const response = await lp.login(
      env.adminEmail,
      env.adminPassword.toUpperCase(),
    );

    expect(response.status()).toBe(400);
    expect(await lp.isErrorVisible()).toBeTruthy();
  });
});
