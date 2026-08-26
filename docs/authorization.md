# Authorization

Authentication establishes who a caller is. Authorization decides what that identity may do. Fileora makes both role and resource decisions in Express; frontend guards exist to present the correct navigation and states but cannot grant access.

## Roles

The database stores `USER` or `ADMIN` in `USER.role`. Protected bearer tokens also carry a role, but Express reloads the verified user for every protected request and requires the database role to equal the claim.

| Capability | USER | ADMIN |
| --- | --- | --- |
| Read own safe profile | Yes | Yes |
| Manage files/folders owned by the authenticated ID | Yes | Yes |
| Read personal file statistics | Yes | Yes |
| Access global user/file/statistics/audit endpoints | No | Yes |
| Preview/download another user's file | No | No |
| Read another user's storage key or extracted content | No | No |
| Change user roles or permanently delete users | No | Yes, with safeguards |
| Permanently delete another user's file | No | Yes, through metadata-only admin APIs |

## Enforcement layers

1. **Client layouts and navigation:** protected pages wait for auth restoration; admin pages and links require an in-memory admin session. This avoids presenting unusable UI.
2. **Bearer authentication:** Express verifies the token and current user authority.
3. **Role middleware:** every `/api/v1/admin/*` route attaches `requireAdmin()` after authentication.
4. **Service/repository ownership:** user file and folder operations include the authenticated subject in lookups, mutations, quota calculations, hierarchy traversal, and content reads.
5. **Operation-specific safeguards:** administrator mutations require current-state confirmation and prevent self or last-admin hazards.

Only layers 2–5 are authoritative. Editing client state, URLs, or React components cannot bypass them.

## Ownership checks

An ownership check proves that the requested resource's `ownerId` equals the authenticated subject. File and folder modules avoid returning a distinct “belongs to someone else” error: an absent, malformed, or cross-owner resource normally becomes the same `404 RESOURCE_NOT_FOUND`.

### User accesses their own file

`GET /api/v1/files/:fileId` authenticates the token and passes its subject to `FindFilesService.detail`. The repository queries by both ID and owner. Preview and download perform the same initial owner check, fetch the private object, then query again for the same owner and storage key before streaming. This second check prevents serving content that changed or was deleted during retrieval.

### User requests another user's file

The owner-scoped query returns no row and the service returns a generic not-found response. Knowing a UUID, changing a route parameter, or moving a frontend component does not grant content access. Folder destinations and ancestry are owner-scoped too, so a file cannot be moved into another user's folder.

### Folder hierarchy

Create, list, detail, rename, and delete resolve the full parent chain through owner-scoped queries. Mutations lock the owner's user row to serialize hierarchy changes. Delete is permitted only for an owned empty folder; it does not cascade through children or files.

## Administrator boundary

All administrator routes attach authentication and `requireAdmin()` independently. A normal user calling an admin URL directly receives `403 AUTH_FORBIDDEN`, regardless of what the UI renders.

Administrator file access is intentionally metadata-only. Admin routes can list/detail file name, owner, type, size, folder, and timestamps, or perform confirmed permanent deletion. They do not expose preview/download routes, storage keys, provider URLs, or extracted content. If an administrator uses the normal user file endpoints, they remain scoped to files owned by that administrator's user ID.

### Role changes

Role changes require the target's observed `updatedAt` and run under a serializable lock. An administrator cannot change their own role or demote the last administrator; the user directory does not render role or deletion actions for the current administrator. A successful change updates the timestamp, removes every target refresh session, and records a best-effort audit event. Existing access tokens fail on the next request because their role claim no longer matches the database.

### User deletion

An administrator must submit the target's current `updatedAt` and exact email. Self-deletion is forbidden, and the last administrator cannot be deleted. The service removes owned storage objects, preserves audit history by detaching the actor and marking it deleted, then deletes sessions, codes, file/folder metadata, and the user. Any non-not-found storage failure prevents database deletion and returns a retryable `503`.

### File deletion

An administrator must submit the file's current `updatedAt` and exact original name. The server reloads the trusted owner, removes the object first, and only then removes metadata. A stale confirmation returns `409 RESOURCE_CONFLICT`.

## Denials and errors

- Missing bearer token: `401 AUTH_REQUIRED`.
- Invalid, expired, deleted-user, unverified-user, or stale-role token: `401 AUTH_ACCESS_INVALID`.
- Authenticated non-admin on an admin route: `403 AUTH_FORBIDDEN`.
- Cross-owner or missing resource: `404 RESOURCE_NOT_FOUND`.
- Stale confirmed admin mutation: `409 RESOURCE_CONFLICT`.

Read [Authentication](authentication.md) for identity establishment, [File Storage](file-storage.md) for owner-scoped content behavior, and [Backend Request Lifecycle](server/request-lifecycle.md) for middleware order.
