# Edsson AQA — project guide for Claude

AQA suite for the **Edsson Elements** admin app (Playwright + TypeScript), focused on
`/administration/user-accounts/`. Tests report to **Testomatio** (project `edsson`) and
run on **GitHub Actions self-hosted runners**. This file tells you how to work here.

## Stack & layout
- Playwright + TypeScript, Page Object Model.
- `lib/pages/` — Page Objects (one per page). **Page flows live here** (e.g. `createUser`), not in tests.
- `lib/data/` — test data: faker factories (e.g. `aqaUser()`) and known fixtures.
- `lib/api/` — API clients (auth, user-accounts).
- `lib/config/` — env (`env.baseUrl`, `apiUrl`, `adminEmail`, `adminPassword`).
- `lib/helpers/` — generic, page-agnostic utils ONLY (no page flows, no test data).
- `lib/fixtures.ts` — fixtures: `webClient`, `apiClient`, `helpers`.
- `tests/web/<area>/*.web.test.ts` — tests (areas: `auth`, `user-accounts`).
- Path aliases: `@lib @pages @data @api @helpers @root`.

## App surface (pages & navigation)
- The whole admin app is mapped in `lib/pages/components/nav.types.ts` as the `NAV`
  const — top sections: **Administration, AI, Marketing, Sales, Production, Finance,
  Analytics, Resources, Website**, each with sub-sections (some have sub-sub items).
  Types `TopNav` / `SubNav<T>` / `SubSubNav<T,S>` give typed, autocompleted navigation.
- Navigate via the header: `webClient.header.navigateTo(section, subSection?, item?)`
  e.g. `navigateTo("Administration", "Authorization", "User Accounts")`.
- Known direct routes live in `AppRoute` (`lib/pages/edsson-app.ts`): `/`, `/login/`,
  `/administration/user-accounts/`. Use `webClient.goTo(route)` — paths are relative to
  `baseURL`, never a full URL.
- Currently automated area: **Administration → Authorization → User Accounts**.

## Fixtures & test architecture
- Every test imports: `import { test, expect } from "@lib/fixtures";`
- Three fixtures (`lib/fixtures.ts`):
  - `webClient` — the web app (all UI work goes through it);
  - `apiClient` — API client (auth / user-accounts), reuses the saved session token;
  - `helpers` — generic, page-agnostic utilities only.
- `webClient` is **mixin-composed** (`lib/pages/edsson-app.ts`):
  `UserAccountsMixin(LoginMixin(HeaderMixin(BasePage)))` → it exposes:
  - `webClient.header` — HeaderComponent (nav, logo, account menu, log out);
  - `webClient.loginPage` — LoginPage;
  - `webClient.userAccountsPage` — UserAccountsPage (grid, create / edit / lock flows);
  - `webClient.goTo(route)`, and `webClient.page` (raw Playwright `Page`, only when unavoidable).
- Page Objects extend `BasePage` and decorate **every** public method with `@step()`
  (from `@helpers/step`) → each action shows up as a named step in the Playwright /
  Testomatio report. Keep that on new POM methods.
- `webClient.waitForTimeout(n)` takes **seconds**, not ms. Prefer real waits over sleeps.

## Conventions (match these when writing tests)
- Title format: `UAC-NNN: <what it verifies> @tags` — `UAC-NNN` is sequential per area.
- Testomatio ids: `@T...` on tests, `@S...` on `describe`. **Never invent `@T` ids** — they are
  created/synced by Testomatio. Leave a new test without one; it gets assigned later.
- Tags: `@web @user-accounts @<feature> @mutating` (mark anything that writes data `@mutating`).
- Page flows (create / edit / lock) are methods on the Page Object; tests stay thin.
- Test data via `aqaUser(prefix)` → controlled `aqa.<prefix>.<stamp>@edsson.com` logins.

## Test-writing style
- **Assertions live in the test, never in Page Objects.** POM methods *act* and *return*
  (e.g. `is...Visible()` / `is...Enabled()` return a boolean); the test asserts:
  `expect(await uap.isGridVisible()).toBeTruthy();`
- **Every test has explicit `expect(...)`** — no "passes because nothing threw" tests.
- Tests stay **thin**: `beforeEach` navigates (`webClient.goTo("/administration/user-accounts/")`),
  the body calls POM flows, then asserts.
- Read-then-assert: prefer awaiting a POM getter and asserting its value over chaining
  Playwright web-first assertions inside the test (keeps tests uniform).
- Selectors target DevExtreme grid internals (`.dx-data-row`, `.dx-select-checkbox`,
  `.dx-texteditor-input`, `.dx-invalid`, …) and hashed CSS-module classes via partial
  matches like `[class*="UserAccountForm_formLabel"]`. The grid filters client-side with
  debounce — filter first, then read.

## How tests run
- **CI is the main lane:** GitHub Actions `aqa.yml` on self-hosted runner `edsson-1`, via
  `workflow_dispatch` (input `grep`). Trigger it through the `github` MCP / `gh` — not locally.
- **Local quick poke:** `npm run ui` (Playwright UI) — for the human, not for the assistant.
- `globalSetup.ts` logs in once → writes `session-storage.json` (reused by the `Parallel Web` project).

## MCP tools (this project)
- `testomatio-edsson` → test management: suites / tests / runs / reports, search via TQL. Project slug `edsson`.
- `playwright` → drive the live app to read **real selectors** when authoring tests.
- `github` → branches, pull requests, trigger `workflow_dispatch`.

## App access
- BASE_URL: `https://edssonelements-dev-hvdhh7c5bggjc6br.westeurope-01.azurewebsites.net`
- Login page `/login/`; main page `/administration/user-accounts/`.
- Auth: reuse `session-storage.json` — do not log in by hand each time.
- Dev quirk: creating a user sends a real welcome email on Save → create flows are slow (60s timeout).

## ⛔ Guardrails (never violate)
- **NEVER delete user accounts** — single or bulk, via UI or API. Delete is out of scope.
- **NEVER type the admin password** into a form — use the saved `session-storage.json` session.
- **Mutating tests use throwaway users only** (`aqa.*@edsson.com`), never real/shared accounts.
- **Git: always branch + PR. Never push to `dev`/`prod` directly. Never auto-merge** — a human (QA lead) reviews and merges.
- Don't run mutating/destructive flows locally to "test the assistant" — that's what CI + throwaway data are for.

## Authoring workflow — the skill pipeline
Work flows through focused skills, each owning ONE layer (invoke `/<name>`):
1. **`/test-design`** — requirement/page → a prioritized, deduplicated case checklist (`<FOC>-NNN` ids, e.g. `UAC-NNN`).
2. **`/analyze-page`** — analyze the live page → write the **verified locators** into `lib/pages/<page>.page.ts` (locators only; scaffolds a new object + mixin/WebClient/AppRoute).
3. **`/sdk-builder`** — add the `@step` act-and-return **methods** on those locators (+ helpers/fixtures/api/data). The SDK layer.
4. **`/test-write`** — write the **thin test** that consumes the SDK, verify it green on CI, open the PR.

Support skills: **`/open-pr`** (land any existing change-set as a PR for QA-lead review), **`/run`** (trigger a CI run), **`/analyze-report`** (triage a run), **`/analyze-test`** (audit a test's code).

**Layer rule:** tests never touch `lib/`; locators (`/analyze-page`) ≠ methods (`/sdk-builder`) ≠ tests (`/test-write`). Always branch + PR; the QA lead reviews and merges.
