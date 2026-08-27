# Frontend routing

Fileora uses the Next.js App Router. Parenthesized route groups organize shared layouts without becoming URL segments.

## Route map

| URL | Source | Access/purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Guest landing page |
| `/login` | `src/app/(auth)/login/page.tsx` | Guest sign-in |
| `/register` | `src/app/(auth)/register/page.tsx` | Guest registration |
| `/verify-email` | `src/app/(auth)/verify-email/page.tsx` | Guest verification/resend |
| `/dashboard` | `src/app/(protected)/dashboard/page.tsx` | Personal storage statistics |
| `/files` | `src/app/(protected)/files/page.tsx` | File/folder workspace |
| `/profile` | `src/app/(protected)/profile/page.tsx` | Safe current-user profile |
| `/admin` | `src/app/admin/page.tsx` | Platform statistics |
| `/admin/users` | `src/app/admin/users/page.tsx` | User administration |
| `/admin/files` | `src/app/admin/files/page.tsx` | Global metadata and deletion |
| `/admin/audit` | `src/app/admin/audit/page.tsx` | Sanitized audit history |

Server-side BFF routes are `POST /api/auth/login`, `POST /api/auth/refresh`, and `POST /api/auth/logout`.

## Layouts

`src/app/layout.tsx` is the document shell for every route. It installs metadata, theme hydration, the skip link, global CSS, and providers.

`(auth)/layout.tsx` adds the branded split layout and theme selector around login, registration, and verification. Parentheses make these pages appear at top-level URLs. It wraps the segment in `GuestRoute`, which waits for restoration and redirects an already-authenticated session to `/dashboard`. The landing page uses the same guard.

`(protected)/layout.tsx` is a client layout. It waits while `AuthProvider` restores a session, redirects anonymous users to `/login` without retaining the previous protected URL, and renders authenticated navigation/content when successful. The sign-in form routes success to `/admin` for admins or `/dashboard` for users.

`admin/layout.tsx` independently waits for auth, returns anonymous sessions to `/`, shows a forbidden state for non-admin sessions, and renders the restricted shell for admins. Administrator logout also returns to `/` instead of briefly rendering an anonymous state inside the restricted route.

## Protection model

There is no `client/middleware.ts` and no server-side route middleware reading the refresh cookie. This is intentional because the access token exists only in browser memory and the refresh cookie is scoped to BFF endpoints. Route layouts provide client-side UX protection after restoration.

Express remains authoritative. Protected page source can be loaded by a browser, but it cannot obtain protected data without a valid bearer token. Admin APIs additionally require the database-backed administrator role.

## Loading and error behavior

Auth/protected/admin route segments contain `error.tsx` boundaries for uncaught rendering errors. There are no App Router `loading.tsx` files; layouts and components choose a loading treatment based on how much UI structure is known.

`PageState` uses an accessible animated spinner for full-page session restoration and redirect transitions, when the application cannot yet safely render a destination page. Once a route and its layout are known, query and Suspense loading states use layout-shaped skeletons instead. For example, `/profile` keeps its heading and profile-card geometry visible while avatar, identity, verification, and detail fields shimmer. Pages also render explicit error, empty, retry, and settled states for their React Query operations. Reduced-motion preferences stop nonessential animation through the global motion rule.

## URL-backed state

The files page maintains file query state in component state: search, type, folder, sort, direction, page, and page size. Folder navigation resets page selection.

Admin users, files, and audit pages parse supported query parameters from `useSearchParams` and write normalized state with `router.replace`. This makes search, sort, page, direction, and selected filters survive refresh and browser navigation. Unsupported values fall back to bounded defaults before reaching API hooks.

## Redirects and navigation

- Successful sign-in redirects by role.
- Successful verification returns the user to login.
- The protected layout redirects anonymous users to login.
- The admin layout and administrator logout return anonymous sessions to `/`.
- Guest-only landing/auth routes redirect an authenticated session to `/dashboard`.
- Navigation renders admin destinations only for an admin session.

These redirects optimize user flow; none replace backend authorization. See [Authorization](../authorization.md) and [Authentication](../authentication.md).

## Adding a route

Choose the layout based on required user experience, add a `page.tsx`, then keep reusable domain behavior under `features`. If the route reads protected data, use the existing direct Express client and React Query pattern and ensure Express enforces the corresponding permission. Add a route error boundary only when the parent boundary is not sufficient; avoid duplicating generic loading/error UI across every page.
