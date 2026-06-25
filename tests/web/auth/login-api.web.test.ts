import { test, expect } from "@lib/fixtures";
import { env } from "@lib/config";

// Pure API surface — driven through apiClient (saved session token), so no UI
// session is needed.
test.describe("Auth — Login API @web @auth @security @regression", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("AUT-022: getPersonalData with a corrupted Bearer token returns 401 @web @auth @security", async ({
    apiClient,
  }) => {
    const response = await apiClient.auth.getPersonalData("corrupted.invalid.token");

    expect(response.status()).toBe(401);
  });

  test("AUT-024: POST /account/login with valid creds returns 200 with a token and a future expiry @web @auth", async ({
    apiClient,
  }) => {
    const response = await apiClient.auth.login(env.adminEmail, env.adminPassword);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.access_token).toBeTruthy();
    expect(new Date(body.expires).getTime()).toBeGreaterThan(Date.now());
  });

  test("AUT-025: POST /account/login with invalid creds returns 400 and no token @web @auth @security", async ({
    apiClient,
  }) => {
    const response = await apiClient.auth.login(env.adminEmail, "wrongpassword");

    expect(response.status()).toBe(400);
    const body = await response.json().catch(() => ({}));
    expect(body.access_token).toBeFalsy();
  });

  test("AUT-026: getPersonalData with no Authorization header returns 401 @web @auth @security", async ({
    apiClient,
  }) => {
    const response = await apiClient.auth.getPersonalDataWithoutAuth();

    expect(response.status()).toBe(401);
  });

  test("AUT-027: POST /account/login missing the Password field returns 4xx, not 500 @web @auth @security", async ({
    apiClient,
  }) => {
    const response = await apiClient.auth.loginRaw({ Email: env.adminEmail });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
