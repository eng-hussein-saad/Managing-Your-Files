# Phase 4 UI Performance Protocol

## Purpose

This protocol defines the reproducible browser measurements used for the pre-redesign baseline and
the post-redesign comparison. A result is comparable only when every controlled condition below is
the same. The acceptance threshold is a redesigned median no more than 10% slower than its legacy
median for each metric.

## Fixed environment

| Variable | Required value |
|---|---|
| Repository revision | Record the full commit SHA and whether the worktree is dirty. |
| Application mode | Production builds of the client and server, started with the documented example-derived configuration. |
| Database | PostgreSQL 17 with the deterministic fixture described below; record image/build version. |
| Storage and email | The same test providers and fixture objects for every run; record provider/emulator versions. |
| Browser | Playwright Chromium supplied with `@playwright/test` 1.55.1; record the executable version. |
| Viewport | 1440 by 900 CSS pixels, device scale factor 1, desktop pointer, reduced motion disabled. |
| Machine | Record OS build, CPU, logical-core count, total RAM, power mode, and whether the machine is virtualized. |
| Network | Local application and dependencies with no artificial throttling. Record unexpected background network activity. |
| Cache | Create a fresh browser context for each repetition. Run and discard one warm-up before the measured repetitions. |
| Concurrency | One browser worker and one measured journey at a time. Do not run builds, tests, indexing, or downloads concurrently. |

## Deterministic fixture

Use one verified normal user and one administrator. The normal user must own the same nested folder
tree, file metadata, previewable fixture, unsupported fixture, extracted-text fixture, and upload
policy for both baseline and comparison. The administrator must see the same users, files, audit
events, aggregates, and recent activity. Record fixture seed command, fixture revision or checksum,
account identifiers (never passwords or tokens), counts, and byte totals in the result file.

## Readiness and settled events

- **Navigation start**: immediately before `page.goto()` or the user action that initiates client
  navigation.
- **Route ready**: the route's primary landmark is visible; its loading/skeleton state is absent; the
  principal query has settled; and the browser has completed two animation frames.
- **Interaction start**: immediately before the measured click, keyboard action, drop, or drawer open.
- **Interaction settled**: the expected result or terminal state is visible, the relevant busy state
  is absent, and the browser has completed two animation frames.
- **Upload settled**: every selected queue item is in success, failed, or invalid state. Network
  transfer time remains part of the measurement.

Instrumentation must use `performance.now()` in the Playwright process around the documented
start/settled conditions. Do not substitute `networkidle` for application readiness.

## Journeys and metrics

| Journey | Start | Ready/settled condition |
|---|---|---|
| Landing | Cold-context navigation to `/` | Main landmark and both primary account actions visible. |
| Sign in | Navigation to `/login` | Sign-in heading and enabled credential form visible. |
| Dashboard | Authenticated navigation to `/dashboard` | Metrics and accessible statistics summary terminal state visible. |
| Files | Authenticated navigation to `/files` | Folder panel, collection toolbar, and terminal collection state visible. |
| Details/preview | Activate the fixed previewable file | Details surface visible and preview reaches supported, unsupported, denied, or failure terminal state as defined by the fixture. |
| Upload | Submit the fixed upload fixture batch | Every queue entry reaches a terminal state and aggregate feedback is visible. |
| Administrator | Administrator navigation to `/admin/users`, then request page 2 | User directory terminal state visible, followed by the requested page indicator and terminal table state. |

## Repetitions and calculation

1. Confirm health checks and fixture counts before the run.
2. Perform one unmeasured warm-up for each journey.
3. Run each journey seven times in a fresh browser context, in rotating journey order.
4. Record every raw duration in milliseconds plus console/runtime errors and unexpected requests.
5. Sort the seven durations numerically and use the fourth value as the median. Do not average.
6. Retain all valid repetitions. Mark a repetition invalid only for a documented environmental
   interruption; rerun it and preserve both the excluded value and reason.
7. Calculate regression as `((redesigned median - baseline median) / baseline median) * 100`.
8. Investigate and rerun the complete paired metric when regression exceeds 10%; do not discard a
   valid slow result selectively.

## Required result metadata

Each baseline and comparison record must include timestamp and timezone, commit/worktree state,
configuration source, fixture identity and counts, browser and machine details, raw repetitions,
median, exclusions, console/runtime errors, tester, and evidence paths. Secrets, credentials, access
tokens, refresh material, storage keys, and private file contents must never be recorded.
