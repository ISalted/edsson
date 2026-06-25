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

  // Post an arbitrary body to /account/login — lets a test send malformed JSON
  // or a payload missing the Email/Password fields and assert the API answers
  // 4xx, never 500 (AUT-027). Caller controls the exact body.
  async loginRaw(data: unknown) {
    return this.request.post(`${this.baseUrl}/account/login`, {
      headers: { "Content-Type": "application/json" },
      data: data as any,
    });
  }

  // Call getPersonalData with NO Authorization header — asserts the endpoint
  // refuses anonymous access with 401 (AUT-026).
  async getPersonalDataWithoutAuth() {
    return this.request.get(`${this.baseUrl}/account/getPersonalData`);
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
