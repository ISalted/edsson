import { test, expect } from "@lib/fixtures";
import {
  aqaUser,
  PERMS,
  EXISTING_LOGIN,
  EXISTING_EMAIL,
} from "@data/user-accounts/user-account.data";

/**
 * Each test operates on a freshly-created throwaway user (never a real account),
 * so a failed restore can't corrupt shared data. NOTE: persists users; no
 * cleanup path (delete forbidden) — they accumulate on the dev grid.
 */
test.describe("User Accounts — Edit User @web @user-accounts @edit @mutating @S0e1f2a3b", () => { let user: ReturnType<typeof aqaUser>;

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
    user = aqaUser("edit");
    await webClient.userAccountsPage.createUser({ ...user, permissions: [...PERMS] });
    await webClient.goTo("/administration/user-accounts/");
    await webClient.userAccountsPage.filterByText("Login", user.login);
  });

  test("UAC-033: unchecking a permission and Save persists the deselection", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    await uap.togglePermission(PERMS[0], false);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.clickEditRow(user.login);
    expect(await uap.isPermissionChecked(PERMS[0])).toBeFalsy();
  });

  test("UAC-034: 'Save' persists changes, keeps the popup open, and the grid row updates", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const newName = `${user.name} SAVED`;
    await uap.clickEditRow(user.login);
    await uap.setFieldValue("Name", newName);
    await uap.save();
    expect(await uap.isCreatePopupVisible()).toBeTruthy(); // stays open
    await uap.closePopupByX();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Name")).toBe(newName);
  });

  test("UAC-035: 'Save and Close' persists changes, closes the popup, and the grid updates", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const newName = `${user.name} SNC`;
    await uap.clickEditRow(user.login);
    await uap.setFieldValue("Name", newName);
    await uap.saveAndClose();
    expect(await uap.isCreatePopupClosed()).toBeTruthy();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Name")).toBe(newName);
  });

  test("UAC-036: editing Name and saving updates the grid Name cell", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const newName = `${user.name} RENAMED`;
    await uap.clickEditRow(user.login);
    await uap.setFieldValue("Name", newName);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Name")).toBe(newName);
  });

  test("UAC-037: re-opening after a Name edit shows the persisted Name (round-trip)", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const newName = `${user.name} ROUNDTRIP`;
    await uap.clickEditRow(user.login);
    await uap.setFieldValue("Name", newName);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.clickEditRow(user.login);
    expect(await uap.getFieldValue("Name")).toBe(newName);
  });

  test("UAC-038: toggling External and saving updates the grid boolean column", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    await uap.checkInForm("External user", true);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.isGridBooleanChecked(user.login, "External")).toBeTruthy();
  });

  test("UAC-039: changing Status Active->Inactive greys the row and updates the Status cell", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    await uap.selectInForm("Status", "Inactive");
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Inactive");
    expect(await uap.isRowGreyed(user.login)).toBeTruthy();
  });

  test("UAC-040: removing a checked permission and saving persists the removal", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    await uap.togglePermission(PERMS[1], false);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.clickEditRow(user.login);
    expect(await uap.isPermissionChecked(PERMS[1])).toBeFalsy();
  });

  test("UAC-041: clearing required Name and Save is blocked", async ({ webClient }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    await uap.setFieldValue("Name", "");
    await uap.save();
    expect(await uap.isFieldInvalid("Name")).toBeTruthy();
    expect(await uap.isCreatePopupVisible()).toBeTruthy();
  });

  test("UAC-042: Login is read-only in Edit mode (immutable after creation)", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    // Login cannot be changed once a user exists — the field is disabled
    expect(await uap.isFieldEditable("Login")).toBeFalsy();
  });

  test("UAC-043: clearing required E-mail and Save is blocked", async ({ webClient }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    await uap.setFieldValue("E-mail", "");
    await uap.save();
    expect(await uap.isFieldInvalid("E-mail")).toBeTruthy();
    expect(await uap.isCreatePopupVisible()).toBeTruthy();
  });

  // N/A in Edit: Login is read-only (see UAC-042), so it cannot be changed to a
  // duplicate. Login uniqueness is covered on create — see UAC-027.
  test.fixme(
    "UAC-044: editing Login to another user's login is rejected (uniqueness)",
    async () => {},
  );

  test("UAC-045: editing E-mail to another user's e-mail is rejected (uniqueness)", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(user.login);
    await uap.setFieldValue("E-mail", EXISTING_EMAIL);
    await uap.save();
    expect(await uap.isCreatePopupVisible()).toBeTruthy();
  });
});
