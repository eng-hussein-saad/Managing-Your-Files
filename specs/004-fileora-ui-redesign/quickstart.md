# Phase 1 Quickstart: Validate the Fileora UI Redesign

This guide validates the completed Phase 4 implementation. It does not replace the detailed
[UI acceptance contract](./contracts/ui-acceptance.md), unchanged
[API invariants](./contracts/api-invariants.md), or conceptual [data model](./data-model.md).

## Prerequisites

- Node.js 24.x, Corepack, and pnpm 10.17.1
- PostgreSQL 17, SMTP test delivery, and a private Supabase Storage bucket as documented in `README.md`
- Docker with Compose for the clean-environment path
- Playwright browsers plus access to the exact supported desktop/mobile browser matrix
- Test accounts/data for a normal verified user and an administrator
- The approved `specs/fileora-app.html` reference available for side-by-side review

## 1. Configure and start the existing product

From the repository root:

```powershell
pnpm install --frozen-lockfile
Copy-Item -LiteralPath 'client/.env.example' -Destination 'client/.env.local'
Copy-Item -LiteralPath 'server/.env.example' -Destination 'server/.env'
pnpm --filter @gold-era/server prisma:generate
pnpm --filter @gold-era/server prisma:migrate:deploy
pnpm --filter @gold-era/server admin:bootstrap
pnpm dev
```

Replace placeholders only in the uncommitted local environment files. Do not add a Phase 4 key.
Expected outcome: Next.js serves `http://localhost:3000`, Express serves `http://localhost:3001`, and
the application starts without configuration/schema warnings or exposed secrets.

## 2. Run static and behavioral gates

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:security
pnpm audit:comments
pnpm build
pnpm verify:phase3
pnpm verify:critical:triple
```

Expected outcome: every command passes. Presentation-specific assertion updates retain the same user
outcomes; contract/security assertions are not weakened. The comment audit passes for every new or
changed function, method, and callback.

## 3. Run browser automation

Install the configured Playwright browsers once, then run the suite:

```powershell
pnpm exec playwright install
pnpm test:e2e
```

Expected outcome:

- Chromium, Firefox, WebKit, configured Chrome/Edge channels, and representative mobile projects pass.
- Existing same-origin/unrelated-origin security journeys still pass.
- The surface/state matrix links evidence for every applicable state at 1440, 768, and 390 px in
  light/dark modes, plus the required 320 px overflow/action result.
- Dedicated 320 px checks find no page-level horizontal overflow or inaccessible required action.
- No critical route produces an unexpected console or runtime error.
- Automated route-family axe scans report zero critical or serious WCAG 2.2 A/AA violations; every
  other A/AA finding is remediated or has reproducible false-positive evidence.
- Manual accessibility evidence confirms WCAG 2.2 AA contrast, keyboard/focus behavior, 200%
  zoom/reflow, 44 by 44 CSS-pixel standalone targets, and any permitted SC 2.5.8 exception.

Automation is not the final proof for Safari/iOS Safari/Android Chrome; complete Step 6 as well.

## 4. Validate critical journeys manually

At 1440, 768, 390, and 320 px, and in light, dark, and system modes:

1. Open the landing page; register, verify/resend, sign in, exercise an invalid/expired session, and
   sign out.
2. Navigate dashboard/profile and confirm statistics, chart text equivalents, safe identity data,
   theme persistence, and live system-theme changes.
3. In files, switch list/grid, browse nested folders/breadcrumbs, search/filter/sort/page, upload a
   partial-failure batch and retry, open all preview outcomes, download, move, and cancel then confirm
   permanent file/folder deletion.
4. As an administrator, review the restricted dashboard, users, global file metadata, and audit
   history; exercise role/delete confirmations. Confirm no admin preview/download/content affordance.
5. Repeat protected/admin requests as a normal user and confirm the server denies them.
6. Repeat core journeys by keyboard at 200% zoom and with reduced motion. Resize/orient the viewport
   while navigation, filters, upload, a dialog, and the details drawer are open.

Expected outcome: every outcome matches the UI acceptance contract and existing Phase 1-3 behavior.
No required state/action is missing because it was absent from the prototype.

## 5. Compare visual fidelity and performance

- Render `specs/fileora-app.html` beside the application for every route family and checkpoint.
- Compare composition, tokens, typography, density, navigation, responsive transitions, themes,
  states, and overlays.
- Record every material difference in a deviation log. A pass requires either zero differences or
  explicit dated maintainer approval for each difference.
- Run the documented pre-redesign timing protocol against landing/sign-in, dashboard, files, file
  details/preview, upload, and an administrator journey using identical data/browser/viewport/cache/
  network/machine conditions. Compare repeated-run medians.

Expected outcome: every redesigned median is no more than 10% slower than its baseline; no unapproved
material difference remains.

## 6. Complete exact browser/device and usability evidence

Run the visual, responsive, functional, keyboard/touch, and critical-journey matrix on:

- latest two major Chrome desktop versions;
- latest two major Edge desktop versions;
- latest two major Firefox desktop versions;
- latest two major Safari desktop versions;
- current iOS Safari; and
- current Android Chrome.

Record browser version, OS/device, viewport, theme, result, evidence link, and tester. Missing access is
`blocked`, never `pass`.

Conduct the specified usability session with at least 10 representative participants on desktop and
mobile. Record whether each participant completes sign-in, locate-file, upload, inspect-file, and
initiate/cancel-destructive-action on the first attempt without assistance.

Expected outcome: every browser/device entry passes, and at least 9 participants pass every named
journey on both layouts.

## 7. Run the clean-environment smoke path

Using disposable infrastructure and non-secret example-derived configuration:

```powershell
docker compose config
docker compose build
docker compose up
```

After health checks pass, complete one landing/authentication, normal-user file-management, and
administrator journey. Confirm migration/schema alignment, storage/email operation, and README,
Docker, production configuration, security, reliability, and performance instructions. Stop with:

```powershell
docker compose down
```

Expected outcome: the complete product starts with no undocumented key or database mismatch and all
three smoke journeys pass. Do not use `--volumes` unless the database is explicitly disposable.

## Completion record

Phase 4 is ready for acceptance only when all automated gates, visual reviews, exact browser/device
entries, accessibility checks, performance comparisons, participant results, deviation approvals,
and clean-start smoke evidence are recorded and passing.

