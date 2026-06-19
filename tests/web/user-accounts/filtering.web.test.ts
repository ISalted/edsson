import { test, expect } from "@lib/fixtures";

test.describe("User Accounts — Filtering @web @user-accounts @filter @S5f6a7b8c", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-006: special/SQL/HTML characters in a filter are treated as literal text (no injection, safe no-results) @T67b43e27", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.filterByText("Login", "%_'\"<>&;--");
    expect(await webClient.userAccountsPage.isNoDataVisible()).toBeTruthy();
    expect(await webClient.userAccountsPage.isGridVisible()).toBeTruthy();
  });
});
