import { faker } from "@faker-js/faker";
import type { PermissionName } from "@pages/user-accounts.page";

/**
 * Test data for the User Accounts page.
 *
 * Tag convention: `@mutating` = the test CREATES or CHANGES real records on the
 * shared dev environment (no cleanup — delete is forbidden). Do NOT run these
 * without isolated test data, e.g. exclude with `--grep-invert @mutating`.
 */

// Dedicated read-only AQA fixture account (must exist on dev; never mutated by
// tests — only read; UAC-024 edits a field then discards). Known state:
//   Name: "Danylo ChumakQA", E-mail: danylochumak@gmail.com, Status: Active,
//   External: off, Administrator: ON, Partner: off.
export const KNOWN_USER = "danylochumak_qa";
// Stable existing rows used as "another user already exists" for uniqueness tests.
export const EXISTING_LOGIN = "admin";
export const EXISTING_EMAIL = "13@gmail.com";

export const PERMS = [
  "View Resource Costs Report",
  "Manage Currencies",
] as const satisfies readonly PermissionName[];

/**
 * Builds a unique throwaway user identity for create/edit tests.
 *
 * - Identity fields (login/email) are CONTROLLED: an `aqa.` marker + a unique
 *   stamp, on a fixed domain. Not faker-random, because (a) login/email feed
 *   uniqueness checks and (b) creating a user sends a REAL welcome e-mail — a
 *   random faker domain could mail strangers or hit an RFC 2606 reserved domain.
 * - Human fields (name/phone/position) use faker for variety, but the name
 *   carries a visible `[AQA]` marker so automation data is obvious in the grid.
 *
 * `prefix` tags which test produced the user (e.g. "e2e-create") for traceability.
 */
export function aqaUser(prefix: string) {
  const stamp = Date.now();
  const uid = `${prefix}.${stamp}`;
  return {
    stamp,
    name: `[AQA] ${faker.person.fullName()}`,
    login: `aqa.${uid}`,
    email: `aqa.${uid}@edsson.com`,
    phone: faker.phone.number(),
    position: faker.person.jobTitle(),
  };
}
