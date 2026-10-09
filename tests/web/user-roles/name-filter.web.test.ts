import { test, expect } from "@lib/fixtures";

// Name filter is client-side with ~300ms DevExtreme debounce.
// Positive-result cases use expect.poll so the assertion retries until the
// filtered state settles. No-data cases use isNoDataVisible(), which waits for
// the no-data element to appear — that too is an implicit debounce gate.

test.describe("User Roles — Name Filter @web @user-roles @filter", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-roles/");
  });

  test(
    "ROL-003: filterByName('man') shows only roles whose name contains 'man' @smoke",
    async ({ webClient }) => {
      const urp = webClient.userRolesPage;

      await urp.filterByName("man");

      // Poll until the debounce has fired and the grid shows the filtered rows. (A)
      await expect
        .poll(() => urp.getRoleNames(), { timeout: 10_000 })
        .toEqual(["Project manager", "HR manager"]);
    },
  );

  test(
    "ROL-004: filterByName('MAN') (all-uppercase) returns the same 2 roles — case-insensitive",
    async ({ webClient }) => {
      const urp = webClient.userRolesPage;

      await urp.filterByName("MAN");

      await expect
        .poll(() => urp.getRoleNames(), { timeout: 10_000 })
        .toEqual(["Project manager", "HR manager"]);
    },
  );

  test(
    "ROL-005: filterByName('zzzz') triggers the no-data state (no roles match)",
    async ({ webClient }) => {
      const urp = webClient.userRolesPage;

      await urp.filterByName("zzzz");

      // isNoDataVisible() waits for the no-data element — confirms filter settled. (A)
      expect(await urp.isNoDataVisible()).toBeTruthy();
    },
  );

  test(
    "ROL-006: clearing the name filter after a no-match restores all 8 roles",
    async ({ webClient }) => {
      const urp = webClient.userRolesPage;

      // Arrange: put the grid into no-data state (wait for debounce to settle). (C)
      await urp.filterByName("zzzz");
      expect(await urp.isNoDataVisible()).toBeTruthy();

      // Act: clear the filter.
      await urp.filterByName("");

      // Assert: all roles come back. getRoleNames() waits for the first row to
      // become visible, so it also acts as the debounce wait here. (A)
      await expect
        .poll(() => urp.getRoleNames(), { timeout: 10_000 })
        .toHaveLength(8);
    },
  );

  test(
    "ROL-007: XSS/injection input is treated as literal text — no script executes and no roles match",
    async ({ webClient }) => {
      const urp = webClient.userRolesPage;

      await urp.filterByName("<script>alert(1)</script>");

      // No dialog should fire (Playwright fails the test if an unexpected dialog opens).
      // No-data confirms the literal-text treatment. (A)
      expect(await urp.isNoDataVisible()).toBeTruthy();
    },
  );
});
