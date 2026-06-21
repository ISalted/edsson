# Edsson AQA — project guide for Claude

AQA suite for the **Edsson Elements** admin app (Playwright + TypeScript), focused on
`/administration/user-accounts/`. Tests report to **Testomatio** (project `edsson`) and run on
**GitHub Actions self-hosted runners**. Repo **`ISalted/edsson`** (default branch `dev`, also `prod`).
This file is the **short always-on layer**; the deep detail lives in `.claude/docs/` (below) and the
skills pull it in — don't duplicate it here.

## Setup (once)
- `cp .mcp.json.example .mcp.json` — 3 MCP servers: `github`, `playwright`, `testomatio-edsson`.
- `cp .env.example .env` — `BASE_URL`, `API_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (loaded via `dotenv`).
- `.mcp.json`, `.env`, `session-storage.json`, `sessions.json` are gitignored (hold tokens/secrets).

## Canon docs (`.claude/docs/`) — the deep layer the skills pull in
- `code-style-guide.md` — POM / SOLID / fixtures / **page-vs-component object** rule.
- `playwright-guide.md` — locator priority ladder + DevExtreme reconciliation.
- `git-ci-guide.md` — branches + **MR standards** (branch `aqa/<short-desc>`, conventional commits, PR to `dev`).
- `testomatio-guide.md` — `@T`/`@S` ids, results API, TQL.

## Stack & layout
- Playwright + TypeScript, Page Object Model. Objects extend `BasePage`; **flows live in the objects**, not tests.
- `lib/pages/` — **page objects** (`*.page.ts`, one per route; e.g. `user-accounts.page.ts`) **and
  component objects** (`components/*.component.ts`, a reusable region on ≥2 pages — e.g.
  `header.component.ts` — page-agnostic, **no `AppRoute`**). Rule: bound to one route → page object;
  appears across pages → component object.
- `lib/pages/mixins.ts` — the **mixin functions** (`HeaderMixin` / `LoginMixin` / `UserAccountsMixin`).
- `lib/pages/edsson-app.ts` — composes those mixins into `WebClient` **and** declares `AppRoute`.
- `lib/data/` — test data: faker factories (e.g. `aqaUser()`) and known fixtures.
- `lib/api/` — API clients (auth, user-accounts). `lib/config/` — `env.{baseUrl,apiUrl,adminEmail,adminPassword}`.
- `lib/helpers/` — generic, page-agnostic utils ONLY. `lib/fixtures.ts` — fixtures `webClient` / `apiClient` / `helpers`.
- `tests/web/<area>/*.web.test.ts` — tests (areas: `auth`, `user-accounts`).
- Path aliases: `@lib @pages @data @api @helpers @root`.

## App surface (pages & navigation)
- The whole admin app is mapped in `lib/pages/components/nav.types.ts` as the `NAV` const — top
  sections: **Administration, AI, Marketing, Sales, Production, Finance, Analytics, Resources,
  Website**, each with sub-sections (some with sub-sub items). Types `TopNav` / `SubNav<T>` /
  `SubSubNav<T,S>` give typed, autocompleted navigation.
- Navigate via the header: `webClient.header.navigateTo(section, subSection?, item?)`
  e.g. `navigateTo("Administration", "Authorization", "User Accounts")`.
- Known direct routes in `AppRoute` (`lib/pages/edsson-app.ts`): `/`, `/login/`,
  `/administration/user-accounts/`. Use `webClient.goTo(route)` — relative to `baseURL`, never a full URL.
- Currently automated area: **Administration → Authorization → User Accounts**.

## Fixtures & architecture (detail: `code-style-guide.md`)
- Every test: `import { test, expect } from "@lib/fixtures";`
- Three fixtures: **`webClient`** (all UI work; mixin-composed — exposes `.header` HeaderComponent,
  `.loginPage`, `.userAccountsPage`, `.goTo(route)`, and `.page` raw Playwright `Page` only when
  unavoidable); **`apiClient`** (auth / user-accounts API — reuses the saved token from **`sessions.json`**);
  **`helpers`** (generic, page-agnostic utils).
- POM methods **act and return** (never assert); each public method is decorated `@step()`
  (`@helpers/step`) → a named step in the Playwright / Testomatio report. Keep that on new methods.
- `webClient.waitForTimeout(n)` takes **seconds**, not ms. Prefer real waits over sleeps.
- `userAccountsPage` is **large (~69 `@step` methods)** — grid read/filter, row detail + tabs,
  create / edit / lock, permissions, paging, save, … **Read the object for the full list and reuse;
  don't rebuild what exists.**

## Conventions (match these when writing tests)
- **Title:** `<FOC>-NNN: <what it verifies> @tags` — `<FOC>` is a 3-letter **focus code** (e.g. `UAC`
  user-accounts, `GRP` groups) + sequential `NNN`; ids come **verbatim from `/test-design`** (per
  checklist/file), never invent or renumber. *(Legacy `auth` keeps `1./2.` titles + placeholder
  `@S00000000`/`@T0000000N` — grandfathered, don't reformat.)*
- **Testomatio ids:** `@T…` on tests, `@S…` on `describe`. **Never invent them** — the
  `@testomatio/reporter` writes `@T`/`@S` back into source on a synced CI run. When **extending** an
  existing file, **preserve** its `@S`/`@T`; on a new test leave them off.
- **Tags:** `@web @<area> @<feature>` (+ `@mutating` for anything that writes). `@smoke` is the
  load-bearing grep filter; the type/feature set in use also includes `@e2e @a11y @security @validation
  @permissions @lock @detail @selection @create @edit @filter @groups`.
- **Test data:** `aqaUser(prefix)` → controlled `aqa.<prefix>.<stamp>@edsson.com` logins.

## Test-writing style (detail: `code-style-guide.md` + the `/test-write` skill)
- **Assertions live in the test, never in objects** — methods act-and-return (`is…()`/`get…()` return
  values), the test asserts: `expect(await uap.isGridVisible()).toBeTruthy();`. **Every test has an
  explicit `expect`** — no "passes because nothing threw".
- Tests stay **thin**: `beforeEach` navigates; the body calls object methods; then asserts.
- **DevExtreme grid filters with debounce → filter first, then read.** Selectors live in the object,
  not the test (locator ladder + `.dx-*`/`[class*="Prefix"]` rules in `playwright-guide.md`).

## How tests run
- **CI is the main lane:** workflow `edsson-aqa` (`aqa.yml`) on self-hosted runner `edsson-1`, via
  `workflow_dispatch` (input `grep`). Trigger through the `github` MCP / `gh` (the `/run` skill) — not locally.
- The **GitHub run stays green even if tests fail** (`continue-on-error`) — real pass/fail is in **Testomatio**.
- **Local (for the human, not the assistant):** `npm run test:web` (the canonical "Parallel Web" run),
  `npm run ui` (Playwright UI), `npm run grep` (mirrors CI `--grep`), `npm run headed`.
- `globalSetup.ts` logs in once → writes **`session-storage.json`** (UI storageState, reused by the
  "Parallel Web" project) **and `sessions.json`** (`{authToken, sessionId}` consumed by `apiClient`).

## MCP tools (this project)
- `testomatio-edsson` → test management: suites / tests / runs / reports, TQL. Project slug `edsson`.
- `playwright` → drive the live app to read **real selectors** when authoring tests.
- `github` → branches, pull requests, trigger `workflow_dispatch`.

## App access
- BASE_URL: `https://edssonelements-dev-hvdhh7c5bggjc6br.westeurope-01.azurewebsites.net`
- Login page `/login/`; main page `/administration/user-accounts/`.
- Auth: reuse the saved session (`session-storage.json` for UI, `sessions.json` for `apiClient`) — never
  log in by hand, **never type the admin password**.
- Dev quirk: creating a user sends a real welcome email on Save → UI create is **slow (~60s)**. Seed
  preconditions via **`apiClient`** (fast); reserve the slow UI create flow for the behaviour under test.

## ⛔ Guardrails (never violate)
- **NEVER delete user accounts** — single or bulk, via UI or API. Delete is out of scope.
- **NEVER type the admin password** into a form — use the saved session.
- **Mutating tests use throwaway users only** (`aqa.*@edsson.com`), never real/shared accounts.
- **Git: branch `aqa/<short-desc>` + PR to `dev`. Never push to `dev`/`prod` directly. Never auto-merge** —
  a human (QA lead) reviews and merges.
- Don't run mutating/destructive flows locally to "test the assistant" — that's what CI + throwaway data are for.

## Authoring workflow — the skill pipeline
Work flows through focused skills, each owning ONE layer (invoke `/<name>`):
1. **`/analyze-requirements`** — raw business input (Jira text / file / prose) → clean, atomic, **testable**
   `REQ-<AREA>-NNN` requirements + acceptance criteria (`<AREA>_REQUIREMENTS.md`); audited vs ISO/IEC/IEEE
   29148, ambiguity **asked-or-flagged**, never silently invented.
2. **`/test-design`** — requirements/page → a prioritized, deduplicated `<FOC>-NNN` checklist (each case
   traces back to a `REQ-` id).
3. **`/analyze-page`** — analyze the live page → write **verified locators** into a **page OR component**
   object (`lib/pages/<page>.page.ts` or `components/<name>.component.ts`); scaffolds the object + its
   mixin (in `mixins.ts`) + `WebClient` wiring; an `AppRoute` entry **only for a page** (components have none).
4. **`/sdk-builder`** — add the `@step` act-and-return **methods** on those locators (+ helpers/fixtures/api/data).
5. **`/test-write`** — write the **thin test** that consumes the SDK, verify it green on CI, and open **its own PR**.

Support skills: **`/open-pr`** (land a **non-test or batched** change-set as a PR — `/test-write` already
PRs its own test), **`/run`** (trigger a CI run), **`/analyze-report`** (triage a run — read-only),
**`/analyze-test`** (audit a test's code — read-only).

**Layer rule:** tests never touch `lib/`; locators (`/analyze-page`) ≠ methods (`/sdk-builder`) ≠ tests
(`/test-write`). Branch `aqa/<short-desc>` + PR to `dev`; the QA lead reviews and merges.
