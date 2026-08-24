# UI Acceptance Contract

This contract defines how the redesigned presentation is accepted. `specs/fileora-app.html` governs
visual and responsive behavior; existing specifications and API contracts govern outcomes and data.

## Global contract

Every in-scope surface must:

- use approved semantic tokens and shared patterns rather than legacy or page-specific visual systems;
- pass at 1440, 768, and 390 px in light and dark appearance, remain usable at 320 px, and behave
  coherently between checkpoints and through orientation changes;
- preserve every applicable default, loading, empty, validation, submitting, disabled, success,
  failure, retry, unauthenticated, unauthorized, forbidden, and confirmation state;
- expose meaningful structure, associated labels, accessible names, visible focus, logical order,
  keyboard/touch operation, non-color-only status, 44 px minimum targets, reduced-motion behavior,
  and textual chart equivalents;
- produce no page-level horizontal overflow, clipped primary action, missing required value/action,
  major console error, or runtime error;
- preserve existing authorized outcomes and server-enforced security boundaries; and
- record any material visual/responsive deviation and obtain explicit maintainer approval before pass.

## Surface matrix

| Surface | Approved composition | Required preserved outcomes/states |
|---|---|---|
| Landing `/` | Fileora navigation, theme control, two-column hero/workspace visual, feature cards; stacked mobile composition | Sign-in and create-account entry, branding/tagline, theme/system change, long copy, keyboard and reduced motion |
| Register `/register` | Split story/form auth shell; stacked narrow layout | Field validation, submitting/disabled, safe success/error, transition to verification |
| Sign in `/login` | Split story/form auth shell | Invalid/unverified credentials, success, renewal/session restoration, protected/admin route outcomes, no token detail |
| Verify `/verify-email` | Split story/form auth shell | Eight-digit entry, replacement/resend, expiry/invalid/success outcomes, safe enumeration behavior |
| Authentication/access outcomes | Closest approved auth/status pattern | Expired session, unauthenticated, unauthorized, forbidden, retry and sign-out outcomes |
| Authenticated shell | Persistent 248 px desktop sidebar and sticky 72 px top bar; 276 px off-canvas navigation at <=820 px | Active route, user/admin navigation, storage summary, profile, theme, sign-out, backdrop/close/focus/close-after-navigation |
| Dashboard `/dashboard` | Page header, metric grid, upload activity, storage/type summary; approved tablet/mobile rearrangement | Populated/zero/loading/error data, exact meanings, time-zone copy, chart text/table equivalent |
| Files `/files` | Folder panel plus collection, breadcrumbs, search/filter/sort/pagination, list/grid, local-scroll regions | Server-defined queries, empty/no-results, long names, folder nesting/actions, all required file actions |
| Upload | Approved dialog/dropzone/queue | Picker/drop, count/type/size validation, queued/uploading/success/failed/invalid/retry states, partial batch success, session expiry |
| File details/preview | Right-side desktop drawer and usable narrow-screen overlay | Safe metadata, supported/unsupported/loading/failure/denied preview, extracted text, download, move, permanent delete |
| Folder/file destructive flows | Approved warning/confirmation dialog | Explicit irreversibility, safe cancellation, empty-folder rule, exact established outcomes, no undo/trash/restore |
| Profile `/profile` | Approved identity/account card | Safe name/email/role/verification only; no unapproved edit/password/delete capabilities |
| Admin dashboard `/admin` | Restricted cues, admin metrics, recent activity/type summaries | Admin-only server access, populated/zero/loading/error statistics, no private content |
| Admin users `/admin/users` | Restricted toolbar/table with local narrow-screen scroll/condensation | Search/filter/sort/page, safe metadata, role change, exact delete confirmation, self/final-admin/session/cascade/audit rules |
| Admin files `/admin/files` | Restricted metadata toolbar/table | Search/filter/page, safe owner metadata, exact permanent delete; never preview/download/content |
| Audit `/admin/audit` | Restricted filterable/paginated history table | Safe actor/action/entity/time/metadata, loading/empty/error, deleted actor/system rendering, reads create no audit event |
| Feedback and overlays | Shared toast, alert, dialog, and drawer primitives | Announced status, bounded toast count, focus containment/restoration, Escape/safe backdrop dismissal, resize/orientation stability |

## Responsive contract

| Width range | Required behavior |
|---|---|
| Above 1100 px | Full persistent shell, four-column file grid where demonstrated, multi-column workspace/dashboard/profile layouts, full table information. |
| 821-1100 px | Approved reduced grid and workspace/dashboard/profile adjustments; all controls remain reachable. |
| 561-820 px | Off-canvas navigation; stacked workspace and major layouts; two-column metrics/file grid where shown; selected table columns condense without losing required information/actions. |
| 320-560 px | Compact top bar, relocated/hidden duplicate global search, stacked headings/actions/metrics/detail rows, locally scrollable data regions, no page overflow. |

## Theme and motion contract

- `light`, `dark`, and `system` remain the only appearance choices and retain current persistence.
- System mode reacts to a device preference change while the application remains open.
- Every token/pattern/surface must be legible and operable in both effective schemes.
- Hover/focus/active/disabled/status differences remain perceivable without color alone.
- Reduced motion removes nonessential transitions/animations without hiding state or delaying access.

## Evidence contract

Acceptance requires all of the following:

1. Side-by-side maintainer review and screenshot evidence for every route family at 1440, 768, and
   390 px in light and dark, plus 320 px overflow/action evidence.
2. Passed behavioral, contract, integration, security, component, and E2E regression suites.
3. Zero critical automated accessibility violations on landing, auth, dashboard, files, profile, and
   administrator route families, plus keyboard journey evidence.
4. Versioned pass records for the latest two Chrome, Edge, Firefox, and Safari versions and current
   iOS Safari/Android Chrome. Emulation alone is insufficient.
5. Performance measurements showing every critical route/interaction median is no more than 10% slower
   than its recorded pre-redesign baseline under the same protocol.
6. A usability record for at least 10 representative participants; at least 9 complete sign-in,
   locate a file, upload files, inspect a file, and initiate/cancel a destructive action without
   assistance on both desktop and mobile.
7. A clean documented start followed by successful public/authentication, user file-management, and
   administrator smoke journeys.
8. A deviation log showing either no material differences or explicit maintainer approval for each one.

