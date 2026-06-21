# Testomatio guide (project `edsson`) — reading runs, results & structure

Verified against the live Testomat.io Public API v2 via the **testomatio-edsson** MCP.
Testomatio is the **test-management hub**: it stores tests, suites and run **results**.
It does **NOT execute** tests — execution happens on GitHub Actions runners (see `/run`).
This file is shared knowledge pulled in by the `/analyze-report` and `/run` skills.

## IDs — how `@T` / `@S` map to the API
- A test's MCP `id` **is** its `@T` tag: test id `00000004` ↔ `@T00000004` in code.
- A suite's MCP `id` **is** its `@S` tag: suite id `00000000` ↔ `@S00000000`.
- A run's `id` is a short **hash** (e.g. `3bdc877f`); its human number lives in the title
  (`Edsson AQA [dev] #11`). Use the **hash** (not `#11`) as `run_id` in API calls.

## Test structure (`suites_list` → tree)
- Root `tests` (69) → `web` → `user-accounts` (65) + `auth` (4) + `Groups` (0).
- Each leaf file-suite carries its `file` path, `tags`, and `test_count`.
- `tests_list` returns each test with `state` (`automated`|`manual`), `priority`,
  `self_tags`, `suite_title`, and **`code`** (the real source) — use `code` to explain a test.
- 69 tests total. Filter with TQL (below); read `meta.total` for counts.

## ⚠️ Finding a run (the #1 gotcha)
`runs_list` returns runs **newest-first** but **without any date field** in the output —
and `runs_get` doesn't expose dates either. So:
- **"Latest / last run"** → take the FIRST item: `runs_list({ per_page: 1 }).data[0]`.
  Do **not** try to reason about dates you can't see in the output.
- **A run on a specific date** → filter with **TQL `finished_at`** (verified working) —
  the field the Testomatio UI shows as **"Finished at"**. Dates are **whole-day inclusive**,
  so for ONE day use the same date on both bounds:
  `runs_list({ tql: "finished_at >= '2026-06-19' and finished_at <= '2026-06-19'" })`.
  (TQL also has `created_at`, `launched_at`, but the UI's date column = `finished_at`.)
- Run fields are MINIMAL: `id` (hash), `title`/`clean_title`, `status` (`passed`|`failed`),
  `kind`, `env`. **No date and NO pass/fail counts in the run object** — derive counts from
  `testruns_list` (below).

## Reading a run's results (why it failed)
- Per-test results: `testruns_list({ run_id, filter_status: "failed" })`.
- Each testrun has: `test_title`, `test_id` (= `@T` id), `suite_title`, `status`,
  `run_time` (**ms** — high = slow test), `substatus`, and **`message`** — the actual
  error/assertion text (e.g. `Expected: 400  Received: 200`). Strip ANSI codes when quoting.
  `message` is `null` for passed tests, populated for failures.
- **Counts** (the run object has none): read `meta.total` from `testruns_list` **per status** —
  `filter_status:"passed"` → passed count, `"failed"` → failed count, etc. (verified).
- `filter_status`: `passed` | `failed` | `skipped` | `pending`. Also filter by `tags`,
  `test_ids`, `envs`, `filter_finished_at_date_range`, `defects`, `filter_priority`.
- Overall verdict = the run's `status`; details = iterate `testruns_list`.
- **Test history / flakiness:** there's no enterprise *analytics*, BUT a test's history IS
  available — `testruns_list({ test_ids: ['<id>'] })` (NO `run_id`) returns that test's runs
  across all runs, each with `status` + `run_time`. Mixed pass/fail over runs = flaky-looking
  or recently broken/fixed — judge it: alternating with no code change ≈ flaky; a clean
  switch point ≈ a fix/regression. (No single-run flaky flag; run-level TQL `has_retries` is the only hint.)

## Test health & coverage (QA-lead / manager / business)
All verified against the live API:
- **Run trend / health:** `runs_list({ per_page: N })` → recent runs' `status` (newest-first)
  → pass/fail trend. Count failing runs: `runs_list({ tql: "failed" }).meta.total`.
- **Currently-failing tests:** `tests_list({ tql: "status == 'failed'" })` — tests whose latest
  result is failed.
- **A single test's history (consistency / flakiness):** `testruns_list({ test_ids: ['<id>'] })`
  → its pass/fail over time across runs.
- **Stale tests** (not run lately): `tests_list({ tql: "last_run_at < '2026-06-01'" })`.
- **Coverage:** automated vs manual → `tests_list({ tql: "state == 'automated'" })` vs `'manual'`
  (compare `meta.total`); per-area counts → `suites_list` `test_count` per folder/file.
- **Traceability:** filter by `milestone` / `jira` / `issue` in TQL; suites carry `requirements`
  (Testomatio Requirements) — for "tests for feature X / release Y".
- **Business-level health** = compose: latest run `status` + recent-runs trend + currently-failing count.

## Running tests (NOT via Testomatio)
- Testomatio cannot run tests. To launch a run: trigger GitHub Actions `aqa.yml`
  (`workflow_dispatch`, input `grep`) via the **github** MCP / `gh` — see `/run`.
  Results flow back into Testomatio automatically (the Playwright reporter).

## TQL — the single filter for `runs_list` / `tests_list`
- Operators: `and or not`, `== !=`, `in [..]`, `%` (partial text), `> < >= <=`, parentheses.
- **Runs** vars: `title, env, tag, duration, passed_count, failed_count, skipped_count,`
  `finished, passed, failed, with_defect, has_test_tag, has_retries, created_at,`
  `finished_at, launched_at, milestone` (+ bare flags: `failed`, `finished`, `automated`).
  e.g. `failed and has_test_tag == 'smoke'`, `finished_at >= '2026-06-01' and failed`.
- **Tests** vars: `tag, label, priority, state, status, suite, test, last_run_at,`
  `executed_at, created_at, assigned_to, milestone`.
  e.g. `state == 'automated'`, `tag in ['smoke'] and status == 'failed'`, `suite % 'Create'`.
- Don't invent fields/syntax. If a query errors, reduce to one documented predicate.

## Common recipes
- **Latest run + its failures:**
  `runs_list({per_page:1})` → `R = data[0].id` → `testruns_list({run_id:R, filter_status:'failed'})`.
- **Run(s) on a date:** `runs_list({tql:"finished_at >= '2026-06-19' and finished_at <= '2026-06-19'"})` (same date both bounds = that whole day).
- **Pass/fail counts of run R:** `testruns_list({run_id:R, filter_status:'passed', per_page:1}).meta.total` (repeat for `failed`/`skipped`).
- **Why test X failed in run R:** `testruns_list({run_id:R, test_ids:['00000001'], filter_status:'failed'})` → read `message`.
- **Automated vs manual:** `tests_list({tql:"state == 'automated'"})` vs `'manual'` → compare `meta.total`.
- **Tests in an area:** `tests_list({tql:"suite % 'Create'"})`; a test's source → `tests_get(test_id).code`.
