import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

const LOGIN_API = /\/account\/login/;

test.describe("Auth — Login UX & Concurrency @web @auth @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-032: double-clicking Sign in fires exactly one login request @web @auth", async ({
    webClient,
    helpers,
  }) => {
    const lp = webClient.loginPage;
    // Wrong password keeps us on /login/ so the double-click is the only variable.
    await lp.fillEmail(env.adminEmail);
    await lp.fillPassword("wrongpassword");

    const requests = await helpers.countNetworkRequests(
      webClient.page,
      LOGIN_API,
      async () => {
        await lp.doubleClickSubmit();
      },
    );

    expect(requests).toBe(1);
  });

  test("AUT-033: editing a field after a failed login clears the previous error banner @web @auth", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    await lp.login(env.adminEmail, "wrongpassword");
    expect(await lp.isErrorVisible()).toBeTruthy();

    await lp.fillEmail("another.user@edsson.com");

    expect(await lp.isErrorBannerPresent()).toBeFalsy();
  });
});
