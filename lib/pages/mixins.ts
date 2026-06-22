import { Page } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { UserAccountsPage } from "@pages/user-accounts.page";

export type Constructor<T = {}> = new (...args: any[]) => T;

// HeaderComponent mixes itself in (see header.component.ts) — re-exported here
// so WebClient keeps importing all three mixins from this one file.
export { HeaderMixin } from "@pages/components/header.component";

export function LoginMixin<TBase extends Constructor<{ page: Page }>>(
  Base: TBase
) {
  return class extends Base {
    loginPage: LoginPage;

    constructor(...args: any[]) {
      super(...args);
      this.loginPage = new LoginPage(this.page);
    }
  };
}

export function UserAccountsMixin<TBase extends Constructor<{ page: Page }>>(
  Base: TBase
) {
  return class extends Base {
    userAccountsPage: UserAccountsPage;

    constructor(...args: any[]) {
      super(...args);
      this.userAccountsPage = new UserAccountsPage(this.page);
    }
  };
}
