import { step } from "@helpers/step";
import { BasePage, Page } from "@pages/base.page";
import { TopNav, SubNav, SubSubNav } from "./nav.types";

export type Constructor<T = {}> = new (...args: any[]) => T;

/** Mixes the header into any page/WebClient — header renders on every authenticated route. */
export function HeaderMixin<TBase extends Constructor<{ page: Page }>>(
  Base: TBase,
) {
  return class extends Base {
    header: HeaderComponent;

    constructor(...args: any[]) {
      super(...args);
      this.header = new HeaderComponent(this.page);
    }
  };
}

export type Workspace = "Website" | "Employee Portal" | "Employee Portal Beta" | "Customer Portal";
export type ProfileAction = "My Personal Data" | "Personalization settings" | "Change password";

export class HeaderComponent extends BasePage {
  private container = this.page.locator("header");
  private navMenu = this.page.locator(".dx-menu");
  private logo = this.page.locator('header a[href="/default/"]');
  private breadcrumb = this.page.locator('[class*="pathSelectedMenuWrapper"]');
  private currentPage = this.breadcrumb
    .locator('[class*="pathSelectedMenuItem"]')
    .last();
  private accountBtn = this.page.locator('[class*="MainMenu_profileBtn"]');
  private accountDropdown = this.page.locator('[class*="MainMenu_profileWrapper"]');
  private logOutBtn = this.accountDropdown.locator('[class*="Workspaces_button"]', { hasText: "Log Out" });

  private navItem = (name: string) =>
    this.page.locator(".dx-menu-item-text", { hasText: name }).first();
  private breadcrumbItem = (name: string) =>
    this.breadcrumb
      .locator('[class*="pathSelectedMenuItem"]', { hasText: name })
      .first();
  private accountItem = (name: Workspace | ProfileAction) =>
    this.accountDropdown.locator("button", { hasText: name });

  @step()
  async navigateTo<T extends TopNav, S extends SubNav<T>>(
    section: T,
    subSection?: S,
    item?: SubSubNav<T, S>,
  ) {
    await this.navItem(section).click();
    if (subSection) await this.navItem(subSection as string).click();
    if (item) await this.navItem(item as string).click();
  }

  @step()
  async isContainerVisible() {
    await this.container.waitFor({ state: "visible" });
    return this.container.isVisible();
  }

  @step()
  async isNavMenuVisible() {
    await this.navMenu.waitFor({ state: "visible" });
    return this.navMenu.isVisible();
  }

  @step()
  async waitForLogo() {
    await this.logo.waitFor({ state: "visible" });
  }

  @step()
  async isLogoVisible() {
    await this.waitForLogo()
    return this.logo.isVisible();
  }

  @step()
  async isBreadcrumbItemVisible(name: string) {
    const item = this.breadcrumbItem(name);
    await item.waitFor({ state: "visible" });
    return item.isVisible();
  }

  @step()
  async isCurrentPageVisible() {
    await this.currentPage.waitFor({ state: "visible" });
    return this.currentPage.isVisible();
  }

  @step()
  async openAccountMenu() {
    await this.accountBtn.click();
  }

  @step()
  async isAccountMenuVisible() {
    await this.accountDropdown.waitFor({ state: "visible" });
    return this.accountDropdown.isVisible();
  }

  @step()
  async clickAccountItem(name: Workspace | ProfileAction) {
    await this.openAccountMenu()
    await this.accountItem(name).click();
  }

  @step()
  async isAccountItemVisible(name: Workspace | ProfileAction) {
    const item = this.accountItem(name);
    await item.waitFor({ state: "visible" });
    return item.isVisible();
  }

  @step()
  async logOut() {
    await this.logOutBtn.click();
  }
}
