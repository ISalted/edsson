import { test, expect } from "@lib/fixtures";

// These cases START authenticated (the default session-storage.json), so they
// do NOT override storageState. Each runs in its own browser context, so the
// in-test logout / token-clear never corrupts the shared session file.
test.describe("Auth — Session & Access Control @web @auth @security @regression", () => {
  test("AUT-006: an authenticated user hitting /login/ is redirected to the authenticated landing @web @auth", async ({
    webClient,
  }) => {
    await webClient.goTo("/login/");

    // The authenticated header only appears after the redirect away from /login/.
    expect(await webClient.userAccountsPage.header.isLogoVisible()).toBeTruthy();
    expect(webClient.page.url()).not.toContain("/login");
  });

  test("AUT-021: clearing the auth token and deep-linking bounces to /login/ and renders no protected data @web @auth @security", async ({
    webClient,
    helpers,
  }) => {
    const uap = webClient.userAccountsPage;
    await webClient.goTo("/administration/user-accounts/");

    await helpers.clearAuthToken(webClient.page);
    await webClient.goTo("/administration/user-accounts/");

    await webClient.waitForUrl(/\/login/i);
    expect(webClient.page.url()).toContain("/login");
    expect(await uap.isGridPresent()).toBeFalsy();
  });

  test("AUT-023: after Log Out, deep-linking to a protected route redirects to /login/ @web @auth @security", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await webClient.goTo("/administration/user-accounts/");

    await uap.header.openAccountMenu();
    await uap.header.logOut();
    await webClient.waitForUrl(/\/login/i);

    await webClient.goTo("/administration/user-accounts/");
    await webClient.waitForUrl(/\/login/i);

    expect(webClient.page.url()).toContain("/login");
    expect(await uap.isGridPresent()).toBeFalsy();
  });
});
