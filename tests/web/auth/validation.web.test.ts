import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

test.describe("Authentication — Validation @web @auth @validation @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-008: empty Email + empty Password → error banner, stays on /login/", async ({
    webClient,
  }) => {
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-009: filled Email + empty Password → error banner, stays on /login/", async ({
    webClient,
  }) => {
    await webClient.loginPage.fillEmail(env.adminEmail);
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-010: empty Email + filled Password → error banner, stays on /login/", async ({
    webClient,
  }) => {
    await webClient.loginPage.fillPassword("anything");
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-011: whitespace-only Email is treated as empty (error banner, no redirect)", async ({
    webClient,
  }) => {
    await webClient.loginPage.fillEmail("   ");
    await webClient.loginPage.fillPassword("anything");
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-012: malformed Email (no @) is rejected — error banner, no redirect", async ({
    webClient,
  }) => {
    await webClient.loginPage.fillEmail("not-an-email");
    await webClient.loginPage.fillPassword("anything");
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });
});
