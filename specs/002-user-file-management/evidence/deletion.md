# Permanent deletion evidence

| Provider removal | Metadata removal | Result | Retained row/quota |
|---|---|---|---|
| success or already absent | success | `204` | absent/reclaimed exactly once |
| unavailable | not attempted | retryable `503` | unchanged |
| success | unavailable | retryable partial `503` | row retained for safe retry |
| success | success, audit unavailable | `204` | absent/reclaimed; audit fails open |

Folder deletion returns `204` only for an owned empty folder. Files or child folders produce a non-empty conflict, concurrent child creation cannot strand an unreachable child, and no cascade or soft-delete state exists.

Client confirmation coverage proves cancel, explicit irreversible confirmation, pending state, retry guidance, cache invalidation after confirmed success, and focus restoration. Browser journey: `tests/e2e/permanent-deletion.spec.ts`.
