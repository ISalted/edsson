import { test as setup } from "@lib/fixtures";
import { env } from "@lib/config";
import fs from "fs";

const SESSION_FILE = "session-storage.json";

setup("web session setup", async ({ webClient }) => {
  await webClient.goTo("/login/");
  await webClient.loginPage.login(env.adminEmail, env.adminPassword);
  await webClient.page.waitForURL("**/administration/user-accounts/**", { timeout: 30_000 });

  const authToken = await webClient.page.evaluate(() =>
    localStorage.getItem("lscache-e-LS_AUTH_TOKEN")
  );
  const sessionId = await webClient.page.evaluate(() =>
    localStorage.getItem("lscache-e-LS_SESSION_ID")
  );

  if (!authToken) throw new Error("web session setup: auth token not found after login");

  // Save storage state so Parallel Web project injects it into every browser context
  await webClient.page.context().storageState({ path: SESSION_FILE });

  // Keep sessions.json for apiClient fixture
  fs.writeFileSync("sessions.json", JSON.stringify({ authToken, sessionId }, null, 2));
});
