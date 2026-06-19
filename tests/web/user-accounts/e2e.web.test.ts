import { test, expect } from "@lib/fixtures";
import { aqaUser, PERMS } from "@data/user-accounts/user-account.data";

/**
 * End-to-end flows across create/edit/lock + grid/detail. Each operates on a
 * freshly-created throwaway user. NOTE: persists users; no cleanup path.
 */
test.describe("User Accounts — End-to-End @web @user-accounts @e2e @mutating @S4c5d6e7f", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-061: create a user, filter to find it, and verify the submitted values in the row @T94ad76c8", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const user = aqaUser("e2e-create");
    await uap.createUser({ ...user });

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Name")).toBe(user.name);
    expect(await uap.getRowCellText(user.login, "E-mail")).toBe(user.email);
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Active");
  });

  test("UAC-062: create with a permission subset, then the detail Permissions tab matches (create->detail) @T2d7cf81c", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const user = aqaUser("e2e-detail");
    await uap.createUser({ ...user, permissions: [PERMS[0]] });

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.openRowDetail(user.login);
    expect(await uap.isDetailTabActive("Permissions")).toBeTruthy();
    expect(await uap.isDetailPermissionGranted(PERMS[0])).toBeTruthy();
  });

  test("UAC-063: create Active, then Lock -> the row greys and reads Inactive in one flow @T50fca04e", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const user = aqaUser("e2e-lock");
    await uap.createUser({ ...user });

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.selectRow(user.login);
    await uap.clickLock();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Inactive");
    expect(await uap.isRowGreyed(user.login)).toBeTruthy();
  });

  test("UAC-065: edit to add one and remove one permission -> the detail reflects both @Ta507cc36", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const user = aqaUser("e2e-perm");
    await uap.createUser({ ...user, permissions: [PERMS[0]] });

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.clickEditRow(user.login);
    await uap.togglePermission(PERMS[0], false); // remove
    await uap.togglePermission(PERMS[1], true); // add
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.openRowDetail(user.login);
    expect(await uap.isDetailPermissionGranted(PERMS[1])).toBeTruthy();
    expect(await uap.isDetailPermissionGranted(PERMS[0])).toBeFalsy();
  });

  // Blocker: Select all + Lock would lock EVERY visible row, including real
  // shared-dev users — too destructive to run until isolated test data exists.
  test.fixme(
    "UAC-064: filter to Active, Select all, Lock -> only the filtered rows are affected",
    async () => {},
  );
});
