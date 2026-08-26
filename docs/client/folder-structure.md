# Frontend folder structure

```text
client/
├── src/
│   ├── app/          App Router pages, layouts, errors, and auth BFF routes
│   ├── components/   Cross-domain presentation and UI infrastructure
│   ├── features/     Domain UI, API functions, hooks, and query keys
│   ├── lib/          Low-level API, auth, configuration, theme, and formatting utilities
│   └── providers/    Application-wide React providers
├── tests/            Unit, integration, and component tests
├── .env.example      Safe public and server-only Next.js configuration contract
├── Dockerfile        Standalone production image
├── next.config.ts    Strict/standalone and workspace tracing configuration
├── postcss.config.mjs
└── tsconfig.json
```

## `src/app`

This directory defines URL structure and route-level composition. Route groups `(auth)` and `(protected)` share layouts without changing URLs; `admin` has its own role-aware layout. The root layout owns metadata, global CSS, theme initialization, skip navigation, and application providers.

`app/api/auth` is server-side BFF code, not a general client API layer. Keep only refresh-credential operations here. Do not add business logic or proxy normal Express resources through these routes without reconsidering the architecture.

Route `error.tsx` files provide boundaries for auth, protected, and admin segments. Loading/restoration states are currently rendered by layouts/components; there are no `loading.tsx` route files.

## `src/components`

Cross-domain UI belongs here:

- `auth`: reusable account-form shells/status/logout controls.
- `brand`: Fileora identity.
- `charts`: reusable visualization components.
- `confirmation`: target-confirmation dialogs.
- `layout` and `navigation`: application shell and role-aware navigation.
- `overlays`: shared accessible dialog/drawer infrastructure with focus containment.
- `status`: reusable loading/error/page states.
- `theme` and `toast`: global UI controls and feedback.
- `ui`: primitives grouped as controls, data display, icons, and surfaces.

These components should not fetch domain data or enforce backend permissions. Feature-specific API coordination belongs under `features`.

`components/auth/guest-route.tsx` is a significant navigation guard: the landing and `(auth)` layout use it to wait for restoration, show guest content only to anonymous visitors, and redirect an authenticated session to `/dashboard`.

## `src/features`

Feature directories group code by user-facing domain:

- `auth`: registration API, sign-in/verification components, memory auth store, hooks, types, and auth query keys.
- `files`: discovery/content/upload APIs, file UI, React Query hooks, upload queue state, and file keys.
- `folders`: folder APIs, breadcrumbs/browser/dialogs, hooks, and keys.
- `dashboard`: personal statistics API, query hook, and dashboard presentation.
- `admin`: user/file/monitoring APIs, directory/dashboard/audit UI, hooks, and admin keys.

The common internal direction is component → hook → API function → Axios client. A feature can hold domain-specific local state, but reusable application infrastructure belongs in `lib`, `providers`, or shared components.

## `src/lib`

- `api/express-client.ts`: direct public/bearer Express client and request interceptor.
- `api/gateway-client.ts`: same-origin login/refresh/logout client.
- `api/renewal-interceptor.ts` and `session-renewal.ts`: one-retry, single-flight refresh behavior.
- `api/api-error.ts`: extracts safe public error code/message for UI.
- `auth/refresh-cookie.ts` and `same-origin.ts`: server-only BFF cookie/origin policy.
- `config/public-env.ts`: validates the only browser-public variable.
- `config/server-env.ts`: validates Next.js server-only BFF/cookie settings.
- `presentation/format.ts`: shared display formatting.
- `theme/theme.ts`: theme preference persistence and resolution.

Keep this layer narrow and dependency-oriented. Domain endpoint paths and query behavior belong in feature APIs/hooks, not in a global “service” grab bag.

## `src/providers`

`app-providers.tsx` defines provider order and one stable `QueryClient`. `auth-provider.tsx` restores and renews sessions. Theme and toast providers own app-wide UI state. Add a provider only for genuinely cross-route state with a clear lifecycle.

## `tests`

- `unit`: pure client configuration/theme behavior.
- `integration`: Next.js BFF login/logout/refresh and renewal coordination.
- `component`: rendered React workflows, accessibility, and UI states.
- `fixtures`: reusable safe administrator data.
- `setup.ts`: jsdom/testing-library setup.

Cross-application browser tests remain in root `tests/e2e`.

## Significant configuration

`next.config.ts` enables React strict mode and standalone output except on Vercel, while tracing from the workspace root so shared packages reach the image. `tsconfig.json` uses the shared strict config, Next's bundler resolution/plugin, and a `@/*` alias rooted at `src`. ESLint checks both `src` and `tests`.

## Where do I make a change?

| Task | Start here |
| --- | --- |
| Add a public, auth, protected, or admin page | Matching directory under `client/src/app` |
| Change route-level access/loading behavior | `(protected)/layout.tsx` or `admin/layout.tsx` |
| Add reusable UI primitive | `client/src/components/ui` |
| Add accessible dialog/drawer behavior | `client/src/components/overlays` |
| Add file/folder/admin domain UI | Matching `client/src/features/<domain>/components` |
| Call a new Express endpoint | Matching `features/<domain>/api` module |
| Add reusable server-state behavior | Matching `features/<domain>/hooks` module |
| Change cache key/invalidation scope | Domain `query-keys.ts` and mutation hook |
| Change memory auth/session restoration | `features/auth/auth-store.ts`, `providers/auth-provider.tsx`, and `lib/api` renewal modules |
| Change login/refresh/logout cookie behavior | `app/api/auth` plus `lib/auth`/server config |
| Add frontend form validation | Relevant form plus shared contract or feature validation module |
| Change global theme/toasts | `providers` and matching shared components/lib |
| Add frontend unit/integration/component test | Matching `client/tests` category |
| Add full browser journey | Root `tests/e2e` |
