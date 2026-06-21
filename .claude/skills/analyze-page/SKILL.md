---
name: analyze-page
description: Analyze a live Edsson page via the Playwright MCP and WRITE its verified LOCATOR layer into lib/pages/<page>.page.ts — derive robust locators from reality, confirm each matches exactly one element, then commit them as private fields + factories (scaffolding class + mixin + WebClient + AppRoute when the object is new). Writes LOCATORS ONLY — no @step methods (that's /sdk-builder), no tests (that's /test-write). Use when asked to analyze/map/read a page, capture or build selectors, or stand up a Page Object's locators before building methods.
---

# Analyze a live page → write its LOCATOR layer

The precision-critical SELECTOR phase. Read a real page through the **playwright** MCP, derive
**robust, verified** locators, and write them as the **locator layer** of `lib/pages/<page>.page.ts`
(private fields + factories; class + wiring if the object is new). Bad selectors poison every
downstream test, so the discipline is **snapshot → enumerate → derive → verify → SWEEP → write, ONCE** —
no guessed CSS, no trial-and-error loops against the live app.

**Hard boundary — you write LOCATORS only.**
- THIS skill (selector layer): private locator fields + factories + (for a new object) class scaffold,
  mixin, `WebClient` composition, `AppRoute`. Nothing else.
- `/sdk-builder` (method layer): owns the `@step` act-and-return methods built on these locators.
- `/test-write` (test layer): owns the specs.
Leave a placeholder comment where methods will go. **Do NOT write `@step` methods. Do NOT write tests.**
If you feel the urge to add behavior, stop — wrong layer. When done, hand off to `/sdk-builder`.

Project rules in `CLAUDE.md` always apply. Lean on the shared docs; do not re-derive their detail:
- `.claude/docs/playwright-guide.md` — extraction protocol, locator philosophy, DevExtreme fallbacks, encapsulation.
- `.claude/docs/code-style-guide.md` — POM structure / fixtures / SOLID / `@step` (so locators land in the right shape).
- `.claude/docs/git-ci-guide.md` — branch + PR flow for landing the code.

---

## The locator priority ladder — the HEART of this skill

Every locator is one decision: **walk this ladder top-down and commit the HIGHEST tier that uniquely +
stably identifies the element.** Never drop a tier when a higher one works — not to CSS when a
`getByRole` resolves, not to XPath when a scoped CSS resolves. The tier you used is reported per element.

### Tier 1 — Playwright built-in, user-first locators (STRONGLY PREFER)
`getByRole(role, { name })` · `getByLabel` · `getByPlaceholder` · `getByText` · `getByAltText` ·
`getByTitle` · `getByTestId`.
**Why first:** they target the element the way a user and assistive tech perceive it (role + accessible
name), so they survive DOM restructures, class-hash churn, and CSS refactors. This is Playwright's
official recommendation and the default for everything this app exposes through clean ARIA — buttons,
links, labelled inputs, headings, `aria-checked` checkboxes, `aria-sort` headers. `getByRole(..., { name })`
is the default reach; prefer accessible-name matching over brittle structure every time.

### Tier 2 — stable CSS (only when Tier 1 can't uniquely + robustly reach it)
Stable structural classes and prefix partials, **tightly scoped to a stable parent**:
- DevExtreme structural hooks: `.dx-data-row`, `.dx-select-checkbox`, `.dx-texteditor-input`,
  `.dx-invalid`, `.dx-popup-wrapper`, `.dx-checkbox-checked` — stable across builds.
- CSS-module classes are **hashed and rebuild-volatile** → never the raw literal; use a `[class*="StablePrefix"]`
  partial on the human-authored prefix (e.g. `[class*="UserAccountForm_formLabel"]`), scoped to its container.

### Tier 3 — XPath (LAST resort)
Relative XPath only, anchored to a nearby stable node, when neither role nor CSS can express the
relationship (e.g. "the input that follows this label"). Reach here almost never. **Never absolute XPath.**

### Per-element rule
Highest tier that is **unique + stable** wins. Tier 1 by default; descend only when the page genuinely
offers no clean accessible handle — common for DevExtreme grid internals (reconcile per the guide: ARIA
where the widget exposes it cleanly, `.dx-*` / prefix partials for the grid plumbing it doesn't; scope
every grid sub-part to the grid container).

### BANNED — these are not locators, they are future flakes (ban + the fix)
- `nth-child` / `:nth-of-type` / any positional chain → scope to a stable parent and match by role/name instead.
- Long brittle descendant chains (`div > div > span > …`) → anchor on the nearest stable container.
- Raw fully-hashed class literals (`.UserAccountForm_formLabel__a1B2c`, change per build) → use a
  `[class*=]` partial on the stable, human-authored prefix.
- Volatile or localized **text** as the **sole** anchor → anchor on role/structure, name as a refinement.
- Absolute XPath (`/html/body/...`) → relative XPath off a stable node, or climb the ladder back to CSS/role.
- Blind `.first()` / `.nth()` to paper over a non-unique match → fix the locator (scope / name / anchor).

---

## Completeness & attentiveness — miss NOTHING (highest-priority dimension)

This team judges this skill on **coverage**. A silently dropped checkbox is a worse failure than an
imperfect tier choice. Work in two passes, then prove you missed nothing.

**Pass 1 — enumerate.** From the snapshot, list **every** region and **every** interactive or observable
element the page exposes — adapted to what THIS page actually is (taxonomy below). Capture state-bearing
elements too (validation anchors, empty states, enabled/disabled scopes), not just the obvious controls.

**Pass 2 — the COMPLETENESS SWEEP (self-critique).** Re-read the **full** `browser_snapshot` region by
region and ask: *"what interactive or observable element — every state, every action — did I NOT
capture?"* Assume you missed something until the sweep proves otherwise. Hunt the classics against the
snapshot, not memory:

- row checkbox **vs** header **select-all** (two distinct controls); bulk-action bar that appears only on selection
- empty / no-data / loading state
- validation-**invalid** anchors (`.dx-invalid`, error text) for **each** field
- disabled-vs-enabled **scope** of action buttons (a button present but disabled is still a locator)
- pager / page-size / total-count; column headers used for sort or filter
- tabs, sub-tabs, accordion sections, tooltips, badges, status pills
- **every** form field — text, dropdown/lookup, date, **toggle/checkbox, radio**, file — plus **both**
  Save **AND** Cancel (and any Close/✕)
- confirm/cancel inside dialogs and toasts/notifications

**Not-present is explicit.** A region or element genuinely absent on this page gets a one-line
**"not present on this page"** note in the report — **never** a silent drop. "I didn't see one" is not
"there isn't one"; only the sweep lets you say the latter, and the reviewer must see you considered it.

---

## Region taxonomy — ADAPT to the page; don't assume a grid

Pick the regions THIS page actually has. A grid is **one case**, not the template; most pages combine
several (e.g. a grid **plus** a create dialog). A region you don't have is simply marked absent.

- **Data grid / table** — toolbar (search, add, bulk actions), column headers (sort/filter), data rows +
  cells, **row select checkbox vs header select-all**, pager/page-size, empty/no-data state, row-level actions.
- **Form / wizard** — each field by label (text, dropdown/lookup, date, **toggle/checkbox, radio, file**),
  section headers, step indicator/nav, validation anchors, **Save / Submit / Next / Back / Cancel**.
- **List / cards / feed** — repeating item → **factory** (verified on a real sample), per-item title +
  actions, selection, empty state, load-more / infinite-scroll trigger.
- **Nav / tabs / menu** — top nav, sub-nav, tab strip, breadcrumb, account/overflow menu, active-state indicator.
- **Detail / read panel** — labelled read-only field↔value pairs, status badges, action buttons, related sub-sections.
- **Dialog / drawer / toast** — container (role `dialog`), title, body fields, confirm/cancel, close/✕, notification text.
- **Cross-cutting states (check on every shape):** loading/skeleton · empty · error/toast · disabled vs
  enabled · selected/active · locked vs active · expanded vs collapsed — each needs its own anchor.

For **repeated** elements (rows, cards, list items) write a private **locator factory** — a function that
takes an identifier and returns a scoped locator — **verified against a REAL sample**, not a hand-written guess.

---

## Verify before you write — exactly ONE

Every locator is proven against the live DOM **before** it lands in the file. The bar is **strict-mode
clean: exactly one match.** The deterministic loop is **derive → verify → write, once per element:**

1. **Derive** the candidate by walking the priority ladder **top-down** off the snapshot (role +
   accessible name first). For what the a11y tree can't expose — DevExtreme internals, hashed CSS-module
   classes — `browser_evaluate` the **real DOM/attributes**; never assume a class name.
2. **VERIFY it resolves to EXACTLY ONE element** (Playwright strict mode) — count matches via
   `browser_evaluate` or the snapshot's own uniqueness. Judge the count:
   - **1** → done, write it.
   - **0** → wrong handle. Re-derive (different role/name, different scope) — do **not** loosen blindly.
   - **>1** → not unique. **Scope to a parent**, **add an accessible name**, or **anchor** it — then
     **re-verify**. **Never** resolve ambiguity with a blind `.first()`.
3. **Write** the locator into the file ONLY once verified. No retry loops, no unverified guessed CSS.

Repeated elements → a **factory**, verified on a **real sample** value pulled from the live page — record
the sample used. No locator is "done" on inspection alone; only on a clean resolve.

---

## Process

1. **Identify the page, route & whether the object exists.** Name the page and its route — known routes
   live in `AppRoute` (`lib/pages/edsson-app.ts`); if unknown, reach it through the app surface via `NAV`
   (`lib/pages/components/nav.types.ts`). Check `lib/pages/` for an existing page/component object (`*.page.ts` / `components/*.component.ts`) and set the mode:
   - **EXISTING object** → **ADD only the new/missing private locators.** Do NOT touch its methods, its
     other locators, or any other section.
   - **NEW object** → **scaffold** the class + wire it in (§6b), then write its locators.
2. **Navigate + auth (READ-ONLY).** `browser_navigate` to the route; auth via the saved
   `session-storage.json` (the suite's globalSetup produces it). **Never type the admin password.** Dev app
   is on Azure → first load may cold-start (20–40s): wait, don't thrash. Strictly **read-only against the
   app** — snapshot, hover, read DOM. **No create/edit/lock/delete clicks, no submits, just to look.** To
   inspect a dialog, open it via a non-destructive trigger and Escape/Cancel out — never Save. (Writing the
   local `.page.ts` is expected; mutating the app is not.)
3. **Snapshot + enumerate the regions (adapt the taxonomy).** `browser_snapshot` FIRST — the
   **accessibility tree** (roles + accessible names) is the source of truth and maps directly to
   `getByRole`/`getByText`/`getByLabel`. **Classify what THIS page actually is**, then enumerate only the
   regions it has (taxonomy above) — from the snapshot, not imagination.
4. **Derive + VERIFY each locator.** Ladder top-down → resolve → **exactly one** before it's done (the
   verify-before-you-write loop above). Factory for repeated elements, verified on a real sample.
5. **COMPLETENESS SWEEP.** Re-scan the full snapshot region by region; capture the stragglers; mark genuine
   absences **"not present"**. Treat anything you can't positively account for as a miss until the snapshot
   proves otherwise.
6. **WRITE the locator layer** into `lib/pages/<page>.page.ts`:
   - **6a. The locators (both modes).** **Private fields**, intent-named nouns (`createBtn`, `grid`,
     `emailInput`) — never selector-named; grouped by region with a short comment banner per region; match
     the existing style in `user-accounts.page.ts` / `login.page.ts` (`private readonly`, scoped children).
     **Every locator is `private` — no exceptions.** Encapsulation is the contract: a test must **never**
     touch a selector; only the `@step` methods `/sdk-builder` builds on these locators expose behaviour.
     A locator you're tempted to make `public` is a design smell — the missing piece is a *method*
     (route it to `/sdk-builder`), never an exposed selector.
     Repeated/parameterized elements → a **private locator factory**, verified on a REAL sample before
     writing, e.g. `private row = (login: string) => this.grid.locator(".dx-data-row", { hasText: login });`.
     Top the block with a **verification banner** recording **what the locators were verified against and
     WHEN**:
     ```ts
     // ════════════════════════════════════════════════════════════════════════
     // SELECTORS — verified against the live DOM (YYYY-MM-DD). Where ARIA is
     // ambiguous (…), the unique title/attribute is used or the locator is scoped.
     // ════════════════════════════════════════════════════════════════════════
     ```
     **EXISTING object:** insert ONLY the new locators into the matching region (or add a new region banner).
     Touch nothing else — not its methods, not its existing fields.
   - **6b. Scaffold + wiring (NEW object ONLY).** First **decide the object type** (canon:
     `.claude/docs/code-style-guide.md`): bound to ONE route/screen → a **page object** (`<page>.page.ts`);
     a reusable widget that appears on ≥2 pages (header, nav, a shared dialog/grid) → a **component
     object** (`components/<widget>.component.ts`), **page-agnostic, no route**. Then create the class and
     wire it in, leaving the methods area as a placeholder:
     - **Class** → `export class <Name>(Page|Component) extends BasePage { … }` (import `step`,
       `BasePage`, `Locator` like the existing objects). SELECTORS banner + locator fields, then a single
       placeholder — **write no methods:**
       ```ts
       // ── METHODS — added by /sdk-builder (do not add @step methods here) ──
       ```
     - **Mixin** (`lib/pages/mixins.ts`): add a `<Name>Mixin` mirroring the existing mixins.
     - **Compose** (`lib/pages/edsson-app.ts`): wrap the new mixin into the `WebClient` composition chain
       alongside the existing mixins.
     - **Route** (`AppRoute`): a **page object** with a known direct route → add it; a **component object
       has no route** → skip.
7. **`npx tsc --noEmit`** — must pass clean (locator fields + any wiring type-check). Stay read-only on the app.
8. **Report + hand off.** Then hand to **`/sdk-builder`** for the `@step` methods.

---

## Report format

Organized **by region** so completeness is auditable:
- **Page / route** + mode (**new** vs **extended**), file path.
- **Locators by region**, each with its intent-name and the **tier used** (Tier 1 `getByRole`/`getByLabel`
  vs Tier 2 `.dx-*` / `[class*="Prefix"]` vs Tier 3 XPath) — i.e. **ARIA-clean vs fallback**, per element.
- **Factory** for repeated elements + the real sample value it was verified against.
- **Completeness ledger:** every region either captured or marked **"not present"**; plus **gaps** — states
  only reachable by mutating the app (e.g. a validation-invalid state needing a submit) flagged, NOT triggered.
- **Verification:** all locators resolve to exactly one element; `tsc` clean.
- **Handoff:** report what was captured, then **offer the next step** via `AskUserQuestion`
  (CLAUDE.md Interaction model), don't auto-proceed: *[▶ proceed to `/sdk-builder`] [✏ capture more
  locators] [⏸ stop]*.

---

## Guardrails (from CLAUDE.md — do not violate)

- **READ-ONLY on the app:** navigate / snapshot / read / hover only. No create/edit/lock/delete clicks, no
  submits to "look around". **Never type the admin password** — auth via the saved session.
- **LOCATORS ONLY.** No `@step` methods (that's `/sdk-builder`), no test code (that's `/test-write`). A new
  object is created WITH locators and a methods placeholder — nothing more. If you feel the urge to add
  behavior, stop — wrong layer.
- **Verified-or-it-doesn't-exist:** an unverified locator does not get written. 0 or >1 → re-derive/scope,
  never blind `.first()`.
- **Highest stable tier wins** — Tier 1 user-first by default; CSS only when no clean accessible handle;
  XPath almost never. No banned patterns.
- **EXISTING object = add-only.** Never rewrite or remove its methods or unrelated locators.
- Never delete accounts; mutating exploration is out of scope here entirely.
- **Branch + PR**; the QA lead reviews and merges — never push to `dev`/`prod`, never auto-merge. **tsc green** before hand-off.
