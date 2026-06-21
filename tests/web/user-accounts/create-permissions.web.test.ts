import { test, expect } from "@lib/fixtures";

test.describe("User Accounts — Create Permissions (popup, no save) @web @user-accounts @create @permissions @regression @S6a7b8c9d", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
    await webClient.userAccountsPage.clickCreate();
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
  });

  test("UAC-016: checking one permission checks only that permission @Tdc733a87", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.togglePermission("View Resource Costs Report", true);
    expect(
      await webClient.userAccountsPage.isPermissionChecked("View Resource Costs Report"),
    ).toBeTruthy();
    expect(
      await webClient.userAccountsPage.isPermissionChecked("Manage Currencies"),
    ).toBeFalsy();
  });

  test("UAC-017: header 'select all' checks all permissions across categories @Tf28e0c1c", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.selectAllPermissions();
    expect(
      await webClient.userAccountsPage.isPermissionChecked("View Resource Costs Report"),
    ).toBeTruthy();
    expect(
      await webClient.userAccountsPage.isPermissionChecked("Manage Currencies"),
    ).toBeTruthy();
  });

  test("UAC-018: header 'select all' toggled twice deselects all permissions @Tea5bc390", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.selectAllPermissions(); // check all
    await webClient.userAccountsPage.selectAllPermissions(); // uncheck all
    expect(
      await webClient.userAccountsPage.isPermissionChecked("View Resource Costs Report"),
    ).toBeFalsy();
    expect(
      await webClient.userAccountsPage.isPermissionChecked("Manage Currencies"),
    ).toBeFalsy();
  });

  test("UAC-019: permission selection persists across popup tab switches @T41db9bd1", async ({
    webClient,
  }) => {
    // Projects tab is disabled in Create mode, so switch via the enabled Groups tab
    await webClient.userAccountsPage.togglePermission("Manage Currencies", true);
    await webClient.userAccountsPage.switchCreateFormTab("Groups");
    await webClient.userAccountsPage.switchCreateFormTab("Edit User Data");
    expect(
      await webClient.userAccountsPage.isPermissionChecked("Manage Currencies"),
    ).toBeTruthy();
  });
});
