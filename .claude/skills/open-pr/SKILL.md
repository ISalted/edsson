---
name: open-pr
description: Package an EXISTING working-tree change-set into a reviewable Pull Request to `dev` for the Edsson AQA suite — branch off `dev` as `aqa/<short-desc>`, commit with a conventional message, push, and open a PR per the team's MR standards (title, body, CI-run link), then stop at the review gate. The general git / merge-request action layer. Use when asked to open/raise/create a PR or MR, land/ship/submit changes, branch + commit + push existing work, or get a change reviewed. Does NOT author tests (/test-write), SDK/locators (/sdk-builder, /analyze-page), or trigger CI (/run).
model: claude-sonnet-4-6
effort: low
---

# Open a PR (the git / merge-request action layer)

`/open-pr` takes a change-set that **already exists** in the working tree (a written test, SDK code, config, docs, a fix) and **lands it for review**: short-lived branch off `dev` → commit → push → PR to `dev` for the QA lead. It *packages* finished work into a reviewable MR — it does **not** produce the change itself.

Canon — apply, don't re-derive: **`.claude/docs/git-ci-guide.md`** (branches, the two git mechanics, the MR-standards section). Repo `ISalted/edsson`; default branch `dev` (also `prod`).

## What this skill does NOT do (route instead)
- **Write/author a test** → `/test-write`, which **already ends with its own PR step**. If you're authoring, stay there; don't double-PR the same change.
- **Write SDK methods** → `/sdk-builder`; **locators / page objects** → `/analyze-page`.
- **Trigger a CI run** → `/run`. This skill only *links* a green run in the PR body; if none exists, offer `/run` first.
- **Produce the change.** No change in the tree → nothing to land → stop.

## Process

### 1. Scope the change-set
- Inspect reality: `git status` + `git diff` (+ `git diff --staged`), or take the files the user named.
- Restate it in **one line** (what changed + why). Confirm it's **one coherent change-set** — if the tree mixes unrelated work, surface it and split; do not bundle. Nothing modified/staged → **stop**.

### 2. Pick the conventional type
From the nature of the change, not the file count:

| Type | When |
|------|------|
| `test:` | a new automated test |
| `fix:` | fixing a flaky/broken test or SDK/app code |
| `chore:` | deps, scaffolding, repo housekeeping |
| `ci:` | `aqa.yml` / runner / workflow config |
| `docs:` | guides, skills, README, comments |

### 3. Branch off an up-to-date `dev`
- `aqa/<short-desc>`, one short-lived branch per task (e.g. `aqa/uac-041-lock-login`).
- Sync first, branch off `dev`: `git fetch origin` → `git switch -c aqa/<short-desc> origin/dev`.
- **Never** commit on `dev`/`prod` directly. If the change is **already committed on local `dev`**: branch from current HEAD (`git switch -c aqa/<short-desc>`), then reset local `dev` back to upstream (`git switch dev && git reset --hard origin/dev`) — **never push `dev`**.
- The QA lead deletes the branch after merge — not you.

### 4. Commit
- Conventional message: `type: subject` — imperative, lowercase.
- For a test, **fold in the `<FOC>` id**: `test: UAC-041 locked user cannot log in`.
- Stage only the scoped files (`git add <paths>`) — never blind `git add -A` that sweeps in unrelated working-tree noise.

### 5. Push + open the PR to `dev`
Pick the mechanic that fits the environment (per git-ci-guide):
- **Native** (local repo): `git push -u origin aqa/<short-desc>` → `gh pr create --base dev --title "<conventional subject>" --body "<body>"`.
- **github MCP** (no local repo / Desktop): `create_branch` → `push_files` / `create_or_update_file` → `create_pull_request` (`base: dev`).
- **Idempotency:** if the branch already has an open PR, **update it** (push the branch / edit title-body) — do not open a duplicate.

### 6. Title + body per the MR standard
**Title** = the conventional-commit subject (with the `<FOC>` id for a test).

**Body template** (copy-paste):
```
## What
<one line — what this change covers>

## Ref
- <FOC> id: UAC-041
- Checklist item / Testomatio test / requirement: <link>

## CI
- Green run: <link>

_for QA-lead review — do not merge_
```
- **Test/code change → link a green CI run.** A test PR with no green run is not review-ready: offer `/run` first rather than omitting or faking the link.
- `chore:` / `ci:` / `docs:` → the `## Ref` `<FOC>` line and the `## CI` line are **N/A** — drop them (keep `## What` and the review-gate line).

### 7. Report + stop at the gate
Return the **PR URL** + a 2-line summary (branch, type, what it lands, what the reviewer should check). **Stop here** — the PR is the review gate.

## Guardrails (hard)
- **Branch + PR ONLY.** Never push to `dev`/`prod` directly, never merge, never force-push, never auto-close or self-merge the PR. Merging and branch deletion are the QA lead's.
- **One scoped change-set per PR** — don't bundle unrelated changes.
- Inherit project guardrails (`CLAUDE.md`): never type the admin password, never delete accounts, never bypass the review gate.
