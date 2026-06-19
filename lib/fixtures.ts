import { test as baseFixture, APIRequestContext, Page } from "@playwright/test";
import fs from "fs";
import WebClient from "@pages/edsson-app";
import ApiClient from "@api/api-client";
import { Helpers } from "@helpers/helpers";
import { env } from "@lib/config";

const envConfig = env;

function loadSession(
  file: string,
): { authToken: string; sessionId: string } | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

const test = baseFixture.extend<{
  webClient: WebClient;
  apiClient: ApiClient;
  helpers: Helpers;
}>({
  webClient: async ({ page }, use) => {
    await use(new WebClient(page));
  },

  helpers: async ({}, use) => {
    await use(new Helpers());
  },

  apiClient: async ({ request }, use) => {
    const session = loadSession("sessions.json");
    const rawToken = session ? JSON.parse(session.authToken ?? "null") : null;
    const client = new ApiClient(request, envConfig.apiUrl, rawToken);
    await use(client);
  },
});

export { test, APIRequestContext, Page };
export { expect } from "@playwright/test";
