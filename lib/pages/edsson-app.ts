import { BasePage, Page } from "@pages/base.page";
import { LoginMixin, UserAccountsMixin } from "@pages/mixins";
import { step } from "@helpers/step";

/** Known application routes (relative to the configured baseURL). */
export type AppRoute =
  | "/"
  | "/login/"
  | "/administration/user-accounts/";

// WebClient composes PAGES only (.loginPage, .userAccountsPage). Components
// (header, …) mix into the pages that render them — never here. Use
// webClient.<page>.header, never webClient.header.
export default class WebClient extends UserAccountsMixin(
  LoginMixin(BasePage),
) {
  constructor(page: Page) {
    super(page);
  }

  // Navigate to an app route. Paths are relative to baseURL (playwright.config),
  // so callers pass "/administration/user-accounts/" — never a full URL.
  // AppRoute gives autocomplete while `(string & {})` still allows ad-hoc paths.
  @step()
  async goTo(
    route: AppRoute | (string & {}),
    options?: {
      waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
      timeout?: number;
    },
  ) {
    await this.page.goto(route, options);
  }

  @step()
  async pause() {
    await this.page.pause();
  }
}
