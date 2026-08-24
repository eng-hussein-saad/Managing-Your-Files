---

description: "Dependency-ordered implementation tasks for the Fileora UI redesign"
---

# Tasks: Fileora UI Redesign

**Input**: Design documents from `/specs/004-fileora-ui-redesign/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the feature specification. Write each story's automated tests before its implementation and confirm the new assertions fail for the intended reason.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested as an independently valuable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and does not depend on an incomplete task
- **[Story]**: Maps the task to a user story in `spec.md`
- Every task names the exact file or directory it changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Capture the pre-redesign baseline and prepare the acceptance harness before any legacy presentation is replaced.

- [ ] T001 Record the fixed-data, browser, viewport, cache, network, machine, readiness-event, repetition, and median calculation protocol in specs/004-fileora-ui-redesign/evidence/performance-protocol.md
- [ ] T002 Measure the legacy landing/sign-in, dashboard, files, details/preview, upload, and administrator journeys and record reproducible pre-redesign medians in specs/004-fileora-ui-redesign/evidence/performance-baseline.md
- [ ] T003 [P] Add development-only axe accessibility tooling and browser-project dependencies to package.json and pnpm-lock.yaml without adding application environment keys
- [ ] T004 Configure Chromium, Firefox, WebKit, branded Chrome/Edge, desktop viewport, and representative mobile projects while preserving the existing same-origin and unrelated-origin projects in playwright.config.ts
- [ ] T005 [P] Create the visual review, 320 px overflow, keyboard, console-error, and accessibility fixture helpers in tests/e2e/fixtures/ui-acceptance.ts
- [ ] T006 [P] Create versioned browser/device, visual review, deviation, performance, and usability evidence templates in specs/004-fileora-ui-redesign/evidence/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the approved semantic visual system, accessible overlays, and responsive shell required by every route family.

**⚠️ CRITICAL**: No user-story migration begins until this phase is complete.

### Tests for the shared foundation

- [ ] T007 [P] Add component assertions for token-backed button, field, card, pill, table, pagination, feedback, and 44 px target states in client/tests/component/design-system.test.tsx
- [ ] T008 [P] Extend focus containment, Escape/backdrop dismissal, scroll locking, background inertness, and focus restoration assertions for dialogs and drawers in client/tests/component/dialog-accessibility.test.tsx
- [ ] T009 [P] Extend desktop sidebar, 820 px off-canvas navigation, backdrop, close-after-navigation, active-route, storage-summary, profile, theme, sign-out, and admin-link assertions in client/tests/component/app-navigation.test.tsx
- [ ] T010 [P] Add light/dark/system token, live system-change, persistence, and reduced-motion assertions in client/tests/component/theme-provider.test.tsx

### Implementation for the shared foundation

- [ ] T011 Derive the approved OKLCH colors, typography, spacing, radii, shadows, sizes, 1100/820/560 px transitions, focus styles, and reduced-motion rules from specs/fileora-app.html into client/src/app/globals.css
- [ ] T012 [P] Implement typed Fileora icon primitives using inline SVG with accessible decorative/action semantics in client/src/components/ui/icons.tsx
- [ ] T013 [P] Implement token-backed button, icon-button, field, select, search, and form-layout primitives with labeled error/help states in client/src/components/ui/controls.tsx
- [ ] T014 [P] Implement card, metric, pill, avatar, skeleton, empty, error, and status primitives with non-color-only state cues in client/src/components/ui/surfaces.tsx
- [ ] T015 [P] Implement responsive table, local-scroll region, collection toolbar, view toggle, and pagination primitives in client/src/components/ui/data-display.tsx
- [ ] T016 Implement the shared dialog and drawer foundation with labeling, initial focus, containment, safe dismissal, inert background, scroll management, and focus restoration in client/src/components/overlays/overlay.tsx
- [ ] T017 Migrate permanent deletion, toast, error panel, page state, and form status onto the shared controls/surfaces/overlay language in client/src/components/confirmation/permanent-delete-dialog.tsx, client/src/components/toast/toast-provider.tsx, client/src/components/status/error-panel.tsx, client/src/components/status/page-state.tsx, and client/src/components/auth/form-status.tsx
- [ ] T018 [P] Update Fileora branding and approved tagline rendering for public and protected compositions in client/src/components/brand/fileora-brand.tsx
- [ ] T019 Implement the persistent 248 px desktop shell, sticky 72 px top bar, 276 px off-canvas compact navigation, role-aware links, storage summary, profile/theme/sign-out controls, and focus-safe resize behavior in client/src/components/navigation/app-navigation.tsx
- [ ] T020 Compose the authenticated-user and restricted-administrator shells without changing route or authorization boundaries in client/src/app/(protected)/layout.tsx and client/src/app/admin/layout.tsx

**Checkpoint**: Shared presentation patterns and shells are independently component-tested and ready for route-family migration.

---

## Phase 3: User Story 1 - Enter Fileora Through the Approved Experience (Priority: P1) 🎯 MVP Slice 1

**Goal**: Deliver the approved public and authentication experience while preserving registration, verification, session, access, and sign-out outcomes.

**Independent Test**: Starting signed out, compare landing, register, verify/resend, sign-in, expired/invalid session, unauthorized, forbidden, and sign-out states at 1440, 768, 390, and 320 px; complete each account journey and confirm unchanged outcomes.

### Tests for User Story 1

- [ ] T021 [P] [US1] Extend landing/auth semantic, validation, submitting, success, safe failure, verification, resend, and access-outcome coverage in client/tests/component/auth-accessibility.test.tsx and client/tests/component/registration-flow.test.tsx
- [ ] T022 [P] [US1] Add public/auth screenshot, responsive, keyboard, reduced-motion, session-failure, sign-out, and console-error journeys in tests/e2e/ui-public-auth.spec.ts

### Implementation for User Story 1

- [ ] T023 [P] [US1] Recompose the landing navigation, two-column hero/workspace visual, feature cards, approved Fileora branding, theme control, and stacked narrow layout in client/src/app/page.tsx
- [ ] T024 [US1] Implement the approved split story/form authentication shell and closest-equivalent access/error states in client/src/app/(auth)/layout.tsx and client/src/app/(auth)/error.tsx
- [ ] T025 [P] [US1] Migrate registration validation, submitting, success, safe error, and verification transition states without changing hooks or contracts in client/src/features/auth/components/register-form.tsx
- [ ] T026 [P] [US1] Migrate sign-in invalid/unverified/success/session-restoration states without exposing credential or token details in client/src/features/auth/components/sign-in-form.tsx
- [ ] T027 [P] [US1] Migrate eight-digit verification, replacement/resend, expiry, invalid, success, and safe-enumeration states in client/src/features/auth/components/verify-email-form.tsx and client/src/components/auth/verification-code-input.tsx
- [ ] T028 [US1] Integrate the redesigned forms and status outcomes into client/src/app/(auth)/register/page.tsx, client/src/app/(auth)/login/page.tsx, and client/src/app/(auth)/verify-email/page.tsx
- [ ] T029 [US1] Verify unchanged login/refresh/logout cookie isolation and renewal behavior by running client/tests/integration/login-gateway.test.ts, client/tests/integration/refresh-gateway.test.ts, client/tests/integration/logout-gateway.test.ts, and client/tests/integration/renewal-concurrency.test.ts and record results in specs/004-fileora-ui-redesign/evidence/regression-results.md

**Checkpoint**: Public and authentication entry journeys are functional, accessible, visually approved, and independently testable.

---

## Phase 4: User Story 2 - Manage Files in the Redesigned Workspace (Priority: P1) 🎯 MVP Slice 2

**Goal**: Deliver the responsive file/folder workspace, upload queue, details/preview, download, move, and permanent-deletion workflows without changing server-defined behavior.

**Independent Test**: With populated nested folders and files, complete list/grid browsing, search/filter/sort/page, upload partial failure/retry, all preview outcomes, download, move, and cancel/confirm permanent deletion at desktop, tablet, mobile, and 320 px widths.

### Tests for User Story 2

- [ ] T030 [P] [US2] Extend list/grid, breadcrumbs, server-query controls, pagination, empty/no-results, long-content, and ownership assertions in client/tests/component/file-discovery.test.tsx and client/tests/component/folder-management.test.tsx
- [ ] T031 [P] [US2] Extend picker/drop, authoritative validation, queued/uploading/success/failed/invalid/retry, partial-batch, and session-expiry assertions in client/tests/component/file-upload.test.tsx
- [ ] T032 [P] [US2] Extend details, extracted text, supported/unsupported/loading/failure/denied preview, download, move, and permanent-delete assertions in client/tests/component/file-preview.test.tsx and client/tests/component/permanent-deletion.test.tsx
- [ ] T033 [P] [US2] Add responsive workspace, overlay resize/orientation, keyboard, screenshot, 320 px overflow, and console-error journeys in tests/e2e/ui-file-workspace.spec.ts

### Implementation for User Story 2

- [ ] T034 [P] [US2] Rebuild breadcrumbs and folder browser with approved responsive hierarchy, long-name handling, and unchanged nesting/navigation semantics in client/src/features/folders/components/breadcrumbs.tsx and client/src/features/folders/components/folder-browser.tsx
- [ ] T035 [P] [US2] Rebuild search, filter, sort, and collection presentation controls while retaining server-driven query values in client/src/features/files/components/file-query-toolbar.tsx
- [ ] T036 [P] [US2] Rebuild responsive list/grid file and folder collection items with required metadata and actions in client/src/features/files/components/file-collection.tsx
- [ ] T037 [P] [US2] Rebuild accessible server-pagination controls and narrow-width behavior in client/src/features/files/components/file-pagination.tsx
- [ ] T038 [US2] Compose the approved folder-panel-plus-collection workspace, page actions, empty/no-results states, and local-scroll regions in client/src/app/(protected)/files/page.tsx
- [ ] T039 [P] [US2] Rebuild the dropzone and queue with per-file non-color-only queued/uploading/success/failed/invalid/retry states and partial-batch feedback in client/src/features/files/components/upload-dropzone.tsx and client/src/features/files/components/upload-queue.tsx
- [ ] T040 [US2] Preserve queue progress, retry, validation, and active-queue revisit behavior while adapting it to the redesigned upload presentation in client/src/features/files/upload/use-upload-queue.ts
- [ ] T041 [P] [US2] Rebuild the responsive details drawer with safe metadata, extracted content, authorized actions, and narrow-screen layout in client/src/features/files/components/file-details.tsx
- [ ] T042 [P] [US2] Rebuild supported image/document/text preview plus unsupported/loading/failure/denied states and download presentation in client/src/features/files/components/file-preview.tsx and client/src/features/files/components/file-download.tsx
- [ ] T043 [US2] Migrate create/rename/delete folder and move-file workflows onto shared dialogs while preserving fixed-parent, depth, naming, uniqueness, ownership, empty-folder, and irreversible-deletion rules in client/src/features/folders/components/folder-dialogs.tsx and client/src/features/folders/components/file-move-dialog.tsx

**Checkpoint**: The primary file-management journey is complete and independently testable without dashboard or administrator migration.

---

## Phase 5: User Story 3 - Understand My Archive at a Glance (Priority: P2)

**Goal**: Present accurate dashboard statistics, chart text equivalents, and safe profile information in approved responsive compositions.

**Independent Test**: Load dashboard and profile with populated, zero, loading, and error data at 1440, 768, 390, and 320 px in light and dark themes and verify every value retains its established meaning.

### Tests for User Story 3

- [ ] T044 [P] [US3] Extend exact file-count/byte-string, zero/loading/error, local-time, chart-text-equivalent, and responsive assertions in client/tests/component/file-dashboard.test.tsx
- [ ] T045 [P] [US3] Add dashboard/profile screenshot, theme, keyboard, long-identity, 320 px overflow, and console-error journeys in tests/e2e/ui-dashboard-profile.spec.ts

### Implementation for User Story 3

- [ ] T046 [P] [US3] Rebuild file totals, storage usage, file-type distribution, upload history, zero/loading/error states, and accessible chart equivalents in client/src/features/dashboard/components/file-statistics.tsx
- [ ] T047 [US3] Compose the approved page header, metric grid, activity, and storage/type summaries with tablet/mobile rearrangement in client/src/app/(protected)/dashboard/page.tsx
- [ ] T048 [P] [US3] Rebuild the profile identity/account card with safe name, email, role, and verification data only in client/src/app/(protected)/profile/page.tsx
- [ ] T049 [US3] Verify statistics and profile API/query outcomes remain unchanged by running tests/e2e/file-statistics.spec.ts and tests/e2e/sign-in-profile.spec.ts and append results to specs/004-fileora-ui-redesign/evidence/regression-results.md

**Checkpoint**: Dashboard and profile work independently with accurate, accessible data in every supported theme and layout.

---

## Phase 6: User Story 4 - Administer Fileora in a Clearly Restricted Workspace (Priority: P2)

**Goal**: Deliver clearly restricted, metadata-only administrator dashboard, user, global-file, and audit surfaces while preserving every server-enforced rule.

**Independent Test**: As an administrator, exercise statistics, users, global files, and audit workflows at all checkpoint widths; repeat routes/actions as a normal user and confirm denial plus the absence of file-content affordances.

### Tests for User Story 4

- [ ] T050 [P] [US4] Extend restricted dashboard, zero/loading/error statistics, recent activity, and safe aggregate assertions in client/tests/component/admin-monitoring.test.tsx
- [ ] T051 [P] [US4] Extend responsive user-table, role, exact deletion, self/final-admin, session, cascade, and audit assertions in client/tests/component/admin-users.test.tsx
- [ ] T052 [P] [US4] Extend safe owner-metadata, search/filter/page, permanent-delete, and no preview/download/content assertions in client/tests/component/admin-files.test.tsx
- [ ] T053 [P] [US4] Add administrator screenshots, narrow-table behavior, keyboard, authorization denial, 320 px overflow, and console-error journeys in tests/e2e/ui-admin-workspace.spec.ts

### Implementation for User Story 4

- [ ] T054 [P] [US4] Rebuild restricted administrator metrics, recent uploads, file-type summaries, and populated/zero/loading/error states in client/src/features/admin/components/admin-dashboard.tsx
- [ ] T055 [P] [US4] Rebuild the user directory toolbar/table/pagination and narrow-screen condensation with safe metadata in client/src/features/admin/components/admin-user-directory.tsx
- [ ] T056 [US4] Migrate role-change and exact permanent-user-deletion confirmations while preserving version, self/final-admin, session, cascade, and audit outcomes in client/src/features/admin/components/admin-user-actions.tsx
- [ ] T057 [P] [US4] Rebuild the global file metadata directory with safe owner data, filters, pagination, local scrolling, and no content affordance in client/src/features/admin/components/admin-file-directory.tsx
- [ ] T058 [US4] Migrate exact permanent administrator-file deletion while preserving storage cleanup and audit outcomes in client/src/features/admin/components/admin-file-actions.tsx
- [ ] T059 [P] [US4] Rebuild safe filterable/paginated audit history with deleted-actor/system, loading/empty/error, and sanitized metadata states in client/src/features/admin/components/admin-audit-history.tsx

**Checkpoint**: Authorized administrators retain all existing operations; normal users remain server-denied and administrators gain no file-content access.

---

## Phase 7: User Story 5 - Use Fileora Accessibly in Any Supported Theme (Priority: P2)

**Goal**: Prove that every redesigned route is operable with keyboard/touch, light/dark/system themes, reduced motion, zoom, responsive layouts, and complete async feedback.

**Independent Test**: Traverse all major public, user, and administrator surfaces by keyboard at 200% zoom in light, dark, and system modes, toggle device color preference live, enable reduced motion, and repeat at every checkpoint width.

### Tests for User Story 5

- [ ] T060 [P] [US5] Add axe scans with zero critical violations for landing, authentication, dashboard, files, profile, and administrator route families in tests/e2e/ui-accessibility.spec.ts
- [ ] T061 [P] [US5] Add keyboard-only, 200% zoom, reduced-motion, live system-theme, touch-target, and overlay focus journeys in tests/e2e/ui-inclusive-interactions.spec.ts
- [ ] T062 [P] [US5] Extend loading, empty, validation, submitting/disabled, success, failure, retry, toast, confirmation, and bounded-announcement assertions in client/tests/component/async-workflow-states.test.tsx and client/tests/component/toast-provider.test.tsx

### Implementation for User Story 5

- [ ] T063 [US5] Resolve route-family axe, semantic structure, associated label, accessible name, focus order, contrast, and 44 px target failures in client/src/components/ui/
- [ ] T064 [US5] Ensure light/dark/system persistence, live system preference changes, pre-hydration theme application, and theme-selector accessibility across public and protected routes in client/src/providers/theme-provider.tsx, client/src/components/theme/theme-script.tsx, and client/src/components/theme/theme-selector.tsx
- [ ] T065 [US5] Ensure Framer Motion and CSS transitions communicate state without blocking interaction and honor reduced motion in client/src/app/globals.css
- [ ] T066 [US5] Resolve 320 px overflow, long-content, 200% zoom, orientation-change, local-scroll, and clipped-action failures across route layouts in client/src/app/
- [ ] T067 [US5] Normalize accessible async and overlay feedback across redesigned feature components in client/src/features/

**Checkpoint**: Every major route family passes automated accessibility and manual keyboard/theme/motion/responsive acceptance.

---

## Phase 8: User Story 6 - Experience One Coherent Fileora Product (Priority: P3)

**Goal**: Remove obsolete visual-system remnants only after all corresponding behavior is covered by the approved system and regression evidence.

**Independent Test**: Visit every in-scope route and transient state and confirm consistent approved patterns, retained prototype-omitted capabilities, current Fileora branding, and no accessible legacy fallback.

### Tests for User Story 6

- [ ] T068 [P] [US6] Expand route-wide obsolete-branding, mixed-token, legacy-class, duplicate-pattern, and user-accessible fallback checks in tests/security/user-facing-branding.test.ts and tests/security/prohibited-patterns.ts
- [ ] T069 [P] [US6] Add a complete public/user/admin route-and-state coherence journey with approved branding assertions in tests/e2e/ui-coherence.spec.ts

### Implementation for User Story 6

- [ ] T070 [US6] Inventory each legacy component, class, token, asset, utility, import, and unique behavior before removal in specs/004-fileora-ui-redesign/evidence/legacy-migration-inventory.md
- [ ] T071 [US6] Replace remaining page-specific legacy controls and surfaces with shared approved patterns across client/src/app/
- [ ] T072 [US6] Replace remaining duplicated or legacy feature presentation with shared approved patterns across client/src/features/
- [ ] T073 [US6] Remove only inventory entries proven to have no remaining consumer or unique behavior, and record the proof and affected paths in specs/004-fileora-ui-redesign/evidence/legacy-migration-inventory.md

**Checkpoint**: No user-accessible surface mixes obsolete and approved visual systems.

---

## Phase 9: Polish & Cross-Cutting Acceptance

**Purpose**: Complete the human, browser/device, performance, regression, operational, and governance evidence required for Phase 4 acceptance.

- [ ] T074 [P] Run lint, typecheck, unit/component, integration, security, intent-comment, build, Phase 3, and critical-triple gates and record commands and results in specs/004-fileora-ui-redesign/evidence/regression-results.md
- [ ] T075 [P] Capture side-by-side light/dark evidence for every route family at 1440, 768, and 390 px plus 320 px overflow/action evidence in specs/004-fileora-ui-redesign/evidence/visual-review.md
- [ ] T076 Resolve every material difference or record its surface/state, reference expectation, implementation difference, rationale, impacts, dated maintainer decision, and evidence in specs/004-fileora-ui-redesign/evidence/deviations.md
- [ ] T077 Run the exact latest-two Chrome/Edge/Firefox/Safari and current iOS Safari/Android Chrome visual, responsive, functional, keyboard/touch, and critical-journey matrix and record version, OS/device, viewport, theme, tester, evidence, and pass/fail/blocked result in specs/004-fileora-ui-redesign/evidence/browser-device-matrix.md
- [ ] T078 Conduct the 10-participant desktop/mobile usability study for sign-in, locate-file, upload, inspect-file, and initiate/cancel-destructive-action and record first-attempt assistance-free outcomes in specs/004-fileora-ui-redesign/evidence/usability-study.md
- [ ] T079 Compare redesigned repeated-run medians with the T002 baseline, investigate any regression above 10%, and record metrics and disposition in specs/004-fileora-ui-redesign/evidence/performance-results.md
- [ ] T080 [P] Verify API, BFF session, schema, storage, audit, environment-key, security, and database-schema invariants remain unchanged and record the comparison in specs/004-fileora-ui-redesign/evidence/invariants-review.md
- [ ] T081 Review redesign-affected setup, Docker, migration, production configuration, security, reliability, and performance instructions and update only inaccurate guidance in README.md
- [ ] T082 Run the documented clean-environment container start and public/authentication, normal-user file-management, and administrator smoke journeys, then record schema/configuration parity and results in specs/004-fileora-ui-redesign/evidence/clean-environment-smoke.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately; T001 precedes T002, T003 precedes T004, and T005 depends on T004's final project names.
- **Foundational (Phase 2)**: Depends on Setup; T007-T010 are written before T011-T020, T016 precedes T017, and T011-T019 precede T020.
- **US1 and US2 (Phases 3-4, P1)**: Depend on the shared foundation and can proceed in parallel with separate owners.
- **US3, US4, and US5 (Phases 5-7, P2)**: Depend on the foundation; US3 and US4 can run alongside each other after their consumed P1 surfaces are stable. US5's final route-wide remediation follows US1-US4.
- **US6 (Phase 8, P3)**: Depends on all migrated route families and accessibility/theme remediation so legacy artifacts are removed safely.
- **Polish (Phase 9)**: Depends on all stories selected for release; T076 follows T075, T079 follows T002 and completed migrations, and T082 follows T081.

### User Story Dependencies

- **US1 (P1)**: Foundation only; independently delivers public/authentication entry.
- **US2 (P1)**: Foundation only; independently delivers core file management.
- **US3 (P2)**: Foundation only; consumes the authenticated shell but not US1 or US2 implementation.
- **US4 (P2)**: Foundation only; independently preserves the restricted administrator workspace.
- **US5 (P2)**: Foundation for its tests; complete cross-route remediation requires US1-US4.
- **US6 (P3)**: Requires US1-US5 so removal proof covers every migrated behavior and state.

### Within Each User Story

- Add tests first and confirm they fail because the approved presentation or state is not yet implemented.
- Implement shared/model-free presentation primitives before route composition.
- Preserve existing API clients, React Query keys, contracts, and server outcomes during composition.
- Complete component and E2E checks before declaring the story checkpoint complete.
- Add or update a short intent comment immediately above every changed project-authored function, method, arrow function, and inline callback.

## Parallel Opportunities

- T003, T005, and T006 can run concurrently after T001 begins; T007-T010 can run concurrently.
- Foundation primitives T012-T015 and branding T018 target separate files and can run concurrently after tokens are defined.
- US1 and US2 can be staffed in parallel after Phase 2.
- US3 and US4 can be staffed in parallel; their tests and implementation components also target separate files.
- Within each story, tasks marked [P] operate on distinct components or test files and can be launched together after prerequisite tests are defined.
- T074, T075, and T080 can run concurrently after all story checkpoints; the exact-device study and participant study can be coordinated independently.

## Parallel Examples

### User Story 1

```text
Task T023: Recompose client/src/app/page.tsx
Task T025: Migrate client/src/features/auth/components/register-form.tsx
Task T026: Migrate client/src/features/auth/components/sign-in-form.tsx
Task T027: Migrate client/src/features/auth/components/verify-email-form.tsx
```

### User Story 2

```text
Task T034: Rebuild breadcrumbs/folder browser
Task T035: Rebuild file query toolbar
Task T036: Rebuild file collection
Task T037: Rebuild file pagination
Task T039: Rebuild upload presentation
Task T041: Rebuild details drawer
Task T042: Rebuild preview/download presentation
```

### User Story 3

```text
Task T044: Extend dashboard component tests
Task T045: Add dashboard/profile E2E acceptance
Task T046: Rebuild file-statistics presentation
Task T048: Rebuild profile presentation
```

### User Story 4

```text
Task T054: Rebuild administrator dashboard
Task T055: Rebuild user directory
Task T057: Rebuild global file directory
Task T059: Rebuild audit history
```

### User Story 5

```text
Task T060: Add route-family axe scans
Task T061: Add inclusive-interaction journeys
Task T062: Extend async workflow tests
```

### User Story 6

```text
Task T068: Add obsolete-pattern security checks
Task T069: Add route-wide coherence journey
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1 for a redesigned public/authentication entry slice.
3. Complete US2 for the primary file-management product slice.
4. Stop and validate both P1 stories independently before adding P2 surfaces.

### Incremental Delivery

1. Setup + Foundation → approved shared system and acceptance harness.
2. US1 → public/authentication slice.
3. US2 → core file-management slice.
4. US3 → dashboard/profile understanding.
5. US4 → restricted administrator workspace.
6. US5 → cross-route accessibility, theme, state, motion, and responsive proof.
7. US6 → safe legacy removal and one coherent product.
8. Polish → exact browser/device, usability, performance, governance, and clean-start acceptance.

## Notes

- `[P]` means separate files and no dependency on another incomplete task.
- No task may add or change an API, schema, migration, storage/auth behavior, or application environment key; discovery of such a need stops implementation and returns to specification/change control.
- Presentation tests may change structure-specific expectations but must retain behavioral and security outcomes.
- WebKit/emulation supplements but never substitutes for exact Safari, iOS Safari, or Android Chrome evidence.
- A missing browser/device environment is recorded as `blocked`, never `pass`.
- Legacy presentation is removed only after its behavior, state, and test obligation have migrated.
