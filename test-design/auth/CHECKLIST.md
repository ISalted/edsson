# Auth (Sign in) — Test Checklist

Targets the WEB UI of `/login/` (Edsson Elements Sign in page) and the unauthenticated access gate. Traces to `test-design/auth/REQUIREMENTS.md`. Supersedes the legacy `tests/web/auth/auth.web.test.ts` (1.–4.).
**Out of scope:** API-only login cases; password reset (no UI entry point); sign-out; account lockout policy (see Deferred).

**Priority legend:** `critical` = blocks core usage, corrupts data, or exposes a security
hole · `high` = frequently-used functionality users depend on · `medium` = secondary
features & common edge cases · `low` = cosmetic / rare / nice-to-have.

**Test-design techniques applied:** equivalence partitioning (empty / whitespace / valid / non-matching / malformed credentials), decision table (Email × Password presence), state transition (unauthenticated → authenticated → reload), error guessing, security (injection, user enumeration), accessibility, persistence.

**Smoke:** cases marked `@smoke` are the core-flow gate for the CI smoke lane.

---

## Page structure

- [ ] AUT-001: Opening `/login/` unauthenticated shows heading "Sign in", an "Email" textbox, a "Password" textbox and an enabled "Sign in" button (high) `[REQ-AUT-001]`
- [ ] AUT-002: The Password input is `type="password"`, so typed characters are masked (medium) `[REQ-AUT-002]`
- [ ] AUT-003: Email has `autocomplete="username"` and Password has `autocomplete="current-password"` (low) `[REQ-AUT-003]`

## Client-side validation

- [ ] AUT-004: Clicking "Sign in" with both fields empty shows "Please enter your email." and sends no `POST /api/account/login` (high) `[REQ-AUT-004]`
- [ ] AUT-005: Clicking "Sign in" with a valid-format Email and empty Password shows "Please enter your password." and sends no login request (high) `[REQ-AUT-005]`
- [ ] AUT-006: A whitespace-only Email ("   ") is treated as empty: shows "Please enter your email." and sends no login request (medium) `[REQ-AUT-004]`

## Authentication

- [ ] AUT-007: Submitting valid admin credentials returns 200 from `POST /api/account/login`, leaves `/login/`, and shows the app header logo (critical) `@smoke` `[REQ-AUT-008]`
- [ ] AUT-008: After a successful sign-in, localStorage holds a non-empty `lscache-e-LS_AUTH_TOKEN`, and reloading `/administration/user-accounts/` keeps the user signed in (URL stays, not `/login/`) (high) `[REQ-AUT-009]`
- [ ] AUT-009: Submitting a non-existent `aqa.*@edsson.com` email with any password returns 400, keeps the URL on `/login/`, shows the error banner, and writes no auth token (critical) `@smoke` `[REQ-AUT-010]`
- [ ] AUT-010: A throwaway `aqa.*` account (seeded via `apiClient`) with a wrong password gets the same status (400) and the same banner text as AUT-009, so there's no user enumeration (high) `@mutating` `[REQ-AUT-011]`
- [ ] AUT-011: Injection payloads (`' OR '1'='1' --` as Email and `<script>alert(1)</script>` as Password) are refused like invalid credentials: 400, not 5xx, no dialog/script execution, stays on `/login/` (high) `[REQ-AUT-010]`
- [ ] AUT-012: The login request carries a non-empty `g-recaptcha-response` header, and the "protected by reCAPTCHA" notice is shown (medium) `[REQ-AUT-013]`

## Access gating

- [ ] AUT-013: Opening `/administration/user-accounts/` with no session redirects to `/login/`, and no user-account grid is rendered (critical) `@smoke` `[REQ-AUT-014]`

## Accessibility

- [ ] AUT-014: Keyboard only: Tab moves focus Email → Password → "Sign in", and pressing Enter in the Password field submits the form (empty Password → "Please enter your password.") (medium) `[REQ-AUT-006]`
- [ ] AUT-015: When a validation error appears, its text is exposed in an `aria-live` / `role="alert"` region (medium) `[REQ-AUT-016]` — *expected to fail today (D3)*
- [ ] AUT-016: `/login/` has a non-empty document title identifying the page (low) `[REQ-AUT-017]` — *expected to fail today (D4)*

## Blocked on open questions — design once answered

- [ ] AUT-017: A malformed Email ("not-an-email") is rejected in the browser with a format error and no login request is sent (low) `[REQ-AUT-007]` — blocked on Q1 (today it is POSTed, D2)
- [ ] AUT-018: A failed sign-in banner shows a plain end-user message with no host names, ports, config hints or raw status codes (medium) `[REQ-AUT-012]` — blocked on Q3 (exact text); fails today (D1)
- [ ] AUT-019: After being redirected from `/administration/user-accounts/` to `/login/` and signing in, the user lands back on `/administration/user-accounts/` (low) `[REQ-AUT-015]` — blocked on Q2

## Deferred — do not implement

- [ ] AUT-020: N consecutive failed logins lock the account / throttle attempts. Deferred: the policy is unknown, and running it against the admin or a shared account could lock it out of CI (only ever against a dedicated throwaway user, once the policy is confirmed) (n/a)
