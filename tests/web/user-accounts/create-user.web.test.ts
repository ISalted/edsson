import { test, expect } from "@lib/fixtures";
import {
  aqaUser,
  EXISTING_LOGIN,
  EXISTING_EMAIL,
  PERMS,
} from "@data/user-accounts/user-account.data";

/**
 * NOTE: these PERSIST new users. Delete is forbidden, so there is no cleanup
 * path — each run leaves throwaway "aqa.*" users on the dev grid.
 * Status/Language/Creation source carry valid defaults, so only Name/Login/
 * E-mail are filled to reach a complete, savable form.
 */
test.describe("User Accounts — Create User @web @user-accounts @create @mutating @S9d0e1f2a", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-027: an existing Login is rejected and no user is created", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { email } = aqaUser("dup-login");
    await uap.clickCreate();
    await uap.fillCreateForm({ name: "QA Dup Login", login: EXISTING_LOGIN, email });
    await uap.save();
    expect(await uap.isCreatePopupVisible()).toBeTruthy(); // blocked → popup open
    await uap.closePopupByX();
    await uap.filterByText("E-mail", email);
    expect(await uap.isNoDataVisible()).toBeTruthy(); // unique e-mail never created
  });

  test("UAC-028: an existing E-mail is rejected and no user is created", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { login } = aqaUser("dup-email");
    await uap.clickCreate();
    await uap.fillCreateForm({ name: "QA Dup Email", login, email: EXISTING_EMAIL });
    await uap.save();
    expect(await uap.isCreatePopupVisible()).toBeTruthy();
    await uap.closePopupByX();
    await uap.filterByText("Login", login);
    expect(await uap.isNoDataVisible()).toBeTruthy();
  });

  test("UAC-029: an XSS payload in Name is stored/escaped safely (no script executes)", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { login, email, stamp } = aqaUser("xss");
    const name = `<img src=x onerror="window.__uaXss=1">QA${stamp}`;

    await uap.clickCreate();
    await uap.fillCreateForm({ name, login, email });
    await uap.saveAndClose();

    // Render the row if it was created, then assert the key SECURITY property:
    // the onerror handler never ran. This holds whether the app stores the name
    // escaped OR rejects HTML on save — both are safe — so we don't require the
    // row to exist.
    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", login);
    const xssExecuted = await webClient.page.evaluate(
      () => (window as unknown as { __uaXss?: number }).__uaXss,
    );
    expect(xssExecuted).toBeFalsy();
  });

  test("UAC-030: a rapid double Save creates only ONE user", async ({ webClient }) => {
    const uap = webClient.userAccountsPage;
    const { name, login, email } = aqaUser("dbl");
    await uap.clickCreate();
    await uap.fillCreateForm({ name, login, email });
    await uap.doubleSave();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", login);
    // wait for the filtered row to appear (client-side filter debounce) BEFORE
    // counting — else getRowCount races the debounce and counts the full page
    await uap.isRowVisible(login);
    expect(await uap.getRowCount()).toBe(1);
  });

  test("UAC-031: a created user's permissions persist (reopen via pencil)", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { name, login, email } = aqaUser("perm");
    await uap.clickCreate();
    await uap.fillCreateForm({ name, login, email });
    await uap.setPermissions([...PERMS]);
    await uap.saveAndClose();

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", login);
    await uap.clickEditRow(login);
    expect(await uap.isCreatePopupVisible()).toBeTruthy();
    expect(await uap.isPermissionChecked(PERMS[0])).toBeTruthy();
    expect(await uap.isPermissionChecked(PERMS[1])).toBeTruthy();
  });

  test("UAC-032: a created user's master-detail Permissions tab reflects the granted permission", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { name, login, email } = aqaUser("detail");
    await uap.clickCreate();
    await uap.fillCreateForm({ name, login, email });
    await uap.setPermissions([PERMS[0]]);
    await uap.saveAndClose();
    await webClient.waitForTimeout(5)

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", login);
    await uap.openRowDetail(login);
    expect(await uap.isDetailPanelVisible()).toBeTruthy();
    expect(await uap.isDetailTabActive("Permissions")).toBeTruthy();
    expect(await uap.isDetailPermissionGranted(PERMS[0])).toBeTruthy();
  });
});
