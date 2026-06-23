---
name: analyze-test
description: Explain AND critically assess an existing Edsson AQA test (or a whole file/area) like a senior AQA — what it verifies, how it's written, whether its assertions actually prove the behaviour, its real-run reliability/flakiness, code smells, and coverage gaps. Returns a verdict plus prioritized fixes. Use when asked to analyze, explain, review, audit, understand, or onboard someone to a test. Read-only — never modifies code.
model: claude-sonnet-4-6
effort: medium
---

# Analyze a test

Read-only counterpart of `/analyze-report`: that one judges RUN RESULTS, this one judges the
TEST CODE. The job is not to paraphrase the code — it's to tell the team **what it verifies,
whether its `expect`s actually prove that, how reliably it runs, and what's wrong with it**.
You explain and audit; you never edit, run, or open PRs — those are sibling skills.

**Pull in `.claude/docs/code-style-guide.md`** (the POM / fixtures / SOLID / selector rules you
audit against) and `.claude/docs/testomatio-guide.md` (the `@T` ↔ id mapping and how to pull a
test's cross-run history). Don't re-derive those mechanics; the steps below assume them.

## 0. Calibrate depth to the ask
- "What does this test do / explain it / onboard me" → **EXPLAIN only** (step 4). Stop.
- "Review / audit / is it any good / what's wrong with it" → **full assessment** (4 → 5 + verdict).
- "Is X flaky / why does it fail sometimes" → jump to **reliability** (5b: code + history), brief verdict.
- A **file or an area** ("audit the create-user tests") → run per-test, then add the area-level
  **coverage map + redundancy** pass (5d). Don't over-deliver on "just explain one test".

## 1. Identify the target (by SEARCH — never a hardcoded id shape)
Accept a partial title, file path, tag, `@T` id, or a project id (`UAC-NNN` is an EXAMPLE, not a format to assume).
- Title / area / tag → `tests_list({ tql: "test % 'lock'" })` or `"suite % 'Create'"`, or grep
  `tests/web/` for the title/tag. `@T` id → `tests_get('<id>')`. A path → read that file.
- **Ambiguous / multiple matches** → list them (title + file + `@T`) and ask which. Never guess.
- Confirm the resolved target back in one line before diving in.

## 2. Gather efficiently — read only what the test touches
1. The **test body** (the `*.web.test.ts`, or `tests_get(id).code`): title, tags, `beforeEach`, steps, every `expect`.
2. **Only the POM methods the test calls** — jump straight to `createUser`, `filterByText`,
   `isGridVisible`, etc. in `lib/pages/*.page.ts`. Do **not** read the whole Page Object.
3. The **data factory** it uses (`aqaUser(prefix)` in `lib/data/`) — what it produces, controlled vs random.
4. The **requirement** it claims to cover (the title, a linked Testomatio requirement, or the user's stated intent).
Read top-down; stop pulling files once you can explain and judge it.

## 3. Cross-run history (for any reliability or "is it good" ask)
Per `testomatio-guide.md`: `testruns_list({ test_ids: ['<@T-id>'] })` (**no `run_id`**) → that
test's pass/fail across all runs, each with `run_time`. The only honest flakiness source — hold it
until 5b. A test with no `@T` yet (newly authored) has no history; say so.

## 4. EXPLAIN (always — the base layer)
Dense prose, no code dump:
- **Verifies** — the one behaviour/requirement, in business terms (not "calls createUser then asserts").
- **Setup** — `beforeEach`, fixtures used (`webClient`/`apiClient`/`helpers`), data (`aqaUser` prefix → login shape).
- **Steps** — the arrange → act flow via POM methods, in order.
- **Assertions** — each `expect`: what it actually checks and at which layer (UI grid / API / popup state).
- **Tags / classification** — `@web @user-accounts @<feature>`, `@mutating` or not, `@T`/`@S`, the project id.
If the ask was "explain", stop here.

## 5. CRITIQUE (the senior layer — run all five, lead with the worst)

### 5a. Assertion / oracle adequacy — THE killer question
Do the `expect`s actually PROVE the claimed behaviour end-to-end, or give **false confidence**
(green even when the feature is broken)? Apply **mutation thinking**: *"what bug would this test NOT catch?"*
Name each weakness explicitly. Hunt for:
- **Side-effect instead of outcome** — asserting the popup closed ≠ the user was persisted; assert the
  *observable result* (the row appears in the grid with the right Status), not a proxy.
- **"Passes because nothing threw"** — a flow with no `expect`, or only `is...Visible()` truthy on something
  always present. No real oracle.
- **Wrong layer** — asserting a DOM/implementation detail or a hashed class instead of user-visible state;
  asserting client UI when the real proof is the persisted/API state (or vice-versa).
- **Weak / over-broad** — `toBeTruthy()` on a string that's truthy even when wrong; asserting "a row exists"
  instead of "*this* row with *these* values"; no negative assertion where the spec implies one.
- **Missing** — the requirement says X *and* Y; only X is asserted.
Verdict: does it catch the regression it exists to catch? If not, say which mutation slips through.

### 5b. Reliability — PREDICT from code, then CONFIRM with history
**Predict flakiness from the CODE:**
- Hard `waitForTimeout`/sleeps used as logic (vs real `waitFor`/response waits) — the grid filters
  client-side with **debounce**, so "filter then read" without settling races it.
- Races / ordering: reading before the debounce settles, asserting before navigation/animation completes.
- **Inter-test dependency / shared state** — relies on another test's data or order, a shared throwaway user, no isolation.
- Network/timing assumptions; the known **cold-start + welcome-email** slowness (create flows need the 60s timeout).
- **Brittle/absolute selectors** — nth-child, absolute XPath, a full hashed class instead of `[class*="..."]` partials.
**Confirm with the REAL history** (step 3): combine predicted + observed and label with evidence —
- **stable** (consistently green; predicted risks haven't bitten),
- **flaky** (alternating green/red, no code change — *"failed 3 of last 8, no commit between"*),
- **newly-broken** (clean green→red switch ≈ regression).
State both halves: *"predicts flaky (debounce race in filterByText) AND history confirms — 2/6 red."* If history
contradicts the code smell, say so (latent risk, not yet firing).

### 5c. Code smells — checklist vs `code-style-guide.md`
Flag each present (cite the line/method):
- assertions **inside the POM** (must live in the test);
- brittle/absolute selectors instead of `.dx-*` / `[class*="..."]` partials;
- `waitForTimeout` sleeps instead of real waits;
- **missing `@mutating`** on a test that writes data;
- inter-test dependency / shared state;
- over-broad or trivial assertions;
- hardcoded test data instead of `aqaUser()`;
- conditional logic / loops / try-catch in the test (tests must be linear);
- missing cleanup, or (guardrail) a delete-based cleanup — **never** delete accounts;
- misused fixtures, a POM method missing `@step()`, or logic that belongs in the POM leaking into the body.

### 5d. Coverage & traceability — is it even the RIGHT test?
- Does it actually cover its stated requirement, or only a slice? **Happy-path only** vs missing
  negative/edge/boundary (invalid input, duplicate login, validation, permissions)?
- **Duplication / overlap** with sibling tests in the file (two tests asserting the same thing)?
- **For a FILE/AREA target:** build a short **coverage map** — requirement/scenario → covered ✓ / gap ✗ —
  plus a redundancy note (which tests overlap, what's missing). Frame the area with `suites_list`
  `test_count` and sibling titles, not just the one case.

### 5e. Maintainability
Readability, naming (project id + clear title), DRY (reused POM flows/`aqaUser` vs copy-paste), thin-test
discipline (no flows/selectors/waits-as-logic in the body), correct `@step()` and fixture usage.

## 6. Output — verdict + prioritized routed fixes
Top-down, densest signal first.
1. **Verdict (1 line):** **solid / weak / risky** + the single main reason.
   e.g. *"Risky — green even if the user never persists (asserts only the popup closed); also flaky, 2/6 red."*
2. **Explanation** — the step-4 summary (full for an "explain"; condensed for an audit).
3. **Findings, worst first** — oracle gaps → reliability (predicted + history evidence) → smells →
   coverage/traceability → maintainability. One line each, concrete, cite the location.
4. **Prioritized fixes, each ROUTED:**
   - rewrite/strengthen this test, or write a missing one → **`/test-write`** (it edits & opens the PR).
   - re-confirm a suspected flake on CI → **`/run`** (that `@T`/tag, repeated).
   - check product-vs-test in the latest run → **`/analyze-report`**.
   - a code fix you can't do here → describe it precisely for a PR; **do not edit**.
   Present these as an **`AskUserQuestion` offer** (CLAUDE.md Interaction model) — the user picks; never auto-invoke a sibling skill.

## Stay read-only
Explain and audit only. No code edits, no runs, no PRs — name the sibling skill and stop;
the user invokes it on their go-ahead.
