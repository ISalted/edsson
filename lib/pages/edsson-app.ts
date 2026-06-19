import { BasePage, Page } from "@pages/base.page";
import { HeaderMixin, LoginMixin, UserAccountsMixin } from "@pages/mixins";
import { step } from "@helpers/step";

/** Known application routes (relative to the configured baseURL). */
export type AppRoute =
  | "/"
  | "/login/"
  | "/administration/user-accounts/";

export default class WebClient extends UserAccountsMixin(
  LoginMixin(HeaderMixin(BasePage)),
) {
  constructor(page: Page) {
    super(page);
  }

  // Navigate to an app route. Paths are relative to baseURL (playwright.config),
  // so callers pass "/administration/user-accounts/" — never a full URL.
  // AppRoute gives autocomplete while `(string & {})` still allows ad-hoc paths.
  @step()
  async goTo(route: AppRoute | (string & {})) {
    await this.page.goto(route);
  }

  @step()
  async pause() {
    await this.page.pause();
  }
}
