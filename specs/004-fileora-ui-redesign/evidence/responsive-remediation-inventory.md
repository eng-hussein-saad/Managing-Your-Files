# Responsive Remediation Inventory

| Viewport/state | Failing assertion | Source path | Owner | Status |
|---|---|---|---|---|
| 320 px at simulated 200% text, landing (first run) | Document width 435 px exceeded 320 px | `client/src/app/globals.css` | T066 | Resolved: mobile display heading wraps and workspace preview columns may shrink. |
| 320 px at simulated 200% text, landing (first rerun) | Document width remained 375 px | `client/src/app/globals.css` | T066 | Resolved: mobile shell and feature-card spacing use bounded pixel gutters that remain within the zoomed viewport. |
| 320 px at root-font scaling used as a zoom proxy | Development tooling retained a 375 px minimum although product-element inspection showed no overflow | `tests/e2e/ui-inclusive-interactions.spec.ts` | T066 | Resolved as reproducible test-method false positive: the journey now models 200% browser zoom by halving the CSS viewport, matching browser zoom reflow semantics without resizing root-relative product tokens. |
| 320 px, `/profile`, long generated email | Page width 348 px exceeded 320 px | `client/src/app/globals.css` | T066 | Resolved: profile definition values can break long unspaced identity strings. |
| Desktop `/files`, compact-only filter drawer journey | Test waited for a Filters trigger hidden by the approved desktop inline-filter layout | `tests/e2e/ui-file-workspace.spec.ts` | T066 | Resolved as test-state mismatch: drawer journey now enters the 768 px compact breakpoint before activation. |

Final evidence: `ui-inclusive-interactions.spec.ts` passed 2/2; the combined public/auth, dashboard/profile, file-workspace, and administrator responsive suite passed 6/6 on the local project on 2026-08-25.
