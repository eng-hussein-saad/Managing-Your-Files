# Accessibility Remediation Inventory

| WCAG criterion | Route/state | Failing assertion | Source path | Owner | Status |
|---|---|---|---|---|---|
| 1.4.3 Contrast (Minimum) | `/dashboard`, current sidebar link | axe `color-contrast` on `a[aria-current="page"]` | `client/src/app/globals.css` | T063 | Resolved: current link now uses semantic text with an accent inset cue. |
| 1.4.3 Contrast (Minimum) | `/dashboard`, timezone badge | axe `color-contrast` on `.timezone` | `client/src/app/globals.css` | T063 | Resolved: badge text now uses the high-contrast semantic text token. |
| 1.4.3 Contrast (Minimum) | `/admin`, restricted-workspace label | axe `color-contrast` on `.restricted` | `client/src/app/globals.css` | T063 | Resolved: label uses semantic text while retaining its icon and wording. |

Final evidence: `ui-accessibility.spec.ts` local project — 2/2 route-family scans passed with zero WCAG A/AA violations on 2026-08-25.
