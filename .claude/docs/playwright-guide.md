# Playwright MCP guide — analysing a page & building robust locators/POM

Shared knowledge pulled in by `/analyze-page`, `/sdk-builder` and `/test-write`. The **playwright** MCP drives a
**real browser locally** — for **analysing the app, deriving robust locators, and building/extending
Page Objects**, NOT the official run (that's CI → `git-ci-guide.md`). Garbage selectors → garbage
tests, so this is the most precision-sensitive work we do: derive from reality, verify, never guess.

## App access & auth
- BASE_URL: `https://edssonelements-dev-hvdhh7c5bggjc6br.westeurope-01.azurewebsites.net`
- Login page `/login/`; main page `/administration/user-accounts/`.
- Protected pages need auth. **Reuse the saved `session-storage.json`** (the suite's globalSetup
  produces it) or have the user log in manually in the headed browser. **Never type the admin password.**
- Dev app is on Azure → first navigation may be slow (cold start 20–40s); wait, don't thrash.

## Reliable extraction via MCP (avoid the flailing / wasted-selector trap)
A disciplined loop — do it once, correctly, instead of guessing and re-running:
1. `browser_navigate` to the page (auth via saved session).
2. `browser_snapshot` → the **accessibility tree** (roles + accessible names). This is the SOURCE
   of truth and maps **directly** to Playwright's `getByRole`/`getByText` — derive locators from it,
   don't invent CSS by guessing.
3. For anything the a11y tree doesn't expose (DevExtreme internals, hashed classes), use
   `browser_evaluate` to read the real DOM/attributes precisely — never assume a class name.
4. **VERIFY every candidate locator resolves to EXACTLY ONE element** (Playwright strict mode). If it
   matches 0 or >1, scope it (`.locator(container).getBy…`, `.filter({ hasText })`, `.first()` only with reason).
5. Only commit a locator once it's verified. Snapshot → derive → verify → record. No loops of trial-and-error.

## Locator philosophy — Playwright best practices (priority order)
Prefer **user-facing, resilient** locators; fall back only when forced. Top to bottom:
1. **`getByRole(role, { name })`** — primary. Resilient to DOM/CSS churn (button, checkbox, textbox,
   row, columnheader…). Use the accessible name from the snapshot.
2. **`getByLabel`** (form fields), **`getByPlaceholder`**, **`getByText`**, **`getByAltText`**, **`getByTitle`**.
3. **`getByTestId`** — if the app exposes test ids (this app largely does not).
4. **CSS** — only for structure the above can't address; prefer **stable** classes; scope tightly.
5. **XPath** — last resort; **never absolute XPath**, never `nth-child` position chains.
- **Banned:** position-based (`nth-child`), long brittle descendant chains, raw auto-generated/hashed
  classes (they change between builds), text that is localized/volatile.

## DevExtreme reality (reconcile the philosophy with this app)
DevExtreme + CSS-module styling means role/name often don't map cleanly — so:
- Use `getByRole` where the widget exposes proper ARIA (buttons, `aria-checked` checkboxes, `aria-sort`).
- Fall back to **stable structural `.dx-*` classes** for grid internals: `.dx-data-row`,
  `.dx-select-checkbox`, `.dx-texteditor-input`, `.dx-invalid`, `.dx-popup-wrapper`.
- Hashed CSS-module classes → **partial match on the stable prefix**: `[class*="UserAccountForm_formLabel"]`
  (the `_xxxx` hash is volatile; the prefix is stable).
- The grid filters client-side with **debounce** → filter first, then read; wait for the row, don't sleep.

## Page Object encapsulation (how locators become a POM)
- **Locators are PRIVATE fields** on the Page Object. **Tests never touch selectors — only call methods.**
- **Public methods are intent-named verbs/getters**, each decorated `@step()`, that *act and return*
  (`createUser(data)`, `filterByText(col, val)`, `isGridVisible(): boolean`, `getRowCellText(login, col)`).
  Assertions stay in the test; methods return values the test asserts on.
- **Concise names:** private locators are descriptive nouns (`private grid`, `private createBtn`,
  `private loginInput`); methods read as intent, not mechanics.
- **Parameterized elements → a private locator factory:** `private row = (login: string) => this.grid.locator('.dx-data-row', { hasText: login })`.
- Match the existing `lib/pages/*.page.ts` structure and the rules in `code-style-guide.md` (POM, fixtures, `@step`).

## Boundary
The MCP browser runs **locally** and is single-client — for analysis/authoring only. The actual
pass/fail run goes to the runner via `aqa.yml` (`/run`).
