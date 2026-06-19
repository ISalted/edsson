import { test, expect } from "@lib/fixtures";

test.describe("User Accounts — Page Load @web @user-accounts @smoke @Sad3f1e2b", () => {
  test("UAC-001: page loads with the grid populated and the pager visible @T4e44a5e7", async ({
    webClient,
  }) => {
    await webClient.goTo("/administration/user-accounts/");
    expect(await webClient.userAccountsPage.isGridVisible()).toBeTruthy();
    expect(await webClient.userAccountsPage.getRowCount()).toBeGreaterThan(0);
    expect(await webClient.userAccountsPage.isPagerVisible()).toBeTruthy();
  });

  test("UAC-002: deep-linking while unauthenticated redirects to login and exposes no data @T5af6ffd2", async ({
    webClient,
  }) => {
    // Log out: the session token lives in localStorage (origin-scoped), so we
    // must be on the app origin before clearing it. clearCookies drops the rest.
    await webClient.goTo("/");
    await webClient.page.context().clearCookies();
    await webClient.page.evaluate(() => localStorage.clear());

    // deep-link while unauthenticated -> must bounce to login, exposing no data
    await webClient.goTo("/administration/user-accounts/");
    await webClient.page.waitForURL(/\/login/i, { timeout: 15_000 });
    expect(webClient.page.url()).toContain("/login");
    expect(await webClient.userAccountsPage.isGridPresent()).toBeFalsy();
  });
});
