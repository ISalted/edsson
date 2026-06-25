import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

// Mutating-credential tests against the real admin email are kept LOW here
// (AUT-014 + AUT-017 = 2 wrong-password attempts) to avoid tripping any
// account-lockout threshold during demo runs.
test.describe("Authentication — Credentials @web @auth @credentials @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-013: valid admin credentials authenticate and land on user-accounts @smoke", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(
      env.adminEmail,
      env.adminPassword,
    );
    expect(response.status()).toBe(200);
    expect(
      await webClient.userAccountsPage.header.isLogoVisible(),
    ).toBeTruthy();
  });

  test("AUT-014: valid Email + wrong Password → 400 + error banner, stays on /login/", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(
      env.adminEmail,
      "wrongpassword-AUT014",
    );
    expect(response.status()).toBe(400);
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-015: unknown Email + any Password → non-2xx + error banner, stays on /login/", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(
      "nobody.AUT015@edsson.com",
      "anything",
    );
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-016: Email comparison is case-insensitive (UPPERCASED email still authenticates)", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(
      env.adminEmail.toUpperCase(),
      env.adminPassword,
    );
    expect(response.status()).toBe(200);
    expect(
      await webClient.userAccountsPage.header.isLogoVisible(),
    ).toBeTruthy();
  });

  test("AUT-017: Password comparison IS case-sensitive (uppercased password is rejected)", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(
      env.adminEmail,
      env.adminPassword.toUpperCase(),
    );
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-018: after a failed login the user can retry without reloading and authenticate", async ({
    webClient,
  }) => {
    const firstAttempt = await webClient.loginPage.login(
      "nobody.AUT018@edsson.com",
      "wrong",
    );
    expect(firstAttempt.status()).toBeGreaterThanOrEqual(400);
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();

    // Re-submit on the SAME page (no reload) with correct credentials.
    const retry = await webClient.loginPage.login(
      env.adminEmail,
      env.adminPassword,
    );
    expect(retry.status()).toBe(200);
    expect(
      await webClient.userAccountsPage.header.isLogoVisible(),
    ).toBeTruthy();
  });

  test("AUT-019: submitting via Enter from the Password field authenticates the same as clicking Sign in", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.loginWithEnter(
      env.adminEmail,
      env.adminPassword,
    );
    expect(response.status()).toBe(200);
    expect(
      await webClient.userAccountsPage.header.isLogoVisible(),
    ).toBeTruthy();
  });
});
