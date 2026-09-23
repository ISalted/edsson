# Auth (Sign in) — Requirements

**Source(s):** derived: live app `/login/` observed read-only via Playwright MCP (2026-09-23) + `lib/pages/login.page.ts` + `globalSetup.ts` + `lib/api/auth/auth-service.ts` + legacy `tests/web/auth/auth.web.test.ts` (HEAD) + domain norms. No written spec exists.
**Scope:** the Sign in page (`/login/`) — form, client validation, credential submission, session issuance, redirect, and unauthenticated access gating.
**Out of scope:** password reset / "forgot password" (no entry point exists in the UI), sign-out, account creation, account lockout policy after N failures (not observable without risking a real account), reCAPTCHA scoring internals, SSO.

**Status legend:** `clear` = unambiguous & confirmed · `assumed` = filled by a flagged
assumption (validate before test-design) · `derived` = inferred from the app/domain, not
confirmed by the business (Source B — validate before relying on it) · `needs-clarification`
= blocked on an open question.

**Standard:** audited against ISO/IEC/IEEE 29148 (Necessary, Unambiguous, Complete,
Singular, Consistent, Feasible, Verifiable + set-level completeness/consistency/non-redundancy).

---

## Page structure

### REQ-AUT-001 — The Sign in page must present an Email field, a Password field, and a "Sign in" submit button.
- **Type:** functional
- **Priority:** critical
- **Acceptance criteria:**
  - Given an unauthenticated visitor, When they open `/login/`, Then a heading "Sign in", a textbox labelled "Email", a textbox labelled "Password", and an enabled button "Sign in" are visible.
- **Source:** derived — observed in app (accessibility tree) + `login.page.ts` locators
- **Status:** derived

### REQ-AUT-002 — The Password field must mask its input.
- **Type:** security
- **Priority:** high
- **Acceptance criteria:**
  - Given the Sign in page, Then the Password input is of type `password` (characters not displayed in clear text).
- **Source:** derived — observed (`type=password`) + domain norm
- **Status:** derived

### REQ-AUT-003 — The form fields must support browser credential autofill.
- **Type:** a11y
- **Priority:** low
- **Acceptance criteria:**
  - Then the Email input has `autocomplete="username"` and the Password input has `autocomplete="current-password"`.
- **Source:** derived — observed + WCAG 1.3.5 (Identify Input Purpose)
- **Status:** derived

## Client-side validation

### REQ-AUT-004 — Submitting with an empty Email must be blocked with the message "Please enter your email."
- **Type:** validation
- **Priority:** high
- **Acceptance criteria:**
  - Given both fields empty, When "Sign in" is activated, Then the banner reads "Please enter your email.".
  - Then no request is sent to `POST /api/account/login`.
- **Source:** derived — observed in app (no network call on empty submit)
- **Status:** derived

### REQ-AUT-005 — Submitting with an Email but empty Password must be blocked with the message "Please enter your password."
- **Type:** validation
- **Priority:** high
- **Acceptance criteria:**
  - Given Email filled and Password empty, When "Sign in" is activated, Then the banner reads "Please enter your password.".
  - Then no request is sent to `POST /api/account/login`.
- **Source:** derived — observed banner text; the no-request criterion is assumed by symmetry with REQ-AUT-004
- **Status:** derived

### REQ-AUT-006 — Pressing Enter in a form field must submit the form, equivalent to clicking "Sign in".
- **Type:** a11y
- **Priority:** medium
- **Acceptance criteria:**
  - Given the Email field focused with a value and Password empty, When Enter is pressed, Then the same validation as REQ-AUT-005 fires.
- **Source:** derived — observed
- **Status:** derived

### REQ-AUT-007 — An Email not in valid email format must be rejected before contacting the server.
- **Type:** validation
- **Priority:** low
- **Acceptance criteria:**
  - Given Email "not-an-email" and any Password, When submitted, Then a format error is shown and no login request is sent.
- **Source:** derived — domain norm + the input is declared `type=email`. **Observed behaviour differs** — see D2.
- **Status:** needs-clarification

## Authentication

### REQ-AUT-008 — Valid credentials must authenticate the user and land them in the application.
- **Type:** functional
- **Priority:** critical
- **Acceptance criteria:**
  - Given a valid active account, When its email and password are submitted, Then `POST /api/account/login` responds 200.
  - Then the browser leaves `/login/` and the application header (Edsson logo) is visible.
- **Source:** derived — `globalSetup.ts` (login → `header.waitForLogo()`) + legacy test 1
- **Status:** derived

### REQ-AUT-009 — A successful sign-in must persist a session token client-side for subsequent requests.
- **Type:** persistence
- **Priority:** high
- **Acceptance criteria:**
  - Given a successful sign-in, Then localStorage holds a non-empty `lscache-e-LS_AUTH_TOKEN`.
  - Given that session, When the user reloads a protected page, Then they remain signed in (not redirected to `/login/`).
- **Source:** derived — `globalSetup.ts` reads `lscache-e-LS_AUTH_TOKEN`; suite-wide reuse of `session-storage.json` proves persistence
- **Status:** derived

### REQ-AUT-010 — Invalid credentials must be refused without issuing a session.
- **Type:** security
- **Priority:** critical
- **Acceptance criteria:**
  - Given an email/password pair that does not match an account, When submitted, Then `POST /api/account/login` responds 400.
  - Then the user stays on `/login/`, an error banner is visible, and no `lscache-e-LS_AUTH_TOKEN` is written.
- **Source:** derived — observed (400, `{"Message":"Login or password does not match"}`, no token) + legacy test 4
- **Status:** derived

### REQ-AUT-011 — The invalid-credentials error must not reveal whether the email exists.
- **Type:** security
- **Priority:** high
- **Acceptance criteria:**
  - Given a non-existent email and Given an existing email with a wrong password, Then both produce the same status code and the same user-facing message.
- **Source:** derived — OWASP authentication guidance (no user enumeration). Server message "Login or password does not match" is generic for the non-existent case; the existing-account case was **not** probed (would hit a real account).
- **Status:** assumed

### REQ-AUT-012 — The user-facing sign-in error must be a plain end-user message without internal/developer details.
- **Type:** error-handling
- **Priority:** medium
- **Acceptance criteria:**
  - Given a rejected sign-in, Then the banner text contains no host names, ports, console/config instructions, or raw status codes.
- **Source:** derived — Claims/User/Purpose oracles. **Observed behaviour violates this** — see D1.
- **Status:** needs-clarification

## Bot protection

### REQ-AUT-013 — Each sign-in request must carry a reCAPTCHA token.
- **Type:** security
- **Priority:** medium
- **Acceptance criteria:**
  - When a login request is sent, Then it carries a non-empty `g-recaptcha-response` header and the page shows the "protected by reCAPTCHA" notice.
- **Source:** derived — observed request header + reCAPTCHA iframe
- **Status:** derived

## Access gating

### REQ-AUT-014 — Protected routes must redirect unauthenticated visitors to the Sign in page without exposing data.
- **Type:** security
- **Priority:** critical
- **Acceptance criteria:**
  - Given no session, When `/administration/user-accounts/` is opened directly, Then the URL becomes `/login/` and no user-account data is rendered.
- **Source:** derived — observed redirect; matches user-accounts CHECKLIST item "Deep-linking … unauthenticated redirects to login"
- **Status:** derived

### REQ-AUT-015 — After sign-in from a redirected deep link, the user should return to the originally requested page.
- **Type:** functional
- **Priority:** low
- **Acceptance criteria:**
  - Given a redirect from `/administration/user-accounts/` to `/login/`, When the user signs in, Then they land on `/administration/user-accounts/`.
- **Source:** domain norm. Observed redirect carries **no** return-URL parameter; the app does call `SaveLastVisitedPage`, so landing may be "last visited" instead — see Q2.
- **Status:** needs-clarification

## Accessibility

### REQ-AUT-016 — Validation and sign-in errors must be announced to assistive technology.
- **Type:** a11y
- **Priority:** medium
- **Acceptance criteria:**
  - When any error banner appears, Then its text is inside an `aria-live` / `role=alert` region (or the region is updated with it).
- **Source:** derived — WCAG 4.1.3 (Status Messages). **Observed:** a `role=alert aria-live=assertive` region exists but stays empty; the banner renders elsewhere — see D3.
- **Status:** derived

### REQ-AUT-017 — The Sign in page must have a meaningful document title.
- **Type:** a11y
- **Priority:** low
- **Acceptance criteria:**
  - Given `/login/`, Then `document.title` is non-empty and identifies the page (e.g. contains "Sign in").
- **Source:** derived — WCAG 2.4.2. **Observed:** title is empty — see D4.
- **Status:** derived

---

## Open questions & assumptions

**Open questions (blocking — answer before /test-design for these items):**
- Q1 (REQ-AUT-007): Should malformed emails be rejected client-side (form currently has `noValidate` and sends them to the server), or is server-side 400 the intended behaviour?
- Q2 (REQ-AUT-015): After login, where should the user land — (a) the originally requested deep link, (b) the last visited page (`SaveLastVisitedPage`), or (c) always `/administration/user-accounts/`?
- Q3 (REQ-AUT-012): What is the intended user-facing text for a failed sign-in (e.g. "Email or password is incorrect.")?

**Suspected defects (Source B — observed behaviour conflicts a consistency oracle):**
- D1 (REQ-AUT-012): Failed sign-in shows *"Login failed (400). Check email/password, reCAPTCHA domain for localhost:3001 in Google console, and API base URL."* — developer debug text leaked to end users (Claims/User/Purpose oracles); also ignores the server's own friendly `Message`.
- D2 (REQ-AUT-007): `type=email` input but form is `noValidate` and no app-side format check; "not-an-email" is POSTed and yields the generic D1 banner (Internal-consistency oracle).
- D3 (REQ-AUT-016): Error banner (`login_banner__*`) is outside the live region; the `role=alert` region stays empty, so screen readers get no announcement.
- D4 (REQ-AUT-017): `document.title` is empty on `/login/`.

**Assumptions (flagged — validate):**
- A1 (REQ-AUT-011): No user enumeration. Only the non-existent-email case was observed; confirming would require a wrong-password attempt against a real account, which we deliberately did not do.
- A2 (REQ-AUT-005): Empty-password submit sends no request (verified for empty email; assumed for this case).

**Derived requirements to validate with the business (Source B — load-bearing):**
- V1 (REQ-AUT-008): Successful login lands in-app with header visible — the whole suite's `globalSetup` depends on it.
- V2 (REQ-AUT-010): Invalid credentials → HTTP 400 (not 401). Tests will assert 400; if the API is changed to 401 these fail.
- V3 (REQ-AUT-014): Unauthenticated deep link → `/login/`.

## Traceability

| REQ-ID | Source | Status |
|--------|--------|--------|
| REQ-AUT-001 | derived (app + login.page.ts) | derived |
| REQ-AUT-002 | derived (app + domain norm) | derived |
| REQ-AUT-003 | derived (app + WCAG 1.3.5) | derived |
| REQ-AUT-004 | derived (app) | derived |
| REQ-AUT-005 | derived (app) + A2 | derived |
| REQ-AUT-006 | derived (app) | derived |
| REQ-AUT-007 | domain norm vs D2 | needs-clarification |
| REQ-AUT-008 | derived (globalSetup + legacy test) | derived |
| REQ-AUT-009 | derived (globalSetup) | derived |
| REQ-AUT-010 | derived (app + legacy test) | derived |
| REQ-AUT-011 | OWASP norm, partially observed | assumed |
| REQ-AUT-012 | oracles vs D1 | needs-clarification |
| REQ-AUT-013 | derived (app) | derived |
| REQ-AUT-014 | derived (app + UAC checklist) | derived |
| REQ-AUT-015 | domain norm, Q2 | needs-clarification |
| REQ-AUT-016 | derived (WCAG 4.1.3) vs D3 | derived |
| REQ-AUT-017 | derived (WCAG 2.4.2) vs D4 | derived |
