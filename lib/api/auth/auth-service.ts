import { APIRequestContext } from "@playwright/test";

export type LoginResponse = {
  access_token: string;
  token_type: string | null;
  expires: string;
};

export type PersonalDataResponse = {
  Name: string;
  Company: string | null;
  Position: string;
  Email: string;
  PhoneNumber: string;
  IsAdministrator: boolean;
  IsExternal: boolean;
  IsPartner: boolean;
};

export default class AuthService {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string
  ) {}

  async login(email: string, password: string) {
    return this.request.post(`${this.baseUrl}/account/login`, {
      headers: { "Content-Type": "application/json" },
      data: { Email: email, Password: password },
    });
  }

  async getPersonalData(token: string) {
    return this.request.get(`${this.baseUrl}/account/getPersonalData`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async saveLastVisitedPage(token: string, path: string) {
    return this.request.post(`${this.baseUrl}/account/SaveLastVisitedPage`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: path,
    });
  }
}
