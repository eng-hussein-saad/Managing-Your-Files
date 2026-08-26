# API and data fetching

The frontend separates transport from caching:

```text
Page / feature component
  → custom hook
  → React Query
  → feature API function
  → Axios client
  → Express or same-origin BFF
```

This keeps endpoint details out of presentation components and gives one place for cache keys, cancellation, invalidation, and auth renewal.

## Axios clients

### `expressClient`

`src/lib/api/express-client.ts` uses `NEXT_PUBLIC_API_BASE_URL`, disables credentialed CORS, and adds the memory access token as a bearer header when present. It serves:

- Public registration, verification, and resend.
- Protected profile, files, folders, personal statistics, and administrator APIs.
- Binary preview/download requests using `responseType: "blob"`.

`AuthProvider` installs a response interceptor. A protected `401` with an access-invalid/expired code is renewed and replayed at most once. The renewal process is single-flight, so concurrent failures share one rotation.

### `gatewayClient`

`src/lib/api/gateway-client.ts` points to same-origin `/api/auth` and is used only for login, refresh, and logout. The browser automatically attaches the scoped refresh cookie, but JavaScript cannot read it. Do not use this client for ordinary Express resources.

## React Query configuration

`AppProviders` creates one `QueryClient`. Queries globally set `retry: false`; user-facing features provide explicit retry buttons where appropriate rather than silently repeating failures. Individual destructive admin mutations also specify no retries.

Reads normally forward React Query's `AbortSignal` to Axios so superseded pages/details can cancel transport. Paginated file/admin lists use `keepPreviousData` to avoid replacing the current page with a blank state during navigation. Upload policy has a 30-second stale time; most other queries use React Query defaults.

## Query keys

Keys are domain-scoped:

- Auth: `["auth"]`, profile.
- Files: policy, parameterized list, and detail.
- Folders: contents by parent ID or `root`.
- Statistics: personal statistics plus browser IANA time zone.
- Admin: independently invalidatable users, files, statistics, and audit prefixes plus parameterized lists/details.

Include every server-visible query parameter in a list key. Invalidate the narrowest stable prefix that represents affected data.

## Real query: file discovery

1. The files page builds `FileQuery` from search, type, selected folder, sort, direction, page, and page size.
2. `useFiles` defers the parameter object to keep typing responsive.
3. React Query uses `fileKeys.list(deferredParams)` and calls `getFiles` with cancellation.
4. Axios sends `GET /api/v1/files` with query parameters and a bearer header.
5. Express returns a success envelope with safe summaries and page metadata.
6. React Query retains previous page data while a new key loads; the page renders loading/error/collection/pagination states.

Search, filter, sort, pagination, and totals are computed server-side. The client does not filter a previously cached global list.

## Real mutation: uploading a file

1. `useUploadPolicy` loads server limits and remaining quota.
2. `useUploadQueue` validates selection for early feedback and stores per-item local status/progress/error.
3. `uploadFile` builds `FormData` with one `file` plus optional `folderId`.
4. Axios sends `POST /api/v1/files` and maps `onUploadProgress` to integer percentages.
5. Each successful item retains its returned summary; each failure captures the safe error and optional quota metadata for independent retry.
6. After the sequential queue run, the page refetches its active file list and upload policy and invalidates personal statistics so sidebar usage updates immediately.
7. Closing the uploader removes completed rows while retaining pending or failed entries that can still be retried.

Other mutations use React Query invalidation. User file deletion invalidates files, folders, upload policy, and personal statistics only after success. Admin user deletion removes the selected detail and invalidates user/file/statistics/audit collections. Role changes update the detail cache and invalidate related summaries. Confirmation-sensitive mutations are not optimistically applied.

## Pagination and filters

User file lists accept page sizes 5, 10, or 20, default 20. Admin lists use the same options. Query objects include only supported filters, and URL-backed admin pages normalize values before calling hooks. Server page metadata is authoritative for total items/pages.

The personal statistics request sends the browser's resolved IANA time zone so Express can produce exact local-date buckets for the last 30 days.

## Error handling

Express JSON failures follow:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid values.",
    "fields": [{ "field": "page", "message": "..." }],
    "requestId": "..."
  }
}
```

`apiErrorCode` supports flow-specific recovery, such as redirecting unverified login to verification. `apiErrorMessage` returns the safe server message or a generic fallback. Components render errors through form status, page/error panels, upload queue entries, dialog messages, or toasts.

For a qualifying access `401`, the renewal interceptor handles one refresh/replay before the error reaches the query. Renewal failure clears auth memory. Other errors remain in the owning query/mutation state.

Binary responses do not contain the JSON envelope once streaming begins. Preview components convert Blobs into temporary object URLs; download creates a temporary anchor and revokes the URL after triggering it.

## Adding an integration

Add request/response shapes to shared contracts when both workspaces need them, put the call in the feature API directory, wrap it in a hook with a stable key, and make cache effects explicit. Keep business decisions on Express and do not expose secrets through `NEXT_PUBLIC_*` or browser response types.
