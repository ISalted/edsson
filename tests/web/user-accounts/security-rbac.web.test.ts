import { test, expect } from "@lib/fixtures";
import { aqaUser } from "@data/user-accounts/user-account.data";

test.describe("User Accounts — Stored XSS @web @user-accounts @security @mutating @regression @S3b4c5d6e", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-056: markup in Name renders inert in the grid, detail panel and edit popup @T2315fb80", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { login, email, stamp } = aqaUser("xssname");
    const name = `<img src=x onerror="window.__uaXss056=1">QA${stamp}`;

    await uap.createUser({ name, login, email });

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", login);
    expect(await uap.isRowVisible(login)).toBeTruthy(); // rendered in grid
    await uap.clickRow(login); // rendered in detail context
    await uap.clickEditRow(login); // rendered in edit popup (Name field)
    expect(await uap.isCreatePopupVisible()).toBeTruthy();

    const executed = await webClient.page.evaluate(
      () => (window as unknown as { __uaXss056?: number }).__uaXss056,
    );
    expect(executed).toBeFalsy();
  });

  test("UAC-057: a stored payload in Details renders as inert literal text @T456622de", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const { name, login, email, stamp } = aqaUser("xssdetails");
    const details = `<img src=x onerror="window.__uaXss057=1">D${stamp}`;

    await uap.createUser({ name, login, email, details });

    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", login);
    await uap.clickEditRow(login); 
    expect(await uap.isCreatePopupVisible()).toBeTruthy();

    const executed = await webClient.page.evaluate(
      () => (window as unknown as { __uaXss057?: number }).__uaXss057,
    );
    expect(executed).toBeFalsy();
  });

    test.fixme("UAC-054: a non-admin navigating directly to the page is denied (no user list)", async () => {});
    test.fixme("UAC-055: a non-admin Lock/Unlock/Save/permission request is rejected server-side", async () => {});
    test.fixme("UAC-058: tampering the edit request's user-id (IDOR) is rejected server-side", async () => {});
    test.fixme("UAC-059: a lower-privileged operator cannot grant Administrator (rejected server-side)", async () => {});
    test.fixme("UAC-060: granting a permission the operator does not hold is rejected server-side", async () => {});
});
