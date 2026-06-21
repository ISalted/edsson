---
name: analyze-report
description: Triage an Edsson CI test-run report like a senior reliability operator — pick the run (latest or by date), cluster failures by root cause, classify each (product defect | test-code bug | flaky | infra/env | data), separate new regressions from known, weight by severity, judge flakiness from cross-run history, and deliver a layered verdict + routed next actions. Use when asked what the last run did, what failed and why, whether a run is a ship-blocker, to triage/diagnose a run, or whether failures are real vs noise. Read-only — never edits, runs, or merges.
---

# Triage a test run

Read-only. The job is not to list failures — it's to tell the team **what actually happened,
why, what's real vs noise, and what to do**. You interpret results; you never edit code, re-run,
or change run status.

**First read `.claude/docs/testomatio-guide.md`** — run/results shape, the `@T`/`@S` ↔ id
mapping, TQL, and the date gotcha. Don't guess the API; the mechanics below assume it.

## 0. Calibrate depth to the ask
- "Did it pass? / how's the last run?" → **one-line verdict** (status + counts + headline). Stop.
- "What failed / why / triage it / is this a blocker?" → **full triage** (steps 1–9).
- Don't over-deliver on a yes/no question; don't under-deliver on "triage it".

## 1. Pick the run
- **Latest** = `runs_list({ per_page: 1 }).data[0]`. Newest-first; the run object has **no
  date** — never sort by a date you can't see.
- **By date** → TQL `finished_at`, whole-day inclusive, **same date on both bounds** for one day:
  `runs_list({ tql: "finished_at >= '2026-06-19' and finished_at <= '2026-06-19'" })`.
- Use the run **id (hash)** — not "#11" — as `run_id` everywhere below.

## 2. Get the counts (the run object has none)
- Derive per status from `testruns_list({ run_id, filter_status: X }).meta.total` for
  `passed` / `failed` / `skipped` / `pending`. Plus the run's `status`, `env`, branch.
- If `failed == 0` → state healthy, give counts, stop (unless asked for more).

## 3. Pull the failures + the real WHY
- `testruns_list({ run_id, filter_status: "failed" })`. Each item carries `test_title`,
  `test_id` (= `@T`), `suite_title`, `run_time` (ms), and **`message`** — the real
  error/assertion text (ANSI-coded; **strip the codes** before quoting).
- The `message` is the evidence. Read it, don't summarize it away.

## 4. Cluster by error signature
- Group failures whose `message`/stack are the same shape — **same root cause = one cluster**,
  reported once. Never list the same failure N times because N tests tripped on it.
- Tells of one shared cause: identical assertion (`Expected 400 Received 200`), same selector/
  timeout, same failing setup/login, same area going down together.

## 5. Classify each cluster by TYPE
Assign one (state the tell):
- **Product defect** — app behaves wrong: clean assertion mismatch on a real expectation,
  unexpected HTTP status, missing/changed UI that the app (not the test) owns. *This is the
  one that blocks a ship.*
- **Test-code bug** — the test is wrong: stale selector after a legit UI change, bad/oversharp
  assertion, wrong expected value, race the test author introduced. App is fine.
- **Flaky** — passes and fails without a code change. **Cannot be claimed from one run** —
  confirm via history (step 7). Tells: intermittent timeout, occasional element-not-found,
  works on retry.
- **Infra / environment** — not the test or the app: cold-start (first hit after idle — this
  app's known slow welcome-email + cold-start quirk), network blip, runner/auth-session issue,
  global timeout. Tells: setup/login failures, mass simultaneous timeouts, `globalSetup` errors.
- **Data issue** — fixture/throwaway-user collision, leftover state, missing seed. Tells:
  "already exists" / not-found on data the test assumed.

## 6. New regression vs known — diff the previous run
- Previous run = `runs_list().data[1]`. Pull its failures
  (`testruns_list({ run_id: prev, filter_status: "failed" })`).
- A failing `test_id` present in **both** = **known/pre-existing**; present **only now** = **new
  regression**. New regressions are the headline; known failures are backlog, not news.

## 7. Reliability — judge flakiness from cross-run history (never one run)
- For any suspected-flaky or surprising failure, pull its history:
  `testruns_list({ test_ids: ['<@T-id>'] })` (**no `run_id`**) → its pass/fail across runs.
- Label with evidence: **stable** (consistently green, this fail is new/real),
  **flaky** (alternating green/red, no code change — "failed 3 of last 5"),
  **newly-broken** (clean green→red switch point ≈ regression),
  **recently-fixed** (red→green). There's no single-run flaky flag and no retry field —
  history is the only honest source.

## 8. Severity weighting
- Weight a failure by the **failing test's area / priority / tags**, not by count.
  Auth, permissions, and critical user-account flows outrank cosmetic/edge cases.
- **1 critical failure > 5 low ones.** Lead with the highest-severity real failure.

## 9. Trend
- Scan recent runs' `status`: `runs_list({ per_page: 8 })` (newest-first) → better/worse than
  the recent norm? Or count failing runs: `runs_list({ tql: "failed" }).meta.total`. One bad run
  in a green streak reads differently than the fifth red in a row.

## Output — layered verdict + routed actions
Write top-down, densest signal first. **Be honest: "the test failed" ≠ "the product is broken."**
Most failures are test/infra/flake — don't cry wolf; equally, don't bury a real regression.

1. **Headline (1 line, for anyone — manager/business):** ship-blocker yes/no + the gist.
   e.g. *"Run #14 [dev]: 62/65 green. 1 real auth regression (blocker), 2 known flakes — not noise."*
2. **Counts + trend:** passed/failed/skipped, status, vs previous run / recent norm.
3. **Per cluster (highest severity first):** type · new-vs-known · likely **root cause** ·
   the **evidence** (the stripped `message` + the history verdict). One entry per cluster.
4. **Routed next actions, prioritized — each pointing somewhere:**
   - product defect → describe it for a **bug report** (don't file it yourself).
   - need to dig into a failing test's code → **`/analyze-test <@T-id or title>`**.
   - suspected flake to re-confirm → **`/run`** (e.g. re-run that test/tag).
   - coverage gap exposed → **`/test-write`**.

## Stay read-only
Report and route only. No code edits, no re-runs, no run-status changes — those are the
sibling skills' jobs, invoked on the user's go-ahead.
