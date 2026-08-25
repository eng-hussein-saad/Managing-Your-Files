# Phase 4 Acceptance Evidence

**Evidence schema version**: 1.0.0  
**Feature**: `004-fileora-ui-redesign`  
**Status**: In progress

This directory contains the auditable evidence required by the UI acceptance contract. Evidence is
append-only once reviewed: replace a result only by adding a new dated run and marking the earlier
run superseded. Never store credentials, verification codes, tokens, storage keys, provider URLs,
private file content, or usable environment secrets.

## Required evidence index

| Artifact | Versioned record | Required contents |
|---|---|---|
| Surface/state coverage | `ui-surface-state-matrix.md` | Every contract surface and applicable state, light/dark review at 1440/768/390 px, and 320 px overflow/action result. |
| Visual review | `visual-review.md` | Side-by-side reference/application links, reviewer, timestamp, viewport, theme, fixture, result, and matrix IDs. |
| Deviations | `deviations.md` | Exact expectation/difference, impact, rationale, evidence, explicit dated maintainer decision, owner, and status. |
| Browser/device | `browser-device-matrix.md` | Exact browser version, OS/device, real/emulated classification, viewport, input, theme, tester, evidence, and result. |
| Accessibility | `accessibility-remediation-inventory.md` | Criterion, route/state, assertion, exact path, owner, remediation/false-positive evidence, and status. |
| Responsive | `responsive-remediation-inventory.md` | Viewport/orientation/zoom, route/state, assertion, exact path, owner, evidence, and status. |
| Async/overlays | `async-overlay-remediation-inventory.md` | Expected announcement/focus behavior, route/state, assertion, exact path, owner, evidence, and status. |
| Performance | `performance-protocol.md`, `performance-baseline.md`, `performance-results.md` | Controlled conditions, raw repetitions, medians, comparison, investigation, and disposition. |
| Usability | `usability-study.md` | Ten or more anonymized participants, desktop/mobile journeys, first-attempt assistance-free result, moderator, evidence, and summary. |
| Regression/operations | `regression-results.md`, `invariants-review.md`, `clean-environment-smoke.md` | Commands, revisions, configuration/schema parity, results, failures, owners, and rerun evidence. |
| Legacy migration | `legacy-migration-inventory.md` | Exact artifact, consumers, unique behavior, T071/T072 owner, replacement/removal proof, and final status. |

## Result vocabulary

- `PENDING`: not yet executed.
- `PASS`: executed in the exact required environment with linked evidence.
- `FAIL`: executed and an acceptance requirement did not pass.
- `BLOCKED`: exact environment, reviewer, participant, or dependency was unavailable; never counts as pass.
- `APPROVED DEVIATION`: a material difference has a linked, explicit, dated maintainer approval.
- `N/A`: the state cannot occur on the surface and the cell includes a rationale.

## Visual review record template

```markdown
## VR-YYYYMMDD-NNN
- Matrix IDs:
- Commit and worktree state:
- Reference revision:
- Route and fixture:
- Viewport / theme / effective scheme:
- Browser / OS / device:
- Application image:
- Reference image:
- Reviewer and timestamp:
- Result: PENDING | PASS | FAIL | APPROVED DEVIATION
- Notes / deviation ID:
```

## Browser/device record template

```markdown
| ID | Browser exact version | OS/device | Real or emulated | Viewport | Input | Theme | Journeys | Tester/date | Evidence | Result |
|---|---|---|---|---|---|---|---|---|---|---|
| BD-001 | | | | | | | | | | PENDING |
```

Record two current major desktop versions each of Chrome, Edge, Firefox, and Safari, plus current iOS
Safari and Android Chrome. WebKit and device emulation are supplemental rows, not substitutes.

## Deviation record template

```markdown
## DEV-NNN — Surface/state
- Reference expectation:
- Implementation difference:
- Rationale:
- Accessibility, responsive, behavioral, security, and maintenance impact:
- Evidence:
- Owner and resolution condition:
- Maintainer decision, name, and date:
- Status: PENDING | REJECTED | APPROVED DEVIATION | RESOLVED
```

## Performance comparison template

```markdown
| Metric | Baseline raw/median | Redesign raw/median | Change | <=10% | Console/runtime result | Investigation/evidence | Disposition |
|---|---|---|---:|---|---|---|---|
```

Every comparison records the protocol version, fixture checksum/counts, commit, browser, machine,
cache/network conditions, all raw repetitions, exclusions, and tester/timestamp.

## Usability record template

Use anonymized participant IDs only. Record desktop and mobile separately.

```markdown
| Participant | Context/device | Sign in | Locate file | Upload | Inspect file | Initiate/cancel delete | Every journey passed first attempt without assistance | Moderator/date | Evidence |
|---|---|---|---|---|---|---|---|---|---|
```

The acceptance summary reports participant count and how many participants completed every journey
without assistance on both layouts. A pass requires at least 10 participants and at least 9 complete
successes.

## Evidence storage convention

Store generated images and traces under a dated, immutable run directory such as
`evidence/runs/2026-08-25T001500Z/`. Link repository-relative paths from the records. External real-
device or study evidence may use a durable restricted-access link plus a non-sensitive checksum and
review summary in this directory.
