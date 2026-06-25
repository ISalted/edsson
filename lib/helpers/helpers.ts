import { Page, Dialog } from "@playwright/test";

/**
 * Generic, framework- and page-agnostic utilities — e.g. dialog tracking,
 * array sorting, string cleanup. Exposed via the `helpers` fixture:
 *
 *   test("…", async ({ helpers }) => { helpers.trackDialogs(page) });
 *
 * Page flows live on the page objects; test data lives in lib/data.
 */
export class Helpers {
  // Attach a dialog listener to `page` and return a tracker whose `count()`
  // reports how many alert/confirm/prompt/beforeunload dialogs fired since
  // attachment. Used as an XSS oracle: a payload that EXECUTES will trigger an
  // alert() the listener catches and dismisses; a safely-escaped payload
  // triggers nothing.
  trackDialogs(page: Page) {
    const dialogs: Dialog[] = [];
    const handler = async (dialog: Dialog) => {
      dialogs.push(dialog);
      await dialog.dismiss();
    };
    page.on("dialog", handler);
    return {
      count: () => dialogs.length,
      stop: () => page.off("dialog", handler),
    };
  }
}
