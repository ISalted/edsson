import type { Locator } from "@playwright/test";
import { step } from "@helpers/step";
import { BasePage } from "./base.page";

export type UserAccountTab = "Permissions" | "Projects" | "Groups";
export type CreateFormTab = "Edit User Data" | "Projects" | "Groups";

export type GridColumn =
  | "Login"
  | "Name"
  | "E-mail"
  | "Status"
  | "Company name"
  | "Source creation"
  | "External"
  | "Administrator"
  | "Partner"
  | "Unlock activities date";

export type PermissionName =
  | "View Resource Costs Report" | "View Project Costs Report"
  | "Manage Currencies" | "Manage Resource Rates" | "Manage Exchange Rates"
  | "Manage Company Rates" | "Manage Contracts" | "Manage Invoices"
  | "View Contractors" | "Manage Contractors"
  | "View Contract Types" | "Manage Contract Types"
  | "View Change History" | "Edit My Details" | "Change Password"
  | "Edit User Settings" | "Use Direct HyperLink"
  | "HR Management" | "Manage Holidays" | "Manage Companies" | "Manage Projects"
  | "View Edsson Site Admin" | "Manage Edsson Site Admin"
  | "View Tenant Projects" | "View Tenant Billing" | "Download Expert CV"
  | "View Payment Requests" | "View Acts" | "View Budget" | "Manage Payroll"
  | "Manage Time Teports Of All Operators"
  | "Manage Find Colleagues" | "View Find Colleagues"
  | "Column Settings Buttons" | "Export Buttons"
  | "View KPIs" | "View Requests Productivity"
  | "Manage Technologies" | "View Potential Customers" | "Manage Potential Customers"
  | "Manage Registration Requests" | "View Site Activity"
  | "View Global Locations" | "Manage Global Locations"
  | "Manage Proposal" | "Manage Contact Person" | "Manage Article Viewer"
  | "View Activities Of All Operators"
  | "Manage Topics" | "Comment Topics" | "Manage Activities" | "View Activities"
  | "View Bonus Hours" | "Manage Bonus Hours" | "Approve Bonus Hours"
  | "View Topics" | "Delete Topics" | "Manage External Change Requests"
  | "Manage Time Reports" | "Manage Resource Planning" | "View Resource Planning"
  | "Manage Requests" | "Manage All Requests"
  | "Manage Estimation" | "View Estimation" | "Multiple Update Topics";

export class UserAccountsPage extends BasePage {
  // ════════════════════════════════════════════════════════════════════════
  // SELECTORS — verified against the live DOM (2026-06-18). Where an aria-label
  // is ambiguous (e.g. two "trash" and two "save" buttons exist on the page)
  // the unique title attribute is used or the locator is scoped to a wrapper.
  // ════════════════════════════════════════════════════════════════════════

  // ── Page ──────────────────────────────────────────────────────────────────
  // Title is a <label class="BasePage_title__…">, not a heading.
  private pageTitle = this.page.locator('[class*="BasePage_title"]', {
    hasText: "User Accounts",
  });
  // The page hosts 9 dx-datagrids (detail + permission sub-grids); the main grid
  // is the custom container — every grid sub-part is scoped to it.
  private grid = this.page
    .locator('[class*="DataGridCtrl_gridContainer"]')
    .first();
  private toolbar = this.grid.locator(".dx-datagrid-header-panel");
  private pager = this.grid.locator(".dx-datagrid-pager");
  private pagerInfo = this.pager.locator(".dx-info");

  // ── Top-right header actions (OUTSIDE the grid) ──────────────────────────
  private headerActions = this.page.locator('[class*="actionsWrapper"]');
  private lockBtn = this.page.locator('[aria-label="Lock"]');
  private unlockBtn = this.page.locator('[aria-label="Unlock"]');
  private viewConfigSelect = this.headerActions.locator(".dx-selectbox").first();
  // unique titles disambiguate from the grid-toolbar save/trash
  private saveViewConfigBtn = this.page.locator(
    '[title="Save View Configuration including current Filter & View Setting"]',
  );
  private deleteViewConfigBtn = this.page.locator(
    '[title="Delete current View Configuration including Filter & View Setting"]',
  );

  // ── Grid toolbar buttons (INSIDE the grid header panel) ──────────────────
  private createBtn = this.toolbar.locator('[aria-label="add"]'); // title "Create"
  private deleteBtn = this.toolbar.locator('[aria-label="trash"]'); // title "Delete Selected"
  private refreshBtn = this.toolbar.locator('[aria-label="refresh"]'); // title "Reload Data"
  private collapseBtn = this.toolbar.locator('[aria-label="collapse"]'); // title "Collapse all groups"
  private saveViewSettingBtn = this.toolbar.locator(
    '[aria-label="save-view-settings"]',
  ); // title "Save View Setting"
  private resetViewBtn = this.toolbar.locator(
    '[aria-label="default-view-settings"]',
  ); // title "Reset View Setting to Default"
  private exportBtn = this.toolbar.locator(".dx-datagrid-export-button");
  private columnChooserBtn = this.toolbar.locator('[aria-label="Column Chooser"]');
  // export menu items render in a detached overlay at page level
  private exportToPdf = this.page.locator(".dx-item-content", {
    hasText: "Export all data to PDF",
  });
  private exportToExcel = this.page.locator(".dx-item-content", {
    hasText: "Export all data to Excel",
  });

  // ── Pager ─────────────────────────────────────────────────────────────────
  private nextPageBtn = this.pager.locator('[aria-label="Next page"]');
  private prevPageBtn = this.pager.locator('[aria-label="Previous page"]');
  private pageSizeBtn = (size: number) =>
    this.pager.locator(`[aria-label="Items per page: ${size}"]`);
  private pageNumberBtn = (n: number) =>
    this.pager.locator(`[aria-label="Page ${n}"]`);

  // ── Group panel ──────────────────────────────────────────────────────────
  private groupPanel = this.grid.locator(".dx-datagrid-group-panel");
  private groupPanelMessage = this.grid.locator(".dx-group-panel-message");

  // ── Column headers: sorting + per-column filter funnel ───────────────────
  private headerCell = (column: GridColumn) =>
    this.grid
      .locator(".dx-datagrid-headers .dx-header-row > td")
      .filter({ hasText: column });
  private sortIndicator = (column: GridColumn) =>
    this.headerCell(column).locator(".dx-sort");
  private filterFunnel = (column: GridColumn) =>
    this.grid.locator(
      `[aria-label="Show filter options for column '${column}'"]`,
    );

  // ── Filter row (cells align to column order incl. select + edit columns) ──
  private filterRow = this.grid.locator(".dx-datagrid-filter-row");
  // 0-based index: 0 = select column, 11 = edit column
  private static readonly FILTER_INDEX: Record<GridColumn, number> = {
    Login: 1,
    Name: 2,
    "E-mail": 3,
    Status: 4,
    "Company name": 5,
    "Source creation": 6,
    External: 7,
    Administrator: 8,
    Partner: 9,
    "Unlock activities date": 10,
  };
  private filterCell = (column: GridColumn) =>
    this.filterRow.locator("td").nth(UserAccountsPage.FILTER_INDEX[column]);
  // text columns: Login / Name / E-mail / Status / Company name / Source creation
  private textFilter = (column: GridColumn) =>
    this.filterCell(column).locator("input").first();
  // tri-state boolean columns: External / Administrator / Partner — (all)/checked/unchecked
  private boolFilter = (column: GridColumn) =>
    this.filterCell(column).locator(".dx-selectbox");
  // date column: Unlock activities date
  private dateFilter = this.filterCell("Unlock activities date").locator(
    ".dx-datebox",
  );

  // ── Rows: selection + edit ───────────────────────────────────────────────
  private rowByLogin = (login: string) =>
    this.grid.locator(".dx-data-row", { hasText: login }).first();
  // CAUTION: select-all + delete would wipe every account — use with extreme care
  private selectAllCheckbox = this.grid.locator(
    ".dx-datagrid-headers .dx-header-row .dx-command-select .dx-select-checkbox",
  );
  private rowCheckbox = (login: string) =>
    this.rowByLogin(login).locator(".dx-command-select .dx-select-checkbox");
  private editBtn = (login: string) =>
    this.rowByLogin(login).locator('a[title="Edit"]').first(); // a.dx-link.dx-icon-edit

  // ── Detail panel (opens on row click) ────────────────────────────────────
  private detailPanel = this.page.locator(".dx-tabpanel").first();
  private detailTab = (tab: UserAccountTab) =>
    this.detailPanel.locator(".dx-tab", { hasText: tab });
  private detailCloseBtn = this.detailPanel.locator('[aria-label="Close"]');
  // detail content is a sub-grid (columns: User Permission / Group Permission / Name)
  private detailGrid = this.detailPanel.locator(".dx-datagrid");
  private detailRowByText = (text: string) =>
    this.detailGrid.locator(".dx-data-row", { hasText: text });

  // ── Create / Edit popup ───────────────────────────────────────────────────
  // .first() — the create/edit popup is the first popup wrapper; a server
  // validation "Error" dialog (e.g. bad e-mail / duplicate) opens a SECOND
  // .dx-popup-wrapper on top, which would otherwise break strict-mode locators.
  private createPopup = this.page.locator(".dx-popup-wrapper").first();
  private createFormTab = (tab: CreateFormTab) =>
    this.createPopup.locator(".dx-tab", { hasText: tab });
  // The form (UserAccountForm_formColumn) interleaves <label> + editor div as
  // adjacent siblings — there is NO .dx-field wrapper. Anchor on the label and
  // take its immediately-following sibling (the editor: textbox/textarea/
  // selectbox/datebox/checkbox). Labels carry a trailing "*" when required, so
  // hasText (substring) matches "Name" against "Name*".
  // Scope to the Edit User Data form labels specifically — the Projects/Groups
  // tabs are also in the DOM and carry their own "formLabel" elements (e.g. a
  // "Name" field), so a generic [class*="formLabel"] matches multiple editors.
  private formEditor = (label: string) =>
    this.createPopup
      .locator('[class*="UserAccountForm_formLabel"]', { hasText: label })
      .locator("xpath=following-sibling::*[1]");
  private formInput = (label: string) =>
    this.formEditor(label).locator(".dx-texteditor-input");
  private formSelectbox = (label: string) => this.formEditor(label);
  private formCheckbox = (label: string) => this.formEditor(label);

  // ── Permissions grid (inside create popup) ───────────────────────────────
  private permGrid = this.createPopup
    .locator(".dx-datagrid")
    .filter({ hasText: "Permission name" });
  private permRow = (name: PermissionName) =>
    this.permGrid.locator(".dx-data-row", { hasText: name }).first();
  // grant = the row's select checkbox; the cell also holds a readonly indicator
  // checkbox, so target .dx-command-select specifically.
  private permCheckbox = (name: PermissionName) =>
    this.permRow(name).locator(".dx-command-select .dx-select-checkbox");
  private permSelectAllCheckbox = this.permGrid.locator(
    ".dx-header-row .dx-command-select .dx-select-checkbox",
  );

  private saveBtn = this.createPopup.locator('[aria-label="Save"]').first();
  private saveAndCloseBtn = this.createPopup.locator('[aria-label="Save and Close"]');
  private closePopupBtn = this.createPopup.locator('[aria-label="Close"].dx-button-mode-contained');
  private closeTitleBtn = this.createPopup.locator('[aria-label="Close"].dx-button-mode-text');
  private fullscreenBtn = this.createPopup.locator('[aria-label="expand"]');

  // ── Groups tab (popup): grid of groups, one select checkbox per row ───────
  // Scope to the active tab's content so the same row/checkbox selectors work
  // whichever tab is shown. (The "Projects" tab is disabled until the user is
  // saved; the "Groups" tab is available in Create mode.)
  private activeTabContent = this.createPopup.locator(
    ".dx-multiview-item.dx-item-selected",
  );
  private groupRow = (name: string) =>
    this.activeTabContent.locator(".dx-data-row", { hasText: name }).first();
  private groupCheckbox = (name: string) =>
    this.groupRow(name).locator(".dx-select-checkbox");

  // ── Projects tab (popup, Edit mode only — disabled in Create) ─────────────
  // Left "Find project" panel: a search input + Search button feed a "Matching
  // projects" grid; right "Projects linked to user" grid has the Is Read Only
  // column. The only text input in the tab is the search box.
  private projectSearchInput = this.activeTabContent
    .locator(".dx-texteditor-input")
    .first();
  private projectSearchBtn = this.createPopup.getByRole("button", {
    name: "Search",
    exact: true,
  });
  private linkSelectedBtn = this.createPopup.getByRole("button", {
    name: "Link selected",
    exact: true,
  });
  private matchingProjectsGrid = this.activeTabContent.locator(".dx-datagrid").first();
  private linkedProjectsGrid = this.activeTabContent
    .locator(".dx-datagrid")
    .filter({ hasText: "Is Read Only" });
  private matchingProjectCheckbox = (name: string) =>
    this.matchingProjectsGrid
      .locator(".dx-data-row", { hasText: name })
      .first()
      .locator(".dx-select-checkbox");
  private linkedProjectRow = (name: string) =>
    this.linkedProjectsGrid.locator(".dx-data-row", { hasText: name }).first();

  // ── Page state ────────────────────────────────────────────────────────────
  @step()
  async isGridVisible() {
    await this.grid.waitFor({ state: "visible" });
    return this.grid.isVisible();
  }

  // Presence check without waiting — used to assert the grid is NOT rendered
  // (e.g. unauthenticated access exposes no data).
  @step()
  async isGridPresent() {
    return (await this.grid.count()) > 0;
  }

  @step()
  async isPagerVisible() {
    await this.pager.waitFor({ state: "visible" });
    return this.pager.isVisible();
  }

  @step()
  async getPagerInfo(): Promise<string> {
    await this.pagerInfo.waitFor({ state: "visible" });
    return (await this.pagerInfo.textContent()) ?? "";
  }

  @step()
  async isRowVisible(login: string) {
    const row = this.rowByLogin(login);
    await row.waitFor({ state: "visible" });
    return row.isVisible();
  }

  // ── Toolbar actions ───────────────────────────────────────────────────────
  @step()
  async clickCreate() {
    await this.createBtn.click();
  }

  @step()
  async clickDelete() {
    await this.deleteBtn.click();
  }

  @step()
  async clickRefresh() {
    await this.refreshBtn.click();
  }

  @step()
  async clickCollapse() {
    await this.collapseBtn.click();
  }

  @step()
  async clickColumnChooser() {
    await this.columnChooserBtn.click();
  }

  // ── Row interaction ───────────────────────────────────────────────────────
  @step()
  async clickRow(login: string) {
    await this.rowByLogin(login).click();
  }

  // Clicks a row AND waits for the detail panel's permissions request, so the
  // bottom Permissions grid is loaded (No -> Yes) before any detail read.
  @step()
  async openRowDetail(login: string) {
    await Promise.all([
      this.page
        .waitForResponse(
          (r) => r.url().includes("GetUserPermissions") && r.status() === 200,
          { timeout: 15_000 },
        )
        .catch(() => undefined),
      this.rowByLogin(login).click(),
    ]);
  }

  // ── Detail panel ──────────────────────────────────────────────────────────
  @step()
  async isDetailPanelVisible() {
    await this.detailPanel.waitFor({ state: "visible" });
    return this.detailPanel.isVisible();
  }

  @step()
  async switchDetailTab(tab: UserAccountTab) {
    await this.detailTab(tab).click();
  }

  @step()
  async isDetailTabActive(tab: UserAccountTab) {
    const el = this.detailTab(tab);
    await el.waitFor({ state: "visible" });
    return (await el.getAttribute("aria-selected")) === "true";
  }

  @step()
  async closeDetailPanel() {
    await this.detailCloseBtn.click();
  }

  // ── Pager actions ─────────────────────────────────────────────────────────
  @step()
  async goToNextPage() {
    await this.nextPageBtn.click();
  }

  @step()
  async goToPreviousPage() {
    await this.prevPageBtn.click();
  }

  @step()
  async setItemsPerPage(size: 5 | 10 | 15 | 25 | 50 | 100) {
    await this.pageSizeBtn(size).click();
  }

  // ── Create popup ──────────────────────────────────────────────────────────
  @step()
  async isCreatePopupVisible() {
    await this.createPopup.waitFor({ state: "visible" });
    return this.createPopup.isVisible();
  }

  @step()
  async switchCreateFormTab(tab: CreateFormTab) {
    await this.createFormTab(tab).click();
  }

  @step()
  async selectInForm(label: string, value: string) {
    await this.formSelectbox(label).click();
    await this.page.locator(".dx-list-item", { hasText: value }).first().click();
  }

  @step()
  async checkInForm(label: string, checked = true) {
    const cb = this.formCheckbox(label);
    const isChecked = (await cb.getAttribute("aria-checked")) === "true";
    if (isChecked !== checked) await cb.click();
  }

  @step()
  async fillCreateForm(data: {
    name: string;
    login: string;
    email: string;
    phone?: string;
    position?: string;
    details?: string;
    status?: string;
    company?: string;
    role?: string;
    language?: string;
    creationSource?: string;
    unlockActivitiesDate?: string;
    administrator?: boolean;
    passwordNeverExpires?: boolean;
    externalUser?: boolean;
    partnerUser?: boolean;
    subscribeForNews?: boolean;
    findColleaguesUser?: boolean;
  }) {
    await this.formInput("Name").fill(data.name);
    await this.formInput("Login").fill(data.login);
    await this.formInput("E-mail").fill(data.email);
    if (data.phone) await this.formInput("Phone").fill(data.phone);
    if (data.position) await this.formInput("Position").fill(data.position);
    if (data.details) await this.formInput("Details").fill(data.details);
    if (data.status) await this.selectInForm("Status", data.status);
    if (data.company) await this.selectInForm("Company", data.company);
    if (data.role) await this.selectInForm("Role", data.role);
    if (data.language) await this.selectInForm("Language", data.language);
    if (data.creationSource) await this.selectInForm("Creation source", data.creationSource);
    if (data.unlockActivitiesDate)
      await this.formInput("Unlock activities date").fill(data.unlockActivitiesDate);
    if (data.administrator !== undefined)
      await this.checkInForm("Administrator", data.administrator);
    if (data.passwordNeverExpires !== undefined)
      await this.checkInForm("Password never expires", data.passwordNeverExpires);
    if (data.externalUser !== undefined)
      await this.checkInForm("External user", data.externalUser);
    if (data.partnerUser !== undefined)
      await this.checkInForm("Partner user", data.partnerUser);
    if (data.subscribeForNews !== undefined)
      await this.checkInForm("Subsscribe for news", data.subscribeForNews);
    if (data.findColleaguesUser !== undefined)
      await this.checkInForm("Find colleagues user", data.findColleaguesUser);
  }

  @step()
  async togglePermission(name: PermissionName, checked = true) {
    const cb = this.permCheckbox(name);
    const isChecked = (await cb.getAttribute("aria-checked")) === "true";
    if (isChecked !== checked) await cb.click();
  }

  @step()
  async setPermissions(names: PermissionName[]) {
    for (const name of names) await this.togglePermission(name, true);
  }

  @step()
  async isPermissionChecked(name: PermissionName) {
    const cb = this.permCheckbox(name);
    await cb.waitFor({ state: "visible" });
    return (await cb.getAttribute("aria-checked")) === "true";
  }

  @step()
  async selectAllPermissions() {
    await this.permSelectAllCheckbox.click();
  }

  @step()
  async save() {
    await this.saveBtn.click();
  }

  @step()
  async saveAndClose() {
    await this.saveAndCloseBtn.click();
  }

  @step()
  async closePopup() {
    await this.closePopupBtn.click();
    // wait for the popup to actually close, else a following open is intercepted
    await this.createPopup.waitFor({ state: "hidden" }).catch(() => undefined);
  }

  @step()
  async closePopupByX() {
    await this.closeTitleBtn.click();
    await this.createPopup.waitFor({ state: "hidden" }).catch(() => undefined);
  }

  @step()
  async toggleFullscreen() {
    await this.fullscreenBtn.click();
  }

  // ── Grid data ──────────────────────────────────────────────────────────────
  @step()
  async getRowCount() {
    await this.grid.waitFor({ state: "visible" });
    const rows = this.grid.locator(".dx-data-row");
    // rows render after the data XHR resolves — wait for the first one
    await rows.first().waitFor({ state: "visible" }).catch(() => {});
    return rows.count();
  }

  // ── Header toolbar state (enabled = no dx-state-disabled class) ───────────
  private async isControlEnabled(loc: Locator) {
    await loc.waitFor({ state: "visible" });
    const cls = (await loc.getAttribute("class")) ?? "";
    return !cls.includes("dx-state-disabled");
  }

  @step()
  async isLockEnabled() {
    return this.isControlEnabled(this.lockBtn);
  }

  @step()
  async isUnlockEnabled() {
    return this.isControlEnabled(this.unlockBtn);
  }

  @step()
  async isDeleteEnabled() {
    return this.isControlEnabled(this.deleteBtn);
  }

  // ── Selection ───────────────────────────────────────────────────────────────
  @step()
  async selectRow(login: string) {
    await this.rowCheckbox(login).click();
  }

  @step()
  async isRowSelected(login: string) {
    const row = this.rowByLogin(login);
    await row.waitFor({ state: "visible" });
    const cls = (await row.getAttribute("class")) ?? "";
    return cls.includes("dx-selection");
  }

  // ── Detail panel content ───────────────────────────────────────────────────
  @step()
  async isDetailRowVisible(text: string) {
    const row = this.detailRowByText(text).first();
    await row.waitFor({ state: "visible" });
    return row.isVisible();
  }

  @step()
  async getDetailContent() {
    const dg = this.detailGrid.first();
    await dg.waitFor({ state: "visible" });
    return (await dg.textContent()) ?? "";
  }

  // ── Create / Edit popup: validation & field values ───────────────────────
  @step()
  async isFieldInvalid(label: string) {
    const editor = this.formEditor(label);
    await editor.waitFor({ state: "visible" });
    const cls = (await editor.getAttribute("class")) ?? "";
    return cls.includes("dx-invalid");
  }

  // false when the field is read-only/disabled (e.g. Login is immutable in Edit)
  @step()
  async isFieldEditable(label: string) {
    const input = this.formInput(label);
    await input.waitFor({ state: "visible" });
    return input.isEditable();
  }

  @step()
  async getInvalidFieldCount() {
    return this.createPopup.locator(".dx-invalid").count();
  }

  // Format/server validation (e.g. bad e-mail) is surfaced as a message, not a
  // dx-invalid field class — check the message text instead.
  @step()
  async isErrorMessageVisible(text: string) {
    const msg = this.page.getByText(text, { exact: false }).first();
    await msg.waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
    return msg.isVisible();
  }

  @step()
  async clickEditRow(login: string) {
    await this.editBtn(login).click();
    await this.createPopup.waitFor({ state: "visible" });
    // the edit form fetches the user's data async — wait until Login populates
    // (an existing user always has a Login) so field reads aren't empty
    const loginInput = this.formInput("Login");
    await loginInput.waitFor({ state: "visible" });
    for (let i = 0; i < 50; i++) {
      const v = (await loginInput.inputValue().catch(() => "")).trim();
      if (v.length > 0) break;
      await this.page.waitForTimeout(100);
    }
  }

  @step()
  async getFieldValue(label: string) {
    return this.formInput(label).inputValue();
  }

  @step()
  async getSelectboxValue(label: string) {
    // .dx-texteditor-input holds the visible display text (e.g. "Active"),
    // whereas a hidden value input holds the data code (e.g. "0").
    return this.formSelectbox(label).locator(".dx-texteditor-input").inputValue();
  }

  @step()
  async isCheckboxChecked(label: string) {
    const cb = this.formCheckbox(label);
    await cb.waitFor({ state: "visible" });
    return (await cb.getAttribute("aria-checked")) === "true";
  }

  @step()
  async setFieldValue(label: string, value: string) {
    await this.formInput(label).fill(value);
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  @step()
  async filterByText(column: GridColumn, value: string) {
    await this.textFilter(column).fill(value);
  }

  @step()
  async isNoDataVisible() {
    const noData = this.grid.locator(".dx-datagrid-nodata");
    await noData.waitFor({ state: "visible" });
    return noData.isVisible();
  }

  // ── Accessibility ────────────────────────────────────────────────────────
  @step()
  async isFocusInsidePopup() {
    await this.createPopup.waitFor({ state: "visible" });
    return this.page.evaluate(() => {
      const popup = document.querySelector(".dx-popup-wrapper");
      return (
        !!popup && !!document.activeElement && popup.contains(document.activeElement)
      );
    });
  }

  // Selects the first available option of a required dropdown (used when the
  // exact option label is irrelevant, e.g. just satisfying Status/Language).
  @step()
  async selectFirstOption(label: string) {
    await this.formSelectbox(label).click();
    await this.page.locator(".dx-list-item").first().click();
  }

  // Fires two Save clicks back-to-back to exercise the double-submit race.
  @step()
  async doubleSave() {
    await Promise.allSettled([this.saveBtn.click(), this.saveBtn.click()]);
  }

  // In the master-detail Permissions grid (columns: User Permission |
  // Group Permission | Name), reads whether the named permission's
  // User Permission cell reads "Yes".
  // NOTE: confirm the first-cell index on first run.
  @step()
  async isDetailPermissionGranted(name: string) {
    const row = this.detailRowByText(name).first();
    await row.waitFor({ state: "visible" });
    const userPerm = (await row.locator("td").first().textContent()) ?? "";
    return userPerm.trim().toLowerCase() === "yes";
  }

  // ── Lock / Unlock ────────────────────────────────────────────────────────
  @step()
  async clickLock() {
    await this.lockBtn.click();
  }

  @step()
  async clickUnlock() {
    await this.unlockBtn.click();
  }

  // ── Grid row state & cells ───────────────────────────────────────────────
  // Active rows have no inline style; Inactive rows are greyed via an inline
  // color; Deleted rows via text-decoration: line-through.
  @step()
  async isRowGreyed(login: string) {
    const row = this.rowByLogin(login);
    await row.waitFor({ state: "visible" });
    const style = (await row.getAttribute("style")) ?? "";
    return style.includes("color:");
  }

  @step()
  async isRowStrikethrough(login: string) {
    const row = this.rowByLogin(login);
    await row.waitFor({ state: "visible" });
    const style = (await row.getAttribute("style")) ?? "";
    return style.includes("line-through");
  }

  @step()
  async getRowCellText(login: string, column: GridColumn) {
    const cell = this.rowByLogin(login)
      .locator("td")
      .nth(UserAccountsPage.FILTER_INDEX[column]);
    await cell.waitFor({ state: "visible" });
    return (await cell.textContent())?.trim() ?? "";
  }

  @step()
  async isGridBooleanChecked(login: string, column: GridColumn) {
    const cb = this.rowByLogin(login)
      .locator("td")
      .nth(UserAccountsPage.FILTER_INDEX[column])
      .locator(".dx-checkbox");
    await cb.waitFor({ state: "visible" });
    return (await cb.getAttribute("aria-checked")) === "true";
  }

  // ── Popup lifecycle ──────────────────────────────────────────────────────
  @step()
  async isCreatePopupClosed() {
    await this.createPopup.waitFor({ state: "hidden" }).catch(() => {});
    return !(await this.createPopup.isVisible());
  }

  // ── Groups tab (popup) ───────────────────────────────────────────────────
  @step()
  async toggleGroup(name: string, checked = true) {
    const cb = this.groupCheckbox(name);
    await cb.waitFor({ state: "visible" });
    const isChecked = (await cb.getAttribute("aria-checked")) === "true";
    if (isChecked !== checked) await cb.click();
  }

  @step()
  async isInGroup(name: string) {
    const cb = this.groupCheckbox(name);
    await cb.waitFor({ state: "visible" });
    return (await cb.getAttribute("aria-checked")) === "true";
  }

  // ── Projects tab (popup, Edit mode) ──────────────────────────────────────
  @step()
  async searchProject(term: string) {
    await this.projectSearchInput.fill(term);
    await this.projectSearchBtn.click();
  }

  @step()
  async linkProject(name: string) {
    const cb = this.matchingProjectCheckbox(name);
    await cb.waitFor({ state: "visible" });
    await cb.click();
    await this.linkSelectedBtn.click();
  }

  @step()
  async isProjectLinked(name: string) {
    const row = this.linkedProjectRow(name);
    await row.waitFor({ state: "visible" });
    return row.isVisible();
  }

  /**
   * High-level flow: create a user via the popup and Save and Close.
   * Status / Language / Creation source carry valid defaults, so only
   * Name/Login/E-mail (+ optional fields/permissions) are filled.
   *
   * NOTE: persists a real user — delete is forbidden, so these accumulate on the
   * shared dev grid until an isolated test-data / teardown strategy exists.
   */
  @step()
  async createUser(data: {
    name: string;
    login: string;
    email: string;
    phone?: string;
    position?: string;
    details?: string;
    permissions?: PermissionName[];
  }) {
    await this.clickCreate();
    await this.fillCreateForm({
      name: data.name,
      login: data.login,
      email: data.email,
      phone: data.phone,
      position: data.position,
      details: data.details,
    });
    if (data.permissions?.length) await this.setPermissions(data.permissions);
    await this.saveAndClose();
    // wait for the save to complete (popup closes) before any navigation, else a
    // following goTo aborts the in-flight create (the welcome e-mail send is slow)
    await this.isCreatePopupClosed();
  }
}
