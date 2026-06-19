import { test, expect } from "@lib/fixtures";

test.describe("User Accounts — Create Validation @web @user-accounts @create @validation @S3d4e5f6a", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
    await webClient.userAccountsPage.clickCreate();
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
  });

  test("UAC-010: empty Save flags the empty-able required fields and creates no user @Te724711d", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.save();
    expect(await webClient.userAccountsPage.getInvalidFieldCount()).toBeGreaterThan(0);
    expect(await webClient.userAccountsPage.isFieldInvalid("Name")).toBeTruthy();
    expect(await webClient.userAccountsPage.isFieldInvalid("Login")).toBeTruthy();
    expect(await webClient.userAccountsPage.isFieldInvalid("E-mail")).toBeTruthy();
    // popup stays open => creation was blocked
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
  });

  test("UAC-011: 'Save and Close' is blocked the same as Save on an empty form @Tb42b9db8", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.saveAndClose();
    expect(await webClient.userAccountsPage.getInvalidFieldCount()).toBeGreaterThan(0);
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
  });

  test("UAC-012: filling only Name still flags Login and E-mail @T78fb2964", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.fillCreateForm({
      name: "QA Validation Probe",
      login: "",
      email: "",
    });
    await webClient.userAccountsPage.save();
    expect(await webClient.userAccountsPage.isFieldInvalid("Login")).toBeTruthy();
    expect(await webClient.userAccountsPage.isFieldInvalid("E-mail")).toBeTruthy();
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
  });

  test("UAC-013: an e-mail without '@' is rejected with a format error @T6dab3349", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.fillCreateForm({
      name: "QA Validation Probe",
      login: "aqa.validation.probe",
      email: "notanemail",
    });
    await webClient.userAccountsPage.save();
    // bad format is rejected via an "Invalid e-mail format" message (not a
    // dx-invalid field class) and the popup stays open (no user created)
    expect(
      await webClient.userAccountsPage.isErrorMessageVisible("Invalid e-mail format"),
    ).toBeTruthy();
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
  });

  // Status/Language are required (*) but carry valid, non-clearable defaults, so
  // they can never be left empty — these verify the defaults instead of an
  // (impossible) empty-submit. Read-only: no Save, no user created.
  test("UAC-014: Status defaults to a valid 'Active' value (required, not clearable) @Tb0a89926", async ({
    webClient,
  }) => {
    expect(await webClient.userAccountsPage.getSelectboxValue("Status")).toBe("Active");
  });

  test("UAC-015: Language defaults to a valid 'Default' value (required, not clearable) @T54f56013", async ({
    webClient,
  }) => {
    expect(await webClient.userAccountsPage.getSelectboxValue("Language")).toBe("Default");
  });
});
