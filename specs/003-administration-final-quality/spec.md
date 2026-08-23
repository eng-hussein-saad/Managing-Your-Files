# Feature Specification: Administration and Final Quality

**Feature Branch**: `main` (no branch-creation hook configured)

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Read IMPLEMENTATION_PLAN.md and create a specification for phase 3 ONLY. I confirm updating the schema to match the new design in phase 3."

## Clarifications

### Session 2026-08-23

- Q: May Phase 3 update the canonical database schema to remove the user soft-deletion field? → A: Yes. Update the schema to match the new Phase 3 design.
- Q: May administrators preview or download file contents owned by other users, or is global file administration limited to metadata and permanent deletion? → A: Administrators are limited to metadata and permanent deletion; they cannot preview or download another user's file contents.
- Q: When an administrator changes a user's role, how must that change affect the user's existing signed-in sessions? → A: Invalidate all existing sessions; the user must sign in again under the new role.
- Q: What should happen when two administrators concurrently change or delete the same user account? → A: The first valid operation succeeds; later stale operations receive a conflict and require refreshed confirmation.
- Q: After an audit event's actor account is permanently deleted, how should the actor appear in audit history? → A: Show "Deleted user" without retaining the actor's name or email snapshot.
- Q: If permanent user deletion removes some stored objects but then fails before cleanup finishes, what must happen on a later retry? → A: Allow an idempotent retry; securely absent objects count as cleaned, and remaining objects are removed before database deletion completes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administer Users Safely (Priority: P1)

An administrator finds users through a searchable, paginated directory, reviews relevant account information, changes eligible roles, and permanently deletes an account when required. Every sensitive action is enforced by the server, clearly confirmed, and protected against locking out the acting administrator or leaving user-owned data behind.

**Why this priority**: Secure user administration is the core Phase 3 capability, and permanent deletion crosses authentication, database, file-storage, and audit boundaries.

**Independent Test**: Sign in as an administrator, list and search users, change an eligible user's role, and permanently delete a seeded user with active sessions, folders, files, and stored objects; verify cleanup, audit attempts, and rejection of the same requests from a normal user.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator and enough users for multiple pages, **When** the administrator searches or changes page, **Then** the directory returns the correct deterministic subset and relevant metadata without exposing credentials, tokens, verification codes, or other secrets.
2. **Given** an eligible target user with one or more active sessions, **When** an administrator confirms a valid role change, **Then** every existing session is invalidated, the user must sign in again under the new role, and the operation attempts to record a safe audit event.
3. **Given** a target user with active refresh tokens, verification records, nested folders, files, and stored objects, **When** an administrator confirms permanent deletion, **Then** required stored objects and dependent records are removed, active sessions can no longer refresh, the user record is removed, and no recovery or restoration state is created.
4. **Given** required external file cleanup cannot be completed safely after some stored objects were removed, **When** permanent user deletion fails and is retried, **Then** the user is not reported as deleted after the failed attempt, securely absent objects count as cleaned, remaining objects are removed, and database deletion completes only after required cleanup succeeds.
5. **Given** an administrator targets their own account or role, or an action would leave the platform with no administrator, **When** the destructive change is submitted, **Then** the operation is rejected with a clear explanation.
6. **Given** an authenticated normal user, **When** they call any user-administration operation directly, **Then** access is denied without disclosing administrative data or changing state.
7. **Given** two administrators act on the same user from the same earlier account state, **When** the first valid role change or deletion succeeds and the second submits a stale operation, **Then** the second receives a conflict, no additional state changes, and must reload and confirm again against the current state.

---

### User Story 2 - Manage Files Across the Platform (Priority: P1)

An administrator can locate files owned by any user, see ownership and relevant metadata, and permanently delete a selected file when operational or policy needs require it.

**Why this priority**: Global file oversight is a primary administrator responsibility and must preserve the same storage consistency and security guarantees as owner-driven deletion.

**Independent Test**: Seed files for several owners and types, query them through combined search, filters, and pagination, inspect ownership metadata, permanently delete one file, and verify both stored content and its record are gone while a normal user is denied.

**Acceptance Scenarios**:

1. **Given** files owned by multiple users, **When** an administrator opens and queries the global file directory, **Then** matching files are returned in deterministic pages with owner identity, name, type, size, folder context, and upload date.
2. **Given** an administrator selects a file, **When** they confirm permanent deletion, **Then** the stored object and file record are removed, storage totals remain consistent, and a safe audit event is attempted.
3. **Given** required stored-object removal fails, **When** deletion is attempted, **Then** the file is not reported as permanently deleted, no unauthorized access is introduced, and the administrator receives a predictable non-sensitive error.
4. **Given** a normal user, **When** they call global file-administration operations directly, **Then** access is denied and no other user's metadata or content is disclosed.
5. **Given** an administrator viewing a file owned by another user, **When** they attempt to preview or download its contents through administrator capabilities, **Then** access is denied while metadata inspection and permanent deletion remain available.

---

### User Story 3 - Monitor Platform Activity (Priority: P1)

An administrator sees accurate platform totals and recent activity, and inspects accumulated audit history to understand important authentication, file, folder, role, and administrative operations.

**Why this priority**: Operational visibility makes the administrator capabilities accountable and enables the team to identify abnormal usage or cleanup failures.

**Independent Test**: Create known users, files, sizes, types, uploads, and audit events; verify dashboard figures and filtered audit results exactly match the eligible records and remain inaccessible to normal users.

**Acceptance Scenarios**:

1. **Given** a known platform data set, **When** an administrator opens the dashboard, **Then** total users, total files, current stored bytes, most-uploaded file types, and recent uploads match the current records and stored-file semantics.
2. **Given** accumulated audit events, **When** an administrator searches, filters, or paginates audit history, **Then** results show timestamp, actor when retained, action, entity type, target identifier, and safe useful metadata in deterministic order.
3. **Given** an audit event whose actor was later permanently deleted, **When** an administrator inspects history, **Then** the actor appears as "Deleted user," the event's action, target, and timestamp remain usable, and no actor name or email snapshot is retained.
4. **Given** a normal user, **When** they request statistics or audit history directly, **Then** access is denied and no operational information is disclosed.

---

### User Story 4 - Use a Consistent Fileora Experience (Priority: P2)

Users and administrators encounter Fileora branding, the tagline "Your files. Organized your way.", and a responsive footer across the application without confusing remnants of the former user-facing name.

**Why this priority**: A consistent identity and shell make the completed product coherent and trustworthy without risking unnecessary internal renames.

**Independent Test**: Review authentication, navigation, dashboards, metadata, empty states, and documentation at mobile, tablet, and desktop sizes and verify visible naming, tagline use, titles, and footer behavior.

**Acceptance Scenarios**:

1. **Given** any user-facing application surface, **When** it is displayed, **Then** visible product references use Fileora and no obvious Gold Era branding remains.
2. **Given** an authentication or application-shell page, **When** it is displayed at a supported viewport, **Then** the footer is readable, visually consistent, non-obstructive, and uses Fileora branding with the tagline where contextually appropriate.
3. **Given** internal identifiers that are not user-facing, **When** rebranding is completed, **Then** they remain unchanged unless a user-facing consistency requirement makes a change necessary.

---

### User Story 5 - Choose and Retain a Theme (Priority: P2)

A person can use light, dark, or system-derived appearance, and their browser preference persists across navigation and later visits. All important user and administrator surfaces remain readable and usable in each theme.

**Why this priority**: Phase 3 completes the application-wide theme requirement and must cover existing and new experiences without accessibility regressions.

**Independent Test**: Select each theme, reload and revisit the application, change the operating-system preference while using system mode, and inspect all named surfaces for readability and correct theme response.

**Acceptance Scenarios**:

1. **Given** a person selects light or dark mode, **When** they navigate or revisit in the same browser, **Then** the selected preference remains active without an incorrect-theme flash that impairs use.
2. **Given** system mode is selected, **When** the operating-system preference changes, **Then** the application follows it while retaining system as the saved selection.
3. **Given** any supported theme, **When** a person uses charts, dialogs, tables, forms, empty states, previews, administrator interfaces, or the footer, **Then** content, focus indicators, controls, and status meanings remain perceivable and operable.

---

### User Story 6 - Complete Workflows with Polished Feedback (Priority: P2)

Users and administrators can complete common workflows across mobile, tablet, and desktop with consistent navigation, formatting, loading, empty, error, success, and destructive-action states.

**Why this priority**: Phase 3 is the final application-quality pass, so existing capabilities must behave as one coherent product rather than isolated features.

**Independent Test**: Exercise representative authentication, file, folder, dashboard, and administrator journeys under slow, empty, successful, validation-failure, and service-failure conditions using keyboard-only interaction at common viewport sizes.

**Acceptance Scenarios**:

1. **Given** an asynchronous page or action, **When** it is loading, empty, successful, invalid, or failed, **Then** the person sees a consistent state that explains what happened and offers a useful next action where one exists.
2. **Given** a permanent file, folder, or user deletion, **When** it is initiated, **Then** a specific confirmation identifies the target and irreversible consequence before the action can proceed.
3. **Given** a keyboard user at a mobile, tablet, or desktop viewport, **When** they navigate forms, dialogs, tables, pagination, and menus, **Then** focus order, labels, controls, dismissal, and responsive layout permit task completion without pointer-only interaction.
4. **Given** dates, file sizes, pagination, or query state displayed in different user and administrator areas, **When** equivalent values or actions appear, **Then** their presentation and behavior are consistent.

---

### User Story 7 - Run and Maintain the Completed Product Reliably (Priority: P3)

A maintainer can set up, run, test, review, and troubleshoot the full application from complete documentation and a reproducible container-based workflow without placing secrets in images or changing the established architecture.

**Why this priority**: Reliable setup, regression evidence, security review, performance review, and accurate documentation are required to hand off the completed product safely.

**Independent Test**: Starting from documented non-secret example configuration, follow the local and container instructions, apply the approved schema change, build both applications, run the test suite, and compare observed behavior with the README.

**Acceptance Scenarios**:

1. **Given** a maintainer with the documented prerequisites and configuration values, **When** they follow the local or container workflow, **Then** all required services start without secrets being embedded in images or committed configuration.
2. **Given** the completed Phase 3 code, **When** automated checks run, **Then** critical authentication, authorization, ownership, permanent deletion, administrator, and file/folder behaviors are covered and consistently pass.
3. **Given** the completed application, **When** maintainers perform the documented security, reliability, and performance review, **Then** no known critical authorization or file-access issue remains and any optimization made addresses an identified important path.
4. **Given** the README, **When** a maintainer follows its setup, migration, administrator initialization, storage, testing, container, and deployment guidance, **Then** the instructions match the implemented product and explicitly describe permanent deletion and the absence of Trash or restore behavior.

### Edge Cases

- A permanent user deletion encounters one or more unavailable stored objects, a storage-provider timeout, or a database failure after partial cleanup; the retained user and remaining records permit an idempotent retry that accepts securely absent objects as already cleaned.
- An administrator attempts to delete or demote themselves, delete or demote the last remaining administrator, assign an unsupported role, or act on a user changed concurrently.
- A deleted user is the actor referenced by retained audit history; the history remains safe and understandable with no live user relationship required.
- A global file query combines search, owner, type, size, and date filters, requests an empty or out-of-range page, or encounters records changed between page requests.
- Statistics are computed when the platform has no users beyond required administration, no files, unknown or uncommon media types, or very large accumulated byte counts.
- Audit metadata contains fields that could reveal credentials, tokens, verification codes, storage keys, private content, or implementation details; those fields are never exposed.
- Saved theme preference is absent, invalid, unavailable, or conflicts with a changed system preference.
- Long filenames, user names, localized dates, large numbers, narrow viewports, reduced-motion settings, and keyboard-only navigation stress responsive layouts.
- A destructive request is submitted twice, times out after success, or targets an entity already removed; the result remains predictable and does not corrupt accounting.
- Container startup is attempted with missing or invalid configuration; startup fails clearly without printing secret values.

## Requirements *(mandatory)*

### Functional Requirements

#### User Lifecycle and Administration

- **FR-001**: The approved canonical data design, runtime user model, database table, migrations, fixtures, queries, contracts, tests, and documentation MUST remove the user soft-deletion field and any index or behavior that exists solely for it.
- **FR-002**: The application MUST NOT provide user soft deletion, deleted-user states, restoration, retention periods, scheduled deletion, or account recovery after administrator deletion.
- **FR-003**: Only authenticated administrators MUST be able to list, search, paginate, inspect, change roles for, or permanently delete users; all such authorization MUST be enforced before data is disclosed or changed.
- **FR-004**: User listings MUST support server-evaluated search and deterministic pagination and MUST expose only relevant non-sensitive account metadata.
- **FR-005**: Role changes MUST accept only supported role transitions, invalidate all existing sessions belonging to the changed user, require that user to sign in again under the new role, and reject changes to the acting administrator or changes that would leave no administrator.
- **FR-006**: Permanent user deletion MUST require an explicit confirmation that identifies the account and irreversible consequences.
- **FR-007**: Permanent user deletion MUST revoke or remove active refresh tokens, remove applicable verification records and dependent records, remove user-owned files and folders, remove associated stored objects, and finally remove the user record without creating recoverable user state.
- **FR-008**: Permanent user deletion MUST use ordering, atomic database changes, and reasonable compensation so that a reported success leaves no required user-owned database records or stored objects and a failure does not expose content or falsely report completion; after partial stored-object cleanup, the user and required database records MUST remain available for an idempotent retry that treats securely absent objects as cleaned and removes all remaining objects before database deletion completes.
- **FR-009**: The application MUST reject administrator self-deletion and any deletion that would leave the platform without an administrator; role-change and deletion safeguards MUST be evaluated atomically against current state, and a stale concurrent operation MUST return a conflict without changing state or being retried automatically.
- **FR-010**: Successful role changes and permanent user deletions MUST attempt to create sanitized audit events; failure to record an audit event MAY allow the primary operation to succeed but MUST produce sanitized operational evidence.

#### Global File Administration

- **FR-011**: Only authenticated administrators MUST be able to access global file listings, metadata inspection, statistics, or permanent file deletion; these administrator capabilities MUST NOT grant preview or download access to another user's file contents.
- **FR-012**: Global file listings MUST support server-evaluated search, useful filters, deterministic sorting, and pagination across all owners.
- **FR-013**: Each global file result MUST identify its owner and show relevant metadata including original name, type, size, folder context when present, and upload timestamp without exposing private content, content-access links, credentials, or storage access secrets.
- **FR-014**: Administrator file deletion MUST be explicitly permanent and require confirmation identifying the file, owner, and irreversible consequence.
- **FR-015**: Permanent administrator file deletion MUST reuse the established permanent cleanup semantics, remove the stored object and corresponding record, keep storage accounting consistent, and attempt a sanitized audit event.
- **FR-016**: If required permanent file cleanup cannot complete safely, the application MUST return a predictable non-sensitive error, MUST NOT report success, and MUST use reasonable compensation or sanitized operational logging for any partial result.
- **FR-017**: File and folder Trash, soft deletion, restoration, Empty Trash, retention, scheduled cleanup, and versioning MUST NOT be introduced in Phase 3.

#### Statistics and Audit Visibility

- **FR-018**: The administrator dashboard MUST show total current users, total current files, total bytes consumed by currently stored file objects, most-uploaded file types, and recent uploads.
- **FR-019**: Dashboard figures MUST use clearly defined current-record semantics and remain consistent after successful uploads and permanent deletions.
- **FR-020**: Audit history MUST be visible only to authenticated administrators and MUST support deterministic pagination plus search or filtering by useful operational fields including action, entity type, actor when available, and time range.
- **FR-021**: Audit entries shown to administrators MUST include timestamp, action, entity type and target when applicable, actor information when the actor still exists, and only safe useful metadata.
- **FR-022**: Important successful authentication, upload, download, permanent file deletion, permanent folder deletion, folder mutation, role change, permanent user deletion, and other administrator operations MUST attempt to emit centralized audit events.
- **FR-023**: Audit history MUST remain usable after an actor is permanently deleted, MUST display that actor as "Deleted user" without retaining a name or email snapshot, and MUST be retained without automated deletion during this phase.
- **FR-024**: Audit records, application responses, and operational errors MUST NOT expose passwords, tokens, verification codes, private file contents, storage credentials, or unnecessary implementation details.

#### Branding, Theme, and Experience Quality

- **FR-025**: All user-facing product-name references MUST use **Fileora**, and the tagline **"Your files. Organized your way."** MUST appear consistently where appropriate.
- **FR-026**: User-facing Gold Era branding MUST be removed from navigation, authentication, metadata and browser titles, dashboards, application shells, empty states, and product-facing documentation.
- **FR-027**: Internal package names, environment-variable names, database objects, and repository identifiers MUST NOT be renamed solely for branding.
- **FR-028**: The application MUST include a Fileora footer that is responsive, theme-compatible, visually consistent, and non-obstructive across authentication, user, and administrator layouts where a footer is appropriate.
- **FR-029**: People MUST be able to select light, dark, or system theme behavior, and the selected preference MUST persist for later use in the same browser.
- **FR-030**: System theme mode MUST follow the current operating-system preference without replacing the saved system selection.
- **FR-031**: Charts, dialogs, tables, forms, empty states, file previews, administrator interfaces, navigation, and the footer MUST remain readable, perceivable, and operable in every supported theme.
- **FR-032**: User and administrator interfaces MUST adapt without lost actions, clipped critical content, or unusable navigation at common mobile, tablet, and desktop viewport sizes.
- **FR-033**: Every user-facing asynchronous workflow MUST provide appropriate loading, empty, success, validation, and error feedback with a useful recovery action where possible.
- **FR-034**: Permanent file, folder, administrator file, and administrator user deletion MUST use clear target-specific confirmation and MUST not rely on color alone to communicate risk.
- **FR-035**: Forms, dialogs, menus, tables, pagination, and navigation MUST have accessible labels, visible focus, logical keyboard behavior, and appropriate focus restoration.
- **FR-036**: Motion MUST respect reduced-motion preferences, clarify state changes, and never block task completion or conceal loading.
- **FR-037**: Equivalent dates, file sizes, query state, pagination, page headers, actions, and administrator tables MUST use consistent presentation and behavior across the application.

#### Verification, Operations, and Documentation

- **FR-038**: Automated verification MUST cover successful and failed registration, login validation, email verification, invalid or expired verification codes, refresh behavior, unauthenticated rejection, and administrator rejection for normal users.
- **FR-039**: Automated verification MUST cover absence of user soft-deletion state, administrator user listing/search/pagination, safe role changes, permanent user deletion, session cleanup, dependent-record cleanup, stored-object cleanup, and unsafe self or last-administrator actions.
- **FR-040**: Automated verification MUST cover upload constraints, ownership, important file queries, permanent file and folder deletion, stored-object cleanup, secure preview/download, folder ownership, and folder mutation rules without adding Trash or restoration tests.
- **FR-041**: Automated verification MUST cover administrator authorization, global file owner visibility and queries, administrator permanent file deletion, statistics accuracy, and audit-history access control.
- **FR-042**: The project MUST provide a reproducible container-based workflow for its existing frontend, backend, and required local services without restructuring established feature domains.
- **FR-043**: Container images and orchestration configuration MUST receive deployment-specific values through environment configuration, MUST NOT contain usable secrets, and MUST exclude unnecessary or sensitive build context.
- **FR-044**: Missing or invalid required configuration MUST stop affected services with clear sanitized diagnostics, and every Phase 3 configuration change MUST be reflected consistently in example configuration, validation, tests, container settings, and documentation.
- **FR-045**: Security and reliability verification MUST cover authentication and administrator authorization, file/folder ownership, upload validation, filename and path safety, credential and token handling, deletion cleanup, sensitive response and audit data, role transitions, and destructive-action validation.
- **FR-046**: Any critical authorization or file-access defect found during the Phase 3 review MUST be corrected and verified before the phase can complete; working authentication, storage, and authorization architecture MUST otherwise remain intact.
- **FR-047**: Performance review MUST examine important paginated lists, platform statistics, audit queries, upload progress, preview/download paths, supporting indexes, cached query behavior, mutation refresh behavior, and unnecessary refetching; changes MUST address an identified issue rather than speculative redesign.
- **FR-048**: The frontend and backend MUST each build successfully, and the automated test suite MUST pass consistently before Phase 3 is declared complete.
- **FR-049**: The README MUST accurately document Fileora's overview, features, architecture, repository structure, prerequisites, environment variables, migrations, administrator initialization, local and container execution, testing, storage configuration, deployment, assumptions, and notable design decisions.
- **FR-050**: The README MUST state that administrator user deletion and current file/folder deletion are permanent, the user model has no soft-deletion field, and file/folder Trash and restoration are not part of the current product.
- **FR-051**: Phase 3 MUST build on the existing authentication, authorization, storage, audit, API, query-state, and interface patterns and MUST NOT introduce parallel infrastructure or unrelated architectural restructuring.

### Key Entities

- **User**: An account with identity, verification state, role, and timestamps. Under the approved Phase 3 design it has no soft-deletion field or deleted-user lifecycle; permanent deletion removes the account after required cleanup.
- **Refresh Session**: A revocable authentication session belonging to a user that must become unusable when that user is permanently deleted or their role is changed.
- **Verification Record**: Time-bound account-verification state belonging to a user and removed when dependency cleanup requires it.
- **File**: Metadata for one user-owned stored object, including owner, optional folder, original name, type, size, content availability, and timestamps; administrator deletion is permanently destructive.
- **Folder**: A user-owned hierarchical container whose relationships and contained files must be resolved safely during permanent user deletion.
- **Stored Object**: The private binary content corresponding to a file record; it must not remain orphaned after a reported successful permanent deletion.
- **Audit Event**: A retained, sanitized record of an important successful operation with actor when available, action, target, timestamp, and safe metadata; after the actor account is removed, it uses a generic "Deleted user" presentation without retaining the actor's name or email snapshot.
- **Theme Preference**: A browser-persisted selection of light, dark, or system behavior.
- **Platform Statistics Snapshot**: A read-time operational view of current user count, file count, stored bytes, type distribution, and recent uploads rather than a separate lifecycle record.

### Data Design Approval and Impact

- The project maintainer explicitly approved changing the canonical schema for Phase 3 on 2026-08-23.
- The approved change removes nullable `deletedAt` from `USER` and removes any index defined exclusively for user soft-deletion queries.
- Planning and implementation MUST update `database-schema.mmd`, the runtime schema, migration history, fixtures, application contracts, tests, and documentation as one synchronized change.
- No soft-deletion field is added to `FILE` or `FOLDER`, and no other entity or relationship change is authorized by this approval.
- Audit history must tolerate a missing actor relationship after permanent user deletion while retaining safe historical event data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In authorization tests, 100% of administrator endpoints reject unauthenticated callers and authenticated normal users without disclosing administrator-only data.
- **SC-002**: In a seeded deletion scenario containing active sessions, verification records, nested folders, files, and stored objects, a successful permanent user deletion leaves zero required user-owned database records, zero associated stored objects, and zero usable refresh sessions.
- **SC-003**: In failure-injection scenarios for required storage cleanup, 100% of affected permanent user and file deletions avoid reporting false success and leave no newly unauthorized content exposure; every retried partial user deletion completes after all remaining objects are removed while already-securely-absent objects are accepted as cleaned.
- **SC-004**: Administrator user and file directories return the correct search/filter result counts and deterministic page contents for data sets of at least 1,000 users and 10,000 files, with 95% of tested interactions presenting the requested page within 2 seconds under the agreed test environment.
- **SC-005**: Dashboard totals and distributions match the seeded source data exactly before and after representative uploads and permanent deletions, including byte totals and recent-upload ordering.
- **SC-006**: 100% of tested audit-history requests from normal users are denied, while administrators can locate a known event by supported filters in no more than three interactions.
- **SC-007**: A review of authentication, navigation, dashboards, empty states, page titles, and product-facing documentation finds zero unintended user-facing references to Gold Era and confirms Fileora plus the tagline in all designated locations.
- **SC-008**: All critical user and administrator journeys remain completable at representative mobile, tablet, and desktop widths in light, dark, and system modes, with no unreadable critical content or inaccessible primary action.
- **SC-009**: Keyboard-only checks complete 100% of representative forms, dialogs, menus, tables, pagination, and destructive confirmations, with visible focus and correct dialog focus restoration.
- **SC-010**: The selected theme persists across navigation and browser reload in 100% of light, dark, and system preference tests, and system mode follows a simulated system-theme change.
- **SC-011**: All specified critical-behavior automated tests pass in three consecutive clean runs, and both frontend and backend production builds complete successfully.
- **SC-012**: A maintainer can start the documented container workflow from non-secret example configuration in no more than 20 minutes, and inspection finds zero usable secrets baked into produced images.
- **SC-013**: A maintainer unfamiliar with the project can follow the README to configure, migrate, start, test, and identify administrator initialization and storage setup without undocumented required steps.
- **SC-014**: Final review records zero known critical authorization, ownership, preview/download, or permanent-deletion defects and documents evidence for every Phase 3 completion-gate item.

## Assumptions

- Phase 1 authentication, role enforcement, refresh sessions, verification, and audit foundations and Phase 2 file, folder, storage, preview/download, quota, and analytics behavior already exist and are the baseline to extend.
- Roles remain limited to the roles established by the current product. Administrators cannot change their own role, delete themselves, or remove the last administrator; another administrator must perform eligible changes.
- User deletion is an administrator-only operational action, not an end-user account-closing workflow.
- Permanent-deletion success requires required stored-object cleanup; audit recording remains best-effort and fail-open under the constitution, with sanitized operational logging on audit failure.
- Existing audit events are retained without automated expiration, and historical actor identity may become unavailable after permanent user deletion.
- Global file search targets original filename and owner identity; useful filters include owner, file type, upload date, and folder presence, with exact options finalized during planning without expanding scope.
- Recent uploads use the same current-file semantics and deterministic ordering as the established file model; permanently deleted files do not contribute to current platform totals.
- Theme preference is browser-scoped rather than stored in the user profile because no cross-device synchronization requirement was provided.
- Common responsive validation targets representative mobile, tablet, and desktop widths agreed during planning, while accessibility follows the project's established standards.
- Docker support targets the repository's existing local development or production-like workflow and external storage configuration; it does not recreate the external storage provider locally.
- No new production credentials, provider provisioning, manual deployment execution, administrator bootstrap execution, or production environment changes are part of implementation.

## Dependencies

- Completed Phase 1 authentication, authorization, refresh-session, email-verification, audit, configuration, and administrator-bootstrap foundations.
- Completed Phase 2 file, folder, quota/accounting, secure preview/download, Supabase Storage abstraction, and user analytics capabilities.
- Access to a valid non-secret local test configuration and a testable private storage environment or faithful test substitute for cleanup verification.
- The maintainer's explicit 2026-08-23 approval to synchronize `database-schema.mmd` with removal of `USER.deletedAt`.

## Out of Scope

- File or folder Trash, soft deletion, restoration, Empty Trash, retention policies, automatic expiration, scheduled cleanup, or versioning.
- User soft deletion, restoration, deleted-user states, retention periods, scheduled deletion, or post-deletion account recovery.
- Replacement or redesign of working authentication, authorization, storage, audit, API, query-state, or component architecture without a demonstrated defect.
- Production service provisioning, secret creation, production migration execution, administrator bootstrap execution, email-provider setup, storage-provider setup, or deployment execution.
- Internal technical renaming performed solely to match the Fileora product brand.
- Speculative optimization or unrelated repository restructuring.
