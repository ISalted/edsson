# User Roles — Requirements

**Source(s):** derived: live app `/administration/user-roles/` observed read-only via Playwright MCP (2026-10-09), logged in [RESEARCH.md](RESEARCH.md). Also: the page bundle `pages/administration/user-roles-*.js` (read as static text), the `userroles/*` API responses, `lib/pages/user-accounts.page.ts` (Role dropdown), and domain norms. Stakeholder input (Danylo Chumak, chat, 2026-10-09): "Is production" marks a **delivery/billable** role. No written spec exists.
**Scope:** the User roles page (Administration → Authorization → User roles): access control, the roles grid (display, sort, filter, paging, view settings, export), inline create / edit / delete of a role, Name validation, and how roles are used by User Accounts.
**Out of scope:** the permission matrix (permissions are attached to users and groups, not to roles on this page), the User Accounts Role dropdown UI itself (covered in `user-accounts`), export file layout and styling, grouping by drag-and-drop (a generic DevExtreme feature that this page doesn't configure specifically).

**Status legend:** `clear` = unambiguous & confirmed · `assumed` = filled by a flagged
assumption (validate before test-design) · `derived` = inferred from the app/domain, not
confirmed by the business (Source B — validate before relying on it) · `needs-clarification`
= blocked on an open question.

**Standard:** audited against ISO/IEC/IEEE 29148 (Necessary, Unambiguous, Complete,
Singular, Consistent, Feasible, Verifiable + set-level completeness/consistency/non-redundancy).

**Area code:** `ROL` (downstream checklist focus code `ROL-NNN`).

---

## Access & navigation

### REQ-ROL-001 — Administration → Authorization → User roles must open the User roles page.
- **Type:** functional
- **Priority:** high
- **Acceptance criteria:**
  - Given an authorised admin on any page, When they choose Administration → Authorization → User roles in the header menu, Then the URL is `/administration/user-roles/` and the breadcrumb reads `Administration > Authorization > User roles`.
  - Then the roles grid is visible.
- **Source:** derived (observed): RESEARCH § Structure.
- **Status:** derived

### REQ-ROL-002 — An unauthenticated visitor must not be able to view the User roles page.
- **Type:** security
- **Priority:** critical
- **Acceptance criteria:**
  - Given no valid session, When the visitor opens `/administration/user-roles/` directly, Then they are redirected to `/login/` and no role names are rendered.
- **Source:** derived. Observed on the sibling route `/administration/user-accounts/`, not yet on this one (RESEARCH § Not covered). Standards oracle.
- **Status:** derived

### REQ-ROL-003 — The user-roles API must reject unauthenticated requests.
- **Type:** security
- **Priority:** critical
- **Acceptance criteria:**
  - Given no `Authorization` header, When `POST …/administration/userroles/GetEntities` is called, Then the response is HTTP 401 and contains no role data.
  - The same holds for the role create, update and delete endpoints.
- **Source:** derived (observed 401 on `GetEntities`): RESEARCH § Interfaces. Write endpoints are inferred.
- **Status:** derived

### REQ-ROL-004 — Only users with the Administrator or PlatformAdministrator permission may view the User roles page.
- **Type:** permissions
- **Priority:** critical
- **Acceptance criteria:**
  - Given a signed-in user with neither Administrator nor PlatformAdministrator, When they open `/administration/user-roles/`, Then no role data is shown (access is denied or they are redirected; see Q5), and `GetEntities` called with their token returns no role data.
  - Given a user with either permission, When they open the page, Then the grid lists the roles.
- **Source:** derived. Client log `required: [Administrator, PlatformAdministrator]` (RESEARCH § Client logic). The denial UX was not observed.
- **Status:** derived

### REQ-ROL-005 — Only users with the Administrator permission may create, edit or delete roles.
- **Type:** permissions
- **Priority:** high
- **Acceptance criteria:**
  - Given a user with PlatformAdministrator but **not** Administrator, When they open the page, Then the Create button and the per-row Edit and Delete actions are not available, and the grid is read-only.
  - Given a user with Administrator, Then Create, Edit and Delete are available.
- **Source:** derived. Bundle sets `isAllowCreate/Edit/Delete = hasPermissionAtLeastOne([Administrator])` (RESEARCH § Client logic). Business intent unconfirmed (V1).
- **Status:** derived

### REQ-ROL-006 — The server must enforce the role-management permission independently of the UI.
- **Type:** security
- **Priority:** critical
- **Acceptance criteria:**
  - Given a token for a user without Administrator, When they call the role create, update or delete API directly, Then the request is rejected (401/403 or `IsSuccess: false`) and the data is unchanged after a reload.
- **Source:** implicit. Domain norm: a control hidden in the client isn't a security boundary. Not observed.
- **Status:** derived

## Grid display

### REQ-ROL-007 — The grid must list every stored role with its Name and Is production value.
- **Type:** functional
- **Priority:** critical
- **Acceptance criteria:**
  - Given N roles stored server-side, When the page loads, Then the pager reports `(N items)` and each role appears once with its Name text and Is production value matching the API (`GetEntities` `DataSource`).
- **Source:** derived (observed: 8 roles, 2 visible columns): RESEARCH § Structure, § Data.
- **Status:** derived

### REQ-ROL-008 — Outside edit mode, Is production must show as a checkbox that is checked exactly when the role's flag is true, and the checkbox can't be changed there.
- **Type:** functional
- **Priority:** medium
- **Acceptance criteria:**
  - Given a role with `IsProduction = true`, Then its checkbox is checked. Given `false`, Then it is unchecked.
  - When the user clicks a checkbox in a row that isn't being edited, Then its state doesn't change and no save request is sent.
- **Source:** derived (observed): RESEARCH § Data.
- **Status:** derived

### REQ-ROL-009 — The grid must load in a deterministic default order.
- **Type:** functional
- **Priority:** low
- **Acceptance criteria:**
  - Given no saved view setting, When the page is loaded twice, Then the row order is identical both times. Today that order is ascending creation/ID order.
- **Source:** derived (observed ID order): RESEARCH § Data. Whether alphabetical order is intended instead is Q7.
- **Status:** derived

### REQ-ROL-010 — The grid must page its rows with selectable page sizes 5, 10, 15, 25, 50 and 100, defaulting to 15.
- **Type:** functional
- **Priority:** medium
- **Acceptance criteria:**
  - Given 8 roles, When the page loads, Then page size 15 is selected and the info text reads `Page 1 of 1 (8 items)`.
  - When page size 5 is chosen, Then 5 rows are shown and the info text reads `Page 1 of 2 (8 items)`. Page 2 shows the remaining 3.
- **Source:** derived (observed) + metadata `RowCountOnPage: 15`: RESEARCH § Function — read paths.
- **Status:** derived

### REQ-ROL-011 — When no role matches the active filters, the grid must show an explicit empty state.
- **Type:** functional
- **Priority:** low
- **Acceptance criteria:**
  - Given a Name filter that matches nothing (e.g. `zzzz`), Then the grid shows `No data` and zero data rows.
- **Source:** derived (observed): RESEARCH § Function — read paths.
- **Status:** derived

## Sorting & filtering

### REQ-ROL-012 — Clicking the Name header must sort roles alphabetically, toggling between ascending and descending.
- **Type:** functional
- **Priority:** medium
- **Acceptance criteria:**
  - When Name is clicked once, Then rows are in case-insensitive ascending order and the header shows `aria-sort="ascending"`.
  - When it is clicked again, Then the order is reversed and the header shows `aria-sort="descending"`.
- **Source:** derived (observed): RESEARCH § Function — read paths.
- **Status:** derived

### REQ-ROL-013 — The Name filter must default to a case-insensitive "Contains" match.
- **Type:** functional
- **Priority:** high
- **Acceptance criteria:**
  - When `man` is typed in the Name filter cell, Then only roles whose Name contains "man" in any case remain (today: Project manager, HR manager).
  - When `MAN` is typed, Then the result is identical.
  - When the filter is cleared, Then all roles are shown again.
- **Source:** derived (observed): RESEARCH § Function — read paths.
- **Status:** derived

### REQ-ROL-014 — The Name filter must offer the operations Contains, Does not contain, Starts with, Ends with, Equals and Does not equal, plus Reset, and each must filter by its own semantics.
- **Type:** functional
- **Priority:** medium
- **Acceptance criteria:**
  - When the filter menu is opened, Then exactly those six operations and Reset are listed.
  - For each operation, the remaining rows are exactly the roles that satisfy it against the typed value. For example, Starts with `Te` → Tester and Test docs. writer; Equals `Tester` → Tester only.
  - When Reset is chosen, Then the operation returns to Contains and all rows are shown.
- **Source:** derived (menu observed; individual operations not exercised): RESEARCH § Function — read paths.
- **Status:** derived

### REQ-ROL-015 — The Is production filter must offer (all), true and false, and filter rows by the flag.
- **Type:** functional
- **Priority:** medium
- **Acceptance criteria:**
  - When `true` is chosen, Then only roles with Is production checked remain. When `false` is chosen, only unchecked roles remain. When `(all)` is chosen, every role is shown.
- **Source:** derived (observed 6 / 2 / 8): RESEARCH § Function — read paths.
- **Status:** derived

### REQ-ROL-016 — Filter input must be treated as literal text.
- **Type:** security
- **Priority:** high
- **Acceptance criteria:**
  - When `<script>alert(1)</script>` or `' OR 1=1 --` is typed in the Name filter, Then no script runs, no error is shown, and the grid shows only literal matches (normally `No data`).
- **Source:** derived (observed for `<script>`): RESEARCH § Function — read paths. Standards oracle.
- **Status:** derived

## View settings, reload & export

### REQ-ROL-017 — Unsaved sort and filter changes must not persist across a page reload.
- **Type:** persistence
- **Priority:** low
- **Acceptance criteria:**
  - Given the user sorted by Name without clicking Save View Setting, When the page is reloaded, Then the default order (REQ-ROL-009) is restored and no sort indicator is shown.
- **Source:** derived (observed): RESEARCH § Function — read paths.
- **Status:** derived

### REQ-ROL-018 — Save View Setting must persist the current grid layout (sort, filter, column visibility) for the current user, and Reset View Setting to Default must restore the default layout.
- **Type:** persistence
- **Priority:** low
- **Acceptance criteria:**
  - Given the user sorted Name descending and clicked Save View Setting, When the page is reloaded, Then Name is still sorted descending.
  - When Reset View Setting to Default is clicked and the page is reloaded, Then the default order and columns are restored.
  - Given another user opens the page, Then they don't see the first user's saved layout (scope assumed per user; see A3).
- **Source:** derived. Buttons observed and the bundle sets `isAllowViewSettingSave/Reset: true`. Not exercised, because saving is a write.
- **Status:** assumed

### REQ-ROL-019 — Reload Data must refresh the grid from the server.
- **Type:** functional
- **Priority:** low
- **Acceptance criteria:**
  - Given a role was added or renamed by another session after this page loaded, When Reload Data is clicked, Then the grid shows the current server state without a full page reload.
- **Source:** derived (button observed; behaviour is a domain norm).
- **Status:** derived

### REQ-ROL-020 — Export must offer "Export all data to Excel" and "Export all data to PDF", and each export must contain every role, not only the current page.
- **Type:** functional
- **Priority:** low
- **Acceptance criteria:**
  - When Export → Excel is chosen with page size 5, Then a spreadsheet downloads whose rows equal all N roles, with Name and Is production columns.
  - When Export → PDF is chosen, Then a PDF downloads containing all N roles.
- **Source:** derived (menu text "Export **all** data …" observed; files not downloaded): RESEARCH § Function — read paths. Claims oracle.
- **Status:** derived

## Create a role

### REQ-ROL-021 — Create must add an inline new-role row with an empty Name, Is production unchecked, and Save / Cancel actions.
- **Type:** functional
- **Priority:** high
- **Acceptance criteria:**
  - Given an Administrator, When Create is clicked, Then a new editable row appears with an empty Name input focused, Is production unchecked, and Save and Cancel actions.
  - While that row is being edited, Export is disabled.
- **Source:** derived (observed): RESEARCH § Function — write paths. Bundle `onInitNewRow`.
- **Status:** derived

### REQ-ROL-022 — Saving a new role with a valid Name must persist it.
- **Type:** persistence
- **Priority:** critical
- **Acceptance criteria:**
  - Given a new row with Name `AQA role <stamp>` and Is production checked, When Save is clicked, Then the row leaves edit mode, the item count goes up by 1, and after a page reload the role is listed with Is production checked.
- **Source:** implicit (create implies persistence) + derived (insert payload in bundle). Not exercised.
- **Status:** derived

### REQ-ROL-023 — Cancelling a new role must discard it without persisting anything.
- **Type:** functional
- **Priority:** medium
- **Acceptance criteria:**
  - Given a new row with a Name typed, When Cancel is clicked, Then the row disappears, the item count is unchanged, no create request is sent, and the role is absent after a reload.
- **Source:** derived (observed, empty row; no request sent): RESEARCH § Function — write paths.
- **Status:** derived

## Role Name validation (create and edit)

### REQ-ROL-024 — A role Name is required: saving with an empty Name must be rejected.
- **Type:** validation
- **Priority:** high
- **Acceptance criteria:**
  - Given a new or edited row with an empty Name, When Save is clicked, Then the save is refused, a visible message identifies Name as required, the row stays in edit mode, and nothing is persisted (count unchanged after reload).
- **Source:** derived. Metadata `Name.IsRequired: true`. The editor has no client validator, so enforcement must be server-side or is missing (D2).
- **Status:** derived

### REQ-ROL-025 — A Name that consists only of whitespace must be rejected like an empty Name.
- **Type:** validation
- **Priority:** medium
- **Acceptance criteria:**
  - Given Name `"   "`, When Save is clicked, Then the outcome is identical to REQ-ROL-024.
- **Source:** assumed. A whitespace-only name is semantically empty (A1).
- **Status:** assumed

### REQ-ROL-026 — Role Names must be unique (comparison rule TBD).
- **Type:** validation
- **Priority:** high
- **Acceptance criteria:**
  - Given a role `Tester` exists, When a new role is saved as `Tester` (and, depending on Q2, as `tester` or ` Tester `), Then the save is refused with a uniqueness message and no duplicate is persisted.
- **Source:** implicit. Duplicate role names would make the User Accounts Role dropdown ambiguous. The rule isn't confirmed (Q2).
- **Status:** needs-clarification

### REQ-ROL-027 — Role Name length must be bounded by a defined maximum.
- **Type:** validation
- **Priority:** medium
- **Acceptance criteria:**
  - Given the maximum is M characters (Q3), When a Name of exactly M characters is saved, Then it is persisted intact. When a Name of M+1 characters is entered, Then the input prevents it or the save is refused with a length message, and no truncated value is silently stored.
- **Source:** implicit. The editor has no `maxlength`, and the column limit is unknown (Q3).
- **Status:** needs-clarification

### REQ-ROL-028 — Leading and trailing whitespace in a Name must be handled consistently (trim rule TBD).
- **Type:** validation
- **Priority:** low
- **Acceptance criteria:**
  - Given Name `"  Analyst  "`, When saved, Then the stored and displayed Name follows the confirmed rule (Q4), either `Analyst` or rejected, and is identical after reload.
- **Source:** implicit. Not observable without a write (Q4).
- **Status:** needs-clarification

### REQ-ROL-029 — Special characters and markup in a Name must be stored and displayed literally.
- **Type:** security
- **Priority:** high
- **Acceptance criteria:**
  - Given Name `<img src=x onerror=alert(1)> & "QA" 'ü'`, When saved and the page is reloaded, Then the grid shows exactly that text, no script runs, and no layout breaks.
- **Source:** derived. Standards/security domain norm; `Name` is a free-text string.
- **Status:** derived

### REQ-ROL-030 — Server-side rejection of a save must be shown to the user and keep the row editable.
- **Type:** error-handling
- **Priority:** high
- **Acceptance criteria:**
  - Given the server answers a create or update with `IsSuccess: false` and a `Message`, Then that message is shown to the user, the row stays in edit mode with the user's input intact, and the grid doesn't show the change as saved.
  - Given a network/5xx failure, Then an error message is shown and no phantom row remains after reload.
- **Source:** derived. Bundle `onRowSaving` cancels and calls `showError(Message)` (RESEARCH § Client logic).
- **Status:** derived

## Edit a role

### REQ-ROL-031 — Edit must turn the row into an inline editor prefilled with the role's current values.
- **Type:** functional
- **Priority:** high
- **Acceptance criteria:**
  - Given role `HR manager` (Is production unchecked), When its Edit action is clicked, Then the Name input shows `HR manager`, the Is production checkbox is editable and unchecked, and the row actions are Save and Cancel.
- **Source:** derived (observed): RESEARCH § Function — write paths.
- **Status:** derived

### REQ-ROL-032 — Saving a changed Name must persist the rename.
- **Type:** persistence
- **Priority:** critical
- **Acceptance criteria:**
  - Given a throwaway role `AQA role <stamp>`, When its Name is changed to `AQA role <stamp> EDITED` and saved, Then the grid shows the new Name, and after a reload the new Name is listed and the old one is not. The item count is unchanged.
- **Source:** implicit (edit implies persistence) + derived (update payload in bundle).
- **Status:** derived

### REQ-ROL-033 — Saving a toggled Is production must persist the flag.
- **Type:** persistence
- **Priority:** high
- **Acceptance criteria:**
  - Given a throwaway role with Is production unchecked, When it is checked and saved, Then after a reload the role's checkbox is checked and the `true` filter includes it. The reverse holds when unchecking.
- **Source:** implicit + derived (bundle maps `IsProduction` on update).
- **Status:** derived

### REQ-ROL-034 — Cancelling an edit must restore the original values without persisting anything.
- **Type:** functional
- **Priority:** medium
- **Acceptance criteria:**
  - Given a row in edit mode with its Name and flag changed, When Cancel is clicked, Then the row shows its original values, no update request is sent, and after a reload the values are unchanged.
- **Source:** derived (observed, unchanged values; no request): RESEARCH § Function — write paths.
- **Status:** derived

### REQ-ROL-035 — A renamed role must keep its assignments: users who held it still hold it under the new Name.
- **Type:** persistence
- **Priority:** high
- **Acceptance criteria:**
  - Given user U (throwaway `aqa.*`) has role R, When R is renamed to R', Then U's Role shows R' in User Accounts and the Role dropdown lists R' and no longer lists R.
- **Source:** implicit. Data integrity: roles are referenced by ID (`ComplexID.Object_id`). Cross-page.
- **Status:** derived

## Delete a role

### REQ-ROL-036 — Delete must ask for confirmation before removing a role.
- **Type:** functional
- **Priority:** high
- **Acceptance criteria:**
  - When a row's Delete action is clicked, Then a confirmation prompt appears before any delete request is sent.
  - When the prompt is dismissed or cancelled, Then the role remains and no request was sent.
- **Source:** derived. Standards oracle: a destructive action needs confirmation. **Not observed** (Delete wasn't clicked).
- **Status:** derived

### REQ-ROL-037 — A confirmed delete of a role that isn't in use must remove it.
- **Type:** persistence
- **Priority:** medium
- **Acceptance criteria:**
  - Given a throwaway role assigned to no user, When it is deleted and the deletion confirmed, Then the grid reloads without it, the item count drops by 1, and it is absent after a page reload and from the User Accounts Role dropdown.
- **Source:** derived. Bundle: delete then reload (RESEARCH § Client logic).
- **Status:** derived

### REQ-ROL-038 — Deleting a role that is assigned to users must follow a defined rule (block or reassign; TBD).
- **Type:** persistence
- **Priority:** critical
- **Acceptance criteria:**
  - Given role R is assigned to at least one user, When R is deleted, Then the outcome matches the confirmed rule (Q1). If blocked: a message explains R is in use, R remains, and the users are unchanged. In every case, no user is left referencing a role that no longer exists.
- **Source:** implicit. Data integrity. All rows report `ReadOnly: false` and Delete is offered on every row (D3). Business rule unknown.
- **Status:** needs-clarification

### REQ-ROL-039 — A server-side delete failure must be shown to the user and the role must remain.
- **Type:** error-handling
- **Priority:** medium
- **Acceptance criteria:**
  - Given the server answers a delete with `IsSuccess: false` and a `Message`, Then that message is shown, the row is still listed, and it is still present after a reload.
- **Source:** derived. Bundle sets `cancel = true` and calls `showError(Message)` on delete failure.
- **Status:** derived

## Business semantics & cross-page use

### REQ-ROL-040 — The Is production flag must mark a role as a delivery/billable role.
- **Type:** functional
- **Priority:** high
- **Acceptance criteria:**
  - Given a role with Is production checked, Then it is treated as a delivery/billable role wherever roles are used for project staffing or billing.
  - Given a role with Is production unchecked (e.g. HR manager, System administrator), Then it is treated as back-office and isn't offered where only billable roles apply.
  - The concrete screens and the observable effect still need to be named (Q6). Until then only the stored flag value is verifiable (REQ-ROL-033).
- **Source:** stakeholder (Danylo Chumak, chat, 2026-10-09) for the meaning. The downstream effect is assumed (A2).
- **Status:** assumed

### REQ-ROL-041 — The User Accounts Role selector must list exactly the roles defined on this page.
- **Type:** functional
- **Priority:** high
- **Acceptance criteria:**
  - Given the User roles grid lists N roles, When the Role dropdown in the User Accounts create/edit form is opened, Then it offers exactly those N role Names.
  - When a role is created here, Then it appears in that dropdown after reload. When a role is deleted here, Then it disappears from the dropdown.
- **Source:** derived. `user-accounts.page.ts` `selectInForm("Role", …)` + domain norm. Not verified live.
- **Status:** derived

## Concurrency

### REQ-ROL-042 — Concurrent edits of the same role must not silently lose data (rule TBD).
- **Type:** persistence
- **Priority:** low
- **Acceptance criteria:**
  - Given admins A and B both open role R in edit mode, When A saves and then B saves a different Name, Then the outcome matches the confirmed rule (Q8): either B is warned about a conflict, or last-write-wins is documented and the final stored Name is B's.
- **Source:** implicit. The update payload merges a client-side snapshot (`{...existingRow, ...changes}`), which suggests last-write-wins. Not observed.
- **Status:** needs-clarification

## Accessibility & consistency

### REQ-ROL-043 — Grid toolbar buttons must expose accessible names that describe their action.
- **Type:** a11y
- **Priority:** medium
- **Acceptance criteria:**
  - The toolbar buttons expose accessible names equivalent to their visible tooltips: `Create`, `Reload Data`, `Save View Setting`, `Reset View Setting to Default`, `Export`, `Column Chooser`. Machine ids such as `add`, `save-view-settings` or `dropdownbutton` don't qualify.
- **Source:** derived. WCAG 2.2 SC 4.1.2. **Observed failing** (D4).
- **Status:** derived

### REQ-ROL-044 — Each Is production checkbox must have an accessible name that identifies it.
- **Type:** a11y
- **Priority:** medium
- **Acceptance criteria:**
  - For each row, the Is production checkbox's accessible name includes "Is production" (and ideally the role Name), e.g. `Is production — Tester`. Its checked state is exposed.
- **Source:** derived. WCAG 2.2 SC 4.1.2 / 1.3.1. **Observed:** the name is empty (D4).
- **Status:** derived

### REQ-ROL-045 — The page heading and title must match the navigation label.
- **Type:** functional
- **Priority:** low
- **Acceptance criteria:**
  - The `<h*>` heading and the document title name the page consistently with the menu and breadcrumb ("User roles"), e.g. title `Edsson Elements: User roles`.
- **Source:** derived. Product-consistency oracle. **Observed:** "User Role" vs "User roles" (D1).
- **Status:** derived

## Open questions & assumptions

**Open questions (blocking — answer before /test-design):**
- Q1 (REQ-ROL-038): What happens when a role that is assigned to users is deleted? Options: (a) blocked with an "in use" message, (b) the users are cleared to "no role", (c) a reassignment prompt. This is the highest-risk unknown, since today every row is deletable.
- Q2 (REQ-ROL-026): Must role Names be unique? If so, is the comparison case-insensitive (`Tester` = `tester`) and whitespace-insensitive?
- Q3 (REQ-ROL-027): What is the maximum Name length? Is there a DB column limit on `WP_UserRole.Name`?
- Q4 (REQ-ROL-028): Should leading/trailing spaces in a Name be trimmed or rejected?
- Q5 (REQ-ROL-004): What should a user without Administrator/PlatformAdministrator see on `/administration/user-roles/`: a redirect, a 403 page, or a hidden menu item?
- Q6 (REQ-ROL-040): Where does "Is production" take effect? Which screens offer only production roles (project staffing, resource rates, billing)? Without this, REQ-ROL-040 can only check the stored flag.
- Q7 (REQ-ROL-009): Is ID/creation order the intended default, or should roles be sorted alphabetically by Name?
- Q8 (REQ-ROL-042): For concurrent edits, is last-write-wins acceptable or is conflict detection expected?

**Suspected defects (Source B — observed behaviour conflicts with a consistency oracle):**
- D1 (REQ-ROL-045): Heading and title say "User Role", while the menu and breadcrumb say "User roles". Fails the product-consistency oracle (cosmetic).
- D2 (REQ-ROL-024, -027): `Name` is flagged `IsRequired: true` in the grid metadata, but the inline editor has no required validator and no `maxlength`. Empty or oversized Names reach the server unchecked. Server-side enforcement is unverified (it would need a write).
- D3 (REQ-ROL-038): All 8 roles come back `ReadOnly: false`, and Delete is offered on each, including roles likely assigned to users. Risk of orphaned role references. Fails the Purpose and User oracles.
- D4 (REQ-ROL-043, -044): Toolbar buttons expose machine names (`add`, `save-view-settings`, `dropdownbutton`), and the Is production checkboxes have empty accessible names. Fails WCAG 4.1.2.
- D5 (no REQ, environment): The toolbar icons `/images/save-view-settings.svg` and `/images/default-view-settings.svg` failed with `ERR_NAME_NOT_RESOLVED` once. Possibly transient; re-check before raising.

**Assumptions (flagged — validate):**
- A1 (REQ-ROL-025): A whitespace-only Name counts as empty. If wrong, roles named `"   "` would be legitimate, and REQ-ROL-025 should be dropped.
- A2 (REQ-ROL-040): The delivery/billable meaning (confirmed by you) translates into filtering of roles on staffing/billing screens. If the flag is informational only, REQ-ROL-040 shrinks to "flag is stored and shown".
- A3 (REQ-ROL-018): Saved view settings are scoped per user, not global. If they are global, one admin's layout would change everyone's grid, and the third criterion inverts.

**Derived requirements to validate with the business (Source B — load-bearing):**
- V1 (REQ-ROL-005): Only **Administrator** may create, edit or delete roles. PlatformAdministrator-only users get a read-only grid. Taken from client code. If PlatformAdministrator should also manage roles, this is a defect instead.
- V2 (REQ-ROL-004): Page access is limited to Administrator or PlatformAdministrator. Every permissions test relies on this.
- V3 (REQ-ROL-036): Delete asks for confirmation. This was not observed, so it is a domain-norm expectation.
- V4 (REQ-ROL-041): The User Accounts Role selector is fed from this page's roles (single source of truth).
- V5 (REQ-ROL-035): Renaming keeps assignments, because references are by ID and not by name.

## Traceability

| REQ-ID | Source | Status |
|--------|--------|--------|
| REQ-ROL-001 | derived (observed nav + breadcrumb) | derived |
| REQ-ROL-002 | derived (sibling route redirect + standards) | derived |
| REQ-ROL-003 | derived (observed 401 on GetEntities) | derived |
| REQ-ROL-004 | derived (client permission log) | derived |
| REQ-ROL-005 | derived (bundle `isAllow*` gating) | derived |
| REQ-ROL-006 | implicit (server-side authz norm) | derived |
| REQ-ROL-007 | derived (observed grid + API) | derived |
| REQ-ROL-008 | derived (observed) | derived |
| REQ-ROL-009 | derived (observed ID order) | derived |
| REQ-ROL-010 | derived (observed pager + metadata) | derived |
| REQ-ROL-011 | derived (observed "No data") | derived |
| REQ-ROL-012 | derived (observed sort) | derived |
| REQ-ROL-013 | derived (observed filter) | derived |
| REQ-ROL-014 | derived (observed filter menu) | derived |
| REQ-ROL-015 | derived (observed Is production filter) | derived |
| REQ-ROL-016 | derived (observed literal handling) | derived |
| REQ-ROL-017 | derived (observed reset on reload) | derived |
| REQ-ROL-018 | derived (buttons + bundle flags), scope assumed | assumed |
| REQ-ROL-019 | derived (button + domain norm) | derived |
| REQ-ROL-020 | derived (menu text "Export all data") | derived |
| REQ-ROL-021 | derived (observed inline create row) | derived |
| REQ-ROL-022 | implicit (create ⇒ persist) + bundle | derived |
| REQ-ROL-023 | derived (observed cancel) | derived |
| REQ-ROL-024 | derived (metadata IsRequired) | derived |
| REQ-ROL-025 | assumed (A1) | assumed |
| REQ-ROL-026 | implicit (Q2) | needs-clarification |
| REQ-ROL-027 | implicit (Q3) | needs-clarification |
| REQ-ROL-028 | implicit (Q4) | needs-clarification |
| REQ-ROL-029 | derived (security norm) | derived |
| REQ-ROL-030 | derived (bundle error handling) | derived |
| REQ-ROL-031 | derived (observed inline edit) | derived |
| REQ-ROL-032 | implicit (edit ⇒ persist) + bundle | derived |
| REQ-ROL-033 | implicit (edit ⇒ persist) + bundle | derived |
| REQ-ROL-034 | derived (observed cancel) | derived |
| REQ-ROL-035 | implicit (referential integrity) | derived |
| REQ-ROL-036 | derived (standards norm; not observed) | derived |
| REQ-ROL-037 | derived (bundle delete → reload) | derived |
| REQ-ROL-038 | implicit (Q1, D3) | needs-clarification |
| REQ-ROL-039 | derived (bundle error handling) | derived |
| REQ-ROL-040 | stakeholder (meaning) + assumed (effect, A2) | assumed |
| REQ-ROL-041 | derived (user-accounts Role field) | derived |
| REQ-ROL-042 | implicit (Q8) | needs-clarification |
| REQ-ROL-043 | derived (WCAG 4.1.2; D4) | derived |
| REQ-ROL-044 | derived (WCAG 4.1.2; D4) | derived |
| REQ-ROL-045 | derived (consistency oracle; D1) | derived |
