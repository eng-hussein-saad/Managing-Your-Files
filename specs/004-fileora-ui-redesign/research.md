# Phase 0 Research: Fileora UI Redesign

## Decision 1: Preserve the application architecture and migrate presentation in slices

**Decision**: Keep the Next.js App Router route structure, feature components, React Query hooks,
Axios clients, first-party authentication gateway, Express APIs, shared Zod contracts, and providers.
Extract the design foundation first, then migrate public/authentication, user, file-management, and
administrator route families component-by-component.

**Rationale**: The repository already separates orchestration, async state, contracts, and server
authority under `client/src/app`, `client/src/features`, `client/src/lib`, `client/src/providers`,
`packages/contracts`, and `server/src`. A presentation-only migration can therefore replace visual
composition without duplicating business behavior. Incremental route-family migration allows each
slice to retain behavioral and security evidence before obsolete presentation code is removed.

**Alternatives considered**:

- Port the prototype's inline JavaScript and state: rejected because it would create parallel domain
  behavior and bypass React Query, shared contracts, and server authority.
- Rewrite the client in one step: rejected because it makes behavioral equivalence and safe legacy
  removal difficult to prove.
- Change APIs to better fit the prototype markup: rejected because existing contracts already expose
  all required data and Phase 4 forbids backend redesign for presentation convenience.

## Decision 2: Extract a semantic design system from the approved prototype

**Decision**: Translate `specs/fileora-app.html` into semantic theme tokens and reusable typed React
primitives for branding, typography, buttons, icon actions, fields, cards, pills, navigation, tables,
pagination, charts, feedback, skeletons, empty/error states, dialogs, and drawers. Use the approved
OKLCH light/dark palette, system/display/monospace typography roles, 14 px cards, 10 px controls,
44 px minimum interactive targets, persistent desktop sidebar, sticky top bar, and restricted-admin
cues. Reuse small typed inline SVG icons instead of adding a general icon or component framework.

**Rationale**: The prototype demonstrates a coherent product system, but its concatenated HTML and
imperative JavaScript are a design reference rather than production architecture. Semantic tokens
make the approved palette and spacing traceable across light/dark modes, while shared primitives meet
the constitution's reuse requirement and prevent page-specific copies.

**Alternatives considered**:

- Copy prototype markup/styles into each page: rejected because it would create drift and duplicated
  interaction logic.
- Introduce a full UI framework: rejected because the approved system is specific, the existing stack
  can express it, and a framework would add scope, bundle, and visual-override cost.
- Retain the current beige/gold horizontal-navigation system: rejected because it materially conflicts
  with the blue/neutral sidebar-led approved reference.

## Decision 3: Follow the prototype's responsive transitions

**Decision**: Implement the reference transitions at 1100, 820, and 560 CSS px, then validate at the
normative review widths 1440, 768, 390, and 320 px plus intermediate widths and orientation changes.
At or below 820 px, replace the persistent sidebar with a 276 px off-canvas drawer and backdrop,
collapse workspace/dashboard/profile compositions as shown, and condense file/admin tables without
removing the only access to required information or actions. At or below 560 px, hide/relocate global
search and stack page actions, metrics, and detail rows as demonstrated. Intentionally wide data
regions may scroll locally; the page itself may not overflow horizontally.

**Rationale**: The approved prototype explicitly defines the composition changes. The current CSS uses
different 1000/760/420 px thresholds and cannot remain authoritative when it conflicts with the
reference. Acceptance widths are checkpoints, not substitute breakpoints.

**Alternatives considered**:

- Keep the existing breakpoints: rejected because they do not reproduce the approved behavior.
- Use generic framework breakpoints and scale the desktop UI: rejected because the design shows
  semantic rearrangement, hiding, stacking, and off-canvas behavior.

## Decision 4: Preserve all backend, data, security, and environment contracts

**Decision**: Freeze the Phase 1-3 public/internal APIs, response envelopes, Prisma schema, migrations,
Supabase storage adapter, session model, audit model, and environment keys. Treat Phase 4's new
contract as a UI composition/state/accessibility layer over those existing interfaces. Any discovered
need for an API, schema, storage, authentication, or environment change returns to specification and
approval before implementation continues.

**Rationale**: Existing contracts expose the required safe user identity, file/folder collection and
detail data, preview/download outcomes, upload policy/progress results, user statistics, administrator
metadata/actions/statistics, and sanitized audit history. Express already enforces authentication,
ownership, role checks, destructive invariants, and server-driven collection behavior. The canonical
`database-schema.mmd` and Prisma schema contain the same six persisted entities: `User`,
`VerificationCode`, `RefreshToken`, `Folder`, `File`, and `AuditLog`. No presentation entity needs
persistence. Existing client/server example configuration already covers the complete runtime.

**Alternatives considered**:

- Persist view mode or theme server-side: rejected because existing browser-local presentation state
  is sufficient and a new data model is out of scope.
- Add environment-configured UI breakpoints or feature flags: rejected because these are approved
  presentation constants and FR-048 forbids new environment keys.
- Return prototype-shaped API payloads: rejected because the client can compose existing typed data.

## Decision 5: Harden overlays and accessibility beyond the prototype demonstration

**Decision**: Create one reusable accessible dialog/drawer foundation that supplies purpose labeling,
initial focus, focus containment, Escape and safe-backdrop dismissal, scroll management, background
inertness where supported, and focus restoration. Preserve native structure and labels, visible focus,
44 by 44 CSS-pixel standalone targets, non-color-only status, chart text/table equivalents, skip
navigation, logical DOM order, 200% zoom behavior, and reduced-motion styles. Use WCAG 2.2 Level AA
as the baseline: normal text reaches 4.5:1; large text and meaningful non-text UI graphics/boundaries
reach 3:1; inline text links and unmodified user-agent controls may use an applicable SC 2.5.8
exception only when its 24 CSS-pixel size-or-spacing rule passes. Add an axe-based Playwright
route-family audit as a development-only test dependency, require zero critical or serious violations,
and remediate or document reproducible false-positive evidence for every other A/AA finding.

**Rationale**: The prototype includes good visual cues, labels, reduced-motion CSS, and initial overlay
focus, but its imperative overlay does not consistently trap focus, mark the background inert, or
restore the opener. The existing `PermanentDeleteDialog` already demonstrates tested focus trapping
and restoration that can be generalized.

**Alternatives considered**:

- Port the prototype overlay behavior exactly: rejected because the prototype is not sufficient for
  FR-040/041 and keyboard acceptance.
- Build separate modal behavior per feature: rejected because it would duplicate subtle accessibility
  logic.
- Rely only on manual accessibility review: rejected because SC-005 also requires automated evidence.

## Decision 6: Expand visual and browser acceptance without mistaking emulation for proof

**Decision**: Add Playwright projects for Chromium, Firefox, and WebKit, plus branded Chrome/Edge
channels and representative desktop/mobile emulation where available. Use built-in screenshot
assertions for approved route-family states at 1440, 768, and 390 px in light and dark modes, and add
320 px overflow/action checks. Complete the normative latest-two Chrome/Edge/Firefox/Safari and
current iOS Safari/Android Chrome matrix using matching installed browsers or a real-device/browser
lab, and record versioned results. WebKit and device emulation are supplemental and never substitute
for the named real-browser acceptance.

**Rationale**: The current Playwright configuration has two Chromium projects distinguished by origin
only. That is useful for same-origin security coverage but does not meet FR-034A. Screenshot evidence
also makes comparison with the static approved reference repeatable, while maintainer review remains
the authority for material deviations.

**Alternatives considered**:

- Treat WebKit as proof of Safari/iOS Safari: rejected because engines/emulation do not fully reproduce
  named browser/device versions.
- Perform only manual visual review: rejected because it is difficult to repeat across route families
  and regressions.
- Add a repository-coupled cloud service requiring new product environment keys: rejected; acceptance
  infrastructure may be externally managed and must not change the application configuration contract.

## Decision 7: Establish a UI performance baseline before migration

**Decision**: Before replacing a critical route, measure navigation-to-ready and representative
interaction-to-settled timing for landing/sign-in, dashboard, files, details/preview, upload, and an
administrator journey under fixed data, browser, viewport, machine, cache, and network conditions.
Use the median of repeated runs, save the metric definitions and results, and require redesigned
medians to remain within 10%. Track build/bundle changes and console/runtime errors as supporting
signals, while retaining existing Phase 2/3 backend query evidence.

**Rationale**: Existing performance artifacts measure backend/database behavior, not SC-010's
user-perceived route and interaction readiness. A pre-redesign browser baseline cannot be reconstructed
reliably after the legacy presentation is removed.

**Alternatives considered**:

- Use existing server query timings as the UI baseline: rejected because they omit rendering and
  interaction cost.
- Use a single Lighthouse score: rejected because it is noisy and does not cover authenticated
  interactions; it may remain supplemental.
- Optimize broadly during redesign: rejected because unrelated performance work is out of scope.

## Decision 8: Use the existing layered regression suite and add Phase 4 evidence

**Decision**: Preserve all unit, contract, component, integration, security, end-to-end, build, and
intent-comment gates. Add focused component tests for new primitives/states; Playwright coverage for
approved layouts, keyboard overlays, themes, reduced motion, long content, async states, console
errors, and 320 px behavior; a documented deviation log; the exact browser/device matrix; and the
required 10-participant desktop/mobile usability record. Finish with the existing clean-environment
container smoke path and confirm README, Docker, migration, security, reliability, and performance
guidance remains accurate.

**Rationale**: The repository already has broad behavior and security protection across client,
server, and end-to-end tests. Phase 4 should extend it for presentation acceptance rather than weaken
or replace established outcome tests. Some success criteria—maintainer deviation approval, exact
browser versions, and participant usability—require recorded human evidence rather than synthetic
tests alone.

**Alternatives considered**:

- Update tests to match visual structure without preserving outcomes: rejected by FR-047.
- Claim usability or named-browser acceptance from automated tests alone: rejected because the
  measures explicitly require participants and exact environments.

## Resolved Unknowns

All technical-context unknowns are resolved. The plan introduces no database deviation, migration,
environment key, backend behavior, or unresolved constitutional gate.
