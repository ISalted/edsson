# User Roles — Research

**Page:** Administration → Authorization → User roles · **URL:** `/administration/user-roles/` · **Observed:** 2026-10-09 · **Mode:** read-only (Playwright MCP, saved admin session; no Save / Delete / Save View Setting clicked)

**Session used:** account with permissions `["Administrator", "PlatformAdministrator"]` (from `userroles/GetActualUserPermissions`). No lower-privileged account was available.

## Observed behaviour

### Structure
- Nav link `User roles` → `href="/administration/user-roles"`; the app lands on `/administration/user-roles/` (trailing slash).
- Breadcrumb: `Administration > Authorization > User roles`. Page heading and `<title>`: **"User Role"** (singular, capital R) — `Edsson Elements: User Role`.
- Single DevExtreme data grid (`id=gridUserRoleCtrl`), accessible name "Data grid with 8 rows and 2 columns". No detail panel / tabs under the grid (unlike User Accounts). No "View configuration" selector (`isAllowViewConfigurations: false`).
- Visible columns: **Name** (string), **Is production** (boolean, rendered as a read-only checkbox, width 115). Hidden key column `ID`.
- Grid metadata (`GetEntities` → `ViewAttributes`): `Name.IsRequired = true`, `IsProduction.IsRequired = false`, `RowCountOnPage = 15`, table `WP_UserRole`.
- Toolbar (left → right): group panel "Drag a column header here to group by that column"; **Create** (`aria-label="add"`, title "Create"); **Reload Data** (`refresh`); **Save View Setting** (`save-view-settings`); **Reset View Setting to Default** (`default-view-settings`); **Export** dropdown (`dropdownbutton`); **Column Chooser**.
- Per-row action column: **Edit** (pencil) and **Delete** (trash) links. No selection checkboxes, no multi-delete (`isAllowMultiDelete: false`), no copy (`isAllowCopy: false`).
- Pager: page sizes `5 / 10 / 15 / 25 / 50 / 100`, default **15** selected; info text `Page 1 of 1 (8 items)`.

### Data (dev, 2026-10-09)
| ID | Name | Is production |
|----|------|---------------|
| 3 | Business analyst | true |
| 4 | Developer | true |
| 5 | Tester | true |
| 6 | Test docs. writer | true |
| 7 | Project manager | true |
| 8 | Release engineer | true |
| 9 | System administrator | false |
| 10 | HR manager | false |

- Default order = ascending `ID` (not alphabetical); no column shows a sort indicator on load (`aria-sort="none"`).
- Every row returned with `ReadOnly: false`, `ReadOnlyMessage: null` — no role is protected from editing at the data level.

### Function — read paths (exercised)
- **Sort:** clicking the Name header toggles ascending → descending (`aria-sort` updates); order is alphabetical, case-insensitive. Sort is client-side (no network call).
- **Filter Name:** filter row text box, default operation **Contains**; operations menu offers `Contains, Does not contain, Starts with, Ends with, Equals, Does not equal, Reset`. `man` → Project manager, HR manager; `MAN` → same (case-insensitive). `zzzz` → empty grid with text **"No data"**. `<script>` → "No data", treated as literal text (no script execution, no error). Clearing restores all 8 rows. Client-side (no network call).
- **Filter Is production:** dropdown options `(all) / true / false` (raw boolean text). `true` → 6 rows, `false` → 2 rows, `(all)` → 8.
- **Paging:** page size 5 → 5 rows, `Page 1 of 2 (8 items)`.
- **Export** dropdown: `Export all data to PDF`, `Export all data to Excel` (not executed — would download a file).
- **Reload after sorting:** sort is reset to default (ID order); view state is not persisted unless "Save View Setting" is clicked (not clicked). The Save View Setting button shows a highlighted "dirty" marker after the sort change.

### Function — write paths (opened and CANCELLED only; no save)
- **Create:** clicking Create adds an **inline new row at the bottom** of the grid (`entityEditorMode: "InlineEditing"`), Name input focused & empty, Is production unchecked, row actions become **Save** / **Cancel**. Export is disabled while the row is being edited. Cancel removes the row; no request sent.
- **New-row input:** plain `<input type=text>`, **no `maxlength`, no `aria-required`, no DevExtreme validator** attached — no client-side required/length validation observed.
- **Edit:** clicking Edit on "HR manager" turns that row into an inline editor: Name prefilled `HR manager`, Is production checkbox editable, actions Save / Cancel. Cancel restored the row unchanged; no request sent.
- **Delete:** not clicked (would be a write; whether a confirmation dialog appears was **not observed**).

### Interfaces (API, read)
- Base `https://edsson-dev.azurewebsites.net/edssonsite/api/administration/userroles/`:
  - `GET GetActualUserPermissions` → `["Administrator","PlatformAdministrator"]`
  - `GET GetPermissionManagementPolicy` → `PlatformAdministratorManagedPermissions: [ManageCurrencies, ManageExchangeRates, ManagePayroll, ViewActs, ViewBudget, ViewPaymentRequests]`
  - `GET GetViewData?viewConfigurationName=` → `CurrentViewConfigurationName: "Default"`
  - `POST GetEntities` → metadata + 8 rows (above).
- Auth: `Authorization: Bearer <jwt>` + `x-session-id`. `POST GetEntities` **without** auth → **401** `"Authorization has been denied for this request."`
- Write endpoints are not visible as string literals in the page bundle (resolved through a shared client by `basePath = userRoles`); not called.

### Client logic (page bundle `pages/administration/user-roles-*.js`, read as static text)
- Create / Edit / Delete are enabled only if the current user has permission **`Administrator`** (`isAllowCreate = isAllowEdit = isAllowDelete = hasPermissionAtLeastOne([Administrator])`).
- Console log on page entry: `User has permission / required / users: true [Administrator] [Administrator, PlatformAdministrator]` → page access requires Administrator **or** PlatformAdministrator.
- New row defaults: `{ Name: "", IsProduction: false }`.
- Insert payload `{ IsNew: true, ID: 0, Name, IsProduction }`; update payload merges the existing row with changed fields.
- On save/delete the client relies on the server response: if `IsSuccess === false` the edit is cancelled and `Message` is shown in an error toast; no client-side validation step.
- Update of a row missing from the local data source → error "Unable to update: user role not found."
- After a successful delete the grid reloads from the server.

### Platform / a11y
- Is production cells: checkbox with **empty accessible name** (`checkbox ""`).
- Toolbar buttons expose machine-style accessible names (`add`, `refresh`, `save-view-settings`, `default-view-settings`, `dropdownbutton`) rather than their visible tooltip text (`Create`, `Reload Data`, …). Row actions are well-named (`Edit`, `Delete`).
- Console: two `net::ERR_NAME_NOT_RESOLVED` errors loading `/images/save-view-settings.svg` and `/images/default-view-settings.svg` (toolbar icons) — seen once, may be transient.

### Cross-page
- User Accounts create/edit form has a **Role** dropdown (`lib/pages/user-accounts.page.ts` `selectInForm("Role", …)`), i.e. roles defined here are consumed there. Not verified live in this session.

## Oracle checks

| Observation | Oracle | Verdict |
|-------------|--------|---------|
| Nav/breadcrumb say "User roles", heading/title say "User Role" | Product (internal consistency) / Claims | suspect — naming mismatch (cosmetic) |
| Name is `IsRequired: true` in metadata, but the editor has no required validator and no max length | Product (internal consistency) / Standards | suspect — empty or oversized Name may only be caught server-side, or not at all (not tested: would write) |
| Every role `ReadOnly: false`, Delete offered on every row | Purpose / User | suspect — deleting a role assigned to users could orphan accounts; business rule unknown |
| Page viewable by PlatformAdministrator, but CRUD gated on Administrator only | Product (cf. `PlatformAdministratorManagedPermissions` policy) | unclear — may be intended; needs business confirmation |
| Default order by ID, not alphabetical | User / Comparable | consistent enough — matches other Edsson grids; low risk |
| "Is production" filter shows raw `true` / `false` | Product (User Accounts grid uses checkbox filter `(all)` too) / User | minor — label wording; consistent with DevExtreme default |
| Filter is case-insensitive "contains", literal handling of `<script>` | Standards / Security | consistent |
| Unauthenticated API call → 401 | Standards (security) | consistent |
| Toolbar accessible names are technical ids, checkbox names empty | Standards (WCAG 4.1.2 Name, Role, Value) | suspect — a11y defect |
| Toolbar icon SVGs failed with DNS error | Product | possibly transient — re-check |
| No confirmation observed for Delete (not clicked) | Standards (destructive-action confirmation) | unknown — not observable read-only |

## Not covered / could not observe
- **All writes:** saving a new role, saving an edit, deleting a role, Save View Setting / Reset View Setting — so server-side validation (empty name, duplicate name, max length, whitespace), error messages, and delete confirmation / in-use protection are **unobserved**.
- **Roles other than Administrator + PlatformAdministrator:** could not check what a PlatformAdministrator-only or non-admin user sees (read-only grid? hidden nav item? redirect?).
- **Meaning and downstream effect of "Is production"** — not explained anywhere in the UI.
- **Where roles are consumed** beyond the User Accounts Role dropdown (projects, resources, rates…).
- **Unauthenticated UI access to `/administration/user-roles/`** — inferred from the sibling route (`/administration/user-accounts/` redirected to `/login/` before the session was injected), not checked on this route.
- Export file contents (PDF / Excel) — would download files.
- Concurrency (two admins editing the same role) and audit/history.
