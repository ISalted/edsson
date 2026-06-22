# Authoring guide — POM, fixtures, SOLID (deep dive)

The short rules live in `CLAUDE.md`. This is the detail the code skills
(`/analyze-page`, `/sdk-builder`, `/test-write`, `/analyze-test`) pull in when writing or reviewing code.

## Layers (single responsibility)
- **Test** (`tests/web/<area>/*.web.test.ts`) — *what* is verified. Arrange → act via
  POM → **assert with `expect`**. No selectors, no flows, no waits-as-logic in the test.
- **Page Object** (`lib/pages/*.page.ts`) — *how* to act on one page. Owns selectors and
  flows (`createUser`, `lockUser`, `filterByText`). Methods **act and return**; they never
  assert. Every public method is decorated with `@step()` so it appears in the report.
- **Data** (`lib/data/…`) — *what data*. Faker factories (`aqaUser(prefix)`) and known
  fixtures. No page logic here.
- **API** (`lib/api/…`) — API clients (auth, user-accounts), used for setup/teardown and
  the `apiClient` fixture.
- **Helpers** (`lib/helpers/…`) — generic, page-agnostic utilities only.

## Page object vs component object
- **Page object** (`*.page.ts`) — models ONE route/screen; owns that page's selectors + flows. It also
  **composes the component objects it renders** by extending their mixins — e.g.
  `class UserAccountsPage extends HeaderMixin(BasePage)` gives it `this.header`. One URL = one page object.
- **Component object** (`components/*.component.ts`) — a **reusable UI region that appears on ≥2 pages**
  (header, nav, a shared dialog/grid). It's a `class XComponent extends BasePage` (private locators +
  `@step` methods) **plus** an `XMixin(Base)` that injects it as a property (`this.x = new XComponent(this.page)`).
  Page-agnostic — no route, no host-page knowledge, identifiers passed in — so every page reuses the **one** class.
- **Composition (the part that matters):** a component **mixes into the PAGES that render it, NOT into
  `WebClient`.** `WebClient` composes **page mixins only** (`UserAccountsMixin(LoginMixin(BasePage))`) →
  `webClient.userAccountsPage`, `webClient.loginPage`. Reach a component **through its page**:
  **`webClient.userAccountsPage.header.waitForLogo()`** — never `webClient.header`.
- **Rule:** bound to one route → **page object**; appears across pages → **component object**. Both extend
  `BasePage`, keep locators private, methods act-and-return + `@step`. A component has **no route**.

## Fixtures (`lib/fixtures.ts`)
Import in every test: `import { test, expect } from "@lib/fixtures";`
- `webClient` — the app. **Page** mixins composed in `lib/pages/edsson-app.ts`:
  `UserAccountsMixin(LoginMixin(BasePage))`. Exposes `.loginPage`, `.userAccountsPage`, `.goTo(route)`,
  `.page`. Components (header, …) are reached **through their page** — `webClient.userAccountsPage.header`.
- `apiClient` — API client, reuses the saved session token.
- `helpers` — generic utils.

## SOLID, applied to this suite
- **Single responsibility:** a POM method does one thing; a test verifies one behavior.
- **Open/closed:** extend behavior by adding POM methods / a new Page Object + mixin —
  don't bloat existing methods with flags.
- **Liskov / interface:** `is…Visible()`/`is…Enabled()` consistently return booleans the
  test asserts on; keep that contract.
- **DRY:** reuse existing POM flows and `aqaUser()`; never copy a selector into a test.
- **A new page** = a `*.page.ts` extending `BasePage` (+ the component mixins it renders, e.g.
  `HeaderMixin`) + a page mixin in `mixins.ts` wired into `WebClient`; add its route to `AppRoute` if known.
- **A new component** = a `components/*.component.ts` (the class **+** its `XMixin`); wire `XMixin` into
  the **pages** that render it (each `extends XMixin(...)`), **not** into `WebClient`; no route.

## Selectors (DevExtreme + CSS modules)
- Grid internals: `.dx-data-row`, `.dx-select-checkbox`, `.dx-texteditor-input`,
  `.dx-invalid`, `.dx-popup-wrapper`, etc.
- Hashed CSS-module classes: partial match, e.g. `[class*="UserAccountForm_formLabel"]`.
- The grid filters **client-side with debounce** → filter first, then read.
- `webClient.waitForTimeout(n)` is in **seconds**. Prefer real waits (`waitFor`, response
  waits) over sleeps.

## Example shape
```ts
import { test, expect } from "@lib/fixtures";
import { aqaUser } from "@data/user-accounts/user-account.data";

test.describe("User Accounts — Create @web @user-accounts @create @mutating @S...", () => {
  test.beforeEach(async ({ webClient }) => {
    await webClient.goTo("/administration/user-accounts/");
  });

  test("UAC-0NN: creating a valid user shows it in the grid @web @user-accounts @create @mutating", async ({ webClient }) => {
    const uap = webClient.userAccountsPage;
    const user = aqaUser("create");
    await uap.createUser({ ...user });           // flow lives on the POM
    await webClient.goTo("/administration/user-accounts/");
    await uap.filterByText("Login", user.login); // filter, then read
    expect(await uap.getRowCellText(user.login, "Status")).toBe("Active"); // assert in the test
  });
});
```
