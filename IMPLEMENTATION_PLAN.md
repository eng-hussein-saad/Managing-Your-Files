# Managing Your Files — Implementation Plan

## Executive Summary

Managing Your Files is a full-stack file management platform that allows authenticated users to securely upload, organize, inspect, preview, download, search, and manage their files while providing administrators with user management, global file management, operational statistics, and audit visibility.

The application will be built as a TypeScript monorepo with a Next.js App Router frontend and an Express.js REST API backend. PostgreSQL will be accessed through Prisma ORM. Authentication will use JWT access tokens with refresh-token support, email OTP verification, protected routes, and role-based authorization for users and administrators. File uploads will use Multer, and Phase 2 will establish Supabase Storage as the object/file-storage provider behind a dedicated storage service abstraction. Supabase is used for object/file storage only; application authentication, authorization, metadata persistence, and audit decisions remain owned by the existing application architecture.

The implementation intentionally includes the complete extended feature set: dark mode, folder management, file and image preview, file downloads, user-only soft deletion, permanent file/folder deletion, audit logs, refresh-token authentication, Docker support, and automated testing.

Development will follow GitHub Spec Kit's spec-driven workflow. The project constitution should be established once before implementation begins. Each phase below should then be treated as a separate Spec Kit feature and taken through specification, clarification where needed, planning, task generation, analysis, implementation, and verification before proceeding to the next phase.

Recommended workflow for every phase:

```text
/speckit.specify
/speckit.clarify      # when requirements are ambiguous
/speckit.plan
/speckit.tasks
/speckit.analyze      # recommended consistency check
/speckit.implement
/speckit.converge     # use when verification finds remaining gaps
```

### Project-wide engineering principles

The project constitution should enforce the following principles across every phase:

- Strict TypeScript usage across frontend and backend.
- Clear separation between routes/controllers, services, persistence, validation, and infrastructure concerns.
- Server-side authorization is the security boundary; frontend route guards are additional UX protection only.
- All external input is validated on the backend, including authentication payloads, query parameters, route parameters, and uploaded files.
- API errors follow one predictable response format.
- Supabase Storage is the object/file-storage provider from Phase 2 onward and is accessed through a storage abstraction instead of directly from controllers.
- Reusable React components and reusable React Query hooks are preferred over duplicated page-level logic.
- Search, filtering, sorting, and pagination for data sets are server-driven.
- Sensitive configuration is supplied through environment variables only.
- User-facing asynchronous actions expose clear loading, success, empty, and error states.
- Features that modify important data generate appropriate audit events.
- Tests prioritize security boundaries and business behavior rather than arbitrary coverage targets.
- Every phase must leave the application runnable and internally consistent.

### Target repository structure

```text
Managing-Your-Files/
├── client/
├── server/
├── docker-compose.yml
├── README.md
└── IMPLEMENTATION_PLAN.md
```

The exact internal folder structures should be finalized during the relevant Spec Kit planning steps rather than being prematurely fixed here.

---

# Phase 1 — Platform Foundation, Authentication & Authorization

## Objective

Establish the application foundation and complete the identity/security layer so all later features can rely on a stable authentication, authorization, database, API, frontend shell, and production-safe refresh-token architecture.

Because the deployed frontend and backend will live on unrelated Vercel and Render domains, authentication will use a small Next.js **Backend for Frontend (BFF)** layer for browser-facing refresh-token cookie handling. Express remains the source of truth for authentication, authorization, token generation/validation, refresh-token rotation/revocation, and refresh-token persistence.

## Scope

### Project foundation

- Initialize the monorepo with `client/` and `server/` applications.
- Configure Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, TanStack React Query, and Axios.
- Configure Express.js, TypeScript, Prisma ORM, PostgreSQL, JWT support, and common middleware.
- Establish environment-variable validation and configuration loading.
- Add linting/formatting conventions and consistent scripts.
- Create global API error handling and a standard API response/error shape.
- Establish backend validation conventions.
- Establish the base frontend application shell, authentication layout, protected application layout, and admin layout.
- Establish Next.js Route Handlers for the limited BFF responsibilities required by authentication.

### Database foundation

Create or establish the data-model contracts needed by the complete system so later phases do not require architectural redesigns.

Core entities should include:

- `User`
- `VerificationCode`
- `RefreshToken`
- `File`
- `Folder`
- `AuditLog`

Relations and indexes should support ownership, role-based access, nested folders, user-only soft deletion, permanent file/folder deletion, refresh-token revocation/rotation, file queries, and audit history.

The `RefreshToken` model should support secure rotation and revocation. Stored refresh-token material should not require keeping reusable raw refresh tokens in plaintext when a hashed/token-identifier strategy can be used.

### Authentication

Implement the complete authentication flow:

- User registration.
- Secure password hashing.
- Email verification using OTP codes.
- OTP expiration and one-time use.
- Resend verification code.
- Login.
- Short-lived JWT access tokens.
- Refresh-token authentication.
- Refresh-token rotation/revocation strategy.
- Logout.
- Authenticated profile endpoint.
- Profile page.
- Protected API routes.
- Frontend protected routes.
- `USER` and `ADMIN` roles.
- Backend role-based authorization middleware.
- Admin bootstrap/seed using environment variables.

Express owns the actual authentication and refresh-token logic, including:

- Credential validation.
- Access-token generation and validation.
- Refresh-token generation and validation.
- Refresh-token persistence.
- Refresh-token rotation and revocation.
- Refresh-token invalidation/revocation decisions.
- Role and authorization enforcement.

The browser must never receive the raw refresh token in a JavaScript-readable response body.

### Next.js BFF and token-storage architecture

Use a small **Backend for Frontend (BFF)** layer implemented with Next.js App Router Route Handlers to avoid relying on third-party cookies between the Vercel frontend and Render backend.

The intended production flow is:

```text
Normal protected API requests:
Browser ───────────────────────────────► Express / Render
        Authorization: Bearer <access token>

Refresh-token operations:
Browser ─────► Next.js BFF / Vercel ─────► Express / Render
              first-party HttpOnly cookie
```

Token responsibilities:

- The access token is generated by Express, returned to browser JavaScript, and kept in frontend memory rather than persistent browser storage.
- The refresh token is generated, validated, rotated, and revoked by Express.
- Next.js stores the refresh token in a first-party `HttpOnly`, `Secure` cookie on the Vercel application origin.
- Next.js reads, replaces, and clears that cookie when performing refresh-token operations.
- Next.js does not validate, sign, rotate, or make authorization decisions about refresh tokens; it forwards them to Express.
- Refresh tokens must not be stored in `localStorage`, `sessionStorage`, IndexedDB, or another JavaScript-readable persistent store.

Implement browser-facing BFF Route Handlers for at least:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Their responsibilities are:

#### Login

1. The browser submits credentials to the Next.js login Route Handler.
2. Next.js forwards the credentials server-to-server to Express.
3. Express validates the credentials, creates the access token and refresh token, and returns the required authentication result to the trusted BFF.
4. Next.js stores the refresh token in an `HttpOnly`, `Secure`, first-party cookie.
5. Next.js returns the access token and safe user data to browser JavaScript.
6. The frontend keeps the access token in memory.

#### Refresh

1. The frontend calls the Next.js refresh Route Handler when an access token needs renewal.
2. The browser automatically includes the first-party HttpOnly refresh cookie.
3. Next.js reads the refresh token server-side and forwards it to Express.
4. Express validates the refresh token, performs rotation/revocation as required, and generates a new access token and rotated refresh token.
5. Next.js replaces the HttpOnly cookie with the rotated refresh token.
6. Next.js returns only the new access token and other explicitly safe data to browser JavaScript.

#### Logout

1. The browser calls the Next.js logout Route Handler.
2. Next.js reads the HttpOnly refresh cookie and forwards the logout request to Express.
3. Express revokes or invalidates the refresh token.
4. Next.js clears the browser's refresh-token cookie.
5. The frontend clears the in-memory access token and cached authenticated state.

Because the Render API is publicly reachable, any Express response that contains raw refresh-token material for the BFF must be treated as a server-to-server interface and must not be exposed as an unrestricted browser-facing response. Protect that BFF-to-Express trust boundary using a server-only mechanism such as an internal shared secret/header or an equivalent design chosen during `/speckit.plan`. The secret must never use a `NEXT_PUBLIC_*` environment variable or otherwise be exposed to browser JavaScript.

Cookie configuration must be environment-aware:

- Production BFF refresh cookies use `HttpOnly`, `Secure`, an appropriate `SameSite` value for the same-site Vercel request, and an intentional cookie path/lifetime.
- Local development may relax `Secure` only when required for plain HTTP localhost development.
- Cookie configuration should be centralized rather than duplicated across Route Handlers.

### Frontend authentication experience

Provide complete screens and states for:

- Registration.
- Login.
- Email verification.
- Resending verification codes.
- Profile.
- Logout.
- Expired/invalid authentication handling.
- Unauthorized and forbidden states.

Axios and React Query should use a reusable authentication strategy rather than handling tokens separately in each screen.

The client authentication layer should:

- Attach the current in-memory access token to protected Express API requests using the `Authorization: Bearer ...` header.
- Detect an expired/invalid access-token response and perform a refresh through the Next.js `/api/auth/refresh` BFF endpoint.
- Update the in-memory access token after a successful refresh.
- Retry the original failed request once with the new access token.
- Prevent infinite refresh/retry loops.
- Coordinate concurrent `401` responses so multiple failed requests share one refresh operation rather than rotating the same refresh token multiple times.
- Restore authenticated state after a page reload by attempting the BFF refresh flow when an HttpOnly refresh cookie is present, since the access token itself is intentionally memory-only.
- Clear authenticated client state when refresh fails or the refresh token is revoked.

Normal application APIs such as files, users, statistics, and profile may continue to be called directly from the browser to Express using the access token. The BFF should remain intentionally narrow rather than duplicating the complete Express REST API without a demonstrated need.

### Audit foundation

Create the audit logging service and begin recording security-relevant events such as:

- Registration.
- Successful login.
- Email verification.
- Refresh-token rotation where useful and safe.
- Logout where useful.
- Administrative role changes when introduced later.

Audit metadata must not contain raw access tokens, refresh tokens, passwords, OTP values, or server-only BFF secrets.

The audit log UI is intentionally deferred to Phase 3.

## Phase 1 completion gate

Phase 1 is complete only when:

- A new user can register, receive an OTP, verify their email, log in, access protected user pages, retrieve their profile, refresh an expired access token, and log out.
- Express remains the authority for token generation, token validation, refresh rotation/revocation, and role-based authorization.
- The production authentication flow does not depend on a third-party refresh-token cookie shared between `vercel.app` and `onrender.com`.
- The refresh token is stored as a first-party HttpOnly cookie managed by the Next.js BFF and is never exposed to browser JavaScript.
- The access token is kept in frontend memory and can be restored after a page reload through the BFF refresh flow.
- A failed/expired access-token request can trigger one refresh operation and then retry successfully with the new access token.
- Concurrent `401` responses do not cause multiple competing refresh-token rotations.
- Invalid, expired, revoked, or reused refresh tokens fail safely, clear client authentication state, and remove the browser refresh cookie where appropriate.
- Direct browser access cannot obtain raw refresh-token material from BFF-only Express responses.
- Unverified or unauthenticated users cannot access protected APIs.
- Normal users cannot access administrator APIs.
- An administrator can authenticate successfully through the same authentication system.
- Errors and validation failures are returned consistently.
- The client and server can both run from a clean setup using documented environment variables.

## Spec Kit kickoff

### `/speckit.specify` seed

Build the platform foundation and complete identity system for Managing Your Files. Users must be able to register, verify their email using an expiring OTP, resend verification codes, log in, remain authenticated, view their profile, refresh an expired access token, and log out. The system has regular users and administrators, and protected functionality must enforce authentication and roles securely. Use a Next.js Backend for Frontend layer for browser-facing refresh-token cookie handling so production authentication does not depend on third-party cookies between the Vercel frontend and Render backend. Express remains responsible for authentication, JWT generation/validation, refresh-token rotation/revocation, refresh-token persistence, and authorization, while Next.js manages the first-party HttpOnly refresh cookie and forwards refresh-token operations to Express. Keep the access token short-lived and in frontend memory, never expose the refresh token to browser JavaScript, and establish the shared application foundation required by later file-management functionality.

### `/speckit.plan` constraints

Use the required project stack: Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, TanStack React Query, Axios, Express.js, TypeScript, Prisma ORM, PostgreSQL, JWT authentication, and a monorepo with `client/` and `server/`. Include refresh-token authentication, email OTP delivery, backend input validation, secure password hashing, admin bootstrap through environment variables, consistent error handling, and an audit logging foundation. Implement a narrow Next.js BFF using Route Handlers for login, refresh, and logout cookie/token operations. Express must remain the sole authority for generating and validating access/refresh tokens and for refresh-token rotation, revocation, persistence, and authorization. Store the refresh token only in a first-party HttpOnly cookie managed by Next.js; keep the access token in frontend memory; never return raw refresh-token material to browser JavaScript. Protect any Express BFF-only token response with a server-only trust mechanism such as a shared secret/header or an equivalent design, and keep that secret out of all `NEXT_PUBLIC_*` variables. Include an Axios refresh interceptor with single-refresh coordination for concurrent `401` responses, safe retry behavior, authentication restoration after reload, environment-aware cookie settings, and appropriate CORS for direct browser-to-Express bearer-token API requests. Design the Prisma schema with user-only soft deletion, permanent file/folder deletion, and audit requirements in mind.

---

# Phase 2 — File Management, Organization & User Experience

## Objective

Deliver the complete end-user file-management experience, from uploading files through discovering, organizing, inspecting, previewing, downloading, and deleting them.

## Scope

### File upload pipeline

Implement:

- Multer-based backend upload handling.
- Drag-and-drop uploading.
- Traditional file picker support.
- Multiple-file uploads.
- Per-file upload progress.
- Client-side validation for immediate feedback.
- Server-side validation as the authoritative validation layer.
- Configurable file-size limits.
- Allowed file-type/MIME validation.
- Clear handling of rejected or failed uploads.
- File metadata persistence in PostgreSQL.
- Object/file storage in a private Supabase Storage bucket through a dedicated storage service abstraction.
- Backend-only Supabase Storage configuration and credentials; Supabase Authentication, Database, Realtime, and other Supabase products remain outside the storage integration.
- Safe generated storage keys/names rather than trusting uploaded filenames as storage paths.
- Extracted content for supported file formats.
- A clear unsupported/unavailable state when textual extraction cannot be performed.
- Audit events for upload activity.

### My Files

Implement a user-owned files experience with:

- File listing.
- Search.
- Filtering.
- Sorting.
- Pagination.
- Server-driven query parameters for search/filter/sort/pagination.
- Responsive table/card presentation as appropriate for screen size.
- Loading states.
- Empty states.
- Error states.

Users must only receive files they are authorized to access.

### File details

Each file detail view should expose appropriate metadata including:

- Original filename.
- File type/MIME type.
- File size.
- Upload date.
- Folder/location information.
- Extracted content where available.
- Preview capability where supported.
- Download action.
- Delete action.

### File preview and image preview

Provide preview experiences appropriate to supported content types, including at minimum:

- Images.
- PDFs or browser-previewable documents where practical.
- Plain text/extracted textual content where appropriate.
- A graceful unsupported-preview state for other formats.

Preview logic should be separated into reusable components rather than embedded as large conditional blocks inside the details page.

### Downloads

Implement authenticated downloads that:

- Verify ownership/authorization before exposing a file.
- Return the correct filename and content metadata.
- Record useful download audit events.

### Folder management

Implement user-owned folders with:

- Create folder.
- Rename folder.
- Delete folder.
- Nested folders through parent relationships.
- Browse folder contents.
- Move files into or between folders.
- Breadcrumb navigation.
- Protection against users reading or mutating another user's folders.
- Sensible behavior when folders contain files or child folders.

### Permanent file and folder deletion

Implement permanent deletion for files and empty folders. Soft deletion applies only to users and is introduced with user administration in Phase 3.

Apply the maintainer-approved lifecycle migration during Phase 2: add nullable `User.deletedAt`, remove `File.deletedAt`, and remove `Folder.deletedAt`. Existing users remain active because the new user field is null by default. The migration and runtime schema must be compared with the updated `database-schema.mmd`, and no other schema change is authorized by this decision.

File and folder deletion must define:

- How a confirmed file deletion permanently removes both its PostgreSQL metadata and Supabase Storage object.
- How successful file deletion immediately reclaims the deleted file's share of the user's 100 MB quota.
- How partial storage or persistence failures are retried or reconciled without exposing orphaned objects or dangling accessible records.
- How empty-folder-only permanent deletion prevents cascading data loss.
- How permanent deletion events remain available in immutable audit history after the target record is gone.

### User dashboard

Add a user dashboard containing:

- Total uploaded files.
- Total storage usage.
- File-type distribution.
- Upload history over time.

The backend should return aggregation-ready statistics rather than requiring the client to download every file and calculate statistics itself.

### User interface quality

Throughout this phase, use the required UI stack to provide:

- Responsive layouts.
- Reusable file/folder components.
- Toast notifications.
- Skeleton/loading states.
- Confirmation dialogs for destructive actions.
- Clear empty states.
- Focused Framer Motion transitions and interaction feedback without excessive animation.

## Phase 2 completion gate

Phase 2 is complete only when an authenticated user can:

- Upload one or many valid files using drag/drop or a picker and observe upload progress.
- Receive useful validation errors for invalid files.
- Browse only their own existing files.
- Search, filter, sort, and paginate files through server-backed queries.
- Open a file and inspect its metadata and extracted content.
- Preview supported files and images.
- Download a file securely.
- Create and navigate nested folders.
- Move files between folders.
- Permanently delete files and reclaim their storage quota through the defined deletion behavior.
- View accurate user dashboard statistics.

Authorization tests must demonstrate that one user cannot access another user's files or folders by manipulating IDs or URLs.

## Spec Kit kickoff

### `/speckit.specify` seed

Build the complete authenticated user file-management experience. Users need to upload one or multiple files with drag-and-drop and progress feedback, browse and query their own files, view metadata and extracted content, preview supported files and images, download files securely, organize files into nested folders, and delete files safely. Users also need a dashboard showing their total files, storage usage, file-type distribution, and upload history. Use a private Supabase Storage bucket for object/file storage only, behind the application storage abstraction. All file and folder access must enforce ownership and provide polished loading, empty, success, validation, and error states.

### `/speckit.plan` constraints

Use Express REST APIs with Multer for upload intake, Prisma/PostgreSQL for metadata, TanStack React Query and Axios for client data access, and Supabase Storage as the object/file-storage provider behind a provider-isolating storage service. Use a private bucket and backend-only credentials; do not use Supabase Authentication or Supabase Database. Search/filter/sort/pagination must be server-driven. Include extracted-content handling, folder hierarchy, secure download/preview endpoints or equivalent authorized access, permanent file and empty-folder deletion, quota reclamation, audit events, responsive UI, toast notifications, and Framer Motion interaction polish. Preserve strict authorization checks for every file/folder operation. Do not add file or folder soft-delete fields.

---

# Phase 3 — Administration, Analytics, Auditability & Application Polish

## Objective

Complete administrator capabilities, global operational visibility, audit inspection, and the remaining cross-application user experience features.

Phase 3 must reuse the Supabase Storage integration established in Phase 2. It must not introduce, migrate to, or replace the object/file-storage provider; administrator file operations must go through the same application storage abstraction and authorization boundaries.

## Scope

### User administration

Administrator-only user management should provide:

- User listing.
- Search.
- Pagination.
- Relevant user metadata.
- Role editing.
- User soft deletion by setting the user deletion timestamp, revoking active refresh tokens, and immediately denying sign-in, renewal, and protected access while retaining the user's owned file/folder records.
- Clear administrator visibility of soft-deleted user status. User restore and permanent user deletion remain outside this phase unless separately specified.
- Protection against unsafe administrative actions such as accidental self-removal or invalid role transitions where applicable.
- Audit events for administrative changes.

### Global file administration

Administrators should be able to:

- View files across all users.
- Identify file owners.
- Search files.
- Filter files.
- Paginate files.
- Inspect relevant file metadata.
- Permanently delete files using the Phase 2 metadata, Supabase object-removal, quota-reclamation, and audit policy.

Administrator access must be enforced by the backend regardless of what the frontend displays.

### Admin dashboard

Provide administrator statistics including:

- Total users.
- Total files.
- Total storage usage.
- Most uploaded file types.
- Recent uploads.

The backend should perform the required aggregations efficiently and expose purpose-built statistics endpoints.

### Audit log interface

Expose administrator-only audit history using the audit events accumulated throughout previous phases.

The audit experience should support useful inspection fields such as:

- Timestamp.
- Acting user.
- Action.
- Entity type.
- Target/entity identifier where appropriate.
- Relevant metadata that is safe to expose.

Add search/filter/pagination if they provide useful operational value without complicating the data model unnecessarily.

Audit events should cover important operations across the system, including authentication, uploads, downloads, deletes, folder actions, role changes, and user-management actions.

### Dark mode

Implement a complete application theme experience with:

- Light mode.
- Dark mode.
- System preference when appropriate.
- Persisted user/browser preference.
- Theme-safe charts, dialogs, tables, forms, empty states, and file previews.

### Cross-application polish

Review and normalize UX across user and admin areas:

- Responsive behavior on mobile, tablet, and desktop.
- Navigation states.
- Consistent page headers/actions.
- Loading skeletons.
- Empty states.
- Error states.
- Toast messages.
- Destructive-action confirmation.
- Accessible form labels and keyboard behavior.
- Appropriate Framer Motion usage.
- Consistent file-size/date formatting.
- Consistent pagination and query-state handling.

## Phase 3 completion gate

Phase 3 is complete only when:

- Administrators can manage users and roles securely.
- Administrators can search, inspect, paginate, and delete files across the system.
- Normal users are blocked from every administrator API even if they call it directly.
- Administrator statistics are accurate.
- Audit events exist for the important workflows implemented across all phases and can be inspected by an administrator.
- Dark mode works across the complete application without obvious unreadable or unthemed areas.
- User and admin experiences behave correctly across common viewport sizes.

## Spec Kit kickoff

### `/speckit.specify` seed

Build the administrator and operational layer of Managing Your Files. Administrators need secure user management, role management, global file management, aggregated system statistics, and a usable audit-history view. Complete the application-wide theme and interaction polish so both user and admin areas work consistently in light and dark modes, remain responsive, and clearly communicate loading, empty, success, error, and destructive-action states. Administrator privileges must remain securely enforced by the backend.

### `/speckit.plan` constraints

Reuse the existing authentication, role middleware, Prisma data model, audit service, API conventions, React Query patterns, and UI components rather than creating parallel implementations. Use efficient database aggregation for statistics and server-side pagination/filtering for admin data sets. Finish audit-event coverage, implement the admin audit interface, and add persistent light/dark/system theming with compatible charts and components.

---

# Phase 4 — Testing, Containerization, Deployment & Production Readiness

## Objective

Turn the functionally complete application into a reproducible, tested, deployable, and well-documented system.

Phase 4 must verify and document the Supabase Storage integration delivered in Phase 2. It must not add, migrate, or replace the object/file-storage provider unless a separately approved requirement change first updates the Phase 2 specification and its dependent artifacts.

## Scope

### Automated testing

Add automated tests focused on high-value behavior and security boundaries.

Authentication coverage should include cases such as:

- Successful registration.
- Duplicate registration rejection.
- Password validation/login failure.
- Email verification success/failure.
- Expired or invalid OTP handling.
- Refresh-token behavior.
- Authentication-required endpoint rejection.
- Administrator authorization rejection for normal users.

File/folder coverage should include cases such as:

- Valid upload.
- Invalid file type.
- Oversized file.
- Multiple-file behavior where relevant.
- Ownership enforcement.
- Search/filter/pagination behavior for important cases.
- Permanent file and empty-folder deletion, including Supabase object removal and quota reclamation.
- User soft deletion, refresh-token revocation, and deleted-user access denial.
- Secure download/preview authorization.
- Folder ownership and mutation rules.

Administrator coverage should include cases such as:

- User listing authorization.
- Role updates.
- Global file access.
- Administrative deletion behavior.
- Statistics access control.

Add focused unit tests for complex services/utilities where they provide value, and integration/API tests for the most important end-to-end backend behavior.

### Docker support

Provide Docker support for reproducible local execution.

Include appropriate Dockerfiles and Docker Compose configuration so the project can run its required local services with minimal setup. Containerization should respect environment variables and should not bake secrets into images.

### Production configuration

Prepare the application for independent frontend/backend deployment:

- Frontend configured through `NEXT_PUBLIC_API_URL`.
- Backend configured through environment variables.
- Production CORS configuration.
- Secure authentication-cookie/token settings according to the selected implementation.
- Correct proxy/header handling where applicable.
- Production verification and deployment configuration for the existing Phase 2 Supabase Storage integration, including its private bucket and backend-only credentials.
- Database migrations/deployment migration strategy.
- Admin initialization strategy.
- Email delivery configuration.
- Logging/error behavior appropriate for production.

### Security and reliability review

Perform a final review for:

- Authorization on every sensitive endpoint.
- File ownership enforcement.
- Upload validation.
- Filename/path safety.
- Password/token/OTP handling.
- Refresh-token invalidation.
- CORS configuration.
- Environment-secret handling.
- Accidental sensitive data in API responses or audit logs.
- Soft-deleted user leakage or continued authentication, and residual file/folder records or objects after successful permanent deletion.
- Error messages that expose implementation details.

### Performance review

Verify reasonable behavior for:

- Paginated file lists.
- Admin lists.
- Statistics queries.
- Upload progress.
- Preview/download paths.
- Database indexes supporting frequent queries.
- React Query caching and invalidation.
- Avoiding unnecessary frontend refetches.

### README and developer experience

Create a complete `README.md` containing:

- Project overview.
- Feature overview.
- Technology stack.
- Repository/folder structure.
- Architecture summary.
- Local setup instructions.
- Environment variables.
- Database migration instructions.
- Admin initialization instructions.
- Running the frontend and backend locally.
- Docker instructions.
- Testing instructions.
- Existing Supabase Storage configuration established in Phase 2.
- Deployment instructions.
- Assumptions and notable design decisions.

The README should explicitly surface the extended functionality implemented by the application, including folders, previews, downloads, user-only soft deletion, permanent file/folder deletion, audit logs, refresh tokens, dark mode, Docker support, and tests.

### Final verification

Perform a clean-environment smoke test covering the complete application journey:

1. Configure environment variables.
2. Install/build or start through the documented method.
3. Run database migrations.
4. Initialize the administrator.
5. Register a user.
6. Verify email.
7. Log in.
8. Upload multiple files.
9. Browse/search/filter/sort/paginate files.
10. Inspect extracted content and previews.
11. Create folders and move files.
12. Download and permanently delete files, confirming metadata/object removal and reclaimed quota.
13. Inspect user statistics.
14. Log in as administrator.
15. Manage users and roles.
16. Manage global files.
17. Inspect admin statistics and audit history.
18. Verify light/dark theme behavior.
19. Run the automated test suite.

## Phase 4 completion gate

Phase 4 is complete only when:

- The automated test suite passes consistently.
- The application can be started from documented clean-setup instructions.
- Docker configuration works for the intended local workflow.
- Production frontend, backend, database, email, and the existing Phase 2 Supabase Storage configuration work together without introducing another storage provider.
- Database migrations can be applied reliably.
- No known critical authorization or file-access issue remains.
- README instructions have been verified rather than only written.
- The complete production smoke-test path succeeds.

## Spec Kit kickoff

### `/speckit.specify` seed

Make Managing Your Files production-ready and reproducible. The complete application must have automated tests for critical authentication, authorization, file, folder, and administrator behavior; Docker-based local support; secure production configuration; verified deployment behavior; and comprehensive developer documentation. Review security, reliability, and performance across the existing system and close any gaps discovered during verification without changing intended product behavior.

### `/speckit.plan` constraints

Build on the existing architecture rather than restructuring working feature domains without a demonstrated need. Prioritize integration/API tests for security-critical behavior, targeted unit tests for complex logic, Docker support for reproducible local execution, environment-driven production configuration, verified Prisma migration procedures, verification and documentation of the existing Phase 2 Supabase Storage integration, CORS/auth security, database indexes, React Query cache behavior, and a README whose setup/deployment instructions are validated against a clean run. Do not add, migrate, or replace the object/file-storage provider in Phase 4.

---

# Phase Dependency Summary

```text
Phase 1
Platform Foundation + Authentication + Authorization
        ↓
Phase 2
Complete User File Management + Folders + User Analytics
        ↓
Phase 3
Administration + Admin Analytics + Audit UI + Dark Mode + UX Polish
        ↓
Phase 4
Tests + Docker + Deployment + Security/Performance Review + Documentation
```

Each phase should be considered complete only after its completion gate passes. If implementation uncovers a requirement change, update the relevant specification first and regenerate or reconcile the downstream plan/tasks rather than allowing the implementation to silently diverge from the specification.
