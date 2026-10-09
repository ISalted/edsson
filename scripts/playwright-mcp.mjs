#!/usr/bin/env node
// Launches the Playwright MCP server (used by .mcp.json).
// Locally: plain `npx @playwright/mcp@latest` (headed, your installed Chrome).
// Claude Code on the web (cloud container): headless pre-installed Chromium via the agent proxy.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const args = ["-y", "@playwright/mcp@latest", ...process.argv.slice(2)];

const cloudChromium = "/opt/pw-browsers/chromium";
if (process.env.CLAUDE_CODE_REMOTE === "true" && existsSync(cloudChromium)) {
  args.push("--headless", "--isolated", "--no-sandbox", "--executable-path", cloudChromium);
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) args.push("--proxy-server", proxy, "--ignore-https-errors");
}

const child = spawn("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 1));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
