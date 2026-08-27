# Components and state

The frontend uses several small state mechanisms instead of a single global store. Choose state based on ownership and lifetime: React Query for remote data, the auth external store for access identity, Context for application-wide UI services, URL parameters for shareable admin views, and component state for local interaction.

## Component layers

### Shared components

`src/components` contains cross-domain building blocks. UI primitives in `components/ui` expose consistent buttons, fields, tables/data display, icons, cards, avatars, and pills. Navigation/layout compose the application shell. Status components handle full-page busy, empty, error, and settled outcomes; feature and route components own skeletons that mirror known destination layouts.

Use the `PageState` busy spinner only when there is no meaningful page skeleton to preserve, such as session restoration before the authenticated destination is known or a redirect transition. If the route shell is already available, keep it stable and skeletonize only the unresolved data. The profile page follows this rule by retaining its heading and card layout while its React Query request is pending.

The overlay foundation is architecturally significant: it renders through a portal, traps focus, supports Escape/backdrop dismissal, marks background content inert, locks page scroll, and restores opener focus. Confirmation dialogs build on shared presentation so destructive actions remain explicit and accessible.

### Feature components

`src/features/<domain>/components` owns domain language and workflows: upload queue, file details/preview, folder browser, statistics, authentication forms, and admin directories/actions. These components call feature hooks rather than importing a global Axios client directly.

Route pages orchestrate major feature components and URL/navigation state. Avoid moving reusable domain workflows into `app/page.tsx`; pages should remain route boundaries rather than becoming the only implementation location.

## Server state

Server state means data whose authoritative version lives outside React—in this project, Express/PostgreSQL/Supabase. TanStack React Query manages loading, error, caching, cancellation, previous-page retention, and invalidation for this data.

Queries use stable domain keys. Mutations invalidate only after confirmed success; permanent and role-changing admin operations do not retry automatically or pretend to succeed optimistically. This prevents the UI from diverging during confirmation conflicts or storage failures.

## Authentication state

`features/auth/auth-store.ts` is a module-level external store with `loading`, `authenticated`, or `anonymous` state and an optional safe access session. `useSyncExternalStore` gives components consistent subscriptions.

The access token lives only in this memory object. `AuthProvider` restores it through the refresh BFF after reload and installs one Axios renewal interceptor. Clearing the session removes browser-readable identity but does not itself revoke a server refresh row; logout goes through the BFF for that operation.

Do not copy access state into local storage, session storage, URL parameters, or React Query.

## Context providers

- `ThemeProvider` stores light/dark/system preference in browser storage, observes system color changes, and updates the root document theme.
- `ToastProvider` stores up to the recent notification queue, assigns stable IDs, dismisses automatically by duration, and uses alert/status semantics.
- `QueryClientProvider` owns the remote-data cache.

Use Context for small cross-route UI capabilities, not for duplicating large remote resource collections.

## Local and URL state

Controlled auth forms, open dialogs/drawers, selected file IDs, upload queue items, file grid/list mode, and folder location are local state because one workflow owns them.

Admin list parameters are URL state. Pages normalize `useSearchParams` and call `router.replace` on updates, so pagination/filter/sort choices survive reload and can be linked. React Query then keys the server result by the normalized object.

## Forms and validation

Forms use controlled inputs plus HTML constraints for immediate accessibility and browser feedback. Shared Zod schemas validate requests at the Express boundary; BFF login also parses the shared login schema before forwarding. Feature code may perform policy-driven checks—especially upload size/type/count/quota—but those never replace server validation.

Safe error helpers extract public API messages and codes. Flow-specific behavior includes redirecting an unverified login, showing pending email delivery, displaying the verification resend countdown, keeping failed upload entries retryable, clearing completed upload rows when the uploader closes, and leaving destructive dialogs open when a mutation fails.

## Motion and accessibility

Framer Motion is used on the landing page, dashboard, and type-distribution chart for staged transitions. These components read `useReducedMotion` and reduce animation when the user requests it. Interaction components use semantic status/alert roles, busy attributes, skip navigation, keyboard handling, focus containment, and explicit labels.

When adding animation, preserve settled content and reduced-motion behavior. Motion should not control data correctness or gate interaction.

## Choosing state for a new feature

| Need | Use |
| --- | --- |
| Express-backed collection/detail | React Query query and feature key |
| Server mutation status | React Query mutation |
| Access identity/token | Existing auth store |
| Shareable filter/page/sort | URL search parameters |
| One dialog/form/selection | Local component state |
| App-wide visual preference/service | Focused Context provider |
| Derived display value | Compute from owning state; do not duplicate |

See [API and Data Fetching](api-and-data-fetching.md) for query/mutation conventions and [Folder Structure](folder-structure.md) for placement.
