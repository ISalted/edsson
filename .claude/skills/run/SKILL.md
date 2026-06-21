---
name: run
description: Launch an Edsson test run on the GitHub self-hosted runner from chat — trigger the aqa.yml workflow (workflow_dispatch) for all tests or a filtered subset (by tag like @smoke, or a test id), and point to where results land. Use when asked to run, launch, execute, kick off, or re-run tests / smoke / a suite on CI.
---

# /run — launch a test run on the runner

The CI-DISPATCH action. From chat you **trigger** `aqa.yml` (`workflow_dispatch`) — whole suite
or a filter — resolve the run it started, point to where results land, and hand off to
`/analyze-report`. You do **not** write/fix tests (`/test-write`, `/sdk-builder`), open PRs
(`/open-pr`), or judge results (`/analyze-report`).

Canon — apply, don't re-derive: **`.claude/docs/git-ci-guide.md`** (dispatch, repo, runner) ·
**`.claude/docs/testomatio-guide.md`** (where results land). Workflow file `aqa.yml`, display
name `edsson-aqa`, repo `ISalted/edsson`, runner `[self-hosted, edsson-1]`. **`workflow_dispatch`
is the ONLY trigger** (no push trigger). Execution is on the runner; never locally.

## 0. Calibrate the ask
- **Fire-and-link** (default): trigger, resolve the run, return its URL + what launched. Stop.
- **Trigger-and-watch**: only if asked to wait/watch — poll to completion, then summarize + route.

## 1. Decide the filter (`grep`)
`grep` maps to `npx playwright test --project="Parallel Web" --grep "<grep>" --workers=1 --retries=2`
— a Playwright **`--grep` regex over the full test TITLE (tags included)**.
- **All** → empty (`grep=""`).
- **By tag** → `@smoke`, `@user-accounts`, `@create`.
- **One test** → its `<FOC>-NNN` (`UAC-041`) or `@T` id. **Use the FULL id** — it's a regex
  substring, so `UAC-04` also matches `UAC-040..049`. Confirm intent if ambiguous.

## 2. Pick the ref (also selects the env)
The **ref picks the environment**: `dev` branch → dev secrets/env, `prod` → prod.
- Default **`dev`**; `prod` only if asked.
- **Verifying a NEW test before its PR** (the `/test-write` verify-green step) → dispatch on the
  author's **feature branch**, scoped to the `<FOC>` id. The branch **MUST already be pushed to
  origin** — you dispatch against a remote ref; an unpushed local branch can't be selected.

## 3. Trigger
- Native: `gh workflow run aqa.yml --ref <branch> -f grep="<filter>"`
- Or the **github** MCP `workflow_dispatch` equivalent (workflow `aqa.yml`, `ref`, `inputs.grep`).

## 4. Resolve the run you started
`workflow_dispatch` returns **no run id**. Find it:
`gh run list --workflow=aqa.yml --branch <ref> --event workflow_dispatch --limit 1` → newest run's
id + URL. New run shows on the runner within ~30s.
- **Gotcha — `concurrency: aqa-<ref>, cancel-in-progress: true`:** a second dispatch on the
  **same branch cancels the previous in-progress run** on that branch.

## 5. Watch (only if asked)
`gh run watch <id>` (or poll `gh run view <id>`). Takes minutes — real browsers, serial
(`--workers=1`) + `--retries=2`.

## 6. Report + route
Give the run **URL** + what launched (**filter + ref**). State the truth plainly:
- The **`Run tests` step is `continue-on-error: true` → the GitHub run goes GREEN regardless of
  test failures.** Real pass/fail lives in **Testomatio**, not the badge.
- **`--retries=2` can mask flakiness** — a test that fails then passes on retry shows green.
- Artifacts (`if: always()`, 14-day retention): `playwright-html-report`, `playwright-json-report`
  (`results.json`).
- When it finishes → hand off to **`/analyze-report`** to triage; a single failing test's code →
  `/analyze-test`.

## Guardrails
- Runs go to the **runner only** — never run mutating/destructive flows locally.
- **Dispatch only** — never push to `dev`/`prod` to trigger a run.
- Read-only on results: no edits, no merges.
