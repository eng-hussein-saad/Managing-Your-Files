---

description: "Dependency-ordered implementation tasks for Administration and Final Quality"
---

# Tasks: Administration and Final Quality

**Input**: Design documents from `/specs/003-administration-final-quality/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/admin-api.yaml`, `quickstart.md`

**Tests**: Tests are required because the specification mandates risk-based automated verification for authentication, authorization, destructive cleanup, administrator operations, themes, accessibility, containers, and release quality.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested as an independent increment. Every project-authored function, method, arrow assignment, and inline callback added or changed by these tasks must receive an accurate intent comment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it targets different files and does not depend on an incomplete task
- **[Story]**: Maps the task to a user story in `spec.md`
- Every task names the exact file or files it changes

## Phase 1: Setup (Shared Test Infrastructure)

**Purpose**: Establish reusable Phase 3 fixtures before contract and behavior tests are written.

- [X] T001 Create deterministic administrator, target-user, session, nested-folder, file, and audit-event fixture builders in server/tests/fixtures/admin.ts
- [X] T002 [P] Create browser-safe administrator user, file, statistics, and audit response fixtures in client/tests/fixtures/admin.ts
- [X] T003 [P] Create Playwright administrator identities and seeded Phase 3 journey helpers in tests/e2e/fixtures/admin.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Synchronize the approved schema and establish shared security, transaction, contract, and client primitives used by every administrator story.

**CRITICAL**: No user story implementation begins until this phase is complete.

- [X] T004 Add a fail-closed forward migration that aborts on non-null legacy user lifecycle values and removes `USER.deletedAt` in server/prisma/migrations/003_administration_final_quality/migration.sql
- [X] T005 Remove `User.deletedAt` from the runtime model and regenerate schema-facing assumptions in server/prisma/schema.prisma
- [X] T006 Update canonical seed data and shared database fixtures to create only permanent-lifecycle users in server/prisma/seed.ts and server/tests/fixtures/canonical.ts
- [X] T007 Add schema-alignment coverage for the approved `USER.deletedAt` removal across database-schema.mmd, Prisma, and PostgreSQL in server/tests/integration/user-lifecycle-migration.integration.test.ts
- [X] T008 Extend the transaction infrastructure with an attempts-one serializable path, administrator advisory lock, row-lock helpers, and conflict classification in server/src/infrastructure/persistence/transactions.ts
- [X] T009 Add an owner lifecycle lock shared by upload, owner deletion, administrator file deletion, and user cleanup in server/src/modules/files/repositories/file.repository.ts and server/src/modules/files/services/upload-file.service.ts
- [X] T010 Require protected requests to load the live verified user and reject missing accounts or persisted/token role mismatches in server/src/http/middleware/authenticate.ts and server/src/modules/users/user.repository.ts
- [X] T011 Define strict shared Zod schemas and inferred public types for all admin users, files, statistics, audit pages, mutations, filters, pagination, and error payloads in packages/contracts/src/public/admin.ts and packages/contracts/src/public/index.ts
- [X] T012 Create validated administrator request schemas and common route parameter/query parsing in server/src/http/schemas/admin.schemas.ts

**Checkpoint**: The approved lifecycle model, transaction safeguards, live authority check, and shared admin contracts are ready.

---

## Phase 3: User Story 1 - Administer Users Safely (Priority: P1) MVP

**Goal**: Let administrators search and inspect users, safely change roles, and permanently delete accounts with complete retryable cleanup and no self/last-admin failure mode.

**Independent Test**: Sign in as an administrator, list/search/page and inspect users, change an eligible target's role, then permanently delete a seeded target with active sessions, verification records, nested folders, files, and stored objects; verify immediate session invalidation, cleanup, sanitized fail-open audit attempts for role change and deletion only, zero audits for list/detail reads, stale-command conflicts, and denial for a normal user.

### Tests for User Story 1

- [X] T013 [P] [US1] Add contract tests for strict user list/detail/role/delete success and error envelopes, unknown fields, confirmations, and pagination in server/tests/contract/admin-users.contract.test.ts
- [X] T014 [P] [US1] Add security tests for unauthenticated, normal-user, self-action, last-admin, secret-disclosure, and unsupported-role rejection in server/tests/security/admin-users.security.test.ts
- [X] T015 [P] [US1] Add integration tests for deterministic user queries, role/session invalidation, stale conflicts, concurrent last-admin protection, exactly one sanitized fail-open audit attempt for successful role changes, and zero audit events for administrator user list/detail reads in server/tests/integration/admin-user-management.integration.test.ts
- [X] T016 [P] [US1] Add failure-injection integration tests for object-first partial user cleanup, database rollback, securely absent objects, retry completion, dependent-row removal, audit actor nulling, and exactly one sanitized fail-open audit attempt after successful permanent user deletion in server/tests/integration/admin-user-deletion.integration.test.ts
- [X] T017 [P] [US1] Add component tests for URL-backed user queries, all async states, role confirmation, typed-email deletion confirmation, 409 reload/reconfirm behavior, and focused dialog restoration in client/tests/component/admin-users.test.tsx

### Implementation for User Story 1

- [X] T018 [P] [US1] Implement safe deterministic admin user projections, search, sorting, pagination, row locking, current-admin counts, and dependent cleanup queries in server/src/modules/users/user.repository.ts
- [X] T019 [P] [US1] Define centralized allowlisted administrator audit actions only for user role change, permanent user deletion, and permanent administrator file deletion with actor, target, outcome, and no raw query, identity, filename, storage, or content metadata in server/src/modules/audit/admin-audit.ts and server/src/modules/audit/audit.types.ts
- [X] T020 [US1] Implement administrator user list/detail and role-change orchestration with expected-version comparison, self/last-admin safeguards, attempts-one serialization, refresh-session removal, no read auditing, and exactly one sanitized fail-open audit attempt after a successful role change in server/src/modules/users/admin-user.service.ts
- [X] T021 [US1] Implement retryable permanent user cleanup with trusted storage-key enumeration, missing-object acceptance, dependent deletion, deleted-actor marking, actor nulling, and exactly one sanitized fail-open post-commit audit attempt in server/src/modules/users/admin-user-deletion.service.ts
- [X] T022 [US1] Implement strict user list/detail/role/delete controllers with sanitized 400/401/403/404/409/503 mapping in server/src/http/controllers/admin-user.controller.ts
- [X] T023 [US1] Mount authenticated and administrator-authorized user administration routes before validation or disclosure in server/src/http/routes/admin.routes.ts
- [X] T024 [P] [US1] Implement typed admin-user gateway functions and normalized request serialization in client/src/features/admin/api/admin-users.api.ts
- [X] T025 [P] [US1] Define stable admin-user query keys and list/detail/mutation hooks with targeted invalidation and no automatic mutation retry in client/src/features/admin/query-keys.ts and client/src/features/admin/hooks/use-admin-users.ts
- [X] T026 [US1] Build searchable, sortable, paginated user directory and safe detail presentation in client/src/features/admin/components/admin-user-directory.tsx
- [X] T027 [US1] Build target-specific role and permanent deletion dialogs with typed confirmation, stale-state recovery, keyboard containment, and focus restoration in client/src/features/admin/components/admin-user-actions.tsx
- [X] T028 [US1] Add the administrator users route and URL-backed query state in client/src/app/admin/users/page.tsx
- [X] T029 [US1] Add a Playwright administrator-user journey covering search, role invalidation, permanent deletion, keyboard confirmation, and normal-user denial in tests/e2e/admin-users.spec.ts

**Checkpoint**: User administration is independently functional, destructive cleanup is retryable, and stale or unsafe commands cannot change state.

---

## Phase 4: User Story 2 - Manage Files Across the Platform (Priority: P1)

**Goal**: Let administrators query metadata for files across all owners and permanently delete a file without gaining content preview or download authority.

**Independent Test**: Seed files for multiple owners and types, combine search/filters/sorting/pagination, inspect metadata, permanently delete one file through a failure and retry path, verify deletion attempts one sanitized fail-open audit event while list/detail reads create none, and prove normal users and administrators cannot use admin authority to read another owner's content.

### Tests for User Story 2

- [X] T030 [P] [US2] Add contract tests for strict global-file list/detail/delete shapes, decimal byte values, filters, confirmation identity, and absence of content routes in server/tests/contract/admin-files.contract.test.ts
- [X] T031 [P] [US2] Add security tests for administrator metadata-only access, normal-user denial, owner-only preview/download, storage-key redaction, and filename/path safety in server/tests/security/admin-files.security.test.ts
- [X] T032 [P] [US2] Add integration tests for deterministic combined global-file queries, object-first deletion, accounting changes, stale conflicts, storage failures, missing-object retry, exactly one sanitized fail-open audit attempt for successful administrator file deletion, and zero audit events for global-file list/detail reads in server/tests/integration/admin-file-management.integration.test.ts
- [X] T033 [P] [US2] Add component tests for URL-backed file filters, responsive metadata results, async states, target-specific confirmation, 409 recovery, and 503 retry in client/tests/component/admin-files.test.tsx

### Implementation for User Story 2

- [X] T034 [US2] Implement cross-owner metadata projections, combined filters, stable sorting, bounded pagination, trusted owner lookup, and version checks in server/src/modules/files/repositories/admin-file.repository.ts
- [X] T035 [US2] Implement unaudited global-file list/detail orchestration and extend permanent file deletion for trusted administrator authority while preserving owner lifecycle locking, object-first cleanup, accounting, and exactly one sanitized fail-open audit attempt after successful deletion in server/src/modules/files/services/admin-file.service.ts and server/src/modules/files/services/delete-file.service.ts
- [X] T036 [US2] Implement metadata-only global-file list/detail/delete controllers and sanitized conflict/unavailable responses in server/src/http/controllers/admin-file.controller.ts
- [X] T037 [US2] Mount the admin file routes without preview, download, signed-access, or extracted-content endpoints in server/src/http/routes/admin.routes.ts
- [X] T038 [P] [US2] Implement typed global-file gateway functions, query keys, and no-retry deletion hooks with targeted statistics/list invalidation in client/src/features/admin/api/admin-files.api.ts and client/src/features/admin/hooks/use-admin-files.ts
- [X] T039 [US2] Build the searchable/filterable/sortable global-file directory and metadata detail view in client/src/features/admin/components/admin-file-directory.tsx
- [X] T040 [US2] Add owner-aware permanent deletion confirmation and recovery states in client/src/features/admin/components/admin-file-actions.tsx and client/src/app/admin/files/page.tsx
- [X] T041 [US2] Add a Playwright global-file journey covering combined filters, metadata-only inspection, deletion failure/retry, responsive layout, and content-access denial in tests/e2e/admin-files.spec.ts

**Checkpoint**: Global metadata oversight and permanent deletion work independently without expanding content authority.

---

## Phase 5: User Story 3 - Monitor Platform Activity (Priority: P1)

**Goal**: Show exact current platform statistics and retained, sanitized, administrator-only audit history with live, deleted, and system actor states.

**Independent Test**: Seed known users, files, types, byte totals, uploads, and audit events; compare dashboard aggregates and filtered pages exactly before and after mutations, verify statistics and audit-history reads create no audit events, verify deleted actors display generically, and prove normal users cannot read either resource.

### Tests for User Story 3

- [X] T042 [P] [US3] Add contract tests for exact statistics and strict audit page/filter/actor projection envelopes in server/tests/contract/admin-monitoring.contract.test.ts
- [X] T043 [P] [US3] Add integration tests for current-row statistics, bigint serialization, type distribution, recent ordering, post-mutation accuracy, empty datasets, and zero audit events for administrator statistics reads in server/tests/integration/admin-statistics.integration.test.ts
- [X] T044 [P] [US3] Add integration and security tests for deterministic audit queries, safe metadata allowlisting, live/deleted/system actors, retention, administrator-only access, and zero audit events for audit-history reads in server/tests/integration/admin-audit-history.integration.test.ts
- [X] T045 [P] [US3] Add dashboard and audit-history component tests for URL filters, pagination, charts/tables, async states, safe actor rendering, and targeted refetches in client/tests/component/admin-monitoring.test.tsx

### Implementation for User Story 3

- [X] T046 [P] [US3] Implement exact unaudited current-user/file/byte/type/recent-upload aggregate queries in server/src/modules/statistics/admin-statistics.repository.ts and server/src/modules/statistics/admin-statistics.service.ts
- [X] T047 [P] [US3] Implement retained unaudited audit search/filter/pagination and narrow live/deleted/system actor projection in server/src/modules/audit/audit.repository.ts and server/src/modules/audit/audit.service.ts
- [X] T048 [US3] Add administrator statistics and audit controllers and mount their protected routes in server/src/http/controllers/admin-monitoring.controller.ts and server/src/http/routes/admin.routes.ts
- [X] T049 [P] [US3] Implement typed statistics/audit gateway functions and React Query hooks with complete normalized keys in client/src/features/admin/api/admin-monitoring.api.ts and client/src/features/admin/hooks/use-admin-monitoring.ts
- [X] T050 [US3] Build the exact totals, file-type distribution, and recent-uploads dashboard in client/src/features/admin/components/admin-dashboard.tsx and client/src/app/admin/page.tsx
- [X] T051 [US3] Build searchable/filterable/paginated sanitized audit history in client/src/features/admin/components/admin-audit-history.tsx and client/src/app/admin/audit/page.tsx
- [X] T052 [US3] Add Playwright monitoring coverage for exact statistics, known-event discovery, deleted/system actors, responsive displays, zero audit events from monitoring reads, and normal-user denial in tests/e2e/admin-monitoring.spec.ts

**Checkpoint**: Statistics and audit visibility are exact, safe, retained, and independently usable by administrators.

---

## Phase 6: User Story 4 - Use a Consistent Fileora Experience (Priority: P2)

**Goal**: Present Fileora branding, the approved tagline, titles, navigation, empty states, and a responsive non-obstructive footer across appropriate user-facing layouts.

**Independent Test**: Review authentication, application, and administrator surfaces at 360 px, 768 px, and 1440 px; verify designated Fileora identity/tagline/footer placement and zero unintended user-facing Gold Era references while internal identifiers remain stable.

### Tests for User Story 4

- [X] T053 [P] [US4] Add a user-facing branding regression scan that excludes approved internal identifiers in tests/security/user-facing-branding.test.ts
- [X] T054 [P] [US4] Add component tests for shared Fileora identity, document metadata, tagline placement, and non-obstructive footer coverage in client/tests/component/fileora-shell.test.tsx

### Implementation for User Story 4

- [X] T055 [P] [US4] Create reusable Fileora brand and responsive footer primitives in client/src/components/brand/fileora-brand.tsx and client/src/components/layout/app-footer.tsx
- [X] T056 [US4] Apply Fileora metadata, product naming, and tagline placement to the root and authentication shells in client/src/app/layout.tsx and client/src/app/(auth)/layout.tsx
- [X] T057 [US4] Apply the shared brand/footer shell to protected and administrator layouts in client/src/app/(protected)/layout.tsx and client/src/app/admin/layout.tsx
- [X] T058 [US4] Replace remaining user-facing Gold Era text in client/src/app/page.tsx, client/src/app/admin/page.tsx, client/src/app/(auth)/login/page.tsx, client/src/app/(auth)/register/page.tsx, client/src/app/(auth)/verify-email/page.tsx, client/src/components/navigation/app-navigation.tsx, and client/src/components/status/page-state.tsx
- [X] T059 [US4] Add cross-viewport Playwright branding/footer coverage in tests/e2e/fileora-branding.spec.ts

**Checkpoint**: All designated product surfaces consistently identify Fileora without renaming internal technical contracts solely for branding.

---

## Phase 7: User Story 5 - Choose and Retain a Theme (Priority: P2)

**Goal**: Support persistent light, dark, and system selections without an impairing wrong-theme flash, including live system changes and perceivable controls in every important surface.

**Independent Test**: Select each theme, navigate and reload, change the emulated OS scheme while system is saved, and inspect authentication, user, preview, administrator, chart, dialog, form, table, empty-state, navigation, and footer surfaces.

### Tests for User Story 5

- [X] T060 [P] [US5] Add unit tests for valid, invalid, missing, and inaccessible browser theme preference resolution in client/tests/unit/theme.test.ts
- [X] T061 [P] [US5] Add component tests for selection persistence, system media-query changes, pre-hydration state, and accessible theme controls in client/tests/component/theme-provider.test.tsx
- [X] T062 [P] [US5] Add Playwright coverage for reload flash, all three saved modes, live system changes, and representative themed surfaces in tests/e2e/themes.spec.ts

### Implementation for User Story 5

- [X] T063 [US5] Implement namespaced light/dark/system preference parsing, safe storage access, and effective-theme resolution in client/src/lib/theme/theme.ts
- [X] T064 [US5] Implement the pre-hydration theme script and live system-aware provider in client/src/components/theme/theme-script.tsx and client/src/providers/theme-provider.tsx
- [X] T065 [US5] Build an accessibly labeled keyboard-operable theme selector in client/src/components/theme/theme-selector.tsx and register it in client/src/providers/app-providers.tsx
- [X] T066 [US5] Define semantic light/dark tokens, color-scheme behavior, visible focus, chart/status palettes, and reduced-motion defaults in client/src/app/globals.css
- [X] T067 [US5] Apply the theme script and selector to shared metadata, navigation, authentication, protected, and administrator shells in client/src/app/layout.tsx and client/src/components/navigation/app-navigation.tsx

**Checkpoint**: Theme choice persists correctly, system mode remains saved while following the OS, and all critical surfaces stay perceivable.

---

## Phase 8: User Story 6 - Complete Workflows with Polished Feedback (Priority: P2)

**Goal**: Make representative existing and new workflows responsive, keyboard-operable, consistently formatted, and complete across loading, empty, validation, success, and failure states.

**Independent Test**: Exercise authentication, files, folders, dashboards, and administrator journeys under slow, empty, success, validation-failure, and service-failure conditions using only a keyboard at 360 px, 768 px, and 1440 px with reduced motion.

### Tests for User Story 6

- [X] T068 [P] [US6] Add component tests for dialog focus containment, Escape handling, background/scroll containment, destructive target naming, and trigger focus restoration in client/tests/component/dialog-accessibility.test.tsx
- [X] T069 [P] [US6] Create a complete inventory of every user-facing asynchronous authentication, file, folder, dashboard, profile, and administrator workflow, record justified non-applicable states, and add component coverage for every applicable loading, empty, validation, success, failure, and recovery state in specs/003-administration-final-quality/async-workflows.md and client/tests/component/async-workflow-states.test.tsx
- [X] T070 [P] [US6] Add Playwright keyboard, responsive, long-content, large-number, and reduced-motion coverage for critical user/admin journeys in tests/e2e/final-experience.spec.ts

### Implementation for User Story 6

- [X] T071 [US6] Extend the shared permanent-delete dialog with reusable target-specific copy, initial focus, focus trap, Escape handling, background containment, and restoration in client/src/components/confirmation/permanent-delete-dialog.tsx
- [X] T072 [P] [US6] Standardize page loading, empty, validation, error, success, retry, and request-in-progress presentation in client/src/components/status/page-state.tsx and client/src/components/status/error-panel.tsx
- [X] T073 [P] [US6] Create shared date, byte, count, and pagination formatters for user and administrator surfaces in client/src/lib/presentation/format.ts
- [X] T074 [US6] Make navigation, menus, tables/cards, forms, pagination, and page actions responsive and keyboard-operable in client/src/components/navigation/app-navigation.tsx and client/src/app/globals.css
- [X] T075 [US6] Close every gap recorded in specs/003-administration-final-quality/async-workflows.md by applying shared feedback, formatting, and confirmation primitives across client/src/features/auth/components/sign-in-form.tsx, client/src/features/auth/components/register-form.tsx, client/src/features/auth/components/verify-email-form.tsx, client/src/features/files/components/file-collection.tsx, client/src/features/files/components/upload-queue.tsx, client/src/features/folders/components/folder-browser.tsx, client/src/features/dashboard/components/file-statistics.tsx, client/src/app/(protected)/profile/page.tsx, client/src/features/admin/components/admin-user-directory.tsx, client/src/features/admin/components/admin-file-directory.tsx, client/src/features/admin/components/admin-dashboard.tsx, and client/src/features/admin/components/admin-audit-history.tsx
- [X] T076 [US6] Add debouncing, cancellation, previous-page data, and narrow mutation invalidation in client/src/features/files/hooks/use-files.ts, client/src/features/files/hooks/use-delete-file.ts, client/src/features/admin/hooks/use-admin-users.ts, client/src/features/admin/hooks/use-admin-files.ts, and client/src/features/admin/hooks/use-admin-monitoring.ts

**Checkpoint**: Critical workflows remain complete with keyboard-only input across target viewports and every asynchronous state communicates a recovery path where possible.

---

## Phase 9: User Story 7 - Run and Maintain the Completed Product Reliably (Priority: P3)

**Goal**: Provide reproducible local/container operation, risk-based regression evidence, measured query performance, secret-safe configuration, and accurate handoff documentation.

**Independent Test**: From a clean checkout and non-secret example configuration, migrate and start locally and through Compose, run all quality gates and both builds, inspect images/configuration for secrets, and follow the README without undocumented steps.

### Tests for User Story 7

- [X] T077 [P] [US7] Extend authentication regression coverage for registration, login validation, verification expiry/invalidity, refresh behavior, unauthenticated rejection, and every required successful-authentication audit attempt including sanitized metadata and fail-open audit-write failure in server/tests/contract/auth-regression.contract.test.ts
- [X] T078 [P] [US7] Extend file/folder security regression coverage for upload validation, ownership, path safety, preview/download, mutation rules, permanent cleanup without Trash behavior, and centralized sanitized fail-open audit attempts for every successful upload, download, file/folder deletion, and folder mutation in server/tests/security/file-folder-regression.security.test.ts
- [X] T079 [P] [US7] Add configuration parity and secret-classification tests across examples, validators, Compose, and public client exposure in tests/security/configuration-contract.test.ts
- [X] T080 [P] [US7] Add scale fixtures and performance assertions for 1,000 users, 10,000 files, deterministic admin pages, statistics, and audit queries in server/tests/integration/admin-performance.integration.test.ts
- [X] T081 [P] [US7] Add clean migration/bootstrap/restart and persistent-data container smoke coverage in tests/integration/container-smoke.test.ts

### Implementation for User Story 7

- [X] T082 [P] [US7] Create pinned Node 24 pnpm multi-stage server and client images in ./Dockerfile.server and ./Dockerfile.client
- [X] T083 [P] [US7] Exclude secrets, local environments, dependencies, test artifacts, and unnecessary repository context in ./.dockerignore
- [X] T084 [US7] Define healthy PostgreSQL, one-shot migration, Express, and Next.js services with runtime-only configuration and persistent database data in ./compose.yaml
- [X] T085 [US7] Synchronize all existing configuration keys, safe placeholders, classifications, and startup validation across server/.env.example, client/.env.example, server/src/config/env.ts, client/src/lib/config/server-env.ts, and client/src/lib/config/public-env.ts
- [X] T086 [US7] Add measured seed/query-plan tooling and document evidence-driven index decisions in server/prisma/seed-admin-performance.ts and specs/003-administration-final-quality/performance.md
- [X] T087 [US7] Add reproducible critical-suite triple-run and full quality-gate scripts in package.json and scripts/verify-phase-3.mjs
- [X] T088 [US7] Rewrite README setup, architecture, configuration, migration, administrator initialization, local/container, testing, storage, deployment, permanent-deletion, and no-Trash guidance in README.md
- [X] T089 [US7] Complete or repair centralized sanitized fail-open audit emission revealed by T015, T016, T032, T077, and T078 for successful authentication, file/folder operations, administrator user role change, permanent user deletion, and permanent administrator file deletion while preserving zero audit writes for all administrator reads in server/src/modules/audit/admin-audit.ts, server/src/modules/audit/auth-audit.ts, server/src/modules/audit/file-audit.ts, server/src/modules/audit/audit.types.ts, server/src/modules/auth/registration.service.ts, server/src/modules/auth/verification.service.ts, server/src/modules/auth/login.service.ts, server/src/modules/auth/logout.service.ts, server/src/modules/users/admin-bootstrap.service.ts, server/src/modules/users/admin-user.service.ts, server/src/modules/users/admin-user-deletion.service.ts, server/src/modules/files/services/upload-file.service.ts, server/src/modules/files/services/get-file-content.service.ts, server/src/modules/files/services/move-file.service.ts, server/src/modules/files/services/delete-file.service.ts, server/src/modules/folders/services/manage-folders.service.ts, and server/src/modules/folders/services/delete-folder.service.ts

**Checkpoint**: A maintainer can reproduce the complete product and its evidence without embedded secrets or undocumented required steps.

---

## Phase 10: Polish & Cross-Cutting Completion

**Purpose**: Verify the complete Phase 3 system against constitutional and measurable completion gates.

- [X] T090 [P] Run the intent-comment audit and add accurate purpose comments above every changed project-authored function, method, arrow assignment, and callback in scripts/intent-comment-audit.mjs and all changed client/src/ and server/src/ files
- [X] T091 [P] Audit admin responses, audit metadata, operational logs, test output, and reports for passwords, tokens, codes, storage keys, private content, and connection strings in tests/security/secret-redaction.test.ts and tests/security/prohibited-patterns.ts
- [X] T092 Validate query plans and interaction timing and record evidence plus advisory index candidates in specs/003-administration-final-quality/performance.md; do not change server/prisma/schema.prisma, database-schema.mmd, or any migration unless the exact index proposal first receives explicit maintainer approval and synchronized artifact updates, and use a new migration rather than editing server/prisma/migrations/003_administration_final_quality/migration.sql after application
- [X] T093 Run lint, strict typecheck, unit, contract, component, integration, security, Playwright, migration, and production-build gates and record commands/results in specs/003-administration-final-quality/verification.md
- [X] T094 Run the documented critical-behavior suite three consecutive times from clean databases and record flake-free evidence in specs/003-administration-final-quality/verification.md
- [X] T095 Execute every quickstart scenario, verify every entry in specs/003-administration-final-quality/async-workflows.md, and record SC-001 through SC-014 evidence, accepted risks, owners, and resolution conditions in specs/003-administration-final-quality/verification.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup and blocks all story implementation.
- **US1, US2, US3 (Phases 3-5)**: Start after Foundational; they are the P1 administration slices and can proceed in parallel after shared contracts/security are stable.
- **US4, US5, US6 (Phases 6-8)**: Start after Foundational and can proceed independently on the existing application; final US6 acceptance should be repeated after all desired feature surfaces exist.
- **US7 (Phase 9)**: Container and documentation work can start after Foundational, while its final regression/performance evidence depends on all stories included in the release.
- **Polish (Phase 10)**: Depends on every story selected for the release.

### User Story Dependency Graph

```text
Setup -> Foundational -> US1 (safe user administration)
                      -> US2 (global file administration)
                      -> US3 (statistics and audit visibility)
                      -> US4 (Fileora identity and footer)
                      -> US5 (persistent themes)
                      -> US6 (workflow quality)
                      -> US7 (operations and maintenance)

US1 + US2 feed post-mutation accuracy checks in US3.
US1 through US5 feed final cross-surface acceptance in US6.
US1 through US6 feed final release evidence in US7 and Polish.
```

### Within Each User Story

- Write the listed tests first and confirm that they fail for the missing behavior.
- Implement persistence/query behavior before services, services before controllers/routes, and server contracts before client consumers.
- Implement API/hooks before components and pages.
- Complete the independent test at the checkpoint before treating the story as deliverable.
- Do not automatically retry stale administrator mutations; require refreshed target state and confirmation.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001 establishes fixture conventions.
- T007, T010, and T011 can progress in parallel after their directly affected baseline files are understood.
- All test tasks marked `[P]` within a story target separate files and can be authored in parallel.
- After Phase 2, separate contributors can implement US1 through US7 concurrently, observing the final-evidence dependencies above.
- Contract/API, client fixture, branding scan, theme unit, and container image tasks marked `[P]` touch separate files.

---

## Parallel Examples

### User Story 1

```text
Task T013: Contract shapes and validation in server/tests/contract/admin-users.contract.test.ts
Task T014: Authorization and safeguard matrix in server/tests/security/admin-users.security.test.ts
Task T015: Query/concurrency/session behavior in server/tests/integration/admin-user-management.integration.test.ts
Task T016: Cleanup failure/retry behavior in server/tests/integration/admin-user-deletion.integration.test.ts
Task T017: Client behavior in client/tests/component/admin-users.test.tsx
```

### User Story 2

```text
Task T030: Admin file contracts in server/tests/contract/admin-files.contract.test.ts
Task T031: Metadata/content boundary in server/tests/security/admin-files.security.test.ts
Task T032: Query and cleanup behavior in server/tests/integration/admin-file-management.integration.test.ts
Task T033: Client file administration in client/tests/component/admin-files.test.tsx
```

### User Story 3

```text
Task T042: Monitoring contracts in server/tests/contract/admin-monitoring.contract.test.ts
Task T043: Exact statistics in server/tests/integration/admin-statistics.integration.test.ts
Task T044: Audit safety and authorization in server/tests/integration/admin-audit-history.integration.test.ts
Task T045: Monitoring UI in client/tests/component/admin-monitoring.test.tsx
```

### User Story 4

```text
Task T053: Branding regression scan in tests/security/user-facing-branding.test.ts
Task T054: Shared shell component coverage in client/tests/component/fileora-shell.test.tsx
Task T055: Brand/footer primitives in client/src/components/brand/fileora-brand.tsx and client/src/components/layout/app-footer.tsx
```

### User Story 5

```text
Task T060: Theme resolution unit tests in client/tests/unit/theme.test.ts
Task T061: Provider/control component tests in client/tests/component/theme-provider.test.tsx
Task T062: Browser theme journeys in tests/e2e/themes.spec.ts
```

### User Story 6

```text
Task T068: Dialog accessibility in client/tests/component/dialog-accessibility.test.tsx
Task T069: Async states in client/tests/component/async-workflow-states.test.tsx
Task T070: Responsive keyboard journeys in tests/e2e/final-experience.spec.ts
```

### User Story 7

```text
Task T077: Authentication regression in server/tests/contract/auth-regression.contract.test.ts
Task T078: File/folder security regression in server/tests/security/file-folder-regression.security.test.ts
Task T079: Configuration parity in tests/security/configuration-contract.test.ts
Task T080: Administrator performance in server/tests/integration/admin-performance.integration.test.ts
Task T081: Container smoke coverage in tests/integration/container-smoke.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 fixtures.
2. Complete the Phase 2 lifecycle, security, transaction, and contract foundation.
3. Complete Phase 3 safe user administration.
4. Stop and execute the US1 independent test, including cleanup failure/retry and stale concurrency.
5. Demo the administrator user directory, role change/session invalidation, and permanent deletion as the MVP.

### Incremental Delivery

1. Deliver Setup + Foundational as the stable Phase 3 base.
2. Deliver US1 safe user administration and validate independently.
3. Deliver US2 metadata-only global file administration and validate independently.
4. Deliver US3 statistics/audit visibility and validate exact post-mutation behavior.
5. Deliver US4 branding, US5 themes, and US6 workflow quality as separately verifiable experience increments.
6. Deliver US7 reproducible operations and documentation.
7. Complete Phase 10 evidence before declaring Phase 3 complete.

### Parallel Team Strategy

1. Collaborate on Setup and Foundational because they define shared contracts and authority boundaries.
2. After Foundational, assign separate owners to US1, US2, US3, and the US4-US6 experience stream.
3. Start US7 container scaffolding in parallel, but defer final docs and evidence until selected stories stabilize.
4. Re-run US3 post-mutation assertions, US6 cross-surface acceptance, and all Phase 10 gates after integration.

---

## Notes

- `[P]` means different files and no dependency on an incomplete task; unmarked tasks preserve required ordering or touch shared files.
- Story labels provide traceability to `spec.md`; Setup, Foundational, and Polish tasks intentionally have no story label.
- All administrator collection work is server-filtered, sorted, and paginated with stable `id` tie-breaking.
- Administrator authority never grants preview, download, signed-access, storage-key, or extracted-content access to another user's file.
- Successful primary operations attempt audit writes, but audit failure remains fail-open with sanitized operational logging.
- Authentication and file/folder regression coverage preserves constitution-mandated audit attempts; within administrator capabilities, only user role change, permanent user deletion, and permanent administrator file deletion are audited, and every administrator read must create zero audit events.
- Every asynchronous workflow listed in specs/003-administration-final-quality/async-workflows.md must have evidence for each applicable state; representative sampling is insufficient.
- Performance review may recommend indexes but must stop for explicit schema approval and synchronized artifacts before any index implementation or migration change.
- No task introduces user/file/folder Trash, restoration, a deletion-state field, a durable outbox, a second auth/query/storage system, or unapproved schema changes.
- Commit after each task or cohesive task group and stop at each checkpoint for independent verification.
