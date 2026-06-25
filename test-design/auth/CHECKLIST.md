# Auth — Test Checklist

Targets the WEB UI of `/login/` and its supporting auth API (`POST /api/account/login`,
`GET /api/account/getPersonalData`) — sign-in, session establishment, session loss, and
the surrounding security/UX surface.
**Out of scope:** reCAPTCHA validation (user-deferred); forgot-password / password-reset
(no UI surface present); brute-force / rate-limit probing against the shared admin (see
Deferred); typing the real admin password into the UI by hand (CLAUDE.md guardrail).

**Priority legend:** `critical` = blocks core usage, corrupts data, or exposes a security
hole · `high` = frequently-used functionality users depend on · `medium` = secondary
features & common edge cases · `low` = cosmetic / rare / nice-to-have.

**Test-design techniques applied:** equivalence partitioning, boundary value analysis,
decision tables, state transition, error guessing, exploratory, security (XSS / SQLi /
user-enumeration / session-tampering), accessibility, persistence, concurrency.

> **Note on existing tests.** `tests/web/auth/auth.web.test.ts` currently holds the
> grandfathered `1.`–`4.` tests (per CLAUDE.md, those titles + placeholder `@T0000000N`
> stay as-is — do not reformat). They cover, in spirit, AUT-004 (happy path), AUT-007 +
> AUT-009 (empty email / empty password), and AUT-014 (wrong password). New automation
> from this checklist uses the `AUT-NNN` ids as titles.

---

## Page Load & Display

- [ ] AUT-001: GET `/login/` renders the `Sign in` heading and the Email input, Password input, and `Sign in` button — all visible and enabled (critical) `[REQ: none]` `@smoke`
- [ ] AUT-002: The Password input masks typed characters (input `type="password"`) so the value is never rendered as visible text in the DOM (critical) `[REQ: none]`
- [ ] AUT-003: On initial load, both Email and Password inputs are empty and the error banner is not present (low) `[REQ: none]`

## Happy Path

- [ ] AUT-004: Submitting valid admin credentials returns HTTP 200 from `POST /api/account/login` with a non-empty `access_token`, the page navigates away from `/login/`, and the authenticated header (logo) is visible (critical) `[REQ: none]` `@smoke`
- [ ] AUT-005: After a successful login, a hard reload of the landing page keeps the user authenticated (no bounce to `/login/`, header still visible) (high) `[REQ: none]`
- [ ] AUT-006: An already-authenticated user navigating to `/login/` is redirected to the authenticated landing route (no second login required) (medium) `[REQ: none]`

## Empty / Missing Input Validation

- [ ] AUT-007: Submitting with both Email and Password empty shows the error banner and fires **no** request to `/account/login` (high) `[REQ: none]`
- [ ] AUT-008: Submitting with Email filled and Password empty shows the error banner and fires no `/account/login` request (high) `[REQ: none]`
- [ ] AUT-009: Submitting with Password filled and Email empty shows the error banner and fires no `/account/login` request (high) `[REQ: none]`
- [ ] AUT-010: Submitting with a whitespace-only Email (e.g. `"   "`) is treated as empty: error banner shown, no `/account/login` request (medium) `[REQ: none]`

## Email Format Validation

- [ ] AUT-011: Submitting an email with no `@` (e.g. `adminedsson.com`) is rejected at the boundary — error shown, no successful login (high) `[REQ: none]`
- [ ] AUT-012: Submitting an email with no domain (e.g. `admin@`) is rejected — error shown, no successful login (medium) `[REQ: none]`
- [ ] AUT-013: Submitting an extreme-length email (>320 chars) is handled gracefully — rejected with an error, no HTTP 500, page remains responsive (low) `[REQ: none]`

## Authentication Failures

- [ ] AUT-014: Wrong password for a valid email returns HTTP 400 from `/account/login` and shows the error banner; the user stays on `/login/` (high) `[REQ: none]`
- [ ] AUT-015: An unknown email (well-formed, not registered) with any password returns HTTP 400 and shows the **same** generic error banner as wrong-password — no user-enumeration disclosure in message or response body (critical) `[REQ: none]`
- [ ] AUT-016: A valid email in different letter case (e.g. `ADMIN@…`) with the correct password logs in successfully — email is case-insensitive (medium) `[REQ: none]`
- [ ] AUT-017: A valid email with the password in different letter case returns HTTP 400 — password is case-sensitive (medium) `[REQ: none]`

## Security

- [ ] AUT-018: After submit, the password value does NOT appear in the `/account/login` response body, the page DOM, `localStorage`, or `sessionStorage` (critical) `[REQ: none]`
- [ ] AUT-019: Submitting a SQL-injection-style email (e.g. `' OR '1'='1`) returns HTTP 4xx with the generic error banner — no HTTP 500, no unfiltered backend response leaked (high) `[REQ: none]`
- [ ] AUT-020: Submitting an XSS payload in Email (`<script>alert(1)</script>@x.com`) is treated as literal text — no script execution, no `dialog` event, server returns 4xx (high) `[REQ: none]`
- [ ] AUT-021: While authenticated, clearing the auth token in `localStorage` and deep-linking to `/administration/user-accounts/` redirects to `/login/` and renders no protected data (high) `[REQ: none]`
- [ ] AUT-022: Calling `GET /api/account/getPersonalData` with a corrupted Bearer token returns HTTP 401 — no user data leaked (high) `[REQ: none]`
- [ ] AUT-023: After Log Out via the header account menu, deep-linking to `/administration/user-accounts/` redirects to `/login/` (high) `[REQ: none]`

## API Surface (via `apiClient`)

- [ ] AUT-024: `POST /api/account/login` with valid creds returns HTTP 200 with a non-empty `access_token` and an `expires` timestamp in the future (high) `[REQ: none]`
- [ ] AUT-025: `POST /api/account/login` with invalid creds returns HTTP 400 and a body that contains **no** `access_token` (high) `[REQ: none]`
- [ ] AUT-026: `GET /api/account/getPersonalData` with no `Authorization` header returns HTTP 401 (high) `[REQ: none]`
- [ ] AUT-027: `POST /api/account/login` with malformed JSON / missing `Email` or `Password` fields returns HTTP 4xx (not 500) (medium) `[REQ: none]`

## Accessibility

- [ ] AUT-028: Tab order from the page root reaches Email → Password → Sign in in that sequence (medium) `[REQ: none]`
- [ ] AUT-029: Pressing `Enter` while focus is in the Password input submits the form (same network behaviour as clicking Sign in) (medium) `[REQ: none]`
- [ ] AUT-030: The Email and Password inputs have accessible names exactly `"Email"` and `"Password"` (medium) `[REQ: none]`
- [ ] AUT-031: A failed login surfaces its message via a `role="alert"` (or live) region so it is announced to assistive tech (medium) `[REQ: none]`

## UX & Concurrency

- [ ] AUT-032: Rapidly double-clicking the Sign in button produces exactly **one** `POST /api/account/login` request (no double-submit) (medium) `[REQ: none]`
- [ ] AUT-033: After a failed login, editing the Email or Password input and re-submitting clears the previous error banner before showing the new result (low) `[REQ: none]`

## Deferred — do not implement

- [ ] AUT-D01: Rate-limit / brute-force probing (10+ failed attempts against the real admin) — risk of locking the shared admin account; never automate (n/a)
- [ ] AUT-D02: reCAPTCHA challenge / validation path — explicitly out of scope per user; cannot be reliably automated without mocking the Google endpoint (n/a)
- [ ] AUT-D03: Forgot-password / password-reset flow — no UI surface present on `/login/` (verified via Playwright snapshot, 2026-06-25) (n/a)
- [ ] AUT-D04: Typing the real admin password into the UI form by hand — CLAUDE.md guardrail: valid-credential login always uses `env.adminPassword`, not literal strings (n/a)
