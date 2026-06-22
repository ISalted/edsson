import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO: a real E2E flow that LOGS IN ITSELF (no saved session / cookies / cache),
// does genuine UI activity, then is DELIBERATELY broken at the end with an
// artificial failure. playwright.config sets `trace: 'retain-on-failure'` (+ a
// failure screenshot), so the failing run keeps a full trace.zip — open it with
// `npx playwright show-trace <trace.zip>` (or the HTML report) to walk the whole
// flow step-by-step: login → navigation → grid actions → the failure.
//
// Starts from a CLEAN, UNAUTHENTICATED context (session dropped) so the LOGIN is
// part of the trace. It ALWAYS fails — that's the point; run it on demand for the
// demo, never leave it in the standard green suite.
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Trace demo @web @trace @e2e", () => {
  // No saved session / cookies / cache — the test authenticates itself.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/login/");
  });

  test("TRC-001: log in, drive user-accounts, then fail intentionally to showcase the trace @web @trace @e2e", async ({
    webClient,
  }) => {
    // ── log in from scratch (captured in the trace) ──
    const res = await webClient.loginPage.login(env.adminEmail, env.adminPassword);
    expect(res.status()).toBe(200);

    // ── real activity on user-accounts — the trace filmstrip / timeline ──
    await webClient.goTo("/administration/user-accounts/");
    const uap = webClient.userAccountsPage;
    expect(await uap.isGridVisible()).toBeTruthy(); // grid loads
    await uap.filterByText("Login", "aqa");          // type → debounce → grid refilters
    await webClient.waitForTimeout(1);               // 1s — let the filmstrip breathe
    await uap.clickRefresh();                         // toolbar action
    const pager = await uap.getPagerInfo();          // read some state

    // ── deliberate, artificial failure (the demo moment) ──
    // Everything above is in the trace; this line makes Playwright save it.
    expect(
      true,
      `Intentional demo failure — trace captured login → user-accounts flow (pager: ${pager}).`,
    ).toBe(false);
  });
});
