import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./tests",
  // Logs in once before everything and writes session-storage.json. Runs in
  // both CLI and UI mode regardless of the project filter (no setup project).
  globalSetup: "./globalSetup.ts",
  // 60s: create-flow tests are slow because creating a user triggers a real
  // welcome-email send on save (dev env). Lower once that is disabled/sinked.
  timeout: 60 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    // ["./node_modules/@testomatio/reporter/lib/adapter/playwright.js", { apiKey: process.env.TESTOMATIO }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 30 * 1000,
    channel: "chrome",
    ...devices["Desktop Chrome"],
    viewport: { width: 1700, height: 1025 },
    launchOptions: {
      args: ["--disable-blink-features=AutomationControlled"],
    },
  },
  projects: [
    {
      name: "Parallel Web",
      testMatch: ["**/*.web.test.ts"],
      use: {
        storageState: "session-storage.json",
      },
    },
  ],
});
