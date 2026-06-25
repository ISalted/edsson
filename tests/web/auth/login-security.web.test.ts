import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

test.describe("Auth — Login Security @web @auth @security @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-018: the password never appears in the login response, localStorage, sessionStorage, or cookies @web @auth @security", async ({
    webClient,
    helpers,
  }) => {
    const response = await webClient.loginPage.login(
      env.adminEmail,
      env.adminPassword,
    );
    expect(response.status()).toBe(200);

    const bodyText = await response.text();
    expect(bodyText).not.toContain(env.adminPassword);

    const leak = await helpers.scanStorageForSecret(
      webClient.page,
      env.adminPassword,
    );
    expect(leak.localStorage).toBeFalsy();
    expect(leak.sessionStorage).toBeFalsy();
    expect(leak.cookies).toBeFalsy();
  });

  test("AUT-019: a SQL-injection-style email returns 4xx with the generic banner — no 500 @web @auth @security", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    const response = await lp.login("' OR '1'='1'@x.com", "any-password");

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
    expect(await lp.isErrorVisible()).toBeTruthy();
  });

  test("AUT-020: an XSS payload in Email is treated as literal text — no dialog fires, server returns 4xx @web @auth @security", async ({
    webClient,
    helpers,
  }) => {
    const lp = webClient.loginPage;
    let status = 0;

    const dialogAppeared = await helpers.didDialogAppearDuring(
      webClient.page,
      async () => {
        const response = await lp.login(
          "<script>alert(1)</script>@x.com",
          "any-password",
        );
        status = response.status();
      },
    );

    expect(dialogAppeared).toBeFalsy();
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });
});
