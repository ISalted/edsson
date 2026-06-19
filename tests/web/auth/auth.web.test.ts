import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

test.describe("Authentication @web @auth @S00000000", () => {
  // Auth/login flow must start unauthenticated — drop the shared session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test(`1. Login: valid credentials redirect to user-accounts @T00000001`, async ({
    webClient,
    apiClient
  }) => {
    // await apiClient.auth.login(env.adminEmail, env.adminPassword);
    const response = await webClient.loginPage.login(
      env.adminEmail,
      env.adminPassword,
    );

    expect(response.status()).toBe(200);
    expect(await webClient.header.isLogoVisible()).toBeTruthy();
  });

  test(`2. Login: empty email shows validation error @T00000002`, async ({
    webClient,
  }) => {
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
  });

  test(`3. Login: empty password shows validation error @T00000003`, async ({
    webClient,
  }) => {
    await webClient.loginPage.fillEmail(env.adminEmail);
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
  });

  test(`4. Login: invalid credentials return 400 error @T00000004`, async ({
    webClient,
  }) => {
    const response = await webClient.loginPage.login(env.adminEmail, "wrongpassword");
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(response.status()).toBe(400);
  });
});
