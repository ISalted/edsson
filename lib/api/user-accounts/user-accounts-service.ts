import { APIRequestContext } from "@playwright/test";

export type UserAccount = {
  id: number;
  Login: string;
  Name: string;
  Email: string;
  Position: string;
  Status: string;
  CompanyName: string;
  SourceCreation: string;
  IsAdministrator: boolean;
  IsExternal: boolean;
  IsPartner: boolean;
  LockedFillDate: string | null;
  IsSelected: boolean;
};

export type Permission = {
  PermissionID: number;
  Name: string;
  Category: string;
  UserPermissionCount: string;
  GroupPermissionCount: string;
};

export type Group = {
  id: number;
  Name: string;
  Status: number;
  Comments: string;
};

export type LinkedProject = {
  id: number;
  Prefix: string;
  Name: string;
  FromGroup: boolean;
  IsReadOnly: boolean;
};

export type MatchingProject = {
  id: number;
  Prefix: string;
  Name: string;
};

export type ViewConfiguration = {
  Value: number;
  DisplayValue: string;
};

export type EdssonListResponse<T> = {
  DataSource: T[];
  IsSuccess: boolean;
  Message: string | null;
  Token: string | null;
};

export type ViewConfigurationsResponse = {
  ViewConfigurations: ViewConfiguration[];
  CurrentViewConfigurationId: number;
  CurrentViewConfigurationName: string;
};

export type ViewDataResponse = {
  CurrentViewConfigurationName: string;
  FilterSetting: unknown | null;
  ViewSetting: unknown | null;
  ViewAttributes: unknown | null;
  DataSource: unknown | null;
};

export default class UserAccountsService {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
    private readonly token?: string
  ) {}

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  getEntities() {
    return this.request.post(
      `${this.baseUrl}/administration/useraccounts/GetEntities`,
      { headers: this.headers() }
    );
  }

  getActualUserPermissions() {
    return this.request.get(
      `${this.baseUrl}/administration/useraccounts/GetActualUserPermissions`,
      { headers: this.headers() }
    );
  }

  getUserPermissions(userAccountId: number) {
    return this.request.get(
      `${this.baseUrl}/administration/useraccounts/GetUserPermissions?userAccountId=${userAccountId}`,
      { headers: this.headers() }
    );
  }

  getUserGroups(userAccountId: number) {
    return this.request.get(
      `${this.baseUrl}/administration/useraccounts/GetUserGroups?userAccountId=${userAccountId}`,
      { headers: this.headers() }
    );
  }

  getLinkedProjects(userAccountId: number) {
    return this.request.get(
      `${this.baseUrl}/administration/useraccounts/GetLinkedProjects?userAccountId=${userAccountId}`,
      { headers: this.headers() }
    );
  }

  getMatchingProjects(userAccountId: number, searchText = "") {
    return this.request.get(
      `${this.baseUrl}/administration/useraccounts/GetMatchingProjects?userAccountId=${userAccountId}&searchText=${encodeURIComponent(searchText)}`,
      { headers: this.headers() }
    );
  }

  getViewConfigurations() {
    return this.request.get(
      `${this.baseUrl}/administration/useraccounts/GetViewConfigurations`,
      { headers: this.headers() }
    );
  }

  getViewData(viewConfigurationName = "") {
    return this.request.get(
      `${this.baseUrl}/administration/useraccounts/GetViewData?viewConfigurationName=${encodeURIComponent(viewConfigurationName)}`,
      { headers: this.headers() }
    );
  }
}
