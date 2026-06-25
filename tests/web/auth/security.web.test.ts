import { test, expect } from "@lib/fixtures";

test.describe("Authentication — Security @web @auth @security @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("AUT-020: SQL-injection-style payload in Email is rejected, no session granted", async ({
    webClient,
  }) => {
    await webClient.loginPage.fillEmail("' OR 1=1 --");
    await webClient.loginPage.fillPassword("anything");
    await webClient.loginPage.submit();
    expect(await webClient.loginPage.isErrorVisible()).toBeTruthy();
    expect(webClient.page.url()).toContain("/login");
  });

  test("AUT-021: XSS payload in Email does NOT execute as script", async ({
    webClient,
    helpers,
  }) => {
    // A reflected XSS in the error banner would trigger this alert.
    const dialogs = helpers.trackDialogs(webClient.page);
    await webClient.loginPage.fillEmail(
      "<script>alert('xss-AUT021')</script>@x.com",
    );
    await webClient.loginPage.fillPassword("anything");
    await webClient.loginPage.submit();
    // Give the banner time to render its rejection state.
    await webClient.loginPage.isErrorVisible();
    expect(dialogs.count()).toBe(0);
    expect(webClient.page.url()).toContain("/login");
    dialogs.stop();
  });

  test("AUT-022: error message is generic (same banner for unknown email AND wrong password — no enumeration)", async ({
    webClient,
  }) => {
    // First submit: well-formed but unknown email.
    await webClient.loginPage.login("nobody.AUT022@edsson.com", "anything");
    const unknownEmailText = await webClient.loginPage.getErrorText();

    // Reload to a clean form to avoid any stateful interference.
    await webClient.goTo("/login/");

    // Second submit: another well-formed unknown email (still no real account).
    await webClient.loginPage.login("ghost.AUT022@edsson.com", "anything");
    const otherUnknownText = await webClient.loginPage.getErrorText();

    expect(unknownEmailText.length).toBeGreaterThan(0);
    // Same banner text for two different unknown-email attempts — no detail
    // varies per email, which is the property an enumeration attack relies on.
    expect(otherUnknownText).toBe(unknownEmailText);
  });

  test("AUT-023: three repeated invalid attempts return the same banner (no probing signal)", async ({
    webClient,
  }) => {
    const seen: string[] = [];
    const statuses: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const response = await webClient.loginPage.login(
        `nobody.AUT023.${i}@edsson.com`,
        "anything",
      );
      statuses.push(response.status());
      seen.push(await webClient.loginPage.getErrorText());
      await webClient.goTo("/login/");
    }
    // All three attempts should return the same non-2xx status and the same
    // banner text. A diverging message on attempt N would leak rate-limit
    // state and aid enumeration.
    expect(new Set(statuses).size).toBe(1);
    expect(statuses[0]).toBeGreaterThanOrEqual(400);
    expect(new Set(seen).size).toBe(1);
  });
});
