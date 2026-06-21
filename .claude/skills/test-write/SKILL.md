---
name: test-write
description: Author a new Playwright automated test for the Edsson AQA suite from a /test-design checklist item or a described scenario — write a THIN test that CONSUMES the SDK in lib/ via the webClient fixture, give it a MEANINGFUL oracle, verify it passes on CI, and open a PR for QA-lead review. Use whenever asked to write, add, create, or automate a test / cover a scenario / turn a checklist case into a test. This is the FINALE: /test-design → /analyze-page → /sdk-builder → /test-write.
---

# /test-write — write the test, prove it, open the PR

The TEST layer and finale of the pipeline. You **consume** the SDK and **judge** the behaviour;
you write `tests/web/<area>/*.web.test.ts` and **never edit `lib/`** (the SDK). Apply `CLAUDE.md`
and the shared docs, don't restate them: `.claude/docs/code-style-guide.md` (thin tests,
expect-in-test, fixtures, tags), `.claude/docs/testomatio-guide.md` (`@T`/`@S` ids; how results
land), `.claude/docs/git-ci-guide.md` (branch/PR + MR standards + `workflow_dispatch`).

## The 5 non-negotiables (house rules)
1. **FIXTURES ONLY.** `import { test, expect } from "@lib/fixtures";` Act through `webClient` /
   `apiClient` / `helpers`. The **raw Playwright `page` is NEVER touched** — no `page.*`, and **no
   reaching through `webClient.page`**. A capability that doesn't exist yet → add it in
   `/sdk-builder`, never inline it.
2. **READABLE.** A teammate reads the test as a spec: linear **Arrange → Act → Assert**,
   intent-named POM calls, no cleverness. If a comment is needed to follow the flow, the flow is wrong.
3. **`expect` ALWAYS in the test, NEVER in an SDK method.** SDK methods *act and return*; the test
   judges. Hiding `expect` in `lib/` makes a failure unreadable.
4. **≤ ONE `describe` per file.** Multiple tests of the **same feature** are siblings inside that
   one `test.describe`; a genuinely **new feature** gets a new file + new describe. (file == feature == the `@<feature>` tag, e.g. `@create`.)
5. **NUMBERING = the checklist id.** `<FOC>-NNN` — three logical, related letters + `00N` — taken
   **VERBATIM** from the `/test-design` checklist at `test-design/<area>/CHECKLIST.md` as the title prefix.
   Never renumber, never invent.

## Layer boundary (route out — never patch `lib/`)
This is the **single** rule for missing pieces (referenced by letter below):
- Missing **method** → STOP, `/sdk-builder`. Missing **locator** → STOP, `/analyze-page`.
- A selector (`.dx-…`/`getByRole`), a Playwright **action**, or a `waitFor`-as-logic appearing in a
  test means the SDK is **incomplete** → route it out, never inline. **Never edit `lib/` here.**

## The quality bar (A–H) — acceptance criteria for "done"
- **A. MEANINGFUL ORACLE (mutation-check).** *"If the feature were silently broken, would this still
  pass?"* If yes → too weak. Assert the **observable outcome** — the row **persists on reload**, the
  value **round-trips** (write → reopen/refilter → read back), the status actually changed — not "a
  popup closed", not "nothing threw". **Persistence cases reload first** (`goTo` again), *then* filter,
  *then* read back; in-memory state is not proof.
- **B. ONE BEHAVIOUR PER TEST.** Verify ONE thing end-to-end; assert **all facets that define it**
  (created → row exists AND the granted permission reads back true), nothing extra.
- **C. ISOLATION + UNIQUE DATA.** Each test self-seeds unique data via `aqaUser(prefix)` (stamped
  `aqa.*@edsson.com`) and depends on no other test's state or order. CI runs a **single worker
  today**, but isolation keeps tests rerun-safe and **parallel-ready** for when workers grow — never
  rely on execution order or shared mutable state.
- **D. NEGATIVES PIN THE SPECIFIC FAILURE.** The exact field is invalid / the exact error text shows,
  **AND** the side effect was prevented (popup still open ⇒ blocked; refilter ⇒ no row created). Never
  "save was rejected somehow".
- **E. NO LOGIC.** No `if/else`, no loops that change what's asserted — one linear path, so a failure
  points to one place.
- **F. NO RAW-PAGE SELECTORS/ACTIONS.** A `page.*`/`webClient.page` call, a `.dx-…`/`getByRole` used
  to **act or locate**, or a `waitFor`-as-logic inside a test = the SDK is incomplete → route out (see
  Layer boundary). Prefer a read-back getter over any sleep; `webClient.waitForTimeout(n)` is **seconds**.
- **G. VERIFY GREEN ON CI** before "done" — see Process §5.
- **H. TITLE + TAGS + IDS** — see Process §3.

## Process

### 1. Take the case
- Input is one `/test-design` line — `- [ ] <FOC>-NNN: <behaviour> (priority)` — or a scenario.
  **Restate the observable behaviour in one line.**
- Pick the area (`auth`, `user-accounts`, … — check `tests/web/`) and the SDK object:
  `webClient.userAccountsPage` / `loginPage` / `header`, `apiClient`. Read the area's existing tests
  + the object's public method names — reuse what exists.

### 2. Map case → SDK methods (confirm before writing)
- List the **act** + **read-back** methods the case needs; confirm each exists on the object.
  Missing → route out (Layer boundary). A getter that *returns* the outcome (`isRowVisible`,
  `getRowCellText`, `isPermissionChecked`, `isErrorMessageVisible`) is what makes a real oracle (A)
  possible — if it's missing, that's an SDK gap, not a test.
- **Preconditions** (a user that must already exist, etc.) → prefer **`apiClient`** (cheapest,
  near-instant) over UI; reserve `webClient` flows for the behaviour under test. UI create is **slow**
  (real welcome email, ~60s), so don't UI-build fixtures you only need as setup.

### 3. Write the thin test
File `tests/web/<area>/<feature>.web.test.ts` — extend the feature's existing file if it fits.
- One `describe` (rule 4); `beforeEach` navigates only; body is **Arrange → Act → Assert** (B, E).
- **Title** (H): `<FOC>-NNN: <behaviour>`; **tags** on both `describe` and test:
  `@web @<area> @<feature>` (+ `@mutating` if it writes; + `@smoke` if it's a critical/high core-flow per `/test-design`).
- **IDs & sync:** author new tests with **no `@T`/`@S`** — the `@testomatio/reporter` assigns and
  writes `@T` (test) / `@S` (suite) ids back into source on a synced run (CI / QA-lead-owned); expect
  them to appear after sync. **Never hand-write or invent a `@T`.** When **extending** a file, keep its
  existing `@S`/`@T` — don't overwrite them.
- **Unique data** (C): one `aqaUser(prefix)` per test.

```ts
import { test, expect } from "@lib/fixtures";
import { aqaUser } from "@data/user-accounts/user-account.data";

test.describe("User Accounts — Create @web @user-accounts @create @mutating", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-0NN: a created user persists and reopens with its granted permission @web @user-accounts @create @mutating", async ({
    webClient,
  }) => {
    const uap = webClient.userAccountsPage;
    const user = aqaUser("create"); // unique login → order-independent, rerun-safe (C)

    // Act
    await uap.createUser({ ...user, permissions: ["Manage Currencies"] });

    // Assert — reload first, THEN filter, THEN read back (persistence, not memory) (A)
    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login);
    expect(await uap.isRowVisible(user.login)).toBeTruthy();
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Active");

    // round-trip the permission: reopen the edit form and read the checkbox back (A, B)
    await uap.clickEditRow(user.login);
    expect(await uap.isPermissionChecked("Manage Currencies")).toBeTruthy();
  });
});
```
*(`UAC-0NN` is illustrative — use the real `<FOC>-NNN` from `/test-design`; the worked methods are
real `userAccountsPage` methods. The describe carries no `@S` — it's assigned on sync.)*

### 4. Safe data (guardrails)
- Mutating tests use `aqaUser(prefix)` throwaway `aqa.*@edsson.com` users **ONLY** — never real/shared.
- **NEVER delete user accounts** (UI or API). **Never type the admin password** — auth is the saved
  `session-storage.json`. New users persist (no cleanup) — expected; that's why tests self-seed (C).

### 5. Verify it works (bar G — don't finalize on a guess)
- `npx tsc --noEmit` → fix type errors.
- **Branch, commit, push — then run on CI and confirm GREEN** before the PR: branch `aqa/<short-desc>`
  off `dev`, conventional commit (`test: <FOC>-NNN <behaviour>`), push. Then `workflow_dispatch` on
  `aqa.yml` **on that branch**, `grep` = the **full** `<FOC>-NNN` (substring match — the full id, so
  `UAC-04` doesn't sweep `UAC-040..049`). Legacy areas with no `<FOC>` prefix (e.g. `auth`, titled
  `1./2.`) → grep the `@T` id or the full title. Don't run mutating flows locally.
- **GREEN means the Testomatio result, NOT the GitHub badge** — `aqa.yml`'s *Run tests* step is
  `continue-on-error: true`, so the GitHub run goes green regardless of failures. Read pass/fail from
  **Testomatio** (project `edsson`).
- A single green run is weak evidence for slow/async flows (create, debounced filter): for
  create/persistence/timing tests, re-run once or check the test's history (`/analyze-report`) before "done".
- **RED → diagnose by cause:** test bug (assertion/data/method use) → fix **here**, re-run; missing/wrong
  method → `/sdk-builder`; missing/wrong locator → `/analyze-page`. Never patch `lib/`.

### 6. Land it — open the PR (bar H, the review gate)
The PR finale stays here for a single new test. The branch is **already pushed and green** (§5). Apply
the **MR standards** in `git-ci-guide`:
- Open the PR `aqa/<short-desc>` → `dev`. **PR title** `test: <FOC>-NNN <behaviour>`.
- **Body**: what it covers · the `<FOC>` id · link to the checklist item / Testomatio test / requirement
  · the **green CI-run link** · "for QA-lead review — do not merge".
- **SDK + test together:** a new test **plus the SDK it needs** (locators/methods just added) land as
  **one** test-write PR; SDK with no immediate test goes via `/open-pr`.
- **Never push to `dev`/`prod`. Never merge.** For **non-test or batch** change-sets, that's
  **`/open-pr`** — don't double-PR the same change.

### 7. Report + offer next
Return the **PR url**, the `<FOC>` id, the **green-run link**, and a **2-line** oracle summary:
(1) the observable outcome the test proves, (2) why it would fail if the feature were silently broken.
Then **offer the next step** via `AskUserQuestion` (CLAUDE.md Interaction model), don't auto-proceed:
*[▶ automate the next checklist case] [🔁 re-run on CI via `/run`] [⏸ stop — awaiting QA-lead review]*.
