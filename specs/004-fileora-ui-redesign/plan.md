# Implementation Plan: Fileora UI Redesign

**Branch**: `004-fileora-ui-redesign` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-fileora-ui-redesign/spec.md`

## Summary

Replace Fileora's current presentation with the approved visual and responsive system in
`specs/fileora-app.html` while preserving every Phase 1-3 route outcome, API contract, BFF session
boundary, ownership rule, deletion rule, administrator restriction, and storage behavior. The
implementation will first extract reusable design tokens and accessible shell/primitives, then
migrate public/authentication, user, file-management, and administrator surfaces in independently
verifiable slices. Existing React Query hooks and API clients remain the source of application data;
Playwright, Vitest, side-by-side visual review, accessibility checks, performance comparison, and a
clean-environment smoke test provide regression evidence.

## Technical Context

**Language/Version**: TypeScript 5.9.2 in strict mode; Node.js 24.x; HTML/CSS/JavaScript reference prototype

**Primary Dependencies**: Next.js 16.0.0 App Router, React 19.1.1, Tailwind CSS 4.1.12, TanStack React Query 5.87.1, Axios 1.11.0, Framer Motion 12.23.12, Zod 4.1.5; existing Express 5.1.0 and `@gold-era/contracts` interfaces remain unchanged

**Storage**: No Phase 4 data change; existing PostgreSQL 17, Prisma 7.0.0, and private Supabase Storage integration remain authoritative

**Testing**: Vitest 3.2.4, Testing Library 16.3.0, Playwright 1.55.1, existing contract/integration/security suites, side-by-side screenshot review, keyboard and reduced-motion checks, automated accessibility scanning, supported-browser/device acceptance, and moderated usability evidence

**Target Platform**: Responsive web application at 320 CSS px and wider; latest two major desktop versions of Chrome, Edge, Firefox, and Safari, plus current iOS Safari and Android Chrome

**Project Type**: TypeScript monorepo web application with a Next.js client, Express REST API, and shared contracts package

**Performance Goals**: Critical-route and interaction readiness no more than 10% slower than a recorded pre-redesign baseline under identical conditions; no major runtime or browser-console errors

**Constraints**: `specs/fileora-app.html` controls visual/responsive behavior; no new product behavior, backend redesign, API/schema/storage/authentication/environment-key change, page-level horizontal overflow, inaccessible required action, or weakened behavioral/security test; all new or changed functions require intent comments

**Scale/Scope**: Landing; register, sign-in, verification, and authentication/access outcomes; authenticated shell; dashboard; files/folders, upload, details, preview, download, move, and deletion states; profile; administrator dashboard, users, global files, and audit history; light/dark/system themes; 1440/768/390 px review checkpoints plus the 320 px boundary

## Constitution Check

*GATE: Passed before Phase 0 research; passed again after Phase 1 design.*

| Principle / gate | Pre-research evaluation | Post-design evaluation |
|---|---|---|
| I. Strict TypeScript and layered design | PASS — presentation work stays in typed client components/features and reuses existing API clients/hooks. | PASS — contracts define presentation inputs without moving business logic into pages or using `any`. |
| II. Server-enforced security | PASS — Express authorization, ownership checks, BFF refresh-token isolation, and deny-by-default outcomes are unchanged. | PASS — UI contracts explicitly treat client guards as UX only and preserve protected-operation regression checks. |
| III. Stable contracts and replaceable infrastructure | PASS — no API, storage, email, or infrastructure contract change is proposed. | PASS — `contracts/api-invariants.md` freezes all consumed public/internal interfaces for this phase. |
| IV. Reusable, complete user experiences | PASS — the approach begins with reusable tokens, primitives, shell, responsive compositions, complete states, and React Query reuse. | PASS — the UI acceptance contract covers loading, empty, validation, success, error, confirmation, keyboard, theme, motion, and responsive behavior. |
| V. Verified environment configuration | PASS — no environment key is added, renamed, or removed. | PASS — quickstart uses the existing safe examples and includes a configuration-parity check. |
| VI. Audit important operations | PASS — presentation changes neither add audit-producing operations nor alter audit meaning/exposure. | PASS — administrator and user UI contracts preserve existing mutation/read audit behavior. |
| VII. Spec-driven, tested, incremental delivery | PASS — the migration is sliced by reusable foundation and independently testable route families. | PASS — quickstart defines build, behavioral, security, visual, browser, accessibility, usability, performance, and clean-start evidence. |
| VIII. Comment every function and method | PASS — implementation and review must retain the repository intent-comment audit. | PASS — validation includes `pnpm audit:comments`. |
| IX. Database schema approval | PASS — Phase 4 proposes no persisted entity, field, relationship, enum, index, or migration change. `database-schema.mmd` remains the canonical baseline. | PASS — `data-model.md` records presentation-only entities and explicitly compares the unchanged Prisma models (`User`, `VerificationCode`, `RefreshToken`, `Folder`, `File`, `AuditLog`) with the canonical diagram. No difference requires maintainer approval. |

No constitutional exception or complexity waiver is required. If implementation discovers a need
for an API, environment, storage, authentication, or database change, work must stop and the spec and
dependent artifacts must be revised before that change is planned.

## Project Structure

### Documentation (this feature)

```text
specs/004-fileora-ui-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-invariants.md
│   └── ui-acceptance.md
└── tasks.md                  # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── app/                 # Landing, auth, protected-user, and admin routes/layouts
│   ├── components/          # Shared brand, navigation, theme, status, toast, and dialog primitives
│   ├── features/            # Existing auth, dashboard, files, folders, and admin slices
│   ├── lib/                 # Existing API/BFF, configuration, presentation, and theme utilities
│   └── providers/           # Query, authentication, theme, and feedback providers
└── tests/
    ├── component/           # Presentation, state, keyboard, accessibility, and behavior checks
    ├── integration/         # BFF/session regression checks
    └── unit/                # Theme/configuration and pure presentation utilities

packages/contracts/src/
├── public/                  # Existing public API schemas consumed by the client
└── internal/                # Existing trusted BFF authentication schemas

server/
├── src/                     # Unchanged authoritative REST/business/security/storage layers
├── prisma/                  # Unchanged schema and migrations
└── tests/                   # Existing API contract, integration, unit, and security regressions

tests/
├── e2e/                    # Cross-route, responsive, theme, user, and administrator journeys
├── integration/            # Clean/container smoke validation
└── security/               # Configuration, branding, redaction, and prohibited-pattern checks

specs/fileora-app.html       # Approved presentation and responsive authority
database-schema.mmd          # Unchanged canonical database baseline
```

**Structure Decision**: Keep the established monorepo and feature-based client organization. Add or
refine reusable presentation primitives under `client/src/components`, compose them within the
existing feature components, and keep route files focused on layout and orchestration. Preserve
`client/src/lib/api`, React Query hooks, `packages/contracts`, all server layers, Prisma, and storage
integration. Migrate one route family at a time only after the shared design foundation is available,
then remove a legacy presentation artifact only when no route, state, or test still depends on it.

## Design Approach

### 1. Approved design extraction

- Translate the prototype's color, typography, spacing, radius, shadow, surface, focus, and motion
  values into semantic CSS/Tailwind tokens rather than copying prototype markup into pages.
- Reproduce its persistent desktop sidebar, sticky top bar, compact/off-canvas navigation, dashboard
  rearrangement, file workspace, responsive tables, drawers, dialogs, authentication split layout,
  and landing composition at the demonstrated transitions (1100, 820, and 560 px) while reviewing at
  1440, 768, 390, and 320 px.
- Treat a material visual or responsive difference as an acceptance exception that requires a written
  rationale and explicit maintainer approval in the feature artifacts.

### 2. Reusable presentation foundation

- Establish semantic design tokens and shared primitives for buttons, icon actions, form fields,
  status/pills, cards, tables, pagination, feedback, skeletons, empty/error states, dialogs/drawers,
  focus restoration, and reduced-motion behavior.
- Build public/authentication, authenticated-user, and restricted-administrator shell compositions on
  those primitives while preserving current route and authorization boundaries.
- Continue to use the existing theme provider and saved `light`, `dark`, or `system` preference; map
  the approved tokens to both effective color schemes without changing storage semantics.

### 3. Incremental surface migration

- Migrate landing and authentication/access outcomes first, followed by the application shell and
  dashboard/profile, file/folder workspace and transient workflows, then administrator surfaces.
- Preserve all established loading, empty, validation, submitting, success, failure, retry,
  unauthorized, forbidden, and confirmation states even when the prototype shows only a representative
  example; use the closest approved pattern for omitted states.
- Keep data fetching/mutations in existing APIs and React Query hooks. Presentation components receive
  typed data and callbacks; they do not reconstruct filtering, authorization, ownership, deletion,
  upload, or audit rules.

### 4. Regression and acceptance evidence

- Record pre-redesign route/interaction timing under controlled conditions before replacing each
  critical surface, then compare the redesigned result against the 10% threshold.
- Extend component and Playwright coverage for semantic outcomes, keyboard focus, overlays, theme,
  reduced motion, 320 px overflow, approved viewport compositions, and console/runtime errors.
- Use Playwright Chromium/Firefox/WebKit for repeatable engine coverage and complete the exact supported
  Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome matrix on matching browser/device
  versions; record any unavailable environment as incomplete rather than inferring a pass.
- Conduct and record the required 10-participant desktop/mobile usability check, with at least 9
  participants completing every named journey without assistance.
- Finish with existing lint/type/test/security/build/comment gates and the documented clean-environment
  public/user/admin smoke journey.

## Complexity Tracking

No constitution violations require justification.
