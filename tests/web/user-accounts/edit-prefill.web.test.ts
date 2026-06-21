import { test, expect } from "@lib/fixtures";
import {
  KNOWN_USER,
  PERMS,
  aqaUser,
} from "@data/user-accounts/user-account.data";

test.describe("User Accounts — Edit Pre-fill @web @user-accounts @edit @regression @S4e5f6a7b", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
    // KNOWN_USER isn't on page 1 — filter to it so the row is rendered
    await webClient.userAccountsPage.filterByText("Login", KNOWN_USER);
  });

  test("UAC-020: the pencil link opens the user popup as a modal @T009177f6", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.clickEditRow(KNOWN_USER);
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
  });

  test("UAC-021: text fields are pre-filled with the selected user's values @T67533e3e", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.clickEditRow(KNOWN_USER);
    expect(await webClient.userAccountsPage.getFieldValue("Login")).toBe(KNOWN_USER);
    expect((await webClient.userAccountsPage.getFieldValue("Name")).length).toBeGreaterThan(0);
    expect((await webClient.userAccountsPage.getFieldValue("E-mail")).length).toBeGreaterThan(0);
  });

  test("UAC-022: dropdowns show the user's saved selection, not the empty placeholder @Ta604daec", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.clickEditRow(KNOWN_USER);
    const status = await webClient.userAccountsPage.getSelectboxValue("Status");
    expect(status.trim().length).toBeGreaterThan(0);
    expect(status).not.toBe("-- none --");
  });

  test("UAC-023: checkboxes reflect the user's saved state (matches grid flags) @T9804a243", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.clickEditRow(KNOWN_USER);
    // KNOWN_USER fixture on the grid: External=off, Administrator=ON, Partner=off
    expect(await webClient.userAccountsPage.isCheckboxChecked("External user")).toBeFalsy();
    expect(await webClient.userAccountsPage.isCheckboxChecked("Administrator")).toBeTruthy();
    expect(await webClient.userAccountsPage.isCheckboxChecked("Partner user")).toBeFalsy();
  });

  test("UAC-024: modifying Name then closing discards the change @Tdcedec86", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.clickEditRow(KNOWN_USER);
    const original = await uap.getFieldValue("Name");
    await uap.closePopup();

    // NOTE: the footer "Close" button discards a dirty form; the header X is a
    // no-op on a dirty form (it does not close it) — so use Close to discard.
    await uap.clickEditRow(KNOWN_USER);
    await uap.setFieldValue("Name", `${original} TEMP-DISCARD`);
    await uap.closePopup(); // discard without saving

    await uap.clickEditRow(KNOWN_USER);
    expect(await uap.getFieldValue("Name")).toBe(original);
  });

  test("UAC-025: the Permissions panel is pre-checked for exactly the user's permissions @T43ecc91f", async ({
    webClient,
  }) => {
    // create a throwaway user with a KNOWN single-permission subset, then reopen
    const user = aqaUser("editperm");
    await webClient.userAccountsPage.createUser({ ...user, permissions: [PERMS[0]] });
    await webClient.goTo("/administration/user-accounts/");
    await webClient.userAccountsPage.filterByText("Login", user.login);
    await webClient.userAccountsPage.clickEditRow(user.login);
    expect(await webClient.userAccountsPage.isPermissionChecked(PERMS[0])).toBeTruthy();
    expect(await webClient.userAccountsPage.isPermissionChecked(PERMS[1])).toBeFalsy();
  });
});
