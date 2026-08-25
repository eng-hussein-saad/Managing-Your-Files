# Legacy Migration Inventory

| Entry/source | Current consumer or proof | Unique behavior to preserve | Owner | Status/evidence |
|---|---|---|---|---|
| Legacy `button` class in `client/src/app/admin/layout.tsx` | Anonymous administrator guard | Link to sign-in remains reachable | T071 | Replaced with shared primary button class; security branding test passes. |
| Legacy `button secondary` class in `client/src/components/auth/logout-button.tsx` | Sidebar/topbar sign-out action | Pending disablement, logout mutation, success notice, login redirect | T072 | Replaced with shared `Button`; component/logout regression remains covered. |
| `.hero`, `.actions`, `.text-link`, `.text-button`, `.gold-orbit` in `client/src/app/globals.css` | `rg` found no TSX consumers after landing migration | None beyond superseded landing presentation | T073 | Removed; approved `.landing-*` composition is covered by public/auth E2E. |
| `.dialog-backdrop`, `.app-dialog` in `client/src/app/globals.css` | `rg` found no TSX consumers after folder/admin dialog migration | None; shared overlay owns focus, inert, dismissal, and sizing behavior | T073 | Removed; dialog component and inclusive browser suites pass. |
| `.auth-shell-header` in `client/src/app/globals.css` | `rg` found no TSX consumer after split-auth migration | None | T073 | Removed; auth route coverage passes. |
| `.folder-actions .icon-action` in `client/src/app/globals.css` | `rg` found no TSX consumer after shared-control migration | None | T073 | Removed; folder component coverage passes. |

Inventory rule: every entry has exactly one T071, T072, or T073 owner; no unproven deletion is included.
