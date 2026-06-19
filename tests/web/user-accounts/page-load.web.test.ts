import { test, expect } from "@lib/fixtures";

test.describe("User Accounts — Page Load @web @user-accounts @smoke @Sad3f1e2b", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo('/administration/user-accounts/');
  });

  test.only("UAC-001: page loads with the grid populated and the pager visible", async ({
    webClient,
  }) => {
    expect(await webClient.userAccountsPage.isGridVisible()).toBeTruthy();
    expect(await webClient.userAccountsPage.getRowCount()).toBeGreaterThan(0);
    expect(await webClient.userAccountsPage.isPagerVisible()).toBeTruthy();
  });
});

test.describe("User Accounts — Page Load (unauthenticated) @web @user-accounts @auth @S8c9d0e1f", () => {
  // Override the project's injected storageState with an empty one so this
  // context is NOT authenticated (no need for a separate project).
  test.use({ storageState: { cookies: [], origins: [] } });

  test("UAC-002: deep-linking while unauthenticated redirects to login and exposes no data", async ({
    webClient,
  }) => {
    await webClient.goTo("/administration/user-accounts/");
    // unauthenticated access must bounce to the login page
    await webClient.page.waitForURL(/\/login/i, { timeout: 15_000 });
    expect(webClient.page.url()).toContain("/login");
    // and the user-accounts grid must not be rendered (no data exposed)
    expect(await webClient.userAccountsPage.isGridPresent()).toBeFalsy();
  });
});
