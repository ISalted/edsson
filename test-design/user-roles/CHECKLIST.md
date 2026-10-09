# User Roles — Test Checklist

Targets the WEB UI of `/administration/user-roles/` (Administration → Authorization → User roles).
**Out of scope:** role delete (CLAUDE.md guardrail — never automate); role create / edit / Name
validation (mutating writes, deferred to a future `/sdk-builder` + `/test-write` pass once the
inline-editor locators are captured); API-level auth beyond what the UI exposes; export file
layout/contents (file download); concurrent-edit scenarios (two simultaneous sessions); permissions
tests requiring a non-Administrator/non-PlatformAdministrator account (no such account available).

**Priority legend:** `critical` = blocks core usage, corrupts data, or exposes a security hole ·
`high` = frequently-used functionality users depend on · `medium` = secondary features & common
edge cases · `low` = cosmetic / rare / nice-to-have.

**Test-design techniques applied:** equivalence partitioning, boundary value analysis, state
transition (sort cycle, filter → clear), error guessing, security (XSS/injection, RBAC redirect),
accessibility.

---

## Grid Display

- [ ] ROL-001: On initial page load, `getRoleNames()` returns an array of exactly 8 role names
  matching the server data (`GetEntities` `DataSource`) in the default display order — confirms
  every stored role is rendered once (critical) `[REQ-ROL-007]` @smoke
- [ ] ROL-002: The Is production column shows a **checked** checkbox for each of the 6 production
  roles (Business analyst, Developer, Tester, Test docs. writer, Project manager, Release engineer)
  and an **unchecked** checkbox for the 2 non-production roles (System administrator, HR manager)
  (medium) `[REQ-ROL-008]`

## Name Filtering

- [ ] ROL-003: `filterByName('man')` narrows the grid to exactly the 2 roles whose names contain
  "man"; `getRoleNames()` returns `['Project manager', 'HR manager']` (high) `[REQ-ROL-013]` @smoke
- [ ] ROL-004: `filterByName('MAN')` (all-uppercase) returns the same 2 roles as `filterByName('man')`,
  confirming case-insensitive Contains matching (high) `[REQ-ROL-013]`
- [ ] ROL-005: `filterByName('zzzz')` (no matching roles) triggers the no-data state; `getRoleNames()`
  returns `[]` (medium) `[REQ-ROL-011]`
- [ ] ROL-006: After an active name filter, `filterByName('')` (clear) restores all 8 roles;
  `getRoleNames().length === 8` (medium) `[REQ-ROL-013]`
- [ ] ROL-007: `filterByName('<script>alert(1)</script>')` returns no data (literal text, zero
  matches), no script executes, and no error is thrown; `getRoleNames()` returns `[]` (high)
  `[REQ-ROL-016]`

## Pagination

- [ ] ROL-008: `setPageSize(5)` with 8 total roles shows exactly 5 role names on page 1;
  `getRoleNames().length === 5` (medium) `[REQ-ROL-010]`
- [ ] ROL-009: With page size 5 and 8 total roles, navigating to page 2 shows the remaining 3 roles;
  `getRoleNames().length === 3` (medium) `[REQ-ROL-010]`

## Sorting

- [ ] ROL-010: Clicking the Name column header once sorts all visible rows into case-insensitive
  ascending alphabetical order; `aria-sort` on the header reads `"ascending"` (medium)
  `[REQ-ROL-012]`
- [ ] ROL-011: Clicking the Name column header a second time reverses the order to descending;
  `aria-sort` on the header reads `"descending"` (medium) `[REQ-ROL-012]`

## Is Production Filter

- [ ] ROL-012: Selecting `true` in the Is production filter shows exactly 6 production roles;
  `getRoleNames().length === 6` (medium) `[REQ-ROL-015]`
- [ ] ROL-013: Selecting `false` in the Is production filter shows exactly 2 non-production roles
  (System administrator, HR manager) in their displayed order (medium) `[REQ-ROL-015]`
- [ ] ROL-014: Selecting `(all)` in the Is production filter after it was set to `true` or `false`
  restores all 8 roles; `getRoleNames().length === 8` (medium) `[REQ-ROL-015]`

## Page Load & Navigation

- [ ] ROL-015: Choosing Administration → Authorization → User roles in the header menu opens
  `/administration/user-roles/` and the roles grid is visible with at least one data row (high)
  `[REQ-ROL-001]`

## View Settings & Reload

- [ ] ROL-016: Sorting by Name (ascending) without clicking Save View Setting, then reloading the
  page, restores the default (ID-ascending) order with no sort indicator on the Name header (low)
  `[REQ-ROL-017]`

## Security & Auth

- [ ] ROL-017: Opening `/administration/user-roles/` in a browser with no valid session redirects
  to `/login/` and renders no role data (critical) `[REQ-ROL-002]` @smoke

## Accessibility

- [ ] ROL-018: Each toolbar button's accessible name matches its visible tooltip — Create, Reload
  Data, Save View Setting, Reset View Setting to Default, Export, Column Chooser — not the machine
  ids (`add`, `refresh`, `dropdownbutton`) currently observed (D4) (medium) `[REQ-ROL-043]`
- [ ] ROL-019: Each Is production checkbox in a data row has a non-empty accessible name that
  includes "Is production"; currently observed as empty (D4) (medium) `[REQ-ROL-044]`

## Deferred — do not implement

- [ ] ROL-020: Create role (inline new row, fill Name, toggle Is production, Save) — mutating write;
  inline-editor locators not yet captured; defer to a future `/analyze-page` → `/sdk-builder` →
  `/test-write` pass (n/a) `[REQ-ROL-021, REQ-ROL-022]`
- [ ] ROL-021: Edit role (open Edit inline, change Name / Is production, Save) — mutating write on a
  throwaway role; same deferral as ROL-020 (n/a) `[REQ-ROL-031, REQ-ROL-032, REQ-ROL-033]`
- [ ] ROL-022: Cancel new row / cancel edit — requires entering edit mode; defer with ROL-020/021
  (n/a) `[REQ-ROL-023, REQ-ROL-034]`
- [ ] ROL-023: Name validation — empty, whitespace-only, duplicate, max-length — all require mutating
  writes; deferred (n/a) `[REQ-ROL-024, REQ-ROL-025, REQ-ROL-026, REQ-ROL-027]`
- [ ] ROL-024: Delete role — violates CLAUDE.md guardrail: **NEVER delete roles / user accounts**
  (n/a) `[REQ-ROL-036, REQ-ROL-037, REQ-ROL-038]`
- [ ] ROL-025: Save View Setting persistence (save sort, reload, verify sort persists) — mutates the
  shared admin user's view state; needs a dedicated test account to avoid cross-test pollution;
  deferred (n/a) `[REQ-ROL-018]`
- [ ] ROL-026: Permissions — non-Administrator / non-PlatformAdministrator user sees redirect or
  read-only grid — no lower-privileged test account currently available; deferred (n/a)
  `[REQ-ROL-004, REQ-ROL-005]`
- [ ] ROL-027: Export file contents (PDF, Excel) — requires downloading and inspecting a binary file;
  deferred (n/a) `[REQ-ROL-020]`
- [ ] ROL-028: Concurrent edit of the same role by two admins — requires two simultaneous browser
  sessions; infrastructure gap; deferred (n/a) `[REQ-ROL-042]`
