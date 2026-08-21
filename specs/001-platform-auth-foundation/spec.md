# Feature Specification: Platform Authentication Foundation

**Feature Branch**: `main` (no branch-creation hook configured)

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Read IMPLEMENTATION_PLAN.md and create a specification for phase 1 ONLY."

## Clarifications

### Session 2026-08-20

- Q: How should email addresses be normalized before registration uniqueness checks and sign-in lookup? → A: Trim surrounding whitespace and lowercase the entire email address.
- Q: What should the user experience when registration succeeds in persistence but the verification email cannot be delivered? → A: Keep the unverified account, show a delivery-pending error, and offer resend.
- Q: What should initialization do if `ADMIN_EMAIL` already belongs to a regular user? → A: Refuse startup and report a sanitized administrator-email conflict.
- Q: What should happen if the authentication gateway cannot store a newly issued or rotated refresh-token cookie? → A: Return an authentication error and do not return the access token.
- Q: How should Phase 1 respond to repeated failed sign-in attempts? → A: Do not apply sign-in throttling or account lockout in Phase 1.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Verify an Account (Priority: P1)

A visitor creates an account with an email address and password, receives a one-time verification code, and verifies the account before using protected features. If the code is unavailable or expires, the visitor can request a replacement without creating another account.

**Why this priority**: Verified identity is the entry point for every later user-owned file capability and prevents unverified accounts from entering protected areas.

**Independent Test**: Register a new email address, verify it with the delivered code, and confirm the account becomes eligible to sign in; repeat with an expired or superseded code to verify safe rejection and resend behavior.

**Acceptance Scenarios**:

1. **Given** an email address that is not registered, **When** the visitor submits a valid email and password, **Then** one unverified account is created, a time-limited verification code is sent, and no secret value is returned in the response.
2. **Given** an unverified account and its current valid code, **When** the visitor submits that code, **Then** the account is marked verified and the code cannot be used again.
3. **Given** an expired, incorrect, already-used, or superseded code, **When** the visitor submits it, **Then** verification is denied with a safe, actionable error and the account remains unverified.
4. **Given** an unverified account, **When** the visitor requests another code within allowed limits, **Then** a new code is sent and all earlier unused codes for that verification purpose become invalid.
5. **Given** an email address that is already registered, **When** a visitor attempts registration, **Then** the system does not create a duplicate account or disclose sensitive account details.
6. **Given** registration has persisted an unverified account but verification-email delivery fails, **When** the result is shown, **Then** the visitor is told that delivery is pending and is offered a path to resend without registering again.

---

### User Story 2 - Sign In and Use Protected Pages (Priority: P1)

A verified user signs in, reaches the protected application area, views their own profile, and can make authenticated requests without repeatedly entering credentials.

**Why this priority**: This establishes the secure session on which all file-management journeys depend.

**Independent Test**: Sign in as a verified regular user, open the protected application and profile, and confirm the same actions are denied to an anonymous or unverified visitor.

**Acceptance Scenarios**:

1. **Given** a verified active account with valid credentials, **When** the user signs in, **Then** the user receives a short-lived JWT access token and safe account data and is admitted to protected user pages while an opaque refresh token is retained outside browser-script access.
2. **Given** an unverified account, **When** correct credentials are submitted, **Then** sign-in is denied and the user is directed to complete verification.
3. **Given** invalid credentials, **When** sign-in is attempted, **Then** access is denied using a response that does not reveal whether the email or password was incorrect.
4. **Given** an authenticated user, **When** the user opens their profile, **Then** only that user's safe profile fields and role are displayed.
5. **Given** an anonymous visitor, **When** the visitor requests a protected page or protected operation, **Then** access is denied and the visitor is offered a path to sign in.
6. **Given** Express issues credentials during sign-in but the authentication gateway cannot store the refresh-token cookie, **When** sign-in completes, **Then** no access token or authenticated state is returned to the browser and an authentication error is shown.

---

### User Story 3 - Remain Authenticated Safely (Priority: P1)

An authenticated user continues working when the short-lived session credential expires or after a page reload, without exposing the long-lived renewal credential to browser scripts.

**Why this priority**: Secure renewal is required for a usable production session and must be correct before later protected features are added.

**Independent Test**: Expire the short-lived credential, reload the page and issue concurrent protected requests; confirm one renewal restores the session and each original request is attempted no more than one additional time.

**Acceptance Scenarios**:

1. **Given** a valid refresh token and an expired short-lived credential, **When** one protected request is rejected for expiration, **Then** one renewal succeeds and the original request is retried once with the replacement credential.
2. **Given** a valid refresh token, **When** the user reloads the application, **Then** authenticated state is restored without asking for credentials again and without exposing the refresh token to browser-readable storage or responses.
3. **Given** several protected requests receive an authentication rejection concurrently, **When** renewal begins, **Then** they share one renewal attempt rather than creating competing credential rotations.
4. **Given** an invalid, expired, revoked, or already-rotated renewal credential, **When** renewal is attempted, **Then** renewal fails safely, authenticated client state is cleared, the browser renewal cookie is removed where possible, and the user is asked to sign in.
5. **Given** a renewal succeeds, **When** the new credential pair is issued, **Then** the prior renewal credential can no longer establish a new session.
6. **Given** Express rotates credentials but the authentication gateway cannot replace the refresh-token cookie, **When** renewal completes, **Then** no replacement access token or authenticated state is returned to the browser and an authentication error is shown.

---

### User Story 4 - Log Out and End the Session (Priority: P1)

An authenticated user logs out and can trust that the current refresh token is no longer usable.

**Why this priority**: Users need a reliable way to terminate access, especially on shared or lost devices.

**Independent Test**: Log out, then attempt renewal and access to a protected area using artifacts from the ended session; both attempts must fail.

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** the user logs out, **Then** the current renewal credential is revoked, the first-party renewal cookie is cleared, in-memory authenticated state is cleared, and protected pages are no longer accessible.
2. **Given** an absent, invalid, or already-revoked renewal credential, **When** logout is requested, **Then** local authentication state and the cookie are still cleared and the result is safe and repeatable.

---

### User Story 5 - Enforce Administrator Boundaries (Priority: P2)

An administrator signs in through the same identity flow and can enter administrator-only areas, while regular users remain excluded from those areas and operations.

**Why this priority**: Later administration features require a proven server-enforced role boundary, even though user and file administration are outside this phase.

**Independent Test**: Use one bootstrapped administrator and one regular verified user to request the same administrator-only page and operation; only the administrator succeeds.

**Acceptance Scenarios**:

1. **Given** valid administrator bootstrap configuration and no matching administrator, **When** initialization runs, **Then** exactly one verified administrator account is available without exposing its password in logs or responses.
2. **Given** an authenticated administrator, **When** an administrator-only page or operation is requested, **Then** access is allowed through the normal authentication system.
3. **Given** an authenticated regular user, **When** an administrator-only page or operation is requested directly, **Then** the server denies it as forbidden regardless of any client-side navigation guard.
4. **Given** an unauthenticated visitor, **When** an administrator-only operation is requested, **Then** the server denies it as unauthenticated.
5. **Given** the configured administrator email already belongs to a regular user, **When** initialization runs, **Then** startup is refused with a sanitized conflict error and the existing user is not promoted automatically.

---

### User Story 6 - Receive Consistent and Auditable Outcomes (Priority: P2)

Users receive understandable loading, validation, success, unauthorized, forbidden, empty, and failure states, while authorized operators can later investigate security-relevant authentication events without secrets entering the audit history.

**Why this priority**: Predictable outcomes make authentication usable and give future operational tooling trustworthy source data.

**Independent Test**: Exercise successful and failed registration, verification, sign-in, renewal, profile, authorization, and logout cases; verify consistent response semantics, complete UI states, and sanitized audit records.

**Acceptance Scenarios**:

1. **Given** invalid external input, **When** any Phase 1 operation is submitted, **Then** the response uses the common error contract, identifies correctable fields when safe, and contains no implementation details or secrets.
2. **Given** a registration, successful verification, successful sign-in, logout, or denied role access, **When** the event completes, **Then** an audit event records the actor when known, action, target, outcome, timestamp, and safe metadata. Routine credential rotations are not audit events.
3. **Given** any audit event or application log produced by this phase, **When** it is inspected, **Then** it contains no password, verification code, raw access credential, raw renewal credential, server-only shared secret, or connection string.
4. **Given** the Phase 1 audit capability, **When** application routes, user interfaces, scheduled work, and deployment access are inspected, **Then** no application-facing audit read surface or automated deletion exists, records remain retained, and database access is limited to authorized operational access.

### Edge Cases

- Two registration requests for the same normalized email arrive at nearly the same time; at most one account is created.
- Verification resend and code submission overlap; only the current, valid, unused code can verify the account.
- A verification or renewal credential expires exactly as it is submitted; the authoritative server time determines validity and the request fails closed.
- The email delivery provider is unavailable after registration; the unverified account remains persisted, the user sees a delivery-pending error with a resend path, and no verification code is exposed. If delivery fails during resend, the account remains unchanged and the user sees the same retryable delivery outcome.
- A user signs in from multiple devices; each sign-in has a distinct active refresh-token record so logout revokes only the presented token and does not invalidate another device's token.
- An old refresh token is replayed after rotation; its revoked record is rejected without requiring session-family or rotation-lineage persistence.
- The authentication authority succeeds but the browser-facing gateway cannot set or replace the renewal cookie; sign-in or renewal fails with an authentication error and no access token or authenticated state is returned to the browser.
- A protected request fails for a reason other than expired or invalid authentication; it is not sent through the renewal loop.
- The administrator bootstrap runs repeatedly or concurrently; it remains idempotent and cannot downgrade or duplicate the configured administrator. If the configured email belongs to a regular user, startup fails with a sanitized conflict instead of promoting that account.
- Account, verification, renewal, or audit persistence is temporarily unavailable; security-sensitive operations fail closed with the common error contract.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide runnable client and server application foundations with documented clean-setup commands and validated startup configuration.
- **FR-002**: The system MUST provide distinct public-authentication, protected-user, and administrator presentation areas, with responsive and keyboard-operable loading, validation, success, unauthorized, forbidden, and failure states in a complete accessible light theme. Dark and system theme support are deferred to Phase 3.
- **FR-003**: The system MUST apply one documented success envelope and one documented error envelope to every Phase 1 service response, including stable error identifiers and safe field-level validation details where applicable.
- **FR-004**: The system MUST validate every externally supplied authentication value, route value, request parameter, and configuration value at its authoritative boundary and MUST deny the operation when validation or identity is uncertain.
- **FR-005**: A visitor MUST be able to register one account per normalized email address using a valid email and a password of at least 8 characters. The system MUST normalize email addresses before uniqueness checks and sign-in lookup by trimming surrounding whitespace and lowercasing the entire address; passwords MUST be stored only in a non-recoverable, salted form.
- **FR-006**: Registration MUST create an unverified regular-user account, initiate verification-code delivery, and MUST NOT grant protected access before verification succeeds. If delivery fails after persistence succeeds, the system MUST retain the unverified account, return a distinct delivery-pending outcome, and allow the user to retry through verification-code resend without registering again.
- **FR-007**: Verification codes MUST be unpredictable, expire 10 minutes after issuance, be usable once, and be stored in a form that does not reveal the submitted code if persistence is exposed.
- **FR-008**: An unverified user MUST be able to request a replacement verification code; issuance MUST invalidate prior unused codes for the same purpose and MUST be rate-limited to prevent abuse.
- **FR-009**: The system MUST verify an account only when the submitted code is current, unexpired, unused, and associated with that account, then consume it atomically.
- **FR-010**: Only a verified account with valid credentials MUST be able to sign in, and failed sign-in responses MUST avoid revealing which credential was incorrect. Phase 1 MUST NOT throttle failed sign-in attempts or lock accounts because of repeated sign-in failures.
- **FR-011**: Successful sign-in MUST return only safe user data and a short-lived JWT access token to browser JavaScript while placing an opaque refresh token in a first-party cookie that browser JavaScript cannot read.
- **FR-012**: JWT access tokens MUST be short-lived, held only in client memory, attached to protected service requests, and never persisted in browser storage by the application.
- **FR-013**: Refresh tokens MUST be cryptographically random opaque values rather than JWTs or other self-contained credentials. Each issued token MUST have one `Refresh Token` record associated with its user, containing only a non-reversible token hash plus expiry, revocation, and creation timestamps. Rotation MUST atomically revoke the presented record and create a replacement record; reusable raw refresh tokens and separate refresh-session records MUST NOT be retained in persistence.
- **FR-014**: The browser-facing authentication gateway MUST be limited to sign-in, renewal, and logout coordination: it MAY store, replace, clear, and forward the renewal cookie but MUST NOT create credentials or make authentication or authorization decisions. If it cannot store a newly issued or rotated refresh-token cookie, it MUST return an authentication error without returning the access token or authenticated state.
- **FR-015**: Raw renewal credentials MUST NOT appear in browser-readable response bodies, browser-readable persistent storage, URLs, application logs, error details, analytics, or audit metadata.
- **FR-016**: Any authority response containing raw renewal material MUST require a server-only trust credential and MUST be inaccessible to an untrusted direct browser request.
- **FR-017**: Production renewal cookies MUST be first-party, HTTP-only, secure in transit, restricted to the intended same-site behavior and narrowest practical path, and have an intentional lifetime; local plain-HTTP development MAY disable only the secure-transport flag.
- **FR-018**: When access expires, the client MUST perform at most one renewal for concurrent authentication failures, replace the in-memory access credential after success, and retry each eligible original request no more than once.
- **FR-019**: On application reload, the client MUST attempt to restore authenticated state through the renewal cookie without exposing that credential to browser JavaScript.
- **FR-020**: Invalid, expired, revoked, reused, or otherwise rejected renewal credentials MUST fail closed, clear authenticated client state, clear the renewal cookie where possible, and require a new sign-in.
- **FR-021**: Logout MUST revoke the presented refresh-token record at the authentication authority and clear both the first-party renewal cookie and in-memory authenticated state; repeating logout MUST remain safe.
- **FR-022**: An authenticated user MUST be able to retrieve and view only their own safe profile fields; profile editing and password reset are outside Phase 1.
- **FR-023**: Every protected service operation MUST validate the access credential server-side before returning protected data or performing a protected action.
- **FR-024**: The system MUST support `USER` and `ADMIN` roles and MUST enforce administrator authorization at the server; client route guards MUST NOT be treated as the security boundary.
- **FR-025**: Initialization MUST idempotently establish one verified administrator from validated secret configuration when the configured account is absent, without logging or returning the bootstrap password. If the configured normalized email belongs to an existing regular user, initialization MUST refuse startup with a sanitized conflict error and MUST NOT promote the account automatically.
- **FR-026**: The Phase 1 data contract MUST establish users, verification codes, refresh-token records, file records, nested folders, and audit events with ownership and lifecycle relationships sufficient for later phases without exposing later file-management behavior now. It MUST NOT introduce a separate refresh-session entity.
- **FR-027**: Security-relevant registration, successful verification, successful sign-in, logout, and authorization-denial outcomes MUST be sent through one audit capability with actor when known, action, target, outcome, timestamp, and sanitized metadata. Routine successful renewal rotations MUST NOT create audit records.
- **FR-028**: Audit and diagnostic records MUST exclude passwords, verification-code values, raw access or renewal credentials, server-only trust credentials, connection strings, and private content.
- **FR-029**: Normal protected operations MUST remain directly accessible with a valid access credential; the browser-facing authentication gateway MUST NOT become a duplicate proxy for non-authentication application operations in this phase.
- **FR-030**: The system MUST document every required environment setting with a non-secret example, secrecy classification, purpose, and startup validation rule, and MUST refuse startup when a required setting is absent or invalid.
- **FR-031**: Cross-origin browser access to protected service operations MUST be limited to explicitly configured trusted application origins and headers; credentialed cross-origin renewal cookies MUST NOT be required.
- **FR-032**: Phase 1 MUST include verification evidence for registration, code lifecycle, sign-in, profile isolation, renewal rotation and replay, single-renewal concurrency, logout, unauthenticated denial, role denial, secret redaction, audit access and retention policy, accessible light-theme presentation, configuration validation, and clean startup.
- **FR-033**: Phase 1 MUST adopt the constitution's default audit access and retention policy: audit records MUST have no application-facing read API or user interface, MUST be accessible only through authorized operational database access, and MUST be retained without automated deletion. Any later replacement policy MUST specify duration, disposition, migration impact, and verification before adoption.

### Requirement Verification Map

| Requirement group            | Acceptance evidence                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001–FR-004, FR-030–FR-032 | Clean-setup demonstration plus contract, light-theme accessibility, validation, origin-policy, configuration, and audit-policy checks |
| FR-005–FR-010                | User Story 1 scenarios and failed/sign-in abuse-boundary tests                                                                        |
| FR-011–FR-021, FR-029        | User Stories 2–4 scenarios, browser storage inspection, direct-access denial, rotation/replay tests, and concurrent-expiry test       |
| FR-022–FR-025                | User Stories 2 and 5 scenarios plus direct protected-operation authorization tests                                                    |
| FR-026–FR-028, FR-033        | Data-contract review and User Story 6 audit, redaction, access-surface, and retention scenarios                                       |

### Key Entities

- **User**: A person's account and identity status, including normalized email, display name, non-recoverable password representation, verification state, role (`USER` or `ADMIN`), lifecycle timestamps, and relationships to refresh tokens, owned folders, owned files, and attributable audit events.
- **Verification Code**: A one-time, purpose-bound proof associated with one user, including a non-recoverable code representation, issue and expiry times, consumption status, and replacement lineage sufficient to reject expired, used, or superseded codes.
- **Refresh Token**: One opaque, independently revocable renewal credential associated with one user. Persistence contains one record per issued token with `id`, `userId`, a non-reversible `tokenHash`, `expiresAt`, nullable `revokedAt`, and `createdAt`, matching `database-schema.mmd`. Rotation revokes the old record and inserts a new record; there is no separate refresh-session entity or persisted rotation family.
- **File**: The Phase 1 ownership and lifecycle contract for a future uploaded item, including owner, optional folder, name and content metadata, storage reference, nullable extracted content, and soft-deletion timestamps. Upload, extraction-status design, browsing, preview, download, and deletion behavior are deferred to Phase 2.
- **Folder**: The Phase 1 ownership and hierarchy contract for future organization, including owner, name, optional parent folder, and soft-deletion timestamps. Folder operations are deferred to Phase 2.
- **Audit Event**: An immutable record of an important action, containing actor when known, action, target type and identifier, outcome, timestamp, and sanitized metadata; audit-log viewing is deferred to Phase 3.

### Configuration Contract

The following names are the Phase 1 configuration contract. Planning MAY refine non-security defaults but MUST update this specification before renaming, adding, or removing a key.

| Setting                    | Classification          | Purpose / validation                                                                                                 |
| -------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `PORT`                     | Non-secret, server-only | Integer from 1 through 65535; defaults to 3001 locally and accepts the deployment platform's injected listener port  |
| `DATABASE_URL`             | Secret                  | Valid database connection value required by the server                                                               |
| `JWT_ACCESS_SECRET`        | Secret                  | High-entropy access-credential signing secret; required and never client-exposed                                     |
| `ACCESS_TOKEN_TTL`         | Non-secret              | Positive duration; default 15 minutes                                                                                |
| `REFRESH_TOKEN_TTL`        | Non-secret              | Positive lifetime for opaque refresh tokens; default 30 days and aligned with cookie lifetime                        |
| `BFF_SHARED_SECRET`        | Secret                  | High-entropy trust credential accepted only on server-to-server authentication exchanges                             |
| `AUTH_BFF_SHARED_SECRET`   | Secret                  | Gateway-side value corresponding to `BFF_SHARED_SECRET`; server-only and never public-prefixed                       |
| `NEXT_PUBLIC_API_BASE_URL` | Public                  | Absolute browser-reachable service origin                                                                            |
| `AUTH_API_BASE_URL`        | Non-secret, server-only | Absolute service origin used by the authentication gateway                                                           |
| `CORS_ALLOWED_ORIGINS`     | Non-secret              | Explicit comma-separated browser origins; wildcard is invalid when credentials or authorization headers are accepted |
| `REFRESH_COOKIE_NAME`      | Non-secret, server-only | Valid cookie name; one centralized default                                                                           |
| `REFRESH_COOKIE_PATH`      | Non-secret, server-only | Narrow path covering sign-in, renewal, and logout handlers                                                           |
| `REFRESH_COOKIE_SAME_SITE` | Non-secret, server-only | Valid environment-appropriate same-site policy                                                                       |
| `REFRESH_COOKIE_SECURE`    | Non-secret, server-only | Must be true in production; false allowed only for plain-HTTP local development                                      |
| `EMAIL_FROM`               | Non-secret              | Valid sender identity used for verification messages                                                                 |
| `SMTP_HOST`                | Non-secret              | Required mail delivery host                                                                                          |
| `SMTP_PORT`                | Non-secret              | Valid port number                                                                                                    |
| `SMTP_SECURE`              | Non-secret              | Boolean transport-security mode consistent with the configured port                                                  |
| `SMTP_USER`                | Secret                  | Mail-service credential                                                                                              |
| `SMTP_PASSWORD`            | Secret                  | Mail-service credential                                                                                              |
| `ADMIN_EMAIL`              | Secret                  | Valid normalized bootstrap administrator email                                                                       |
| `ADMIN_PASSWORD`           | Secret                  | Bootstrap password satisfying the account password policy                                                            |
| `ADMIN_NAME`               | Non-secret              | Non-empty bootstrap administrator display name                                                                       |

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 90% of first-time test participants can register, obtain a verification message, verify, and reach sign-in without assistance in under 3 minutes, excluding external email delivery time.
- **SC-002**: 100% of acceptance tests deny protected data to anonymous and unverified users and deny administrator-only operations to regular users, including direct requests that bypass page navigation.
- **SC-003**: In a test burst of at least 20 simultaneous protected requests after access expiry, exactly one renewal operation occurs, every eligible request is retried no more than once, and at least 95% complete successfully when the refresh token is valid.
- **SC-004**: 100% of tested expired, revoked, malformed, and replayed renewal credentials fail to establish authenticated access and leave no usable authenticated browser state.
- **SC-005**: Inspection across sign-in, renewal, reload, logout, logs, errors, audit records, URLs, and browser storage finds zero raw renewal credentials exposed to browser JavaScript or retained in prohibited locations.
- **SC-006**: A verified user can sign in, open a protected page, retrieve their profile, survive one access-credential expiry, reload the page, and log out successfully in one end-to-end test on both local and production-like domain arrangements.
- **SC-007**: 100% of Phase 1 service failures sampled in contract tests use the documented error shape, and 100% of successful responses sampled use the documented success shape.
- **SC-008**: A new contributor can configure and start both applications from the documented non-secret example settings in under 15 minutes after prerequisites and external service credentials are available.
- **SC-009**: 100% of required security events in the Phase 1 test suite produce structurally complete audit records, with zero prohibited secrets found by redaction checks.
- **SC-010**: In usability review, at least 90% of participants correctly understand whether they must verify, sign in again, or lack permission from the presented authentication state without assistance.

## Assumptions

- Email and password are the only end-user sign-in method in Phase 1; social sign-in, multi-factor authentication, password reset, and account recovery are deferred.
- Email addresses are normalized before comparison by trimming surrounding whitespace and lowercasing the entire address, and each normalized email address identifies at most one account.
- Verification codes expire after 10 minutes; access credentials default to 15 minutes and refresh tokens to 30 days unless planning documents a security-reviewed reason to change them.
- Verification-code resend limits use reasonable security defaults finalized during planning and present a retryable response without revealing protective thresholds unnecessarily. Failed sign-in attempts are not throttled and do not lock accounts in Phase 1.
- Each browser or device sign-in creates a distinct refresh-token record. Phase 1 logout revokes the presented token record, not every refresh token owned by the user.
- The profile is read-only in Phase 1 and contains only safe identity fields such as display name, email, verification state, role, and account timestamps.
- Administrator bootstrap is initialization behavior, not an administrator-management interface; role changes and administration workflows are deferred to Phase 3.
- File and folder entities are data-contract foundations only in this phase. Upload, query, organization, preview, download, and deletion experiences remain Phase 2 work.
- Phase 1 adopts the constitutional default audit policy: it exposes no application audit-read API or user interface, permits only authorized operational database access, and retains audit records without automated deletion. Audit search, export, and any replacement retention policy are deferred to Phase 3 and require an approved duration, disposition, migration impact, and verification plan.
- Phase 1 and Phase 2 provide a complete accessible light theme. Dark and system theme support, including theme controls and cross-interface verification, are delivered in Phase 3.
- Only access tokens use JWT. Refresh tokens are opaque random values backed directly by hashed `Refresh Token` records; no refresh-session table, refresh-token signing secret, or JWT refresh-token validation is part of this feature.
- The required client, server, data, mail, and deployment technologies named in the implementation plan and constitution remain planning constraints, with any generic reference to “JWT access/refresh authentication” interpreted as JWT access-token authentication plus opaque refresh-token authentication—not JWT-formatted refresh tokens.
- The application will be deployed with the browser-facing application and authentication authority on unrelated origins, so the design cannot depend on a shared third-party renewal cookie.

## Dependencies

- A reachable relational data service for identity, session, foundation, and audit records.
- A mail delivery service and authorized sender identity for verification-code delivery.
- Deployment environments capable of keeping the access-token signing secret, bootstrap credentials, database credentials, mail credentials, and the server-to-server trust credential secret.
- Correct public application and service origins for production cookie and cross-origin policy validation.

## Out of Scope

- File upload, listing, search, filtering, sorting, preview, download, folders, file deletion, and user file statistics (Phase 2).
- User administration, global file administration, operational dashboards, audit-log viewing, and role-change interfaces (Phase 3).
- Dark and system theme support, including user controls and cross-interface theme verification (Phase 3).
- Containerization, full production-hardening documentation, extended performance work, and the complete cross-phase automated test suite beyond Phase 1 verification (Phase 4).
- Password reset, account recovery, social sign-in, multi-factor authentication, user-controlled session listing/revocation, and profile editing unless added through a later approved specification.
