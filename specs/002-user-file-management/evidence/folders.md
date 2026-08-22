# Folder hierarchy evidence

- Root is virtual; persisted folders have fixed parents and same-owner ancestor chains.
- Levels 1 through 10 succeed and level 11 is rejected. Breadcrumb depth and descendant reachability remain intact after rename.
- Trimmed, normalized, case-insensitive sibling conflicts are rejected under owner-scoped locking; concurrent create/rename coverage prevents duplicate siblings.
- File moves change only destination and update time, including moves to virtual root.
- Empty-folder deletion serializes against child creation, never cascades, and preserves parent reachability.
- Every foreign folder read, create-child, rename, delete, list-filter, and move destination converges to generic absence without hierarchy disclosure.

Browser journey: `tests/e2e/folder-management.spec.ts`.
