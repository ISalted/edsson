import type { Dialog, Page, Request } from "@playwright/test";
import { step } from "@helpers/step";

/**
 * Generic, framework- and page-agnostic utilities — exposed via the `helpers`
 * fixture. Page flows live on page objects; test data lives in lib/data.
 * Methods here take the page (or other primitives) as parameters and never
 * hold state, so they stay reusable across areas.
 */
export class Helpers {
  // The app caches the auth token in localStorage under an lscache-prefixed
  // key, with a sibling `-cacheexpiration` entry. Keep both names in sync with
  // globalSetup.ts.
  private static readonly AUTH_TOKEN_KEY = "lscache-e-LS_AUTH_TOKEN";

  /** Remove the cached auth token (and its lscache expiration sibling) from localStorage. */
  @step()
  async clearAuthToken(page: Page): Promise<void> {
    const key = Helpers.AUTH_TOKEN_KEY;
    await page.evaluate((k) => {
      localStorage.removeItem(k);
      localStorage.removeItem(`${k}-cacheexpiration`);
    }, key);
  }

  /** Overwrite the cached auth token with a syntactically-valid but invalid value. */
  @step()
  async corruptAuthToken(page: Page): Promise<void> {
    const key = Helpers.AUTH_TOKEN_KEY;
    await page.evaluate((k) => {
      localStorage.setItem(k, '"NOT_A_REAL_TOKEN"');
    }, key);
  }

  /** Search the current origin's localStorage, sessionStorage, and cookies for a substring. */
  @step()
  async scanStorageForSecret(
    page: Page,
    secret: string,
  ): Promise<{ localStorage: boolean; sessionStorage: boolean; cookies: boolean }> {
    const inStorages = await page.evaluate((s) => {
      const scan = (store: Storage) => {
        for (let i = 0; i < store.length; i++) {
          const key = store.key(i);
          if (!key) continue;
          if (key.includes(s)) return true;
          const value = store.getItem(key);
          if (typeof value === "string" && value.includes(s)) return true;
        }
        return false;
      };
      return {
        localStorage: scan(localStorage),
        sessionStorage: scan(sessionStorage),
      };
    }, secret);
    const cookies = await page.context().cookies();
    const inCookies = cookies.some(
      (c) => c.value.includes(secret) || c.name.includes(secret),
    );
    return { ...inStorages, cookies: inCookies };
  }

  /**
   * Run `action` while listening for requests whose URL matches `urlPattern`,
   * and return how many fired. Short settle wait at the end so requests in
   * flight when `action` resolves are still counted.
   */
  @step()
  async countNetworkRequests(
    page: Page,
    urlPattern: RegExp,
    action: () => Promise<void>,
  ): Promise<number> {
    let count = 0;
    const listener = (req: Request) => {
      if (urlPattern.test(req.url())) count++;
    };
    page.on("request", listener);
    try {
      await action();
      await page.waitForTimeout(500);
    } finally {
      page.off("request", listener);
    }
    return count;
  }

  /**
   * Run `action` while watching for a native JS dialog (alert/confirm/prompt)
   * and return whether one fired. Used to prove an injected XSS payload is
   * rendered as literal text rather than executed (AUT-020). Any dialog is
   * accepted-and-dismissed so the page is never left blocked.
   */
  @step()
  async didDialogAppearDuring(
    page: Page,
    action: () => Promise<void>,
  ): Promise<boolean> {
    let appeared = false;
    const listener = async (dialog: Dialog) => {
      appeared = true;
      await dialog.dismiss().catch(() => {});
    };
    page.on("dialog", listener);
    try {
      await action();
      await page.waitForTimeout(500);
    } finally {
      page.off("dialog", listener);
    }
    return appeared;
  }
}
