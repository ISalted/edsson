import { test, expect } from "@lib/fixtures";
import { aqaUser } from "@data/user-accounts/user-account.data";

/**
 * Each test locks/unlocks a freshly-created throwaway user (never a real
 * account). NOTE: persists users; no cleanup path (delete forbidden).
 * If Lock/Unlock shows a confirmation dialog, add its handling on first run.
 */
test.describe("User Accounts — Lock / Unlock & Status @web @user-accounts @lock @mutating @S2a3b4c5d", () => {
  let user: ReturnType<typeof aqaUser>;

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
    user = aqaUser("lock");
    await webClient.userAccountsPage.createUser({ ...user }); // created Active by default
    await webClient.goTo("/administration/user-accounts/");
    await webClient.userAccountsPage.filterByText("Login", user.login);
  });

  test("UAC-048: locking an Active user sets Status=Inactive and greys the row", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.selectRow(user.login);
    await uap.clickLock();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Inactive");
    expect(await uap.isRowGreyed(user.login)).toBeTruthy();
  });

  test("UAC-049: unlocking a locked user restores Status=Active and normal styling", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.selectRow(user.login);
    await uap.clickLock();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    await uap.selectRow(user.login);
    await uap.clickUnlock();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Active");
    expect(await uap.isRowGreyed(user.login)).toBeFalsy();
  });

  test("UAC-050: the Lock status change persists after a full page reload", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    await uap.selectRow(user.login);
    await uap.clickLock();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Inactive");

    // reload once more to confirm durable persistence
    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Inactive");
  });

  // Blocker: requires authenticating AS the affected user; created users have no
  // known password, so login-as-user cannot be exercised here.
  test.fixme(
    "UAC-051: a locked user can no longer authenticate / is denied access",
    async () => {},
  );
  test.fixme(
    "UAC-052: an unlocked user can authenticate again and regains access",
    async () => {},
  );

  // Blocker: needs the precise spec of the Unlock-activities-date invariant
  // (what value is valid relative to "now") before it can be asserted.
  test.fixme(
    "UAC-053: after Lock the Unlock-activities-date invariant holds (not in the past)",
    async () => {},
  );
});
