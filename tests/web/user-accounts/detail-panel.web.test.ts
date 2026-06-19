import { test, expect } from "@lib/fixtures";
import { KNOWN_USER, PERMS, aqaUser } from "@data/user-accounts/user-account.data";

test.describe("User Accounts — Detail Panel @web @user-accounts @detail @S2c3d4e5f", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
    // KNOWN_USER isn't on page 1 — filter to it so the row is rendered
    // (UAC-008/009 create + re-filter to their own users, overriding this)
    await webClient.userAccountsPage.filterByText("Login", KNOWN_USER);
  });

  test("UAC-007: opening a row shows the detail panel with Permissions active and populated", async ({
    webClient,
  }) => {
    await webClient.userAccountsPage.openRowDetail(KNOWN_USER);
    expect(await webClient.userAccountsPage.isDetailPanelVisible()).toBeTruthy();
    expect(
      await webClient.userAccountsPage.isDetailTabActive("Permissions"),
    ).toBeTruthy();
    expect(
      (await webClient.userAccountsPage.getDetailContent()).trim().length,
    ).toBeGreaterThan(0);
  });

  test("UAC-008: switching rows shows the selected user's own permissions, not stale data", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    // two throwaway users with DISTINCT permission sets
    const userA = aqaUser("staleA");
    const userB = aqaUser("staleB");
    await uap.createUser({ ...userA, permissions: [PERMS[0]] });
    await uap.createUser({ ...userB, permissions: [PERMS[1]] });
    await webClient.goTo("/administration/user-accounts/");

    // user A: only PERMS[0] granted
    await uap.filterByText("Login", userA.login);
    await uap.openRowDetail(userA.login);
    expect(await uap.isDetailTabActive("Permissions")).toBeTruthy();
    expect(await uap.isDetailPermissionGranted(PERMS[0])).toBeTruthy();
    expect(await uap.isDetailPermissionGranted(PERMS[1])).toBeFalsy();

    // re-filter to user B on the SAME page (no reload) and open it: the panel
    // must now reflect B's perms (PERMS[1]) and NOT keep A's stale data
    await uap.filterByText("Login", userB.login);
    await uap.openRowDetail(userB.login);
    expect(await uap.isDetailPanelVisible()).toBeTruthy();
    expect(await uap.isDetailPermissionGranted(PERMS[1])).toBeTruthy();
    expect(await uap.isDetailPermissionGranted(PERMS[0])).toBeFalsy();
  });

  test("UAC-009: a user with NO permissions shows none granted in the detail Permissions tab", async ({
    webClient,
  }) => {
    // create a throwaway user with zero permissions, then inspect its detail
    const user = aqaUser("noperm");
    await webClient.userAccountsPage.createUser({ ...user }); // no permissions passed
    await webClient.goTo("/administration/user-accounts/");
    await webClient.userAccountsPage.filterByText("Login", user.login);
    await webClient.userAccountsPage.openRowDetail(user.login);
    expect(await webClient.userAccountsPage.isDetailPanelVisible()).toBeTruthy();
    expect(
      await webClient.userAccountsPage.isDetailPermissionGranted(PERMS[0]),
    ).toBeFalsy();
  });
});
