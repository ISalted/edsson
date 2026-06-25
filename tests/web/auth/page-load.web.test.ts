import { test, expect } from "@lib/fixtures";

test.describe("Authentication — Page Load @web @auth @page-load @regression", () => {
  // Login form must be inspected unauthenticated — drop the shared session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-001: /login/ renders both Email and Password inputs @smoke", async ({
    webClient,
  }) => {
    expect(await webClient.loginPage.isFieldVisible("Email")).toBeTruthy();
    expect(await webClient.loginPage.isFieldVisible("Password")).toBeTruthy();
  });

  test("AUT-002: Sign-in button is visible and enabled on initial load", async ({
    webClient,
  }) => {
    expect(await webClient.loginPage.isSubmitVisible()).toBeTruthy();
    expect(await webClient.loginPage.isSubmitEnabled()).toBeTruthy();
  });

  test("AUT-003: Password input is masked (type=password)", async ({
    webClient,
  }) => {
    expect(await webClient.loginPage.getFieldType("Password")).toBe("password");
  });

  test("AUT-004: Email input is NOT masked (type is not password)", async ({
    webClient,
  }) => {
    expect(await webClient.loginPage.getFieldType("Email")).not.toBe(
      "password",
    );
  });

  test("AUT-005: Email and Password inputs are empty on fresh load", async ({
    webClient,
  }) => {
    expect(await webClient.loginPage.getFieldValue("Email")).toBe("");
    expect(await webClient.loginPage.getFieldValue("Password")).toBe("");
  });

  test("AUT-006: no error banner is shown on a fresh load", async ({
    webClient,
  }) => {
    expect(await webClient.loginPage.isErrorPresent()).toBeFalsy();
  });

  test("AUT-007: Email and Password inputs expose password-manager autocomplete hints", async ({
    webClient,
  }) => {
    const emailAc = await webClient.loginPage.getFieldAutocomplete("Email");
    const passAc = await webClient.loginPage.getFieldAutocomplete("Password");
    // Acceptable values: explicit token, or "on" — anything but "off"/null,
    // which would actively break password-manager autofill.
    expect(emailAc).not.toBeNull();
    expect(emailAc?.toLowerCase()).not.toBe("off");
    expect(passAc).not.toBeNull();
    expect(passAc?.toLowerCase()).not.toBe("off");
  });
});
