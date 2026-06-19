import { APIRequestContext } from "@playwright/test";
import AuthService from "./auth/auth-service";
import UserAccountsService from "./user-accounts/user-accounts-service";

export default class ApiClient {
  public auth: AuthService;
  public userAccounts: UserAccountsService;

  constructor(
    request: APIRequestContext,
    baseUrl: string,
    token?: string
  ) {
    this.auth = new AuthService(request, baseUrl);
    this.userAccounts = new UserAccountsService(request, baseUrl, token);
  }
}
