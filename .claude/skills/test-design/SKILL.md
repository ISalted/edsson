---
name: test-design
description: Design a prioritized, deduplicated test-case CHECKLIST for a feature, page, or requirement BEFORE any automation — systematically applies the full test-design technique grid (equivalence partitioning, boundary values, decision tables, state transition, pairwise, plus security, accessibility, persistence, i18n) and outputs a checklist of concrete, ID'd cases in the project's format. Use when asked to create test cases, a checklist, test scenarios, coverage, or to "break down" / decompose a feature or requirement into cases. This is the step AFTER /analyze-requirements (it consumes the `<AREA>_REQUIREMENTS.md` artifact) and BEFORE /test-write.
---

# Design a test-case checklist

The **design** phase of the QA pipeline: a requirement — ideally the `<AREA>_REQUIREMENTS.md`
from `/analyze-requirements`, or a feature / page directly — becomes a prioritized,
**deduplicated** checklist of cases. Fed a requirements artifact, **trace each case to its
`REQ-<AREA>-NNN`** so coverage maps back to a need. Each case is concrete enough that
`/test-write` can later automate it as **exactly one** test. You apply test-design theory
deliberately — not improvise — and the bar is ISTQB-grade: **minimal but sufficient**.

Output is a single markdown file `<AREA>_CHECKLIST.md`. This skill is self-contained:
the format, ID scheme, priority legend, technique grid, and process are all below. The
project `CLAUDE.md` guardrails always apply.

## Guiding philosophy — meaningful coverage, not a billion tests

- **Collapse the input space.** Use equivalence partitioning + boundary analysis to pick
  ONE representative per class — not every value. The space of inputs is infinite; the
  set of distinct *behaviours* is small. Test the behaviours.
- **One distinct behaviour per case.** If two cases would pass/fail for the same reason,
  they are the same case.
- **Dedup is a discipline, not an afterthought.** After deriving cases, actively merge or
  delete any that assert the same thing through a different door.
- **Risk-based prioritization.** Order by impact × likelihood. Spend cases where failure
  hurts (data corruption, security, core flows), not on cosmetics.
- **Minimal-but-sufficient — the completeness contract:** every requirement / acceptance
  criterion, every UI element, every state, every transition, and every identified risk
  is covered by **≥ 1** case, with **zero** redundancy. More cases than that is graphomania;
  fewer is a coverage gap.

## Quality bar — what every single case must satisfy

A case earns its line only if it is ALL of:
- **Atomic** — one behaviour. Not "create and edit and delete".
- **Observable** — asserts something you can actually see/read in the UI or response.
- **States the expected result** — the action AND its outcome, not just the action.
- **Assertion-able** — a clear pass/fail oracle, not "looks right".
- **Automation-ready** — concrete enough for `/test-write` to write directly, with the real
  control/value implied.

Bad: `filtering works`. Bad: `test the Login filter`.
Good: `LCK-012: Typing 'admin' in the Login filter cell shows only rows whose Login contains 'admin' and updates the pager total to the match count (high)`.

## Case IDs — `<FOC>-NNN`

Every case gets a per-area code: a **3-letter focus prefix** + a zero-padded **sequential
number**, e.g. `GRP-001`, `UAC-014`, `LCK-007`.

- **Choose the 3-letter focus code** from the area/feature being designed — a memorable,
  uppercase, area-scoped abbreviation: User Accounts → `UAC`, Groups → `GRP`, Lock/Unlock
  → `LCK`, Projects → `PRJ`, Permissions → `PRM`, Companies → `CMP`. Use ONE focus code
  per checklist file (the whole file is one area).
- **Number sequentially** across the whole file, `001`, `002`, … in the order cases
  appear. The number is global to the file, not restarted per `##` section.
- **Continue existing numbering.** If a checklist for this area/focus already exists (in
  the repo or in Testomatio), find the highest `<FOC>-NNN` and start at the next integer —
  never reuse or renumber issued ids; they become downstream test titles.
- These ids flow straight into `/test-write` as the test title prefix, so they must be
  stable and unique.

## Output format — `<AREA>_CHECKLIST.md` (exact)

Write the file with this structure, nothing extra:

```
# <Area> — Test Checklist

Targets <the page/feature, e.g. the WEB UI of /administration/user-accounts/>.
**Out of scope:** <e.g. API-level cases; destructive Delete (see Deferred)>.

**Priority legend:** `critical` = blocks core usage, corrupts data, or exposes a security
hole · `high` = frequently-used functionality users depend on · `medium` = secondary
features & common edge cases · `low` = cosmetic / rare / nice-to-have.

**Test-design techniques applied:** <list only the ones you actually used, e.g.
equivalence partitioning, BVA, decision tables, state transition, pairwise, error
guessing, exploratory, security, accessibility, persistence, i18n>.

---

## <Section — e.g. Page Load & Navigation>

- [ ] FOC-001: <one specific, observable behaviour + its expected result> (priority)
- [ ] FOC-002: <…> (priority)

## <Section — e.g. Filtering>

- [ ] FOC-003: <…> (priority)

## Deferred — do not implement

- [ ] FOC-NNN: <forbidden/destructive case + why deferred, e.g. Delete user — violates
      CLAUDE.md guardrail, never automate> (n/a)
```

Rules:
- Group cases into `## <Section>` blocks by concern (Page Load, Grid/Display, Sorting &
  Grouping, Filtering, Pagination, Selection & Toolbar, Detail Panel, Create/Edit,
  Validation, Permissions, State/Lock, Persistence, Security, Accessibility…). Sections
  are organizational; **ids stay globally sequential** across them.
- Every case line is `- [ ] FOC-NNN: <behaviour + expected result> (priority)`.
- The **`## Deferred — do not implement`** section is mandatory whenever a destructive or
  forbidden case surfaces — it is listed there, never silently dropped, and never handed
  to `/test-write`.

## The technique grid (the professional core)

After building the inventory (process step 2), run **each element / input / state /
action through this grid**, deliberately. Each line is the one-line how-to. Then dedup.

**Specification-based (derive from spec/UI structure):**
- **Equivalence partitioning** — split each input into valid / invalid / empty classes;
  emit ONE case per class (this is the primary space-collapser).
- **Boundary value analysis (BVA)** — for each ordered domain test min, max, just-under,
  just-over, empty, and max-length (e.g. name at limit vs limit+1; page 1 vs last page).
- **Decision tables** — enumerate combinations of conditions → expected outcome (e.g.
  External × Administrator × Partner flags; Active/Inactive × Lock/Unlock availability);
  one case per distinct rule, collapse don't-care rows.
- **Cause-effect graphing** — when several inputs jointly drive one output, map causes→
  effects to find the combinations that actually change behaviour (feeds the decision table).
- **State transition testing** — list states and legal/illegal transitions; cover each
  transition + at least one invalid one (e.g. Active → Locked → Active; lock an
  already-locked user is a no-op).
- **Pairwise / combinatorial** — when options interact (filter × sort × group × paginate),
  cover all pairs rather than the full cross-product to keep cases bounded.
- **Classification trees** — when an input has nested sub-classes, branch them and pick a
  representative leaf per branch (e.g. e-mail: missing @, missing domain, missing TLD,
  internal space, double @ — each a leaf).
- **Use-case / scenario testing** — walk the primary end-to-end flow and its main
  alternates as cases (create user → appears in grid → open detail → matches).
- **Domain analysis** — for interacting numeric/range inputs, test on/off/in/out points of
  each domain boundary together (e.g. page-size vs total-rows interactions).

**Experience-based (catch what the spec misses):**
- **Error guessing** — target likely-broken spots: nulls, duplicates, whitespace-only,
  trailing spaces, very long strings, double-submit, stale cache, out-of-range page.
- **Exploratory** — note behaviours the live page reveals that the requirement omitted;
  turn each surprise into a case (and flag the requirement gap).
- **Checklist-based** — sweep the standard concern list (the sections above) so no whole
  category is forgotten.

**Structural completeness (don't leave a hole):**
- **Full CRUD** — Create, Read, Update for each entity (Delete → Deferred per guardrail).
- **All states & transitions** — every status the entity can hold and every move between.
- **All roles / permissions** — each role's allowed and denied paths (admin vs non-admin).

**Non-functional lenses (juniors forget these — prompt EACH one explicitly):**
- **Security** — stored XSS in every free-text field; RBAC/authorization (non-admin
  denied the action); IDOR / parameter tampering (another user's id); injection (SQL/HTML
  treated as literal, no 500).
- **Accessibility** — keyboard operability (Tab/Enter/Space), focus trap in modals,
  labels & accessible names, ARIA state (aria-checked / aria-sort / aria-selected).
- **Performance / responsiveness** — large page sizes, many permission rows, debounce
  under rapid input — no freeze, indicator shown.
- **Localization / i18n** — labels translate, no untranslated keys, Unicode/Cyrillic/RTL
  input round-trips without mojibake.
- **Compatibility** — viewport widths, no horizontal-overflow of the document, cold deep-link.
- **Usability** — clear field-specific error messages, sensible defaults, empty states.
- **Data integrity & persistence** — the change survives reload AND reopen (re-fetch from
  server, not just client cache).
- **Concurrency / race** — double-submit creates ONE record; out-of-order async responses
  (click A then B then C → C wins); debounced filter races settle on the final state.
- **Large / empty data sets** — zero rows → no-data state; max page size; long unbroken token.
- **Error handling & recovery** — backend 500 / dropped network → error indication (not
  infinite spinner or blank), entered data preserved, retry recovers.

For DevExtreme DataGrid surfaces specifically, the technique grid maps onto: columns &
cell rendering (booleans as checkboxes, date format, status styling), sorting (asc/desc/
none cycle, multi-sort, stability), grouping (single/multi-level, counts, group sort),
filtering (filter-row vs header-funnel, AND/OR, operators), pagination (size set, bounds,
filtered counts), selection (current-page-only select-all, indeterminate, toolbar
enablement boundaries 0↔1↔2), and master-detail (correct user keying, stale-data race).

## Process — follow in order

1. **Scope it.** State the feature/page/requirement in one line and what's explicitly
   out of scope (e.g. API-level, destructive Delete). Pick the 3-letter focus code.
2. **Inventory the real surface.** Sources in priority order: the user's description →
   any written requirement (a doc, or Testomatio `requirements` via the
   `testomatio-edsson` MCP) → the **live page via the `playwright` MCP** (auth reuses the
   saved session — never type the admin password; exploration is **read-only**). List
   every control, column, action, input, state, role, default, and empty-state actually
   present. If a requirement exists, enumerate every acceptance criterion. **Flag any
   ambiguity or gap** you find for the summary — do not silently guess.
3. **Apply the technique grid per element.** For each inventory item, walk the grid above
   and jot candidate cases. Be generous here — divergence before convergence.
4. **Derive cases.** Turn each surviving candidate into a line that meets the quality bar
   (atomic, observable, expected result stated, automation-ready).
5. **DEDUPE.** Remove or merge any two cases that would pass/fail for the same reason or
   assert the same behaviour through a different control. This is mandatory, not optional.
6. **Prioritize by risk.** Assign critical/high/medium/low per the legend, using impact ×
   likelihood. Security, data-corruption, and core-flow cases trend critical/high.
7. **Assign `<FOC>-NNN` ids.** Number sequentially across the whole file; continue any
   existing numbering for this area — never reuse issued ids.
8. **Write `<AREA>_CHECKLIST.md`** in the exact format above (header block → `##` sections
   → cases).
9. **Deferred section.** Put every forbidden/destructive case (Delete, anything that
   corrupts shared data) under `## Deferred — do not implement` with a one-line reason.
   Never drop them silently; never hand them to `/test-write`.
10. **Summarize & hand off.** Report counts by priority, the total, and every requirement
    gap / ambiguity you flagged. Optionally (on request) sync cases into Testomatio as
    manual tests (`tests_create` / `suites_create`). Point the top-priority items at
    `/test-write` for automation.

## Guardrails (from CLAUDE.md — never violate)

- **Read-only on the live app.** Explore via the `playwright` MCP only; never type the
  admin password; never run mutating/destructive flows just to "see what happens".
- **Destructive/forbidden cases go to Deferred**, not into the implementable checklist —
  Delete (single or bulk) and anything that corrupts shared/real data.
- This skill produces a **checklist, not code.** It does not write tests or open PRs —
  that is `/test-write`.
