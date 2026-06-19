import { Page } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { UserAccountsPage } from "@pages/user-accounts.page";
import { HeaderComponent } from "@pages/components/header.component";

export type Constructor<T = {}> = new (...args: any[]) => T;

export function HeaderMixin<TBase extends Constructor<{ page: Page }>>(
  Base: TBase
) {
  return class extends Base {
    header: HeaderComponent;

    constructor(...args: any[]) {
      super(...args);
      this.header = new HeaderComponent(this.page);
    }
  };
}

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
