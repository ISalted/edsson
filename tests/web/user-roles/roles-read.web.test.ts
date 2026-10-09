import { test, expect } from "@lib/fixtures";

// ROL-001 — confirmed dev-env data (RESEARCH.md, 2026-10-09): 8 system roles,
// default order ascending by ID. Update if the dev dataset changes.
const ALL_ROLE_NAMES = [
  "Business analyst",
  "Developer",
  "Tester",
  "Test docs. writer",
  "Project manager",
  "Release engineer",
  "System administrator",
  "HR manager",
];

test.describe(
  "User Roles — Grid Read @web @user-roles @display @smoke",
  () => {
    test.beforeEach(async ({ webClient }) => {
      await webClient.goTo("/administration/user-roles/");
    });

    test(
      "ROL-001: page load populates the grid with every stored role in default (ID-ascending) order @smoke",
      async ({ webClient }) => {
        const names = await webClient.userRolesPage.getRoleNames();

        // Assert count AND exact names — a silently missing role would fail the
        // toEqual comparison even if length happens to match. (A)
        expect(names).toEqual(ALL_ROLE_NAMES);
      },
    );
  },
);
