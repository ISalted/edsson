import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

const LOGIN_API = /\/account\/login/;

test.describe("Auth — Login Validation @web @auth @validation @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-007: submitting both fields empty shows the error and fires no login request @web @auth @validation", async ({
    webClient,
    helpers,
  }) => {
    const lp = webClient.loginPage;

    const requests = await helpers.countNetworkRequests(
      webClient.page,
      LOGIN_API,
      async () => {
        await lp.submit();
      },
    );

    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(requests).toBe(0);
  });

  test("AUT-008: submitting with password empty shows the error and fires no login request @web @auth @validation", async ({
    webClient,
    helpers,
  }) => {
    const lp = webClient.loginPage;
    await lp.fillEmail(env.adminEmail);

    const requests = await helpers.countNetworkRequests(
      webClient.page,
      LOGIN_API,
      async () => {
        await lp.submit();
      },
    );

    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(requests).toBe(0);
  });

  test("AUT-009: submitting with email empty shows the error and fires no login request @web @auth @validation", async ({
    webClient,
    helpers,
  }) => {
    const lp = webClient.loginPage;
    await lp.fillPassword("any-password");

    const requests = await helpers.countNetworkRequests(
      webClient.page,
      LOGIN_API,
      async () => {
        await lp.submit();
      },
    );

    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(requests).toBe(0);
  });

  test("AUT-010: a whitespace-only email is treated as empty — error shown, no login request @web @auth @validation", async ({
    webClient,
    helpers,
  }) => {
    const lp = webClient.loginPage;
    await lp.fillEmail("   ");
    await lp.fillPassword("any-password");

    const requests = await helpers.countNetworkRequests(
      webClient.page,
      LOGIN_API,
      async () => {
        await lp.submit();
      },
    );

    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(requests).toBe(0);
  });

  test("AUT-011: an email with no @ is rejected — error shown, stays on /login/ @web @auth @validation", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    await lp.fillEmail("adminedsson.com");
    await lp.fillPassword("any-password");
    await lp.submit();

    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-012: an email with no domain is rejected — error shown, stays on /login/ @web @auth @validation", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    await lp.fillEmail("admin@");
    await lp.fillPassword("any-password");
    await lp.submit();

    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-013: an extreme-length email is handled gracefully — error shown, form stays responsive @web @auth @validation", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    const longEmail = `${"a".repeat(320)}@edsson.com`;
    await lp.fillEmail(longEmail);
    await lp.fillPassword("any-password");
    await lp.submit();

    expect(await lp.isErrorVisible()).toBeTruthy();
    // Form still renders => no crash / hang (no HTTP 500 took the page down).
    const state = await lp.getLoginFormState();
    expect(state.heading).toBeTruthy();
    expect(state.submitEnabled).toBeTruthy();
  });
});
