import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

test.describe("Authentication — Session (unauthenticated) @web @auth @session @regression", () => {
  // These tests need to be unauthenticated to verify the redirect-to-login flow.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("AUT-024: deep-link to /administration/user-accounts/ while unauthenticated bounces to /login/ and exposes no grid", async ({
    webClient,
  }) => {
    await webClient.goTo("/administration/user-accounts/");
    await webClient.page.waitForURL(/\/login/i, { timeout: 15_000 });
    expect(webClient.page.url()).toContain("/login");
    expect(
      await webClient.userAccountsPage.isGridPresent(),
    ).toBeFalsy();
  });

  test("AUT-025: after a successful login the URL is the user-accounts area, not /login/", async ({
    webClient,
  }) => {
    await webClient.goTo("/login/");
    const response = await webClient.loginPage.login(
      env.adminEmail,
      env.adminPassword,
    );
    expect(response.status()).toBe(200);
    await webClient.page.waitForURL(/\/administration\/user-accounts/i, {
      timeout: 15_000,
    });
    expect(webClient.page.url()).not.toContain("/login");
    expect(webClient.page.url()).toContain("/administration/user-accounts");
  });
});

test.describe("Authentication — Session (authenticated) @web @auth @session @regression", () => {
  // Inherits the saved session-storage.json — start logged in.

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
    expect(
      await webClient.userAccountsPage.header.isLogoVisible(),
    ).toBeTruthy();
  });

  test("AUT-026: logging out via the header bounces back to /login/", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.header.openAccountMenu();
    await webClient.userAccountsPage.header.logOut();
    await webClient.page.waitForURL(/\/login/i, { timeout: 15_000 });
    expect(webClient.page.url()).toContain("/login");
    expect(await webClient.loginPage.isFieldVisible("Email")).toBeTruthy();
  });

  test("AUT-027: browser-back after logout does NOT re-expose the protected page", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.header.openAccountMenu();
    await webClient.userAccountsPage.header.logOut();
    await webClient.page.waitForURL(/\/login/i, { timeout: 15_000 });

    await webClient.page.goBack();
    // The app must re-bounce the back-navigation to /login/ (session is gone).
    // We allow a moment for the redirect to settle before asserting the URL.
    await webClient.page.waitForURL(/\/login/i, { timeout: 15_000 });
    expect(webClient.page.url()).toContain("/login");
    expect(
      await webClient.userAccountsPage.isGridPresent(),
    ).toBeFalsy();
  });
});
