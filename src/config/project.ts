/**
 * Project-level flags — describe the AnvilWiki open-source project itself,
 * NOT the demo game. This file survives `apply-template` (unlike the landing
 * page files, which the CLI removes).
 */

/**
 * Whether the project landing page (/landing, /zh/landing) exists.
 * When true, the demo site header shows a small hammer icon linking to it,
 * so demo visitors can discover the template behind the demo.
 *
 * `apply-template` flips this to false when it removes the landing page —
 * the header link disappears together with the pages.
 */
export const landingLinkEnabled = false;
