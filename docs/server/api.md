# API conventions and reference

The public REST base is `/api/v1`. Trusted refresh-bearing operations use `/internal/v1/auth` and are not a browser API. Liveness is `/health`.

## Headers and authentication

- JSON requests: `Content-Type: application/json`.
- Protected requests: `Authorization: Bearer <access-token>`.
- Upload: `multipart/form-data` with one field named `file` and optional `folderId`.
- Trusted BFF auth: `x-gold-era-bff-trust` matching the server secret.
- Optional `x-request-id`: values up to 128 characters are reflected; otherwise the server generates a UUID.

Browser CORS permits configured exact origins, no credentials, methods GET/POST/PATCH/DELETE/OPTIONS, and headers Content-Type/Authorization/X-Request-Id. Refresh cookies go only to same-origin Next.js BFF routes, not this public API.

## Envelopes

JSON success:

```json
{ "success": true, "data": {} }
```

Paged success adds top-level `meta`:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

Failure:

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

`fields` is present for field validation when available. Some errors, notably quota, add top-level `meta`. Binary preview/download responses use content headers and are not wrapped.

## Health

| Method/path | Auth | Behavior |
| --- | --- | --- |
| `GET /health` | None | `200` liveness payload `{ status: "ok" }` |

## Authentication

| Method/path | Body | Result |
| --- | --- | --- |
| `POST /api/v1/auth/register` | `{ name, email, password }` | `201`; creates unverified user and sends code |
| `POST /api/v1/auth/verify-email` | `{ email, code }` where code is eight digits | `200`; safe verified user |
| `POST /api/v1/auth/resend-verification` | `{ email }` | `202`; generic response, or `429` with `Retry-After: 60` |

Email is trimmed/lowercased. Names are 1–120 characters; registration password is 8–1024.

### Trusted BFF-only authentication

| Method/path | Body | Result |
| --- | --- | --- |
| `POST /internal/v1/auth/login` | `{ email, password }` | `200`; access session plus raw refresh value |
| `POST /internal/v1/auth/refresh` | `{ refreshToken }` | `200`; rotated access/refresh result |
| `POST /internal/v1/auth/logout` | `{ refreshToken? }` | `200`; idempotent presented-token revocation |

These require BFF trust and return an internal contract containing raw refresh material. The Next.js BFF strips that field before responding to the browser.

## Users

| Method/path | Auth | Result |
| --- | --- | --- |
| `GET /api/v1/users/me` | Bearer | Current safe user fields only |

## Files

| Method/path | Auth | Body | Behavior |
| --- | --- | --- | --- |
| `GET /api/v1/files/policy` | Bearer | — | Returns the fixed size/MIME/batch policy plus the current owner's quota |
| `POST /api/v1/files` | Bearer | `multipart/form-data`: required `file`; optional `folderId` UUID | Uploads exactly one file; omit `folderId` to upload it at the root, or provide an owned folder UUID to upload it inside that folder; `201` summary |
| `GET /api/v1/files` | Bearer | — | Returns owner-scoped filtered and paginated file metadata |
| `GET /api/v1/files/:fileId` | Bearer | — | Returns owner-scoped details, folder path, and extracted text |
| `PATCH /api/v1/files/:fileId` | Bearer | `{ "folderId": uuid \| null }` | Moves the file; `folderId` is required—use `null` to move it to the root or an owned folder UUID to move it inside that folder |
| `GET /api/v1/files/:fileId/preview` | Bearer | — | Returns an inline owner-authorized object stream when previewable |
| `GET /api/v1/files/:fileId/download` | Bearer | — | Returns an attachment owner-authorized object stream |
| `DELETE /api/v1/files/:fileId` | Bearer | — | Permanently deletes the object first; `204` |

List query:

- `search`: optional trimmed name search, max 200.
- `type`: `pdf|text|image|document`.
- `folderId`: owned UUID or `root`.
- `sort`: `name|size|uploadedAt`, default `uploadedAt`.
- `direction`: `asc|desc`, default `desc`.
- Name ordering is case-insensitive, so capitalization does not move otherwise
  alphabetically later names ahead of earlier names.
- `page`: positive integer, default 1.
- `pageSize`: 5, 10, or 20; default 20.

The accepted upload types are PDF (`.pdf`), strict UTF-8 text (`.txt`), JPEG (`.jpg`/`.jpeg`), PNG (`.png`), WebP (`.webp`), and DOCX (`.docx`). These extensions describe the usual browser-facing names; the API does not trust an extension or submitted MIME as proof of type. It inspects file bytes, and DOCX uploads must pass ZIP-structure verification whether initial detection returns generic `application/zip` or the official `application/vnd.openxmlformats-officedocument.wordprocessingml.document` MIME. Size is 5 MiB and owner quota is 100 MiB.

## Folders

| Method/path | Auth | Body | Behavior |
| --- | --- | --- | --- |
| `GET /api/v1/folders` | Bearer | — | Lists the authenticated user's root-level folders and files (items with no parent folder) |
| `GET /api/v1/folders?parentId=<uuid>` | Bearer | — | Lists the direct child folders and files inside the specified owned folder, plus that folder and its breadcrumbs |
| `POST /api/v1/folders` | Bearer | `{ "name": string, "parentId": uuid \| null }` | Creates a folder; `parentId` is required—use `null` to create it at the root or an owned folder UUID to create it inside that folder; `201` |
| `GET /api/v1/folders/:folderId` | Bearer | — | Returns owned folder details and breadcrumbs |
| `PATCH /api/v1/folders/:folderId` | Bearer | `{ "name": string }` | Renames the folder |
| `DELETE /api/v1/folders/:folderId` | Bearer | — | Permanently deletes an empty owned folder; `204` |

Folder listings are not recursive. Both forms return only the immediate contents of
the requested location; items nested inside a returned child folder require another
request using that child's ID as `parentId`. The response contains `folder` (`null`
at the root), `breadcrumbs`, `folders`, and `files`.

Names are 1–120 characters and reject path separators/control characters. Hierarchy depth is at most ten.

## Personal statistics

| Method/path | Auth | Query/result |
| --- | --- | --- |
| `GET /api/v1/file-statistics` | Bearer | Required query parameter: `timeZone=<valid IANA time zone>` (for example, `?timeZone=Africa%2FCairo`); returns current counts/bytes/quota/types and exactly 30 local-date upload buckets |

## Administrator

Every endpoint below requires bearer authentication and current database role `ADMIN`.

| Method/path | Behavior |
| --- | --- |
| `GET /api/v1/admin/access-check` | Returns `{ allowed: true }` after middleware |
| `GET /api/v1/admin/users` | Search/filter/sort/page safe users |
| `GET /api/v1/admin/users/:userId` | Safe user detail |
| `PATCH /api/v1/admin/users/:userId/role` | `{ role, expectedUpdatedAt }`; guarded role change |
| `DELETE /api/v1/admin/users/:userId` | `{ expectedUpdatedAt, confirmationEmail }`; permanent cleanup |
| `GET /api/v1/admin/files` | Global metadata-only file page |
| `GET /api/v1/admin/files/:fileId` | Metadata-only file detail |
| `DELETE /api/v1/admin/files/:fileId` | `{ expectedUpdatedAt, confirmationOriginalName }`; permanent deletion |
| `GET /api/v1/admin/statistics` | Exact current users/files/bytes/type distribution/recent uploads |
| `GET /api/v1/admin/audit-events` | Sanitized retained audit page |

Admin user list supports `search`, role, verified flag, sort by name/email/role/createdAt, direction, page, and page size. Admin file list supports name search, owner, type, upload date/time bounds, size bounds, root/foldered scope, name/owner/size/upload-time sort, direction, and paging; file-name sorting is case-insensitive. Audit list supports search, action, entity type, actor ID/state, outcome, time bounds, direction, and paging.

Admin file responses never include storage key, preview/download link, or extracted content.

## Common status/error meanings

| Status | Typical codes |
| --- | --- |
| `400` | `VALIDATION_FAILED` |
| `401` | `AUTH_REQUIRED`, `AUTH_ACCESS_INVALID`, `AUTH_REFRESH_INVALID`, `TRUST_REQUIRED` |
| `403` | `AUTH_VERIFICATION_REQUIRED`, `AUTH_FORBIDDEN` |
| `404` | `RESOURCE_NOT_FOUND` |
| `409` | registration unavailable, invalid/current-code conflict, folder name conflict, stale resource conflict |
| `413` | `FILE_TOO_LARGE` |
| `415` | unsupported file or unavailable preview |
| `422` | quota or folder-depth constraint |
| `429` | verification resend rate limit |
| `503` | mail/storage/database/unexpected service failure |

Use response `code`, not message text, for client branching. Error messages are safe for display; internal/provider details are deliberately redacted.
