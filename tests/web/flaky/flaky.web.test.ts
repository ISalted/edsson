import { test, expect } from "@lib/fixtures";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO: a DETERMINISTIC "flaky" test — fails on the first attempt, passes on the
// retry, so Playwright's `--retries` visibly fires (fail → retry → pass).
//
// The flakiness is driven purely by the attempt counter `testInfo.retry`
// (0 on the first attempt, 1 on the first retry, …). No site, no Page Object, no
// real login — so it is 100% reproducible and can never "no-show" in a live demo
// the way a genuine non-deterministic flake could.
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Flaky retry demo @web @flaky @Sf872e856", () => {
  // This test never touches the app — drop the shared session entirely.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("FLK-001: flaky check — fails on the first attempt, passes on retry @web @flaky @T98b732bc", async ({webClient}, testInfo) => {
    await webClient.waitForTimeout(10)
    // true on the first attempt (retry === 0), false on every retry.
    const flaky = testInfo.retry === 0;

    // attempt 1 → expect(true).toBeFalsy()  → FAIL → triggers a retry
    // attempt 2 → expect(false).toBeFalsy() → PASS → test goes green as "flaky"
    expect(flaky).toBeFalsy();
  });
});
