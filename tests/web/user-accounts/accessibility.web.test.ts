import { test, expect } from "@lib/fixtures";

test.describe("User Accounts — Accessibility @web @user-accounts @regression @S7b8c9d0e", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-026: focus is trapped inside the Create/Edit modal @T05033fbf", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.clickCreate();
    expect(await webClient.userAccountsPage.isCreatePopupVisible()).toBeTruthy();
    for (let i = 0; i < 6; i++) await webClient.page.keyboard.press("Tab");
    expect(await webClient.userAccountsPage.isFocusInsidePopup()).toBeTruthy();
  });
});
