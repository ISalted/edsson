import { test, expect } from "@lib/fixtures";

test.describe("User Roles — Pagination @web @user-roles @pagination", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-roles/");
  });

  test(
    "ROL-008: setPageSize(5) with 8 total roles clips the visible list to exactly 5 rows on page 1",
    async ({ webClient }) => {
      const urp = webClient.userRolesPage;

      await urp.setPageSize(5);

      // Poll in case the pager re-render is briefly async. (A)
      await expect
        .poll(() => urp.getRoleNames(), { timeout: 5_000 })
        .toHaveLength(5);
    },
  );
});
