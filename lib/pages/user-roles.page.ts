import { step } from "@helpers/step";
import { BasePage } from "@pages/base.page";
import { HeaderMixin } from "@pages/components/header.component";

// ════════════════════════════════════════════════════════════════════════════
// SELECTORS — verified against the live DOM (2026-10-09). DevExtreme renders
// the action column in two tables (main scrollable + fixed pointer-events-none
// overlay); data rows are scoped to .dx-scrollable-content to avoid the
// unclickable fixed overlay. Column Chooser is scoped to .dx-toolbar to
// exclude the hidden popup container that carries the same aria-label.
// ════════════════════════════════════════════════════════════════════════════

export class UserRolesPage extends HeaderMixin(BasePage) {
  // ── Page heading ──────────────────────────────────────────────────────────
  // Tier 2: CSS-module class partial (stable prefix "BasePage_titlePanel")
  private readonly pageHeading = this.page.locator('[class*="BasePage_titlePanel"]');

  // ── Grid container ───────────────────────────────────────────────────────
  // Tier 2: stable element id
  private readonly grid = this.page.locator("#gridUserRoleCtrl");

  // ── Toolbar ──────────────────────────────────────────────────────────────
  // Tier 1: ARIA role + accessible name (aria-label) — all scoped to grid
  private readonly createBtn    = this.grid.getByRole("button", { name: "add" });
  private readonly reloadBtn    = this.grid.getByRole("button", { name: "refresh" });
  private readonly saveViewBtn  = this.grid.getByRole("button", { name: "save-view-settings" });
  private readonly resetViewBtn = this.grid.getByRole("button", { name: "default-view-settings" });
  // Tier 1: getByTitle — DevExtreme export button exposes a title attribute
  private readonly exportBtn = this.grid.getByTitle("Export");
  // Tier 2: scoped to .dx-toolbar to exclude the hidden column-chooser popup
  private readonly columnChooserBtn = this.grid.locator(
    '.dx-toolbar [aria-label="Column Chooser"]',
  );

  // ── Column headers ───────────────────────────────────────────────────────
  // Tier 1: ARIA role=columnheader + accessible name
  private readonly nameColHeader   = this.grid.getByRole("columnheader", { name: "Column Name" });
  private readonly isProdColHeader = this.grid.getByRole("columnheader", { name: "Column Is production" });

  // ── Filter row ───────────────────────────────────────────────────────────
  // Tier 1: role=textbox, unique in grid scope (Name column only)
  private readonly nameFilterInput = this.grid.getByRole("textbox", { name: "Filter cell" });
  // Tier 1: role=menuitem — the filter-operation selector ("Contains" chevron)
  private readonly nameFilterMenuBtn = this.grid.getByRole("menuitem", { name: "Search box" });
  // Tier 1: role=combobox — Is production "(all)/true/false" dropdown
  private readonly isProdFilterCombobox = this.grid.getByRole("combobox", { name: "Filter cell" });

  // ── Data rows (factories) ────────────────────────────────────────────────
  // Tier 2: scoped to .dx-scrollable-content to exclude the fixed-column
  // pointer-events-none overlay; verified against "Business analyst" (ID 3)
  // and "HR manager" (ID 10). Pass the full role name for a unique match.
  private readonly row = (name: string) =>
    this.grid.locator(".dx-scrollable-content .dx-data-row", { hasText: name });

  // Row-level actions — Tier 2: title attribute, 1 per named row
  private readonly rowEditBtn = (name: string) =>
    this.row(name).locator('a[title="Edit"]');
  private readonly rowDeleteBtn = (name: string) =>
    this.row(name).locator('a[title="Delete"]');

  // Is production read-only checkbox in a data row
  // Tier 2: role="checkbox" (DevExtreme renders .dx-checkbox with that role)
  private readonly rowIsProductionCheckbox = (name: string) =>
    this.row(name).locator('[role="checkbox"]');

  // ── Empty / no-data state ─────────────────────────────────────────────────
  // Tier 2: stable DevExtreme class; present in DOM but empty when data exists
  private readonly noDataMessage = this.grid.locator(".dx-datagrid-nodata");

  // ── Pager ─────────────────────────────────────────────────────────────────
  // Tier 1: role=navigation with accessible name
  private readonly pagerNav = this.page.getByRole("navigation", {
    name: "Page navigation",
  });
  // Tier 1: role=button (DevExtreme page-size cells expose role="button")
  private readonly pageSizeBtn = (size: number) =>
    this.pagerNav.getByRole("button", { name: `Items per page: ${size}` });
  private readonly prevPageBtn = this.pagerNav.getByRole("button", {
    name: "Previous page",
  });
  private readonly nextPageBtn = this.pagerNav.getByRole("button", {
    name: "Next page",
  });
  private readonly pageBtn = (n: number) =>
    this.pagerNav.getByRole("button", { name: `Page ${n}` });
  // Tier 2: stable DevExtreme pager info class
  private readonly pageInfoText = this.pagerNav.locator(".dx-info");

  // ── Inline editor (mutating paths — gaps; not verified read-only) ─────────
  // Create row / edit row locators (Name input, Is production toggle, Save /
  // Cancel) are only reachable after clicking Create or Edit — captured by
  // /sdk-builder once those actions are safe to trigger in CI.

  // ── METHODS — added by /sdk-builder (do not add @step methods here) ──────

  // ── Filtering ─────────────────────────────────────────────────────────────

  /**
   * Fill the Name filter input. DevExtreme filters client-side; no extra wait
   * needed — downstream reads (`getRoleNames`) wait for rows themselves.
   * Pass "" to clear the filter.
   */
  @step()
  async filterByName(text: string): Promise<void> {
    await this.nameFilterInput.fill(text);
  }

  // ── Pager ─────────────────────────────────────────────────────────────────

  /** Click a page-size option (5 / 10 / 15 / 25 / 50 / 100). */
  @step()
  async setPageSize(size: number): Promise<void> {
    await this.pageSizeBtn(size).click();
  }

  // ── Grid data ─────────────────────────────────────────────────────────────

  /**
   * Return the role names currently visible in the grid, in display order.
   * Waits for the first row to be visible before reading; returns [] when the
   * grid shows no data.
   */
  @step()
  async getRoleNames(): Promise<string[]> {
    const rows = this.grid.locator(".dx-scrollable-content .dx-data-row");
    await rows.first().waitFor({ state: "visible" }).catch(() => {});
    return (await rows.locator("td:first-child").allInnerTexts()).map((t) =>
      t.trim(),
    );
  }

  /**
   * Returns true when the DevExtreme "No data" message is visible — i.e. the
   * active filter matches no roles. Also acts as an implicit debounce wait: the
   * no-data element only appears after the client-side filter has settled.
   */
  @step()
  async isNoDataVisible(): Promise<boolean> {
    await this.noDataMessage.waitFor({ state: "visible" });
    return this.noDataMessage.isVisible();
  }
}
