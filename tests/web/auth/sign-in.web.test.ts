import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";
import { aqaUser } from "@data/user-accounts/user-account.data";

test.describe("Auth — Sign in @web @auth @sign-in", () => {
  // Sign-in must start unauthenticated — drop the shared session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-004: empty form shows 'Please enter your email.' and sends no login request @web @auth @sign-in @validation", async ({
    webClient,
  }) => {
    const loginRequest = await webClient.loginPage.submitAndGetLoginRequest();

    expect(await webClient.loginPage.getErrorText()).toBe("Please enter your email.");
    expect(loginRequest).toBeNull();
  });

  test("AUT-005: email without password shows 'Please enter your password.' and sends no login request @web @auth @sign-in @validation", async ({
    webClient,
  }) => {
    const user = aqaUser("signin");

    await webClient.loginPage.fillEmail(user.email);
    const loginRequest = await webClient.loginPage.submitAndGetLoginRequest();

    expect(await webClient.loginPage.getErrorText()).toBe("Please enter your password.");
    expect(loginRequest).toBeNull();
  });

  test("AUT-007: valid credentials sign in and land in the app @web @auth @sign-in @smoke", async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(env.adminEmail, env.adminPassword);

    expect(response.status()).toBe(200);
    expect(await webClient.userAccountsPage.header.isLogoVisible()).toBeTruthy();
    expect(await webClient.getCurrentPath()).not.toBe("/login/");
  });

  test("AUT-009: invalid credentials are refused with 400, stay on /login/ and issue no session @web @auth @sign-in @security @smoke", async ({
    webClient,
  }) => {
    const unknownUser = aqaUser("signin-invalid"); // never created → guaranteed non-matching

    const response = await webClient.loginPage.login(unknownUser.email, "NotTheRightPassword1!");

    expect(response.status()).toBe(400);
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(await webClient.getCurrentPath()).toBe("/login/");
    expect(await webClient.loginPage.getAuthToken()).toBeNull();
  });

  test("AUT-013: unauthenticated deep link to user-accounts redirects to /login/ without rendering the grid @web @auth @sign-in @security @smoke", async ({
    webClient,
  }) => {
    await webClient.goTo("/administration/user-accounts/");
    await webClient.waitForUrl(/\/login\/$/);

    expect(await webClient.getCurrentPath()).toBe("/login/");
    expect(await webClient.loginPage.isSignInFormVisible()).toBeTruthy();
    expect(await webClient.userAccountsPage.isGridPresent()).toBeFalsy();
  });
});
