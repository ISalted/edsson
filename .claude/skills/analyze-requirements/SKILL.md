---
name: analyze-requirements
description: Turn business requirements — a stated spec (pasted Jira ticket, doc/text file, prose) OR a missing/weak one you must DERIVE from the live app + domain — into a clean, atomic, TESTABLE, ID'd requirements artifact that /test-design consumes. Read the source critically, extract explicit AND implicit/non-functional requirements, audit each against the ISO/IEC/IEEE 29148 quality characteristics (keystone: Verifiable — acceptance criteria mandatory), resolve every ambiguity by asking or flagging an assumption (never silently invent), and write <AREA>_REQUIREMENTS.md with REQ-IDs + acceptance criteria + traceability. Use when asked to analyze/clarify/refine/intake requirements, a ticket, a spec, or acceptance criteria — including when there is no spec and you must recover requirements from the app. The step BEFORE /test-design — produces REQUIREMENTS ONLY, no test cases, no automation.
---

# Analyze requirements (requirements intake)

The **first** phase of the QA pipeline, upstream of everything: business input becomes a
clean, atomic, **testable** requirements artifact. `/test-design` reads that artifact to
build the `<FOC>-NNN` checklist; every downstream test case traces back to a **REQ-ID**
here. Garbage requirements produce garbage coverage — this layer is the gate.

You act as the **requirements engineer / business analyst**: read critically, find what's
missing as hard as what's stated, audit against a recognized standard, and refuse to let
ambiguity through silently. The bar is **ISO/IEC/IEEE 29148** (the requirements-engineering
standard), and for AQA the keystone characteristic is **Verifiable** — *no acceptance
criteria => not yet a requirement.*

Output is a single markdown file `<AREA>_REQUIREMENTS.md`. This skill is self-contained:
quality characteristics, audit, REQ format, and process are all below.

## Input — TWO source modes (most features are a MIX)

A requirement here is the *answer to "what must be true"*, not "how we'd check it in the
UI". Keep acceptance criteria observable but tool-agnostic. The source comes in two modes:

- **Source A — a stated spec** (current behaviour, textual): pasted prose, a file path
  (Read it), or a pasted Jira ticket. There is **no Jira MCP** — the user pastes / gives a
  path; you read it, you don't fetch it. Theory-heavy, no app interaction.
- **Source B — no / weak / missing spec → DERIVE** ("requirements recovery", testing
  without a spec). The common reality here (Edsson has no formal spec). The source becomes
  the **live app behaviour** + **domain conventions** + **the user as context holder** —
  see the Source B section below.

**Mixed reality is the norm.** Most features are PARTIAL spec: some requirements come from
Source A, the gaps are Source B-derived. Apply Source-A rigor to the stated parts and the
Source-B discipline (oracles, coverage heuristics, `derived` status) to the recovered parts.

## Scope — what this skill does and does NOT do

- **Produces REQUIREMENTS ONLY** — refined, atomic, acceptance-criteria'd, ID'd needs.
- **NOT test cases** (`<FOC>-NNN` cases are `/test-design`), NOT locators/methods/tests.
- Source A does **not** touch the app. Source B reads the app **only to observe behaviour**
  (via `/analyze-page` / the Playwright MCP) — read-only, never mutating, never writing `lib/`.

## The quality bar — ISO/IEC/IEEE 29148 characteristics

Audit **every** requirement against these seven. For each defect, name the characteristic
it violates and why. The AQA keystone is **Verifiable** — enforce it hardest.

1. **Necessary** — traces to a genuine business need; no gold-plating / scope creep. *Tell:*
   a "requirement" no stakeholder asked for, or that restates a UI detail as a need.
2. **Unambiguous / Clear** — exactly one interpretation. *Tell:* weasel words — "fast",
   "user-friendly", "intuitive", "robust", "should be able to", "support", "handle",
   "appropriate", "as needed", "etc." Each must be replaced with a measurable bound.
3. **Complete** — states inputs, outputs, **and** error / edge / negative behaviour. *Tell:*
   happy-path only; "TBD"; a trailing "etc." standing in for unenumerated cases.
4. **Singular / Atomic** — one requirement = one need. *Tell:* "and" / "or" / a comma list
   bundling behaviours ("validate the email **and** send a welcome mail"). Split them.
5. **Consistent** — no contradiction with any other requirement in the set. *Tell:* two
   reqs giving different limits/defaults/outcomes for the same condition.
6. **Feasible** — implementable within the app and tech constraints. *Tell:* assumes a
   capability the product/stack doesn't have, or conflicts with a known guardrail.
7. **Verifiable / Testable** *(keystone)* — an objective pass/fail check exists; the req
   carries explicit **acceptance criteria**. *Tell:* no criteria, or criteria that aren't
   observable ("works correctly", "looks good"). **Missing acceptance criteria => it is not
   yet a requirement — resolve before it ships from this skill.**

**Set-level audit** (the whole artifact, not just each line):
- **Complete (as a set)** — no gap in the feature: all states, roles, and inputs the
  feature implies have at least one requirement.
- **Consistent (as a set)** — no two requirements conflict.
- **Non-redundant** — no two requirements state the same need; merge duplicates.

## Extract EVERYTHING — the classic failure is losing the implicit / NFR ones

Pull out, explicitly:
- **Explicit** requirements — what the source states outright.
- **Implicit** requirements — what the business assumes but didn't write (e.g. "edit a
  user" implies the change **persists** and **survives reload**; "create a user" implies
  **uniqueness** of the key and **validation** of inputs).
- **Functional** — behaviour, inputs → outputs, state transitions, CRUD.
- **Non-functional** — the ones juniors drop. Sweep each lens explicitly:
  **permissions/RBAC**, **validation** (format, length, required, uniqueness),
  **security** (authz, injection/XSS treated as literal, no IDOR), **persistence/data
  integrity**, **performance/responsiveness**, **accessibility**, **i18n/localization**,
  **error handling & recovery**, **concurrency**, **empty/large data**.

If the source is silent on a lens that the feature plainly needs, that is a **gap** — do
not invent the answer; ask, flag an assumption, or (Source B) derive it as `derived`.

## Source B — deriving requirements without a spec

When there is no / a weak spec, the requirement source shifts to three things: the **live
app behaviour** (observe via `/analyze-page` / the Playwright MCP, read-only), the **domain
conventions** (the app's `NAV`/structure and standard validation / permissions / persistence
norms), and **the user** as the context holder (ask when judgment is needed). Output is
still `REQ-<AREA>-NNN` + acceptance criteria — but with two disciplines that Source A doesn't
need:

**The oracle problem (the keystone caveat).** With no spec, codifying "what the app does"
makes tests pass by construction and **blind to a wrong-but-shipped behaviour**.
**As-built != as-intended.** Therefore:

- **Do not canonize observed behaviour as a confirmed requirement.** Judge correctness with
  **heuristic test oracles** — *consistency oracles*: a behaviour is suspect if it's
  inconsistent with its **History**, the product's own **internal consistency**, **Comparable**
  products, the **Claims / UI text**, reasonable **User** expectations, the feature's
  **Purpose**, or **Standards / familiar conventions**. When observed behaviour conflicts
  with a consistency oracle, raise it as an **open question / suspected defect** — **NOT** as
  a requirement.
- **Be complete without a requirement list** via **coverage heuristics**, so derivation
  isn't just the happy path you happened to see:
  - **Product-element sweep** — walk every facet: **Structure** (fields, screens, `NAV`
    location), **Function** (each capability + its negative/error path), **Data** (inputs,
    defaults, persisted state, empty/large/boundary), **Interfaces** (UI + APIs), **Platform**
    (browser, auth/session, DevExtreme), **Operations** (roles + real workflows), **Time**
    (ordering, concurrency, timeouts/debounce, persistence across reload/session).
  - **CRUD × entity × role × state** — for every entity the feature touches, every role that
    can reach it, every state it can be in, ask what Create / Read / Update / Delete *should*
    do — **including the forbidden ones** (delete is out of scope here, so the requirement is
    that it is *blocked*, not merely absent). This is what turns one observed happy path into
    a full grid of derived requirements.
- **Every Source-B requirement gets status `derived`** — "inferred from the app/domain, not
  confirmed by the business — validate before relying on it." List the **load-bearing**
  derived requirements in Open Questions for business validation.

**Tie-ins (don't duplicate those skills):** Source B leans on `/analyze-page` for real
behaviour and on the `/test-design` technique grid + domain reasoning for coverage; the
user is asked when judgment is needed.

## Resolving gaps & ambiguity — ask OR flag, NEVER silently invent

For every defect, gap, or ambiguity, choose exactly one:
- **(a) Ask** — a sharp, specific clarifying question with options where possible. Not
  "what about validation?" but "Max login length — the source says nothing. Is it 64
  chars (matches the existing User schema) or unbounded?"
- **(b) Assume** — record an **explicit, flagged ASSUMPTION** so `/test-design` and the
  team can validate it. Mark the requirement's status `assumed` and list it in the Open
  Questions section.
- **(c) Derive** (Source B only) — recover the requirement from app + domain, mark it
  `derived`, and list the load-bearing ones for business validation.

**Never** paper over a gap by quietly writing a plausible-sounding requirement as `clear`.
A silent invention is the worst failure of this layer: it looks like a confirmed need and
gets tested as one. When in doubt, flag it.

## REQ-IDs — `REQ-<AREA>-NNN`

Stable id per area: `REQ-` + the **uppercase area code** (reuse the same focus code the
downstream checklist will use — User Accounts → `UAC`, Groups → `GRP`, Lock → `LCK`) +
zero-padded **sequential** number: `REQ-UAC-001`, `REQ-UAC-002`, …

- One area per artifact; number globally across the file in appearance order.
- **Continue existing numbering** — if a `<AREA>_REQUIREMENTS.md` already exists, start at
  the next integer; never reuse or renumber an issued id. Downstream `<FOC>-NNN` cases cite
  these ids in their traceability, so they must be stable.

## Output format — `<AREA>_REQUIREMENTS.md` (exact)

```
# <Area> — Requirements

**Source(s):** <ticket id / file path / "pasted prose, 2026-06-21" / "derived: live app + domain"> — record every source for traceability.
**Scope:** <one line: the feature this artifact covers>.
**Out of scope:** <what the source mentions but this artifact excludes>.

**Status legend:** `clear` = unambiguous & confirmed · `assumed` = filled by a flagged
assumption (validate before test-design) · `derived` = inferred from the app/domain, not
confirmed by the business (Source B — validate before relying on it) · `needs-clarification`
= blocked on an open question.

**Standard:** audited against ISO/IEC/IEEE 29148 (Necessary, Unambiguous, Complete,
Singular, Consistent, Feasible, Verifiable + set-level completeness/consistency/non-redundancy).

---

## <Section — e.g. Creation>

### REQ-UAC-001 — <one-sentence requirement statement>
- **Type:** functional | validation | security | permissions | a11y | persistence | i18n | performance | error-handling
- **Priority:** critical | high | medium | low
- **Acceptance criteria:**
  - Given <precondition>, When <action>, Then <objectively observable outcome>.
  - <additional objective condition / negative case>.
- **Source:** <ticket §/line / file / "implicit — assumed" / "derived — observed in app + domain norm">
- **Status:** clear | assumed | derived | needs-clarification

### REQ-UAC-002 — …

## Open questions & assumptions

**Open questions (blocking — answer before /test-design):**
- Q1 (REQ-UAC-00X): <sharp, specific question + options>.

**Suspected defects (Source B — observed behaviour conflicts a consistency oracle):**
- D1 (REQ-UAC-00Z): <observed behaviour, which oracle it fails, why suspect>.

**Assumptions (flagged — validate):**
- A1 (REQ-UAC-00Y): <the assumption made, why, and what it would change if wrong>.

**Derived requirements to validate with the business (Source B — load-bearing):**
- V1 (REQ-UAC-00W): <the derived need + what relies on it being correct>.

## Traceability

| REQ-ID | Source | Status |
|--------|--------|--------|
| REQ-UAC-001 | ticket §2.1 | clear |
| REQ-UAC-002 | implicit (persistence) | assumed |
| REQ-UAC-003 | derived (app + domain norm) | derived |
```

Rules:
- Group reqs into `## <Section>` blocks by concern; **ids stay globally sequential** across
  sections.
- **Every** requirement carries acceptance criteria — a req with none is `needs-clarification`,
  not `clear`.
- The **Open questions & assumptions** and **Traceability** sections are **mandatory**.
  Include the suspected-defects / derived-to-validate blocks whenever Source B is in play.

### Compact example (one real entry)

```
### REQ-UAC-007 — A user account Login must be unique across all accounts.
- **Type:** validation
- **Priority:** high
- **Acceptance criteria:**
  - Given an account with Login "j.doe" exists, When an admin saves a new account with Login "j.doe", Then the save is rejected and a field-level uniqueness error is shown.
  - Given the rejection, Then no new account is persisted (count unchanged after reload).
- **Source:** ticket §3 ("logins can't collide") + implicit (persistence on reject)
- **Status:** clear
```

### Compact example — Source B `derived` (no spec)

```
### REQ-UAC-014 — A locked account must be barred from signing in.
- **Type:** security
- **Priority:** critical
- **Acceptance criteria:**
  - Given an account with status Locked, When its credentials are submitted at /login/, Then sign-in is refused and no session is issued.
- **Source:** derived — Lock toggle observed in the app + domain norm (lock implies access denial); Purpose/Standards oracles.
- **Status:** derived
```

## Process — follow in order

1. **Ingest & classify the source.** Decide the mode: **Source A** (stated spec — accept
   pasted prose, a file path you Read, or a pasted ticket) or **Source B** (no/weak spec →
   derive). Most features are a **mix**. **Record every source** for traceability (mandatory).
2. **If no/weak spec → derive via Source B.** Observe live behaviour (`/analyze-page` /
   Playwright MCP, read-only) + apply domain conventions; sweep the coverage heuristics
   (product elements + CRUD × entity/role/state) so derivation isn't just the happy path.
   Ask the user where judgment is needed.
3. **Extract everything.** Explicit **and** implicit; functional **and** non-functional —
   sweep every NFR lens above. Losing the implicit/NFR requirements is the classic failure.
4. **Audit each against the 7** (+ the set-level checks). Name the characteristic and why
   ("ambiguous: 'quickly' has no measurable bound"; "not verifiable: no acceptance criteria";
   "bundled: split into two singular reqs"; "redundant with REQ-x"). For Source-B items,
   also run the **consistency oracles** — when observed behaviour conflicts an oracle, log a
   **suspected defect**, do not canonize it as a requirement.
5. **Resolve every gap.** For each: **ask** a sharp question, record a **flagged assumption**,
   or (Source B) **derive**. Never silently invent. Mark status accordingly.
6. **Reformulate.** Rewrite into clean, atomic, testable requirements — each with a
   REQ-ID, one-sentence statement, **acceptance criteria** (Given/When/Then or objective
   conditions including the negative/error case), type, priority, source, status.
7. **Write `<AREA>_REQUIREMENTS.md`** at the **repo root**, in the exact format above, including the
   **Open questions & assumptions** and **Traceability** sections. It is a shared artifact — **commit it
   via `/open-pr` (`docs:`)** so `/test-design` and the team work from the same source.
8. **Summarize & hand off.** Report counts by status (clear / assumed / derived /
   needs-clarification) and by priority, list every open question, suspected defect, and
   load-bearing `derived` requirement up front, then point `/test-design` at the artifact.
   If there are blocking open questions, surface them to the user **before** handoff.

## Guardrails (never violate)

- **Requirements only** — no test cases (that's `/test-design`), no automation, no
  locators/methods/tests. Source B app reads are **read-only** observation, never mutating.
- **Never silently invent** a requirement — every gap or ambiguity is an open **question**,
  a flagged **assumption**, or a Source-B **`derived`** item; never a quiet `clear`.
- **As-built != as-intended** — never canonize observed behaviour as `clear`. Source-B
  needs are `derived` until the business confirms them; oracle conflicts are suspected defects.
- **Traceability is mandatory** — every refined REQ links to its source (or is marked
  `implicit` / `derived`), so a downstream `<FOC>-NNN` case can trace back through REQ-ID to origin.
- **No requirement ships `clear` without acceptance criteria** — missing criteria means
  `needs-clarification`, not done. (Derived requirements still carry acceptance criteria,
  but ship as `derived`, never `clear`, until the business confirms.)
