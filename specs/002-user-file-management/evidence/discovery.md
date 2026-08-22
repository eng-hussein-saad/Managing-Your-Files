# Discovery evidence

- The 10,000-row owner fixture passed the local `< 2000 ms` query assertion; the complete test case took 1,913 ms in the recorded run, including fixture work around the measured request.
- Name, size, and upload-time sorts were checked in both directions with `FILE.id` as the same-direction tie-breaker.
- Search is case-insensitive; type, virtual root, and owned-folder filters compose before totals and paging.
- Repeated unchanged queries use deterministic ordering and accurate `totalItems`/`totalPages` metadata.
- Direct foreign detail and folder-filter requests converge to the generic not-found outcome. Public responses were scanned for owner IDs and storage keys.
- The UI exposes search, type, sort, direction, list/grid selection, paging, and one file-selection action; empty-account and no-match states remain distinct.

Browser journey: `tests/e2e/file-discovery.spec.ts`.
