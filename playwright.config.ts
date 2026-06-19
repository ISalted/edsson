import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./tests",
  // 60s: create-flow tests are slow because creating a user triggers a real
  // welcome-email send on save (dev env). Lower once that is disabled/sinked.
  timeout: 60 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 1,
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
  },
  projects: [
    {
      name: "setup-auth-web",
      testMatch: /usersSessionWeb\.setup\.ts/,
      use: {
        channel: "chrome",
        ...devices["Desktop Chrome"],
        viewport: { width: 1700, height: 1025 },
        launchOptions: {
          args: ["--disable-blink-features=AutomationControlled"],
        },
      },
    },
    {
      name: "Auth Tests",
      testMatch: ["**/auth/*.web.test.ts"],
      use: {
        channel: "chrome",
        ...devices["Desktop Chrome"],
        viewport: { width: 1700, height: 1025 },
        launchOptions: {
          args: ["--disable-blink-features=AutomationControlled"],
        },
      },
    },
    {
      name: "Parallel Web",
      testMatch: ["**/*.web.test.ts"],
      testIgnore: ["**/auth/*.web.test.ts"],
      dependencies: ["setup-auth-web"],
      use: {
        channel: "chrome",
        ...devices["Desktop Chrome"],
        viewport: { width: 1700, height: 1025 },
        launchOptions: {
          args: ["--disable-blink-features=AutomationControlled"],
        },
        storageState: "session-storage.json",
      },
    },
  ],
});
