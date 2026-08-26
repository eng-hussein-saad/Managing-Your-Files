# Frontend overview

The `client` workspace is a Next.js 16 App Router application using React 19 and TypeScript. It renders Fileora's public, user, and administrator experiences; coordinates remote data with TanStack React Query and Axios; holds short-lived access state in memory; and provides three server-side BFF routes for refresh-cookie handling.

## Responsibilities

The frontend is responsible for:

- Route-level layouts, pages, navigation, loading/error/empty states, and accessibility.
- Controlled forms and early interaction validation.
- Fetching public and bearer-protected Express data.
- Caching server responses and invalidating them after successful mutations.
- Upload selection, sequential queue state, progress, and per-file retry.
- Same-origin login, refresh, and logout calls to the Next.js BFF.
- Memory-only access session state, theme preference, toast feedback, dialogs, and other UI state.

It is not responsible for authoritative authentication, authorization, ownership, upload type detection, quota enforcement, business rules, database access, or object storage. The client never receives Prisma access, Supabase credentials, raw refresh tokens, storage keys, or another user's file content.

## Major technologies

- **Next.js App Router:** filesystem routes and layouts under `src/app`.
- **React:** client components drive interactive workflows; the root page/layout and auth layout can remain server components.
- **Tailwind CSS 4:** integrated through PostCSS. Most project styling is composed in `src/app/globals.css` using project class names and CSS variables.
- **Framer Motion:** dashboard/statistic transitions and chart fills, guarded by `useReducedMotion`.
- **TanStack React Query:** remote/server-state cache, request cancellation, mutation state, and invalidation.
- **Axios:** separate direct-Express and same-origin-gateway clients.
- **Zod/shared contracts:** server and BFF request/response validation and shared TypeScript shapes.

## Application providers

`src/app/layout.tsx` installs `AppProviders` around every route:

1. `QueryClientProvider` creates one stable cache. Queries default to no automatic retry.
2. `ThemeProvider` maintains light/dark/system preference and updates document color semantics.
3. `ToastProvider` exposes a bounded dismissible notification queue.
4. `AuthProvider` attempts session restoration and installs the Axios renewal interceptor.

The root also sets metadata, a pre-hydration theme script, and an accessible skip link.

## Data and state strategy

Remote application data belongs in React Query: profile, file pages/details/previews/policy, folders, statistics, and administrator resources. Query keys include resource scope plus parameters so cached pages do not collide. Mutations update a selected detail directly or invalidate only affected prefixes.

Transient interaction state stays local to the component: selected files/folders, dialogs, filters before URL synchronization, upload queue items, and form values. Administrator filters and pagination live in URL search parameters so views are navigable and refreshable. Theme and toast behavior use Context because they are UI-wide concerns.

Authentication uses a small external store exposed through `useSyncExternalStore`. It holds status plus the safe access session in module memory. It intentionally does not persist access tokens to web storage.

## Frontend/backend boundary

Public registration/verification and normal application APIs call Express directly through `expressClient`. The browser sends no cookies cross-origin; protected calls add the in-memory bearer token.

Only login, refresh, and logout use `gatewayClient` to call same-origin `/api/auth/*` Route Handlers. Those handlers own the refresh cookie and communicate with trusted Express internal routes. See [Authentication](../authentication.md) and [API and Data Fetching](api-and-data-fetching.md).

## Design implications

Separating the web application from Express allows the client to optimize interaction and caching without placing security rules in React. The narrow BFF prevents browser JavaScript from reading long-lived refresh material while avoiding the complexity of proxying file uploads, previews, and all other API traffic through Next.js.

For route placement and code ownership, continue with [Folder Structure](folder-structure.md), [Routing](routing.md), and [Components and State](components-and-state.md).
