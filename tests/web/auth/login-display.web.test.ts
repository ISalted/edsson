import { test, expect } from "@lib/fixtures";

test.describe("Auth — Login Display @web @auth @regression", () => {
  // Login surface is pre-auth — drop the shared session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-001: the login form renders the heading, both inputs, and an enabled Sign in button @web @auth @smoke", async ({
    webClient,
  }) => {
    const state = await webClient.loginPage.getLoginFormState();

    expect(state.heading).toBeTruthy();
    expect(state.email).toBeTruthy();
    expect(state.password).toBeTruthy();
    expect(state.submitVisible).toBeTruthy();
    expect(state.submitEnabled).toBeTruthy();
  });

  test("AUT-002: the Password input masks typed characters @web @auth @security", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    await lp.fillPassword("super-secret-text");

    expect(await lp.isPasswordMasked()).toBeTruthy();
  });

  test("AUT-003: on initial load both inputs are empty and no error banner is present @web @auth", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;

    expect(await lp.getEmailValue()).toBe("");
    expect(await lp.getPasswordValue()).toBe("");
    expect(await lp.isErrorBannerPresent()).toBeFalsy();
  });
});
