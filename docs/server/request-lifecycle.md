# Backend request lifecycle

Express applies a small global pipeline, then endpoint-specific authentication, authorization, validation/intake, controller, and service work. Errors are forwarded to the final translator.

## Global order

```text
HTTP request
  → requestId (accept bounded x-request-id or generate UUID; set response header)
  → exactOriginCors (explicit origins, credentialless)
  → express.json (32 KiB, strict JSON when content type applies)
  → mounted route
  → notFound when no route handled the request
  → errorHandler for forwarded failures
```

`app.disable("x-powered-by")` removes the Express identification header.

## Authenticated metadata GET

Example: `GET /api/v1/files?search=report&page=1&pageSize=20`.

1. Global middleware assigns request ID and evaluates CORS.
2. The file router calls `authenticate`.
3. Authentication parses the bearer value, verifies the JWT, reloads a verified user, and requires its current role to match the claim.
4. `fileQueryController.list` parses query values with `fileQuerySchema`.
5. The controller passes authenticated subject and normalized query to `FindFilesService`.
6. The service validates any folder scope, then the repository runs owner-scoped page/count queries.
7. The controller returns `{ success: true, data, meta }`.

Malformed query input goes to error middleware and becomes `400 VALIDATION_FAILED`. Cross-owner folder/file IDs become generic not-found errors.

## Public registration POST

```text
POST /api/v1/auth/register
  → global middleware
  → validateBody(shared register schema)
  → registration controller
  → RegistrationService
  → serializable Prisma user/code transaction
  → SMTP delivery after commit
  → 201 success or safe operational error
```

If SMTP fails after commit, the account remains unverified and the response directs the user to request a new code.

## File upload

```text
POST /api/v1/files (multipart)
  → global request ID / CORS / JSON middleware
  → authenticate bearer
  → Multer oneFileUpload
      → generated temp directory/name
      → one file, one field, bounded parts and size
  → cleanupUploadedFile registers finish/close cleanup
  → upload controller validates file + optional folderId
  → UploadFileService
      → bytes/MIME/name validation
      → owner/folder/quota lock and check
      → storage upload
      → best-effort extraction
      → metadata insert
      → best-effort audit
  → 201 safe file summary
```

Multer failures are translated centrally. The temporary file is removed after a completed or closed response. Storage/metadata compensation is documented in [File Storage](../file-storage.md).

## Administrator operation

Example: `PATCH /api/v1/admin/users/:userId/role`.

1. Global middleware.
2. `authenticate` establishes current identity and database-matched role.
3. `requireAdmin` returns `403` unless role is `ADMIN`.
4. Controller parses UUID params and shared role-change body.
5. Service rejects self-change, locks the target, checks `expectedUpdatedAt`, preserves the last administrator, changes role, and revokes target refresh sessions.
6. Best-effort audit write.
7. Controller returns the safe user projection.

Every admin route independently attaches authentication and role middleware; page layout state is never consulted.

## Trusted BFF authentication

`/internal/v1/auth/*` does not use bearer auth. Before route validation/controller work, `requireBffTrust` constant-time compares `x-gold-era-bff-trust` with the server secret. Missing or incorrect trust returns `401 TRUST_REQUIRED`. Only Next.js server Route Handlers should call this surface.

## Content streaming

Preview/download authenticates and authorizes ownership before controller streaming. The service downloads the private object and rechecks metadata; the controller sets safe private headers and pipes the provider stream. Request abort or response close destroys the stream.

If a stream errors before headers, normal error middleware can return JSON. After headers, the controller destroys the response rather than mixing a JSON error envelope with binary bytes.

## Error translation

| Source | Result |
| --- | --- |
| `AppError` | Its safe status/code/message/fields/meta |
| Multer file-size error | `413 FILE_TOO_LARGE` |
| Other Multer error | `400 VALIDATION_FAILED` |
| Zod error | `400 VALIDATION_FAILED` with field issues |
| Unknown error | Logged, then redacted `503 SERVICE_UNAVAILABLE` |
| No matching route | `404` with generic `VALIDATION_FAILED` code |

All JSON failures use `failure()`, which includes the current request ID. Controllers use `next(error)`; services should throw operational `AppError` values rather than constructing HTTP responses.
