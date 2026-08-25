# API Invariants Contract

Phase 4 consumes the existing Phase 1-3 interfaces without changing their routes, schemas, envelopes,
authorization, or side effects. The authoritative OpenAPI contracts remain:

- `specs/001-platform-auth-foundation/contracts/public-api.openapi.yaml`
- `specs/001-platform-auth-foundation/contracts/bff-auth.openapi.yaml`
- `specs/002-user-file-management/contracts/file-management.openapi.yaml`
- `specs/003-administration-final-quality/contracts/admin-api.yaml`

Runtime Zod/type contracts remain under `packages/contracts/src/public` and
`packages/contracts/src/internal`.

## Unchanged interface map

| Area | Existing interface | UI invariant |
|---|---|---|
| Envelope | Public success and error envelopes | Redesigned feedback consumes the same typed success/error outcomes and exposes no extra implementation detail. |
| Registration and verification | `POST /api/v1/auth/register`, `/verify-email`, `/resend-verification` | Forms preserve validation, safe enumeration behavior, expiry/replacement rules, and outcomes. |
| BFF session | `POST /api/auth/login`, `/refresh`, `/logout` backed by trusted internal auth routes | Refresh material stays in the first-party HttpOnly cookie; access token remains memory-only; no credential/token detail appears in UI. |
| Profile/access | `GET /api/v1/users/me`, `GET /api/v1/admin/access-check` | Client route guards remain UX aids; Express decides access. |
| Files | `GET /api/v1/files/policy`, `POST/GET /api/v1/files`, `GET/PATCH/DELETE /api/v1/files/:fileId`, preview/download subresources | List/detail/upload/move/delete/preview/download presentation preserves owner scope, verified metadata, storage policy, and generic absence for foreign records. |
| Folders | `GET/POST /api/v1/folders`, `GET/PATCH/DELETE /api/v1/folders/:folderId` | Navigation, breadcrumbs, create/rename/delete preserve depth, naming, uniqueness, ownership, fixed-parent, and empty-folder rules. |
| User statistics | `GET /api/v1/file-statistics?timeZone=...` | Cards/charts preserve exact counts/byte strings, type distribution, local-time meaning, and fixed history semantics. |
| Admin users | Admin users list/detail/role/delete routes | Tables/dialogs preserve server pagination, expected-version guards, exact confirmation, self/final-admin protection, session invalidation, cascade, and audit behavior. |
| Admin files | Admin files list/detail/delete routes | UI exposes safe owner/file metadata and permitted deletion only; no content, preview, or download affordance is introduced. |
| Admin monitoring | Admin statistics and audit-event routes | Cards/tables preserve safe aggregates and expose only successful important file/folder and administrator-controlled mutations; authentication, authorization, content reads, and monitoring reads do not create audit events. |

## Security and behavior invariants

1. Express authenticates and authorizes every sensitive operation. Hiding navigation or actions is not
   an authorization control.
2. Server-driven search, filtering, sorting, and pagination remain authoritative; list/grid choice and
   responsive condensation are presentation only.
3. Upload MIME/type/size/count/quota validation remains authoritative at the server boundary. The UI
   may provide early feedback but may not override a rejection or expose storage keys/provider URLs.
4. File/folder ownership, permanent-deletion behavior, storage cleanup, and audit effects are unchanged.
   No trash, restore, undo, or soft deletion exists.
5. Administrator metadata access does not imply file-content access. No redesigned control may call a
   normal-user preview/download endpoint on an administrator's behalf.
6. Error messages, logs, audit metadata, and rendered debugging states must remain free of credentials,
   tokens, OTPs, connection strings, storage keys, and private content.
7. Existing React Query keys, invalidation behavior, API clients, and BFF renewal concurrency remain in
   force unless an actual pre-existing defect is separately specified.

## Change-control gate

If implementation appears to require an API response change, new endpoint, environment key, schema
field, migration, storage behavior, or authentication change, that is a requirement change. Stop the
Phase 4 implementation and update specification, planning, contracts, schema approval, and dependent
artifacts before proceeding.
