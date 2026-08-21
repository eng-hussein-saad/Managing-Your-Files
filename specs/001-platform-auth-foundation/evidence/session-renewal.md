# SC-003 session-renewal evidence

Deterministic Vitest run on 2026-08-20 (`client/tests/integration/renewal-concurrency.test.ts`):

- simultaneous expired protected requests: 20
- gateway renewal calls: 1
- retries per original request: 1
- successful original requests: 20/20 (100%)
- non-authentication failures entering renewal: 0

The test uses one module-scoped promise and delays the mocked authority response so all 20 failures overlap before rotation resolves.

