import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

test.describe("Auth — Login Accessibility @web @auth @a11y @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-028: tab order reaches Email, then Password, then Sign in @web @auth @a11y", async ({
    webClient,
  }) => {
    const order = await webClient.loginPage.getFormFocusOrder(5);

    const iEmail = order.indexOf("Email");
    const iPassword = order.indexOf("Password");
    const iSignIn = order.indexOf("Sign in");

    expect(iEmail).toBeGreaterThanOrEqual(0);
    expect(iPassword).toBeGreaterThan(iEmail);
    expect(iSignIn).toBeGreaterThan(iPassword);
  });

  test("AUT-029: pressing Enter in the Password input submits the form @web @auth @a11y", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    await lp.fillEmail(env.adminEmail);
    await lp.fillPassword(env.adminPassword);

    const responsePromise = lp.waitForLoginResponse();
    await lp.pressEnterInPassword();
    const response = await responsePromise;

    expect(response.status()).toBe(200);
  });

  test("AUT-030: the Email and Password inputs expose the exact accessible names @web @auth @a11y", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;

    expect(await lp.getEmailAccessibleName()).toBe("Email");
    expect(await lp.getPasswordAccessibleName()).toBe("Password");
  });

  test("AUT-031: a failed login surfaces its message via a role=alert region @web @auth @a11y", async ({
    webClient,
  }) => {
    const lp = webClient.loginPage;
    await lp.login(env.adminEmail, "wrongpassword");

    expect(await lp.isErrorVisible()).toBeTruthy();
    expect(await lp.getErrorRole()).toBe("alert");
  });
});
