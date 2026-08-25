# Pre-Redesign UI Performance Baseline

**Measured**: 2026-08-25 00:14:59 Africa/Cairo (`2026-08-24T21:14:59.285Z`)

**Protocol**: [performance-protocol.md](./performance-protocol.md)

**Raw evidence**: [performance-baseline.raw.json](./performance-baseline.raw.json)

## Controlled environment

| Variable | Recorded value |
|---|---|
| Repository commit | `3441fcb1476896e750b824613ae8ea5c519033f1` |
| Worktree | Dirty before measurement because the feature specification artifacts were already modified; T001 and the measurement harness were the only implementation-workflow additions before timing. |
| Runtime | Node.js 24.19.0; pnpm 10.17.1; production Next.js 16.0.0 build and production server. |
| Browser | Playwright Chromium 140.0.7339.186 from `@playwright/test` 1.55.1. |
| Viewport | 1440 by 900 CSS pixels; device scale factor 1; reduced motion disabled. |
| Machine | Windows 11 Pro 10.0.26200 x64; AMD Ryzen 5 3600 6-Core Processor; 12 logical cores; 34,287,480,832 bytes RAM; AMD Ryzen Balanced power plan; physical host `DESKTOP-ODO0JQH`. |
| Database | Local isolated `postgres:17.6-bookworm`; migrations 001-003; deterministic administrator scale seed of 1,000 users and 10,000 files plus the bootstrap administrator and fixed normal-user fixture. |
| Storage/email | In-process `FakeStorage` authority adapter and localhost-only Mailpit 1.27. No remote provider latency. |
| Network/cache | Localhost, no artificial throttling; one warm-up discarded; fresh 1440 px browser context per journey; one worker; journeys rotated per repetition. |
| Fixture | Verified `ui-baseline-user@example.invalid`, fixed `baseline-preview.txt`, fixed small text upload per repetition, and `admin-baseline@example.invalid`. Credentials, tokens, codes, and private contents are intentionally omitted. |

## Legacy medians

Seven valid measured repetitions were sorted independently for every metric. The fourth value is the
median; no repetitions were excluded.

| Journey / metric | Median (ms) | Post-redesign maximum (+10%) (ms) |
|---|---:|---:|
| Landing route ready | 281.91 | 310.10 |
| Sign-in route ready | 317.24 | 348.96 |
| Dashboard statistics ready | 167.05 | 183.76 |
| Files collection ready | 260.96 | 287.06 |
| Details and text preview settled | 235.91 | 259.50 |
| Text upload terminal state | 204.58 | 225.04 |
| Administrator users page 2 ready | 338.24 | 372.06 |

## Diagnostics and validity notes

- Every measured journey reached its required semantic terminal state and completed two animation
  frames. The harness exited successfully after the warm-up and 49 measured journey executions.
- Every fresh context logged one `401 Unauthorized` resource error while the authentication provider
  established that no prior access token was present. This is existing legacy behavior and is retained
  in every raw repetition; it was not used to exclude or adjust a duration. Phase 4 console-error
  acceptance should either eliminate the browser-console emission without changing the established
  unauthenticated outcome or explicitly classify it with reproducible evidence.
- The first two diagnostic attempts were not measured: one exposed Mailpit API/localhost setup
  differences and one exposed the production secure-cookie configuration requirement. The final run
  used the fixed configuration above, included its own discarded warm-up, and produced all seven
  valid repetitions.
- Upload warm-up/test objects remain confined to the isolated test database and fake in-memory
  storage process. Post-redesign comparison must reset and reproduce the same seed and run order.

## Reproduction command

After starting the documented isolated services and production builds with the same configuration:

```powershell
$env:PERF_MAIL_API_URL='http://localhost:18025/api/v1/messages'
$env:PERF_OUTPUT_PATH='specs/004-fileora-ui-redesign/evidence/performance-results.raw.json'
$env:PERF_ADMIN_EMAIL='admin-baseline@example.invalid'
node scripts/measure-ui-performance.mjs
```

Supply the administrator password only through the uncommitted process environment. The harness
defaults to seven repetitions and emits browser version, raw results, diagnostics, and medians.
