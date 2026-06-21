# Git & CI guide — branches, PRs, running on the runner

Shared knowledge pulled in by the `test-write`, `open-pr` and `run` skills. Repo: **`ISalted/edsson`**.

## Branches & PR flow (the review gate)
- Default branch: **`dev`** (also `prod`). **Never push directly to `dev`/`prod`. Never merge** —
  a human (QA lead) reviews and merges.
- New work → a short-lived branch off `dev` → commit → open a **PR to `dev`** → QA lead merges → branch deleted. Format below.

## MR standards (names & format)
- **Branch:** `aqa/<short-desc>` off `dev`, one per task, deleted after merge (e.g. `aqa/uac-041-lock-login`).
- **Commit & PR title:** conventional commits — `type: subject`, imperative, lowercase. Types in use: `test:` (new test), `fix:` (test/code fix), `chore:` / `ci:` / `docs:` (infra/config/docs). For a test, fold in the case id: `test: UAC-041 locked user cannot log in`.
- **PR body:** what it covers · the `<FOC>` id (for a test) · link to the checklist item / Testomatio test / requirement · the green CI-run link (for test changes) · note **"for QA-lead review — do not merge"**.
- **Target:** PR into `dev`. The PR is the review gate.

## Two ways to do git (both available)
- **Claude Code native** (local repo): `git` + `gh` — branch, commit, push, `gh pr create`.
- **github MCP** (no local repo / Desktop): `create_branch` → `push_files` /
  `create_or_update_file` → `create_pull_request`.

## CI — how tests actually run
- Workflow **`aqa.yml`** on the self-hosted runner **`edsson-1`**, triggered by
  **`workflow_dispatch`** with input **`grep`** (filter; empty = all).
- `globalSetup.ts` logs in once → writes **`session-storage.json`** (UI storageState, reused by
  `Parallel Web`) **and `sessions.json`** (`{authToken, sessionId}` consumed by the `apiClient` fixture).
- The "Run tests" step has **`continue-on-error: true`** → the GitHub run stays green even
  when individual tests fail; true pass/fail lives in **Testomatio** + the report artifacts.
- Artifacts uploaded `if: always()`: `playwright-html-report` (+ `playwright-json-report`).

## Triggering a run (the `/run` skill)
- Dispatch via the **github** MCP / `gh`:
  `workflow_dispatch` on `aqa.yml`, `ref` = `dev` (default) or `prod`, `inputs.grep` = filter.
- Filter examples: `@smoke` (a tag), `UAC-001` / `@T00000001` (one test), empty = whole suite.
- Runs on the runner (minutes); results flow back to Testomatio automatically.
- Don't run mutating/destructive flows locally — that's what CI + throwaway data are for.

## Scheduling
- To schedule runs, add a `schedule:` (cron) trigger to `aqa.yml` — propose it as a PR
  (never push to `dev` directly). Testomatio can also schedule, but cron in `aqa.yml` is the simplest.

## Guardrails
- Always branch + PR; never push to `dev`/`prod`; never auto-merge. The PR is the gate.
