import { test, expect } from "@lib/fixtures";
import { KNOWN_USER } from "@data/user-accounts/user-account.data";

test.describe("User Accounts — Toolbar & Selection State @web @user-accounts @selection @S1b2c3d4e", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-003: Lock is disabled on load when no row is selected", async ({
    webClient,
  }) => {
    expect(await webClient.userAccountsPage.isLockEnabled()).toBeFalsy();
  });

  test("UAC-004: Unlock is disabled on load when no row is selected", async ({
    webClient,
  }) => {
    expect(await webClient.userAccountsPage.isUnlockEnabled()).toBeFalsy();
  });

  test("UAC-005: selecting one row enables Lock, Unlock and Delete", async ({
    webClient,
  }) => {
    // KNOWN_USER isn't on page 1 — filter to it so the row is rendered
    await webClient.userAccountsPage.filterByText("Login", KNOWN_USER);
    await webClient.userAccountsPage.selectRow(KNOWN_USER);
    expect(await webClient.userAccountsPage.isRowSelected(KNOWN_USER)).toBeTruthy();
    expect(await webClient.userAccountsPage.isLockEnabled()).toBeTruthy();
    expect(await webClient.userAccountsPage.isUnlockEnabled()).toBeTruthy();
    expect(await webClient.userAccountsPage.isDeleteEnabled()).toBeTruthy();
  });
});
