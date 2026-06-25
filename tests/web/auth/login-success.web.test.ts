import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

test.describe("Auth — Login Success @web @auth @smoke @regression", () => {
  // Sign-in flow must start unauthenticated.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-004: valid admin credentials return 200, leave /login/, and show the authenticated header @web @auth @smoke", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(
      env.adminEmail,
      env.adminPassword,
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.access_token).toBeTruthy();

    expect(await webClient.userAccountsPage.header.isLogoVisible()).toBeTruthy();
    expect(webClient.page.url()).not.toContain("/login");
  });

  test("AUT-005: a successful login survives a reload of the landing page @web @auth", async ({
    webClient,
  }) => {
    await webClient.loginPage.login(env.adminEmail, env.adminPassword);
    expect(await webClient.userAccountsPage.header.isLogoVisible()).toBeTruthy();

    // Re-fetch the landing page from the server; an authenticated session keeps
    // the header and does not bounce back to /login/.
    await webClient.goTo("/");

    expect(await webClient.userAccountsPage.header.isLogoVisible()).toBeTruthy();
    expect(webClient.page.url()).not.toContain("/login");
  });
});
