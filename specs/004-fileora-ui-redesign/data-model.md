# Phase 1 Data Model: Fileora UI Redesign

## Data-design boundary

Phase 4 creates no persisted data. The entities below are conceptual presentation and acceptance
models used to structure implementation and verification. They are not Prisma models, API resources,
database tables, local-storage additions, or new server-side domain concepts.

## Canonical schema comparison

The proposed design was compared with `database-schema.mmd` as required by Constitution Principle IX.
The canonical diagram defines `USER`, `VERIFICATION_CODE`, `REFRESH_TOKEN`, `FOLDER`, `FILE`, and
`AUDIT_LOG`; `server/prisma/schema.prisma` represents the same six entities and relationships. Phase 4
adds or changes no field, type, key, nullability rule, enum, index, relationship, retention rule, or
migration. Therefore the design has **no difference** from the canonical database baseline and needs
no database-deviation approval.

Existing domain records remain governed by specifications 001-003 and are only rendered differently.

## Conceptual entities

### ApprovedDesignReference

Represents `specs/fileora-app.html` as the visual and responsive authority.

| Field | Meaning | Validation |
|---|---|---|
| `path` | Repository-relative source path | Exactly `specs/fileora-app.html` |
| `themes` | Approved appearance treatments | Light and dark; system resolves to one of them |
| `breakpoints` | Demonstrated responsive transitions | 1100, 820, and 560 CSS px |
| `acceptanceWidths` | Normative review checkpoints | 1440, 768, 390, and 320 CSS px |
| `surfaceFamilies` | Representative public/user/admin compositions | Must cover every in-scope route family |
| `approvalAuthority` | Who can accept a material deviation | Project maintainer only |

### DesignToken

A semantic reusable value derived from the approved reference.

| Field | Meaning | Validation |
|---|---|---|
| `name` | Stable semantic identifier | Describes role, not a page or literal color |
| `category` | Color, typography, spacing, radius, shadow, motion, or size | One approved category |
| `lightValue` | Light-mode representation | Must match the approved reference |
| `darkValue` | Dark-mode representation when applicable | Must remain legible and match the reference |
| `reducedMotionValue` | Motion-safe override when applicable | Must not hide or delay essential state |

Relationships: many `PresentationPattern` records consume many tokens. Tokens never contain secrets,
server values, or business rules.

### PresentationPattern

A reusable visual and interaction primitive or composition.

| Field | Meaning | Validation |
|---|---|---|
| `kind` | Button, field, card, pill, navigation, table, chart, collection, dialog, drawer, toast, skeleton, empty state, or error state | Must map to an approved or closest-equivalent pattern |
| `states` | Supported visible states | Include every applicable `InteractionState` |
| `responsiveVariants` | Composition by width range | Must follow the approved breakpoint behavior |
| `themeVariants` | Light and dark rendering | Both must remain legible and operable |
| `accessibilityContract` | WCAG 2.2 AA semantics, focus, labels, text equivalents, contrast, and target-size/spacing evidence | Must satisfy FR-040 through FR-042, including the project's 44 by 44 CSS-pixel standalone-target rule and documented SC 2.5.8 exceptions |
| `consumers` | Route surfaces that reuse the pattern | Repeated behavior must not be reimplemented per page |

### RouteSurface

An in-scope route family or transient surface that composes patterns and existing domain data.

| Field | Meaning | Validation |
|---|---|---|
| `routeFamily` | Landing, authentication, dashboard, files/folders, profile, admin dashboard, admin users, admin files, or audit history | Must match an existing route/outcome |
| `accessClass` | Public, authenticated user, or administrator | Server remains authoritative |
| `requiredPatterns` | Shared components used by the surface | Must use the approved system consistently |
| `requiredStates` | Async/access/validation/destructive states | No established state may be dropped |
| `domainInputs` | Existing typed API/query data | Must use unchanged shared contracts |
| `actions` | Existing callbacks/mutations | Must preserve authorization and outcome semantics |

Relationships: a route surface composes many presentation patterns and renders existing domain records.
It never owns authentication, authorization, filtering, ownership, deletion, upload, or audit rules.

### ResponsiveVariant

The approved composition for one width range.

| Field | Meaning | Validation |
|---|---|---|
| `range` | Desktop, compact desktop/tablet, tablet/mobile, or narrow mobile | Boundaries follow 1100/820/560 px transitions |
| `navigationMode` | Persistent sidebar or off-canvas drawer | Off-canvas mode requires backdrop, close control, focus management, and close-after-navigation |
| `layoutChanges` | Stack, reorder, condense, hide duplicate affordance, or local scroll | Cannot hide the only required value/action |
| `overflowPolicy` | Page reflow or intentionally scrollable region | Page-level horizontal overflow is invalid |
| `reviewWidths` | Widths exercising this range | Must include all 1440/768/390/320 checkpoints |

### InteractionState

A user-visible state for a route or pattern.

Allowed values are `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `empty`, `validating`,
`submitting`, `success`, `failure`, `retryable`, `unauthenticated`, `unauthorized`, `forbidden`, and
`confirmation-required`. Upload items additionally expose `queued`, `uploading`, `successful`,
`failed`, and `invalid` without relying on color alone.

State transitions:

```text
default -> validating -> submitting -> success
                             └-------> failure -> retryable -> submitting

closed -> open -> active -> closed
                  └-------> safe cancellation -> closed

queued -> uploading -> successful
                  └-> failed -> queued (retry)

authenticated -> expired/invalid -> unauthenticated outcome
authorized admin -> role/session change -> access re-evaluation -> allowed or forbidden
```

Destructive confirmation never adds an undo, trash, restore, or soft-delete transition.

### AcceptanceEvidence

A versioned record stored in feature documentation/test artifacts, not application persistence.

| Field | Meaning | Validation |
|---|---|---|
| `surface` | Route/state under review | Must identify the exact state |
| `viewport` | Width, height, orientation, and pixel ratio | Must cover required checkpoints |
| `theme` | Light, dark, or system | System evidence records the effective scheme change |
| `browser` | Product, exact version, OS/device | Must satisfy FR-034A |
| `result` | Pass, fail, or blocked | Missing environment cannot be recorded as pass |
| `artifact` | Screenshot, trace, log, timing, audit, or participant record | Must be reproducible or reviewable |
| `reviewer` | Automated suite, tester, participant facilitator, or maintainer | Must be identifiable in project records |

### DeviationRecord

Documents a material difference from the approved reference.

| Field | Meaning | Validation |
|---|---|---|
| `surfaceAndState` | Exact affected composition | Required |
| `referenceExpectation` | What the prototype demonstrates | Required |
| `implementedDifference` | Observable deviation | Required |
| `rationale` | Why exact reproduction is unsafe or infeasible | Required |
| `impact` | Responsive, theme, accessibility, functional, and browser effects | Required |
| `maintainerDecision` | Approved or rejected | Explicit decision required before acceptance |
| `decisionDate` | Date of maintainer decision | Required for an approved exception |

## Existing domain invariants

- Users, sessions, verification, files, folders, uploads, statistics, and audit records retain their
  current schemas and lifecycles.
- Theme and collection presentation remain client presentation state; no persisted server preference
  is introduced.
- Express remains authoritative for identity, ownership, role, validation, pagination, permanent
  deletion, audit behavior, and storage access.
- Administrator file surfaces render safe metadata only and never gain preview, download, or content.

