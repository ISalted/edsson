import "dotenv/config";
import { chromium } from "@playwright/test";
import fs from "fs";
import WebClient from "@pages/edsson-app";
import { env } from "@lib/config";

const SESSION_FILE = "session-storage.json";

/**
 * Logs in once before the whole suite and persists the session so every
 * project context starts authenticated. Runs in BOTH `npm test` and UI mode,
 * independent of the UI project filter — so there is no setup project to keep
 * checked. On token expiry during a long UI session, hit reload (↻) to re-run.
 */
export default async function globalSetup() {
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    baseURL: env.baseUrl,
    viewport: { width: 1700, height: 1025 },
  });
  const page = await context.newPage();
  const webClient = new WebClient(page);

  await webClient.goTo("/login/");
  await webClient.loginPage.login(env.adminEmail, env.adminPassword);
  await page.waitForURL("**/administration/user-accounts/**", {
    timeout: 30_000,
  });

  const authToken = await page.evaluate(() =>
    localStorage.getItem("lscache-e-LS_AUTH_TOKEN"),
  );
  const sessionId = await page.evaluate(() =>
    localStorage.getItem("lscache-e-LS_SESSION_ID"),
  );
  if (!authToken) {
    await browser.close();
    throw new Error("global setup: auth token not found after login");
  }

  // storageState -> injected via `use.storageState` into every browser context
  await context.storageState({ path: SESSION_FILE });
  // sessions.json -> consumed by the apiClient fixture
  fs.writeFileSync(
    "sessions.json",
    JSON.stringify({ authToken, sessionId }, null, 2),
  );

  await browser.close();
}
