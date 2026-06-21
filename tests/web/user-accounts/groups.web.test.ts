import { test, expect } from "@lib/fixtures";
import { aqaUser } from "@data/user-accounts/user-account.data";

const GROUP = "TestGroup"; // a stable group present on the dev grid
const PROJECT = "Accells"; // a stable existing project on the dev grid

test.describe("User Accounts — Groups & Projects @web @user-accounts @groups @projects @mutating @regression @S1f2a3b4c", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-046: linking a project and Save persists it (visible on reopen) @T226e85ce", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    // Projects tab is disabled in Create, so create the user first, then Edit it
    const user = aqaUser("project");
    await uap.createUser({ ...user });

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.clickEditRow(user.login);
    await uap.switchCreateFormTab("Projects");
    await uap.searchProject(PROJECT);
    await uap.linkProject(PROJECT);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.clickEditRow(user.login);
    await uap.switchCreateFormTab("Projects");
    expect(await uap.isProjectLinked(PROJECT)).toBeTruthy();
  });

  test("UAC-047: adding a user to a group persists (visible on reopen) @T02e2c6fa", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { name, login, email } = aqaUser("group");

    await uap.clickCreate();
    await uap.fillCreateForm({ name, login, email });
    await uap.switchCreateFormTab("Groups");
    await uap.toggleGroup(GROUP, true);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", login);
    await uap.clickEditRow(login);
    await uap.switchCreateFormTab("Groups");
    expect(await uap.isInGroup(GROUP)).toBeTruthy();
  });
});
