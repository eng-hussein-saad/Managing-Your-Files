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

| Method/path | Auth | Behavior |
| --- | --- | --- |
| `GET /api/v1/files/policy` | Bearer | Fixed size/MIME/batch policy plus current owner quota |
| `POST /api/v1/files` | Bearer | Upload exactly one multipart file; `201` summary |
| `GET /api/v1/files` | Bearer | Owner-scoped filtered/paged metadata |
| `GET /api/v1/files/:fileId` | Bearer | Owner-scoped detail, folder path, extracted text |
| `PATCH /api/v1/files/:fileId` | Bearer | Body `{ folderId: uuid | null }`; move within owned hierarchy |
| `GET /api/v1/files/:fileId/preview` | Bearer | Inline owner-authorized object stream when previewable |
| `GET /api/v1/files/:fileId/download` | Bearer | Attachment owner-authorized object stream |
| `DELETE /api/v1/files/:fileId` | Bearer | Permanent object-first deletion; `204` |

List query:

- `search`: optional trimmed name search, max 200.
- `type`: `pdf|text|image|document`.
- `folderId`: owned UUID or `root`.
- `sort`: `name|size|uploadedAt`, default `uploadedAt`.
- `direction`: `asc|desc`, default `desc`.
- `page`: positive integer, default 1.
- `pageSize`: 5, 10, or 20; default 20.

The accepted upload types are PDF, strict UTF-8 text, JPEG, PNG, WebP, and DOCX. Size is 5 MiB and owner quota is 100 MiB.

## Folders

| Method/path | Auth | Behavior |
| --- | --- | --- |
| `GET /api/v1/folders?parentId=<uuid>` | Bearer | Root or owned folder contents and breadcrumbs |
| `POST /api/v1/folders` | Bearer | `{ name, parentId: uuid|null }`; `201` |
| `GET /api/v1/folders/:folderId` | Bearer | Owned detail and breadcrumbs |
| `PATCH /api/v1/folders/:folderId` | Bearer | `{ name }`; rename |
| `DELETE /api/v1/folders/:folderId` | Bearer | Permanently delete an empty owned folder; `204` |

Names are 1–120 characters and reject path separators/control characters. Hierarchy depth is at most ten.

## Personal statistics

| Method/path | Auth | Query/result |
| --- | --- | --- |
| `GET /api/v1/file-statistics` | Bearer | Required valid IANA `timeZone`; current counts/bytes/quota/types and exactly 30 local-date upload buckets |

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

Admin user list supports `search`, role, verified flag, sort by name/email/role/createdAt, direction, page, and page size. Admin file list supports name search, owner, type, upload date/time bounds, size bounds, root/foldered scope, name/owner/size/upload-time sort, direction, and paging. Audit list supports search, action, entity type, actor ID/state, outcome, time bounds, direction, and paging.

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
