# Authentication — Test Checklist

Targets the **WEB UI** of `/login/` (Edsson Elements internal admin app). Covers the login form, its validation, credential handling, the post-login redirect, and the session-bounce behaviour for unauthenticated deep-links. **reCAPTCHA flows are explicitly out of scope** for this checklist.

**Priority legend:** `critical` = blocks core sign-in or causes security exposure · `high` = primary login behaviour users hit every day · `medium` = secondary feedback / edge cases · `low` = cosmetic / a11y / rare.

**Test-design techniques applied:** equivalence partitioning, boundary value analysis (BVA), decision tables, state transition, error guessing, exploratory, accessibility, security.

**FOC code:** `AUT`.

---

## Page Load & Static UI

- [ ] AUT-001: Navigating to /login/ renders the login form with both Email and Password inputs visible (critical)
- [ ] AUT-002: The Sign-in button is rendered and enabled on initial load (high)
- [ ] AUT-003: The Password input masks its value (type=password), never plain text (critical)
- [ ] AUT-004: The Email input does NOT mask its value (type is email/text, not password) (medium)
- [ ] AUT-005: On a fresh load both Email and Password inputs are empty (no leftover values from a previous session) (high)
- [ ] AUT-006: No error banner is shown on a fresh load (the banner only appears after a failed submit) (high)
- [ ] AUT-007: The Email and Password inputs have associated accessible labels matching "Email" / "Password" (medium)

## Submit-time Validation (client-side, before reaching the API)

- [ ] AUT-008: Submitting with both Email and Password empty surfaces the error banner and does NOT redirect off /login/ (critical)
- [ ] AUT-009: Submitting with only Email filled (Password empty) surfaces the error banner and stays on /login/ (high)
- [ ] AUT-010: Submitting with only Password filled (Email empty) surfaces the error banner and stays on /login/ (high)
- [ ] AUT-011: A whitespace-only Email is treated as empty — error banner shown, no auth request consumed (medium)
- [ ] AUT-012: A clearly malformed Email (no @) is rejected — error banner shown, no successful redirect (high)

## Credential Handling

- [ ] AUT-013: Valid admin credentials authenticate (POST /account/login → 200) and redirect to the user-accounts area with the header logo visible (critical)
- [ ] AUT-014: Valid Email + wrong Password returns 400 and shows the error banner; the user stays on /login/ (critical)
- [ ] AUT-015: Wrong Email (well-formed but unknown) + any Password returns a non-2xx and shows the error banner; the user stays on /login/ (high)
- [ ] AUT-016: Email comparison is case-INsensitive — uppercased valid email + valid password still authenticates (200 + redirect) (high)
- [ ] AUT-017: Password comparison IS case-sensitive — valid email + uppercased valid password is rejected (non-2xx + banner) (high)
- [ ] AUT-018: After a failed login the banner clears (or the next submit re-issues a request) so the user can retry without a page reload (medium)
- [ ] AUT-019: Submitting via the Enter key from the Password field has the same effect as clicking Sign in (high)

## Security & Robustness

- [ ] AUT-020: An SQL-injection-style payload in Email (e.g. `' OR 1=1 --`) is rejected with a non-2xx and grants NO session — the user remains on /login/ (critical)
- [ ] AUT-021: An XSS payload in Email (e.g. `<script>alert(1)</script>`) does NOT execute as script — submit is rejected and no dialog fires (critical)
- [ ] AUT-022: The error banner text is generic (does not disclose which of Email / Password was wrong, no stack trace, no SQL error) (high)
- [ ] AUT-023: Repeated invalid attempts (3 in a row for an unknown email) keep returning the same generic banner — no different message that would aid enumeration (medium)

## Session & Post-login Routing

- [ ] AUT-024: Deep-linking to a protected route (/administration/user-accounts/) while unauthenticated redirects to /login/ and exposes no grid data (critical)
- [ ] AUT-025: After a successful login the URL is the user-accounts area, not /login/ (high)
- [ ] AUT-026: After logging out via the header account menu, the user is bounced to /login/ and the protected page is no longer reachable without re-auth (critical)
- [ ] AUT-027: After logout, navigating back via the browser does NOT re-expose the protected page contents (high)
