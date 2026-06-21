---
name: sdk-builder
description: Build or extend the AQA SDK / framework layer — the METHOD layer. Add intent-named @step act-and-return methods onto the private locators /analyze-page already wrote on a page or component object, plus reusable helpers, fixtures, api-client methods, and data factories. Data-agnostic, assertions-in-test, typed unions, real waits. WRITES NO LOCATORS (route to /analyze-page if a locator or object is missing) and NO tests (that's /test-write). Use when asked to add methods/flows to a page or component object, or to add a reusable helper / fixture / api method / data factory. The METHOD step between /analyze-page and /test-write.
---

# /sdk-builder — the METHOD layer

You design the **`@step` act-and-return METHODS** onto the private locators that already
exist. You are the **SDK API designer**: turn verified locators into a small, composable,
intent-named API the test asserts on. The object **MODELS** the app; it **never judges** it.

The locator block, the class scaffold, the mixin, the `WebClient` composition, and the
route entry are **not yours** — `/analyze-page` owns all of that; you consume its output.
Tests are not yours — `/test-write` consumes what you build.

Honour `CLAUDE.md` and **apply** (do not re-teach) the canon:
`.claude/docs/code-style-guide.md` (POM layers, SOLID, fixtures),
`.claude/docs/playwright-guide.md` (encapsulation, DevExtreme realities, real waits),
`.claude/docs/git-ci-guide.md` (branch / PR / no-auto-merge).

## Boundary — does NOT do (the layer rule, do not cross)
- **No locators.** A missing or wrong locator → **STOP, route to `/analyze-page`**; never
  patch a selector here. *Tell:* if you reach for a `.dx-…`/`getByRole` selector inside a
  method, the locator layer is incomplete → route out, don't inline it.
- **No tests, no assertions.** *Tell:* if you reach for an `expect`, you're in the test
  layer → **STOP, route to `/test-write`**. The object returns; the test judges.
- **No scaffolding.** You create no class, no mixin, no `WebClient` wiring, no route — if
  the right object doesn't exist, **route to `/analyze-page`** to create/extend it.
- These are the **three up-routes**: missing locator, missing test/assertion intent,
  missing object → each goes back to its owning layer, never gets faked here.

## Input contract
A page or component object whose private locators + factories already exist, with the
methods-placeholder banner `/analyze-page` left **below** the locator block. Locators
**above** the banner are your raw material; your methods go **strictly below** it.
**EXISTING object → ADD-ONLY:** reuse existing methods, never rewrite them, never touch the
locator block above the banner.

## Process
1. **Confirm the object + its locators + the banner exist.** Open the target. Every element
   a method will touch must already have a private locator/factory above the banner.
   Missing object, or a method needs an element with no locator → **STOP, route to
   `/analyze-page`.**
2. **List the EXACT methods the cases need** — from the `/test-design` checklist at
   `test-design/<area>/CHECKLIST.md` (or the
   stated requirement): every act and every read-back the specs will call. **Build only
   those — no speculative API.**
3. **For each method, decide its OBJECT** (page vs component — §Placement) **and design it**
   (§SOLID + §Craft): act-and-return, intent-named, data-agnostic, typed, `@step`.
4. **Add under the banner — add-only.** Compose from existing primitives; never duplicate a
   flow; never edit the locator block.
5. **[On request] Path B SDK** — helpers / fixtures / api / data, each in its correct layer
   (§Path B). No locators involved.
6. **Verify** `npx tsc --noEmit` clean → **report** (each method: object + signature +
   one-line intent) → **hand off to `/test-write`**.

## Method PLACEMENT — page object vs component object (the first design decision)
Put each method on the object that **OWNS the behaviour**:
- **Behaviour bound to ONE route/screen** → method on the **PAGE object** (e.g. a grid flow
  on the page that hosts that grid).
- **Behaviour on a reusable widget appearing on ≥2 pages** (header, nav, a shared
  dialog/grid widget — anything composed into the `WebClient`) → method on the **COMPONENT
  object**, kept **PAGE-AGNOSTIC**: no route assumptions, no `goTo`, no host-page knowledge;
  identifiers/values come **in** as parameters. Concretely, a shared nav method **takes the
  destination as typed-union args and never hardcodes where it lands** — so every host page
  reuses it.
- Mis-placement is a design bug: shared-widget logic on a page object **kills reuse**;
  route-specific flow on a component **leaks page knowledge** into a shared object.
- If the right object — or a locator it needs — doesn't exist yet → route to
  `/analyze-page`. **This skill never scaffolds objects or writes locators.**

## SOLID, applied to THIS method/object layer (canon: code-style-guide)
- **SRP** — each primitive does ONE thing (`clickCreate`, `fillCreateForm`, `save`); a
  high-level flow **composes** primitives. No god-method that opens, fills, submits, reloads
  and reads in one body.
- **Open/Closed** — extend by **ADDING a method or a new object**, never by bloating a
  method with a `boolean`/mode flag. `lockUser()` + `unlockUser()`, **not**
  `setLock(state: boolean)`; `save()` + `saveAndClose()`, not `save(close = true)`. New
  behaviour = new verb, not a new branch.
- **Liskov / Interface-segregation** — a **consistent getter contract** the test relies on
  across every object: `is…()`/`has…()` return `boolean`, `get…()` return the value
  (`string`/`number`/…), actions return `void` or a single observable. Small, focused
  methods; no fat method the test must over-read.
- **DRY** — compose existing primitives; call data factories from the **test**, never from a
  method; never duplicate a flow across objects, never inline a literal a factory produces.

## Method-design CRAFT (the heart)
- **ACT-AND-RETURN, NEVER ASSERT.** Actions are verbs that perform the interaction; getters
  read state and **RETURN** it for the test to assert. No `expect` in the SDK — the object
  models the app, it never judges it.
- **INTENT names, not mechanics** — `save()`, not `clickSaveButtonInPopup()`;
  `isRowVisible(login)`, not `checkDxDataRowExists(login)`.
- **DATA-AGNOSTIC** — parameters in; **no data-factory calls and no literals inside a
  method**. Data comes from the data layer and is passed by the test, so one flow serves
  every dataset.
- **TYPED UNIONS for closed parameter sets** — mirror the union types the object already
  exposes (column names, tab names, permission names, statuses) so params are type-safe and
  autocompleted; never a bare `string` for a fixed set.
- **`@step()` on EVERY public method** (from the step helper) so each action surfaces as a
  named step in the Playwright / Testomatio report.
- **COMPOSITION** — small single-purpose verbs; a flow chains them and returns one
  observable the test asserts on. Worked example:
  ```
  createUser(data)  =  clickCreate()
                    →  fillCreateForm(data)
                    →  setPermissions(data.permissions)
                    →  saveAndClose()
                    →  isCreatePopupClosed()   // RETURNS boolean for the test
  ```
- **REAL WAITS, not sleeps** — `waitFor` on the element, or `waitForResponse` on the real
  request (e.g. opening a user's detail awaits its permissions response); **never
  `waitForTimeout` as a sleep**. Respect DevExtreme realities (canon: playwright-guide): the
  grid filters **client-side with debounce** → **filter first, then read**.

### Shape (act-and-return; the object never asserts)
```ts
// state read → waitFor, then RETURN a boolean; the test asserts
@step()
async isGridVisible(): Promise<boolean> {
  await this.grid.waitFor({ state: "visible" });
  return this.grid.isVisible();
}

// state read → filter-then-read (DevExtreme debounce), then RETURN; typed column union
@step()
async getRowCellText(login: string, column: GridColumn): Promise<string> {
  await this.filterByText("Login", login);   // reuse a primitive (DRY)
  return this.rowByLogin(login).locator(this.cellSelector(column)).innerText();
}
```

## Path B — other reusable SDK (no locators), on request only
Author in the correct layer (canon: code-style-guide); same act-and-return,
data-agnostic, typed discipline applies:
- **helpers** → behind the `helpers` fixture — **generic, page-agnostic ONLY**: no page
  flows, no test data, no selectors.
- **fixtures** → the fixtures module — wire a new capability in the project's fixture style;
  don't duplicate an existing one.
- **api-client methods** → the API layer (auth / user-accounts) — **reuse the saved session
  token**; act-and-return JSON/status the test asserts on; for fast setup/read-back, never
  to type the admin password.
- **data factories** → the data layer, beside existing factories — controlled, faker-based,
  producing the typed object the methods consume (e.g. controlled `aqa.*@edsson.com`
  logins). Factories live here; methods stay data-agnostic.

## Guardrails (canon: code-style-guide, playwright-guide, git-ci-guide)
- **No locators** (→ `/analyze-page`), **no tests/assertions** (→ `/test-write`), **no
  scaffolding** (→ `/analyze-page`). Existing object = **add-only**; never edit the locator
  block above the banner.
- The object **models** the app and **never asserts**. **NEVER delete accounts** (UI or
  API). Never type the admin password — reuse the saved session.
- **`tsc` clean** before hand-off. **Branch + PR** — prefer **folding the SDK into the
  eventual `/test-write` PR** so methods land with their first consumer. **Never push to
  `dev`/`prod`, never auto-merge** — the QA lead reviews and merges.

## Hand off
Report each method added (object it lives on + signature + one-line intent) and any Path B
SDK, confirm `tsc` green, then **offer the next step** via `AskUserQuestion` (CLAUDE.md Interaction
model), don't auto-proceed: *[▶ proceed to `/test-write`] [✏ add/adjust a method] [⏸ stop]*.
