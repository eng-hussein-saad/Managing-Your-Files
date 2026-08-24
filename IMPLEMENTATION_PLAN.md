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

# Phase 3 — Administration, Application Polish, Testing & Final Quality

## Objective

Complete administrator capabilities, global operational visibility, audit inspection, application rebranding, remaining cross-application user experience features, automated testing, Docker support, final security and performance review, and developer documentation.

This phase should build on the existing authentication, authorization, Prisma data model, Supabase Storage integration, audit service, API conventions, React Query patterns, and UI components established in previous phases.

It must not reopen completed architecture or production-configuration decisions unless an actual implementation defect requires a change.

File and folder Trash, soft deletion, restoration, and recovery workflows are intentionally outside this phase and may be implemented later as a separate optional feature phase.

---

## Scope

### User administration

Administrator-only user management should provide:

* User listing.
* Search.
* Pagination.
* Relevant user metadata.
* Role editing.
* Permanent user deletion.
* Protection against unsafe administrative actions such as accidental administrator self-deletion or invalid role transitions where applicable.
* Audit events for administrative changes and permanent user deletion.

User soft deletion is removed from the application.

Remove the existing `deletedAt` field from the `User` Prisma model and database table.

Removal of user soft deletion should also include obsolete:

* Database indexes.
* Prisma queries.
* Authentication checks.
* Authorization checks.
* Middleware.
* Services.
* Validation.
* API response fields.
* Frontend types.
* Administrator UI states.
* Tests.
* Documentation.

Do not retain unused deleted-user lifecycle infrastructure.

### Permanent user deletion

Administrator user deletion should be an explicit permanent operation.

Permanent user deletion must safely handle relevant dependent state, including:

* Active refresh tokens.
* Verification codes or similar user-dependent authentication records where applicable.
* User-owned files.
* User-owned folders.
* Supabase Storage objects.
* Other dependent database records required by the current schema.

File objects must be removed from Supabase Storage before or as part of the established permanent-deletion workflow so successful user deletion does not leave orphaned stored objects.

Use safe database ordering or transactions where appropriate.

The operation must:

* Revoke or remove active refresh tokens.
* Remove required user-owned Supabase Storage objects.
* Remove dependent database records safely.
* Remove the user record.
* Preserve audit information according to the established audit policy.
* Return predictable failure behavior if required cleanup cannot be completed safely.

Do not implement:

* User soft deletion.
* User restoration.
* Deleted-user states.
* User retention periods.
* Scheduled user cleanup.
* Account recovery after administrator deletion.

---

### Global file administration

Administrators should be able to:

* View files across all users.
* Identify file owners.
* Search files.
* Filter files.
* Paginate files.
* Inspect relevant file metadata.
* View file size.
* Permanently delete files.

Administrator access must be enforced by the backend regardless of what the frontend displays.

Administrator file deletion should explicitly use the existing permanent file-deletion behavior.

Permanent administrator file deletion should:

* Validate administrator authorization.
* Remove the corresponding Supabase Storage object.
* Remove the file database record according to established data-integrity rules.
* Keep storage-related state consistent.
* Emit the appropriate audit event.
* Return predictable errors if required cleanup cannot be completed safely.

Internally, permanent-deletion services should use clear naming such as:

```ts
permanentlyDeleteFile()
permanentlyDeleteFolder()
permanentlyDeleteUser()
```

rather than ambiguous deletion-service names where practical.

This keeps current behavior explicit and allows a future Trash feature to introduce separate soft-delete operations without redefining administrator deletion semantics.

File and folder Trash behavior is not implemented in this phase.

---

### Admin dashboard

Provide administrator statistics including:

* Total users.
* Total files.
* Total storage usage.
* Most uploaded file types.
* Recent uploads.

Total platform storage usage should represent the storage consumed by currently stored file objects.

The backend should perform required aggregations efficiently and expose purpose-built statistics endpoints.

Statistics should use clear semantics and remain consistent with existing file and storage behavior.

---

### Audit log interface

Expose administrator-only audit history using the audit events accumulated throughout previous phases.

The audit experience should support useful inspection fields such as:

* Timestamp.
* Acting user.
* Action.
* Entity type.
* Target/entity identifier where appropriate.
* Relevant metadata that is safe to expose.

Add search, filtering, and pagination where they provide useful operational value without unnecessarily complicating the implementation.

Audit events should cover important operations across the system, including:

* Authentication.
* Uploads.
* Downloads.
* Permanent file deletions.
* Permanent folder deletions.
* Folder mutations.
* Role changes.
* Permanent user deletion.
* Other administrator actions.

Do not introduce Trash-specific audit behavior during this phase.

---

### Site rebranding

Rebrand the application from **Gold Era** to:

**Fileora**
*Your files. Organized your way.*

Apply the new branding consistently across the application, including where applicable:

* Application name and visible product branding.
* Navbar/sidebar branding.
* Authentication pages.
* Page metadata and browser titles.
* Dashboard and application-shell areas.
* Empty states or other user-facing copy that references the old name.
* README and project-facing documentation where the product name is shown.
* Any other visible references to Gold Era.

Add an application footer consistent with the existing design system and responsive layout.

The footer should:

* Display the **Fileora** branding.
* Include the tagline **"Your files. Organized your way."** where appropriate.
* Work correctly in both light and dark modes.
* Behave correctly across mobile, tablet, and desktop layouts.
* Remain visually consistent with the rest of the application.

Do not rename internal package names, environment-variable names, database objects, repository identifiers, or other technical identifiers solely for branding unless changing them is necessary for user-facing consistency.

---

### Dark mode

Implement a complete application theme experience with:

* Light mode.
* Dark mode.
* System preference where appropriate.
* Persisted user/browser preference.
* Theme-safe charts.
* Dialogs.
* Tables.
* Forms.
* Empty states.
* File previews.
* Administrator interfaces.
* Footer.

---

### Cross-application polish

Review and normalize UX across user and admin areas:

* Responsive behavior on mobile, tablet, and desktop.
* Navigation states.
* Consistent page headers and actions.
* Loading skeletons.
* Empty states.
* Error states.
* Toast messages.
* Destructive-action confirmation.
* Accessible form labels and keyboard behavior.
* Appropriate Framer Motion usage.
* Consistent file-size formatting.
* Consistent date formatting.
* Consistent pagination behavior.
* Consistent query-state handling.
* Consistent administrator table behavior.

Permanent and destructive actions should have clear confirmation where appropriate, particularly:

* File deletion.
* Folder deletion.
* Administrator file deletion.
* Administrator user deletion.

---

### Automated testing

Add automated tests focused on high-value behavior and security boundaries.

#### Authentication coverage

Include cases such as:

* Successful registration.
* Duplicate registration rejection.
* Password validation/login failure.
* Email verification success/failure.
* Expired or invalid OTP handling.
* Refresh-token behavior.
* Authentication-required endpoint rejection.
* Administrator authorization rejection for normal users.

#### User model and user administration coverage

Include cases such as:

* `User.deletedAt` no longer existing in the Prisma model.
* User queries no longer depending on soft-deletion state.
* Authentication no longer checking user soft-deletion state.
* User listing authorization.
* User search.
* User pagination.
* Role updates.
* Invalid role transitions where applicable.
* Permanent user deletion.
* Refresh-token cleanup or revocation during permanent user deletion.
* Required dependent-record cleanup.
* User-owned file cleanup.
* User-owned folder cleanup.
* User-owned Supabase Storage object removal.
* Administrator self-deletion protection where applicable.

Do not add tests for user soft deletion or restoration.

#### File/folder coverage

Include cases such as:

* Valid upload.
* Invalid file type.
* Oversized file.
* Multiple-file behavior where relevant.
* Ownership enforcement.
* Search/filter/pagination behavior for important cases.
* Permanent file deletion.
* Supabase object removal during permanent file deletion.
* Storage-related state remaining consistent after deletion.
* Permanent folder deletion.
* Recursive file cleanup during permanent folder deletion where applicable.
* Secure download authorization.
* Secure preview authorization.
* Folder ownership.
* Folder mutation rules.

Do not add Trash, restore, soft-delete, or Empty Trash tests during this phase.

#### Administrator coverage

Include cases such as:

* Administrator endpoint authorization.
* Normal-user rejection from administrator APIs.
* User listing.
* Role updates.
* Permanent user deletion.
* Global file access.
* File-owner visibility.
* File search/filter/pagination.
* Administrator permanent file deletion.
* Statistics access control.
* Audit-history access control.

Add focused unit tests for complex services or utilities where they provide value, and integration/API tests for the most important end-to-end backend behavior.

Prioritize meaningful security and business behavior rather than maximizing raw test count.

---

### Docker support

Provide Docker support for reproducible local execution.

Include appropriate Dockerfiles and Docker Compose configuration so the project can run its required local services with minimal setup.

Containerization must:

* Use environment variables rather than baking configuration into images.
* Avoid baking secrets into images.
* Support the existing monorepo structure.
* Support the existing frontend and backend applications without changing their architecture.
* Provide appropriate `.dockerignore` files.
* Allow the intended local development or production-like workflow to be started through documented Docker commands.

Do not restructure the application solely to make containerization easier.

---

### Security and reliability review

Review the implemented application for remaining security or reliability gaps and correct issues where necessary.

Review areas should include:

* Authorization on every sensitive endpoint.
* Administrator authorization on every administrator endpoint.
* File ownership enforcement.
* Folder ownership enforcement.
* Upload validation.
* Filename/path safety.
* Password handling.
* Access-token handling.
* Refresh-token handling and invalidation.
* OTP handling.
* Permanent user deletion.
* Administrator self-deletion protection.
* Permanent file deletion.
* Permanent folder deletion.
* Supabase Storage cleanup.
* Residual database records or storage objects after successful permanent deletion.
* Accidental sensitive data in API responses.
* Accidental sensitive data in audit logs.
* Error messages that expose implementation details.
* Unsafe role transitions.
* Missing destructive-action validation.

Remove obsolete security logic that existed solely for `User.deletedAt`.

Do not redesign working authentication, storage, or authorization architecture unless an actual defect requires a change.

---

### Performance review

Review and improve reasonable behavior for:

* Paginated user file lists.
* Administrator user lists.
* Administrator file lists.
* Statistics queries.
* Audit-log queries.
* Upload progress.
* Preview/download paths.
* Database indexes supporting frequent queries.
* React Query caching.
* React Query invalidation after mutations.
* Avoiding unnecessary frontend refetches.

Review and remove obsolete indexes associated exclusively with `User.deletedAt`.

Use server-side pagination/filtering for administrator data sets.

Only introduce optimizations where they address an identifiable issue or clearly improve an important application path.

Do not perform speculative architectural optimization.

---

### README and developer experience

Create a complete `README.md` containing:

* Project overview.
* Feature overview.
* Technology stack.
* Repository/folder structure.
* Architecture summary.
* Local setup instructions.
* Environment variables.
* Database migration instructions.
* Admin initialization instructions.
* Running the frontend and backend locally.
* Docker instructions.
* Testing instructions.
* Supabase Storage configuration.
* Deployment instructions.
* Assumptions and notable design decisions.

The README should use the **Fileora** product name and tagline where appropriate.

The README should explicitly surface implemented extended functionality including:

* Folder management.
* File previews.
* File downloads.
* Permanent file/folder deletion.
* Administrator user management.
* Administrator global file management.
* Audit logs.
* Refresh-token authentication.
* Dark mode.
* Docker support.
* Automated tests.

Document that:

* Administrator user deletion is permanent.
* `User` does not use a `deletedAt` lifecycle field.
* Current file and folder deletion is permanent.
* File/folder Trash and restore are not part of the current implementation.

Do not document a Trash or restore feature unless it is implemented in a later phase.

---

### Future extensibility boundary

Do not implement file/folder Trash during this phase.

However, current permanent-deletion behavior should remain explicit enough that a future optional Trash phase can extend deletion semantics without unnecessarily rewriting administrator functionality.

In particular:

* Administrator deletion should remain permanently destructive.
* Existing storage-removal logic should remain reusable.
* Existing quota/storage-accounting logic should remain reusable.
* Existing audit infrastructure should remain reusable.
* Existing ownership and authorization logic should remain reusable.
* Permanent file/folder deletion services should be separable from any future soft-delete behavior.

A future Trash phase may introduce separate operations such as:

```ts
moveFileToTrash()
restoreFile()

moveFolderToTrash()
restoreFolder()

emptyTrash()
```

without changing the meaning of:

```ts
permanentlyDeleteFile()
permanentlyDeleteFolder()
```

Do not implement those future operations now.

---

### Final implementation validation

Before considering the phase complete:

* Remove `deletedAt` from the `User` Prisma model.
* Apply the corresponding Prisma/database migration.
* Remove obsolete backend user-soft-deletion logic.
* Remove obsolete frontend user-soft-deletion logic.
* Verify no user-soft-delete API or UI remains unintentionally accessible.
* Build the frontend successfully.
* Build the backend successfully.
* Run the automated test suite.
* Verify administrator user listing, search, pagination, and role editing.
* Verify permanent administrator user deletion.
* Verify refresh-token cleanup during permanent user deletion.
* Verify required user-owned file/folder cleanup during permanent user deletion.
* Verify Supabase Storage cleanup during permanent user deletion.
* Verify global administrator file management.
* Verify administrator permanent file deletion.
* Verify administrator statistics.
* Verify administrator audit-history access.
* Verify normal users cannot call administrator APIs directly.
* Verify dark mode across important application surfaces.
* Verify responsive behavior across common viewport sizes.
* Verify Docker configuration starts the intended services correctly.
* Review security and reliability.
* Review important performance paths.
* Verify README instructions against the completed implementation.
* Resolve implementation errors discovered during these checks.

---

## Phase 3 completion gate

Phase 3 is complete only when:

* The `User` Prisma model and database table no longer contain `deletedAt`.
* No backend, frontend, authentication, authorization, or administrative logic depends on user soft-deletion state.
* User soft deletion and user restoration are not implemented.
* Administrators can securely list, search, and paginate users.
* Administrators can edit user roles safely.
* Administrators can permanently delete users.
* Permanent user deletion correctly handles active refresh tokens and required dependent state.
* Permanent user deletion safely removes required user-owned Supabase Storage objects and database records.
* Unsafe administrator self-deletion is prevented where applicable.
* Administrators can view files across all users.
* Administrators can identify file owners.
* Administrators can search, filter, and paginate global files.
* Administrators can permanently delete files.
* Administrator deletion correctly removes required Supabase Storage objects and database records.
* Normal users are blocked from every administrator API even when calling it directly.
* Administrator statistics are accurate.
* Administrator audit history is usable and access-controlled.
* Important operations emit appropriate audit events.
* All user-facing Gold Era branding has been replaced with **Fileora**.
* The tagline **"Your files. Organized your way."** is used consistently where appropriate.
* The application includes a responsive, theme-compatible footer.
* No obvious outdated Gold Era branding remains in the user-facing application.
* Dark mode works across the complete application without obvious unreadable or unthemed areas.
* User and administrator experiences behave correctly across common viewport sizes.
* Loading, empty, error, success, and destructive-action states are consistently handled.
* The automated test suite passes consistently.
* Critical authentication, authorization, file, folder, user-management, and administrator behavior is covered by tests.
* Docker configuration works for the intended local workflow.
* No known critical authorization or file-access issue remains.
* Important database queries and frontend data-fetching behavior have been reviewed for obvious performance problems.
* The frontend builds successfully.
* The backend builds successfully.
* The README accurately documents the completed application and its setup.
* File/folder Trash or restore functionality has not been unnecessarily introduced into this phase.
* No unnecessary architectural restructuring has been introduced during finalization.

---

## Spec Kit kickoff

### `/speckit.specify` seed

Complete the administrator and final-quality layer of **Fileora — Your files. Organized your way.**

Simplify user lifecycle handling by removing user soft deletion entirely. Remove `deletedAt` from the `User` Prisma model and database table together with queries, indexes, authentication checks, authorization behavior, API fields, frontend types, UI states, tests, and other code that exists solely to support user soft deletion.

Administrator user deletion should be permanent. Permanent deletion must safely handle active refresh tokens, required dependent database records, user-owned files and folders, associated Supabase Storage objects, and audit requirements. Do not implement user restoration or any deleted-user lifecycle.

Complete secure administrator user management with listing, search, pagination, role editing, permanent deletion, and protection against unsafe administrative actions.

Complete global administrator file management with owner visibility, search, filtering, pagination, metadata inspection, and permanent file deletion. Administrator deletion remains permanently destructive and should reuse the existing Supabase Storage and database cleanup behavior.

Complete the administrator dashboard with total users, total files, total storage usage, most-uploaded file types, and recent uploads. Expose accumulated audit history through a secure administrator-only inspection interface.

Rebrand the existing application from Gold Era to **Fileora**, using the tagline **"Your files. Organized your way."**, and add a responsive footer compatible with light and dark themes.

Complete persistent light/dark/system theming, responsive application-wide interaction polish, loading/error/empty/destructive states, and consistent user and administrator UX.

Finalize the application by adding automated tests for critical authentication, authorization, permanent deletion, file/folder behavior, and administrator functionality; adding Docker support for reproducible execution; reviewing security, reliability, and performance; and producing comprehensive developer documentation.

Do not implement file/folder Trash, soft deletion, restoration, Empty Trash, retention policies, or other recovery workflows during this phase. These may be introduced later as a separate optional feature phase.

Build on the existing architecture and integrations rather than reopening completed configuration or design decisions.

### `/speckit.plan` constraints

Reuse the existing authentication, role middleware, Prisma data model, Supabase Storage abstraction, audit service, API conventions, React Query patterns, and UI components rather than creating parallel implementations.

Remove `deletedAt` from the `User` model and create the required Prisma migration.

Remove code that:

* Filters users by deletion timestamp.
* Checks deleted-user state during authentication.
* Checks deleted-user state during authorization.
* Exposes deleted-user status through APIs.
* Displays deleted-user state in the frontend.
* Implements user restoration or soft deletion.

Do not implement user soft deletion, user restoration, deleted-user states, user retention periods, or scheduled user cleanup.

Administrator user deletion is a permanent operation. Reuse existing refresh-token, file/folder, Supabase Storage, and audit services to safely perform required cleanup rather than creating parallel infrastructure.

Administrator file deletion is also a permanent operation.

Prefer explicit permanent-deletion service names such as:

```ts
permanentlyDeleteFile()
permanentlyDeleteFolder()
permanentlyDeleteUser()
```

where practical so future deletion behavior remains unambiguous.

Do not implement file/folder Trash, file/folder soft deletion, restore operations, Empty Trash, automatic Trash expiration, scheduled Trash cleanup, retention configuration, or file versioning.

Do not add `deletedAt` fields to File or Folder as part of this phase solely in preparation for future Trash functionality.

A future optional Trash phase should extend the existing permanent-deletion architecture rather than requiring current administrator functionality to be redesigned.

Rebrand user-facing application surfaces from Gold Era to **Fileora**, using the tagline **"Your files. Organized your way."**, and add a responsive theme-compatible footer.

Branding changes should focus on user-facing presentation and documentation. Do not perform unnecessary technical renames of packages, environment variables, database objects, repository identifiers, or other internal identifiers.

Use efficient database aggregation for statistics and server-side pagination/filtering for administrator data sets.

Finish audit-event coverage and implement the administrator audit interface.

Add persistent light/dark/system theming with compatible charts and components.

Prioritize:

* Integration/API tests for security-critical behavior.
* Targeted unit tests for complex logic.
* Docker support for reproducible execution.
* Database indexes where justified.
* React Query cache behavior.
* Security and reliability fixes discovered during review.
* Performance fixes for identifiable problems.
* Completion of the project README.

Do not restructure working feature domains without a demonstrated need.

Do not create tasks for production environment configuration, CORS/cookie deployment configuration, Prisma production migration execution, administrator bootstrap execution, email-provider production setup, Supabase production setup, or other manual deployment operations that are already configured outside this implementation phase.

# Phase 4 — Complete UI Redesign & Design System Migration

## Objective

Replace the existing Fileora frontend presentation with the approved redesigned interface while preserving the completed application functionality, business rules, authentication architecture, authorization behavior, API contracts, React Query behavior, and backend integrations established in Phases 1–3.

The redesign has already been defined in:

```text
fiora-app.html
```

**`fiora-app.html` is the single source of truth for the new UI design and responsive behavior.**

The HTML design already includes approved responsive layouts for:

* Desktop.
* Tablet.
* Mobile.

Phase 4 is primarily a frontend implementation and migration phase. Its purpose is to translate the approved HTML design into the existing Next.js application using the established frontend architecture and required technology stack.

This phase must not redesign backend architecture or silently change application behavior merely to accommodate the new presentation.

---

## Design source of truth

The file:

```text
fiora-app.html
```

is the authoritative reference for the new Fileora visual design.

It should be treated as the single source of truth for areas such as:

* Overall visual language.
* Application layout.
* Page composition.
* Sidebar and navigation presentation.
* Header design.
* Typography.
* Colors.
* Spacing.
* Borders.
* Border radii.
* Shadows.
* Cards.
* Tables.
* Buttons.
* Inputs.
* Search controls.
* Filters.
* File/folder presentation.
* Dashboard presentation.
* Administrator interfaces.
* Dialog presentation.
* Empty states.
* Visual hierarchy.
* Desktop responsive behavior.
* Tablet responsive behavior.
* Mobile responsive behavior.
* Light/dark theme presentation where represented.
* Other visual and interaction patterns demonstrated by the approved design.

Do not preserve existing UI styling or responsive behavior merely because it is already implemented if it conflicts with `fiora-app.html`.

Where the existing frontend and `fiora-app.html` disagree visually or responsively, **`fiora-app.html` takes precedence**.

However, `fiora-app.html` is the source of truth for **design and presentation, not application business behavior**.

Existing completed specifications and implementation remain authoritative for:

* Authentication behavior.
* BFF authentication architecture.
* Access-token handling.
* Refresh-token handling.
* Authorization.
* User/admin roles.
* API contracts.
* File ownership.
* Folder ownership.
* Upload behavior.
* File/folder operations.
* Permanent deletion semantics.
* Supabase Storage behavior.
* Audit behavior.
* Pagination semantics.
* Search/filter/sort behavior.
* Validation.
* Security rules.
* Administrator capabilities.
* Other completed application requirements.

If the design does not explicitly display an existing required state or action, the functionality must not be removed. Instead, integrate it into the new design using the closest appropriate visual and responsive patterns already established by `fiora-app.html`.

---

## Scope

### Design-system extraction

Analyze the complete `fiora-app.html` before rewriting individual application pages.

Identify and implement its reusable visual system, including conventions for:

* Typography hierarchy.
* Application colors.
* Background surfaces.
* Card styles.
* Border styles.
* Radius scale.
* Shadow treatment.
* Spacing.
* Buttons.
* Icon buttons.
* Form controls.
* Search inputs.
* Select/filter controls.
* Badges.
* Status indicators.
* Tables.
* File/folder rows or cards.
* Dropdown menus.
* Dialogs.
* Tooltips where applicable.
* Pagination.
* Tabs where applicable.
* Skeleton/loading states.
* Empty states.
* Error presentation.
* Toast presentation.
* Sidebar navigation.
* Mobile navigation.
* Page headers.
* Dashboard statistic cards.
* Chart containers.

Translate these patterns into reusable Next.js/React/Tailwind components rather than copying large sections of prototype markup independently into individual routes.

The implementation should reproduce the approved design while remaining maintainable within the existing application architecture.

---

### Application shell redesign

Replace the current application shell with the structure represented by `fiora-app.html`.

This includes, where represented by the approved design:

* Main application navigation.
* Sidebar.
* Top navigation/header.
* Page content container.
* Active navigation states.
* User/profile controls.
* Administrator navigation.
* Theme controls.
* Fileora branding.
* Desktop navigation behavior.
* Tablet navigation behavior.
* Mobile navigation behavior.

Preserve appropriate separation between:

* Public/authentication pages.
* Authenticated user pages.
* Administrator pages.

Do not weaken route protection or authorization during UI restructuring.

---

### Authentication UI redesign

Migrate the existing authentication functionality into the approved visual language.

Apply the new design to:

* Registration.
* Login.
* Email verification.
* Resend verification flow.
* Profile.
* Logout interactions.
* Invalid authentication states.
* Expired-session states.
* Unauthorized states.
* Forbidden states.

Preserve the Phase 1 authentication architecture and behavior.

Do not redesign:

* The BFF authentication model.
* Express authentication responsibilities.
* Access-token storage.
* Refresh-token storage.
* Refresh rotation.
* Refresh revocation.
* Authentication API contracts.

unless an actual implementation defect is discovered.

Authentication screens should reproduce the desktop, tablet, and mobile behavior established by `fiora-app.html`.

---

### User dashboard redesign

Reimplement the user dashboard using the design patterns established by `fiora-app.html`.

The dashboard must continue exposing:

* Total uploaded files.
* Storage usage.
* File-type distribution.
* Upload history.

Charts and statistics should visually match the approved design while continuing to consume the existing statistics APIs.

Ensure dashboard layouts and charts reproduce the intended desktop, tablet, and mobile behavior.

Charts must remain usable in supported themes.

---

### Files and folders redesign

Apply the approved Fileora design to the complete file-management experience.

This includes:

* My Files.
* File listing.
* Folder listing.
* Folder navigation.
* Breadcrumbs.
* Search.
* Filtering.
* Sorting.
* Pagination.
* File/folder actions.
* File details.
* File metadata.
* Extracted content.
* File preview.
* Image preview.
* Download actions.
* File deletion.
* Folder creation.
* Folder rename.
* Folder deletion.
* Moving files between folders.
* Empty states.
* Loading states.
* Error states.

Existing server-driven search, filtering, sorting, and pagination behavior must be preserved.

Existing ownership and authorization behavior must not change.

Desktop, tablet, and mobile file/folder layouts must follow the responsive behavior represented by `fiora-app.html`.

---

### Upload experience redesign

Reimplement the upload experience according to the approved design while preserving the established upload functionality.

Continue supporting:

* Drag-and-drop uploading.
* File picker uploading.
* Multiple files.
* Per-file progress.
* Client-side validation.
* Backend authoritative validation.
* Upload failure handling.
* File-size restrictions.
* File-type restrictions.
* Successful upload feedback.

The new upload presentation may reorganize these interactions visually, but it must not remove existing functionality.

The upload interface must follow the desktop, tablet, and mobile behavior established by `fiora-app.html`.

---

### File details and preview redesign

Update file details and preview surfaces to match the new UI.

Continue supporting appropriate presentation of:

* Filename.
* MIME/file type.
* File size.
* Upload date.
* Folder/location.
* Extracted content.
* Preview.
* Download.
* Permanent deletion.

Supported image/document/text previews and unsupported-preview states must continue working.

File details and preview layouts must adapt according to the responsive patterns established by `fiora-app.html`.

---

### Administrator interface redesign

Apply the approved design language consistently to all administrator functionality.

#### User management

Preserve:

* User listing.
* Search.
* Pagination.
* User metadata.
* Role editing.
* Permanent user deletion.
* Required confirmation flows.
* Administrator self-deletion protection.

#### Global file management

Preserve:

* Global file listing.
* File-owner visibility.
* Search.
* Filtering.
* Pagination.
* File metadata.
* Permanent administrator deletion.

#### Admin dashboard

Preserve:

* Total users.
* Total files.
* Total storage usage.
* Most-uploaded file types.
* Recent uploads.

#### Audit interface

Preserve:

* Audit history.
* Acting user.
* Action.
* Entity type.
* Entity identifier where applicable.
* Timestamp.
* Safe metadata.
* Search/filter/pagination where already implemented.

Administrator authorization must remain enforced by the backend independently of the redesigned frontend.

Administrator layouts, tables, controls, dashboards, and navigation must reproduce the desktop, tablet, and mobile presentation established by `fiora-app.html`.

---

### Responsive implementation

Implement the responsive behavior already defined in `fiora-app.html`.

The approved HTML design includes completed responsive layouts for:

* Desktop.
* Tablet.
* Mobile.

The Next.js implementation should reproduce those layouts and transitions faithfully rather than independently redesigning responsive behavior.

Responsive implementation should preserve the behavior demonstrated by `fiora-app.html` for areas such as:

* Sidebar/navigation.
* Headers.
* Page layouts.
* Tables.
* File and folder listings.
* Dashboard statistics.
* Charts.
* Search controls.
* Filtering controls.
* Page actions.
* Dialogs.
* Forms.
* File previews.
* Authentication pages.
* Administrator interfaces.
* Spacing.
* Content density.
* Grid changes.
* Component stacking.
* Component rearrangement.
* Mobile-specific navigation or controls where present.

Do not treat tablet or mobile layouts as merely scaled-down versions of desktop.

Do not invent an alternative responsive system when `fiora-app.html` already specifies the intended behavior.

When translating the prototype into React/Tailwind, inspect how each relevant component changes between desktop, tablet, and mobile and reproduce those changes using maintainable responsive components and breakpoints.

If an existing application feature or state is not represented in `fiora-app.html`, adapt it using the responsive patterns established by the closest equivalent design elements.

---

### Light and dark themes

Preserve the completed theme functionality from Phase 3.

The redesigned application must continue supporting:

* Light mode.
* Dark mode.
* System preference.
* Persisted theme preference.

All redesigned components must be reviewed in both light and dark modes, including:

* Navigation.
* Cards.
* Tables.
* Forms.
* Dialogs.
* File previews.
* Charts.
* Empty states.
* Loading states.
* Administrator interfaces.

If `fiora-app.html` defines specific light/dark theme treatments, those treatments should guide the implementation.

Where an application state is absent from the prototype, extend the same theme language rather than falling back to legacy styling.

---

### Motion and interaction behavior

Use Framer Motion where useful to reproduce or enhance interactions implied by the approved design.

Motion should remain focused and subtle.

Potential areas include:

* Page transitions.
* Sidebar transitions.
* Dialog transitions.
* Dropdowns.
* Upload interactions.
* Hover/press feedback.
* Empty-state transitions.
* File/folder interactions.

Do not introduce excessive animation that negatively affects responsiveness, usability, or performance.

---

### Loading, empty, error, and feedback states

Ensure every important asynchronous redesigned surface has appropriate states.

These should include:

* Loading skeletons.
* Empty states.
* Error states.
* Validation feedback.
* Success feedback.
* Toast notifications.
* Disabled/submitting states.
* Destructive-operation confirmation.
* Retry behavior where appropriate.

If `fiora-app.html` does not contain a particular required application state, create that state using the same design language rather than falling back to the old UI.

These states must also behave appropriately across desktop, tablet, and mobile.

---

### Accessibility and interaction quality

The redesign must retain or improve basic accessibility.

Review:

* Semantic HTML.
* Form labels.
* Keyboard navigation.
* Focus visibility.
* Dialog focus behavior.
* Button labeling.
* Icon-only actions.
* Accessible names.
* Color contrast.
* Disabled states.
* Error messaging.
* Responsive touch targets.

Do not sacrifice accessibility solely to achieve closer visual similarity to the prototype.

---

### Frontend architecture

Implement the new design within the existing frontend architecture.

Prefer:

* Reusable components.
* Shared design primitives.
* Existing React Query hooks.
* Existing Axios infrastructure.
* Existing authentication context/state.
* Existing route structure where practical.
* Existing domain logic.
* Existing API clients.
* Existing validation logic where still appropriate.

Refactoring frontend components is expected where necessary to implement the redesigned system cleanly.

However, do not create duplicate business logic solely because the new design organizes content differently.

Maintain a clear separation where practical:

```text
Presentation
     ↓
Application hooks/state
     ↓
API/data layer
```

The redesign should change presentation aggressively while changing application behavior conservatively.

---

### Legacy UI cleanup

After equivalent functionality has been migrated to the new design:

* Remove obsolete components.
* Remove obsolete layout components.
* Remove unused Tailwind classes/styles.
* Remove unused design tokens.
* Remove abandoned UI utilities.
* Remove obsolete assets.
* Remove unused imports.
* Remove dead frontend code created by the old visual system.

Do not retain two parallel UI systems unless a temporary migration requirement makes it unavoidable.

Do not remove application logic solely because an old UI component was its previous entry point.

---

### Branding consistency

Ensure the redesigned interface consistently uses:

**Fileora**

and:

**Your files. Organized your way.**

Remove remaining visible references to previous application branding.

Preserve the Phase 3 rule that internal technical identifiers do not need to be renamed solely for branding purposes.

---

## Explicit non-goals

Phase 4 must not intentionally introduce:

* New backend architecture.
* New authentication architecture.
* Different refresh-token behavior.
* Different authorization rules.
* Different file ownership behavior.
* Different folder ownership behavior.
* Different permanent-deletion semantics.
* File/folder Trash.
* File/folder soft deletion.
* Restore functionality.
* User soft deletion.
* New storage providers.
* Supabase Auth.
* New database architecture.
* API redesign solely for UI convenience.
* Major unrelated performance optimization.
* New product features not represented by existing requirements.

A backend change is acceptable only when an actual defect or unavoidable frontend integration requirement is discovered.

Such changes should remain minimal and preserve established behavior.

---

## Functional regression requirements

The redesign must not be considered complete based only on visual similarity.

Existing functionality must continue working after migration.

Verify at minimum:

### Authentication

* Registration.
* Login.
* Email verification.
* Resend verification.
* Session restoration.
* Access-token refresh.
* Logout.
* Protected routes.
* Administrator route protection.

### File management

* Upload.
* Multi-file upload.
* Upload progress.
* File validation.
* Search.
* Filter.
* Sort.
* Pagination.
* File details.
* Preview.
* Download.
* Permanent deletion.

### Folder management

* Create.
* Rename.
* Navigate.
* Nested folders.
* Breadcrumbs.
* Move files.
* Delete according to existing rules.

### User dashboard

* File statistics.
* Storage statistics.
* File-type statistics.
* Upload-history statistics.

### Administrator functionality

* User listing.
* User search.
* User pagination.
* Role changes.
* Permanent user deletion.
* Global file listing.
* Global file search/filter/pagination.
* File-owner visibility.
* Administrator file deletion.
* Administrator statistics.
* Audit history.

### Global application behavior

* React Query invalidation.
* Loading states.
* Error states.
* Empty states.
* Toast feedback.
* Confirmation dialogs.
* Desktop responsiveness.
* Tablet responsiveness.
* Mobile responsiveness.
* Light mode.
* Dark mode.
* System theme.
* Fileora branding.

---

## Testing and validation

Existing automated tests from Phase 3 must continue passing.

Update frontend tests where implementation details legitimately change because of the redesigned component structure.

Do not weaken behavioral or security tests merely to accommodate the redesign.

Add targeted UI/component tests where they provide meaningful regression protection for important redesigned interactions.

Perform final validation for:

* Frontend build.
* TypeScript errors.
* Linting where configured.
* Automated test suite.
* Browser console errors.
* React errors/warnings.
* Broken routes.
* Broken API interactions.
* Light mode.
* Dark mode.
* Loading states.
* Empty states.
* Error states.
* Authentication restoration.
* User navigation.
* Administrator navigation.
* Critical user workflows.
* Critical administrator workflows.

### Responsive validation

Compare the implemented application directly against `fiora-app.html` for:

* Desktop layouts.
* Tablet layouts.
* Mobile layouts.
* Navigation behavior at each form factor.
* Component stacking and rearrangement.
* Page spacing.
* Content density.
* Tables and data-heavy views.
* File/folder views.
* Dashboard cards.
* Charts.
* Search/filter controls.
* Forms.
* Dialogs.
* Authentication screens.
* File previews.
* Administrator interfaces.
* Loading states.
* Empty states.
* Error states.

The goal is not merely for the application to be generally responsive.

The implemented responsive behavior should reproduce the approved responsive design defined by `fiora-app.html`.

---

## Phase 4 completion gate

Phase 4 is complete only when:

* `fiora-app.html` has been used as the single source of truth for the new UI design.
* `fiora-app.html` has been used as the single source of truth for desktop, tablet, and mobile responsive presentation.
* The existing visual system has been replaced by the approved Fileora design across all important application surfaces.
* The application uses a coherent reusable design system rather than isolated page-specific copies of prototype markup.
* Authentication pages match the new design.
* The authenticated application shell matches the new design.
* User dashboard pages match the new design.
* File and folder management match the new design.
* Upload interactions match the new design.
* File details and preview experiences match the new design.
* Administrator dashboard matches the new design.
* Administrator user management matches the new design.
* Administrator global file management matches the new design.
* Audit history matches the new design.
* Fileora branding is consistent.
* Desktop layouts accurately reproduce the approved HTML design.
* Tablet layouts accurately reproduce the approved HTML design.
* Mobile layouts accurately reproduce the approved HTML design.
* Navigation reproduces the appropriate responsive behavior defined in `fiora-app.html`.
* Tables and data-heavy views reproduce the intended responsive behavior.
* File/folder views reproduce the intended responsive behavior.
* Dashboard layouts reproduce the intended responsive behavior.
* Forms and dialogs reproduce the intended responsive behavior.
* Administrator interfaces reproduce the intended responsive behavior.
* Light mode is visually complete.
* Dark mode is visually complete.
* Required loading, empty, validation, success, and error states use the new design language.
* Destructive actions continue to require appropriate confirmation.
* All existing authentication and authorization behavior remains functional.
* Existing BFF authentication architecture remains intact.
* Existing React Query/API behavior remains functional.
* File and folder ownership protections remain intact.
* Administrator authorization remains intact.
* Existing permanent-deletion semantics remain intact.
* Existing Supabase Storage integration remains intact.
* No required application capability has been removed merely because it was absent from the HTML prototype.
* Obsolete legacy UI components and styles have been removed where safe.
* No unnecessary duplicate UI system remains.
* Existing automated tests continue to pass after legitimate test updates.
* The frontend builds successfully.
* No major runtime or browser-console errors remain.
* No unnecessary backend or architectural redesign has been introduced.

---

## Spec Kit kickoff

### `/speckit.specify` seed

Completely redesign the Fileora frontend using the approved `fiora-app.html` design.

`fiora-app.html` is the **single source of truth for the new UI design and responsive behavior**.

The file already contains approved desktop, tablet, and mobile layouts. Reproduce those layouts and their responsive behavior faithfully in the Next.js application rather than independently redesigning responsiveness.

Use `fiora-app.html` as the authoritative reference for layout, visual hierarchy, navigation presentation, typography, colors, spacing, surfaces, components, tables, cards, forms, buttons, file-management presentation, dashboards, administrator interfaces, responsive component behavior, and other visual patterns.

Replace the existing application presentation with this design across authentication, application navigation, user dashboard, files and folders, upload flows, file details and previews, profile, administrator dashboard, administrator user management, global file management, audit history, theme behavior, and shared application states.

Preserve all functionality implemented in Phases 1–3. The HTML design is authoritative for presentation, but existing application specifications and working implementation remain authoritative for authentication, authorization, BFF behavior, API contracts, file/folder ownership, uploads, search/filter/sort/pagination, permanent deletion, Supabase Storage, audit behavior, administrator capabilities, validation, and other business rules.

If an existing required state or action is not explicitly represented in `fiora-app.html`, do not remove it. Integrate it using the same visual and responsive design language established by the closest equivalent elements in the approved design.

Extract reusable components and a coherent design system from the approved HTML rather than copying large amounts of prototype markup independently into every page.

Ensure light mode, dark mode, loading states, empty states, errors, success feedback, dialogs, destructive confirmations, and accessibility remain complete.

Do not introduce new product functionality or redesign the backend architecture as part of this phase.

---

### `/speckit.plan` constraints

Treat `fiora-app.html` as the **single source of truth for both Fileora's visual design and its desktop, tablet, and mobile responsive behavior**.

Before changing individual application pages, inspect the complete HTML design and identify its:

* Shared design language.
* Page shell.
* Navigation model.
* Typography.
* Spacing.
* Colors.
* Surfaces.
* Component patterns.
* States.
* Desktop behavior.
* Tablet behavior.
* Mobile behavior.
* Light/dark theme treatment.

Translate those patterns into reusable Next.js/React/Tailwind components rather than reproducing the prototype as unrelated page-specific markup.

Where the current frontend visually or responsively conflicts with `fiora-app.html`, the approved HTML design takes precedence.

Do not derive an independent responsive design or simply scale the desktop interface using generic breakpoints when `fiora-app.html` already demonstrates the intended tablet and mobile behavior.

Inspect how navigation, grids, tables, controls, page actions, content density, dialogs, forms, dashboards, file/folder views, and administrator interfaces change between desktop, tablet, and mobile, and translate those behaviors into maintainable responsive React/Tailwind components.

Where `fiora-app.html` does not represent an existing required behavior, preserve that behavior and design the missing state or interaction consistently with the closest visual and responsive pattern in the approved design.

Reuse the existing:

* Route structure where practical.
* Authentication architecture.
* BFF Route Handlers.
* Authentication state.
* Axios infrastructure.
* React Query hooks.
* API clients.
* Backend APIs.
* Validation behavior.
* File/folder domain logic.
* Administrator APIs.
* Statistics APIs.
* Audit infrastructure.
* Supabase Storage integration.

Do not rewrite working application or business logic solely because the presentation changes.

Preserve the architecture in which Express remains authoritative for authentication, authorization, data access, storage decisions, and business behavior.

Do not expose refresh tokens to browser JavaScript or alter the established BFF security architecture.

Do not change file/folder ownership or permanent deletion behavior.

Do not add Trash, restore, soft-delete, or other new lifecycle functionality.

Use Framer Motion selectively for interactions and transitions consistent with the approved design.

Preserve and adapt the existing light/dark/system theme functionality.

Ensure charts, dialogs, tables, file previews, forms, navigation, and administrator interfaces are compatible with the redesigned theme.

Explicitly validate desktop, tablet, and mobile implementations against `fiora-app.html`.

Remove legacy frontend components/styles only after their required behavior has been successfully migrated.

Run existing automated tests and update tests only when component structure or presentation legitimately changes.

Do not weaken behavioral or security tests.

Finish by validating the complete frontend build and all critical user/admin workflows.

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
Administration + Admin Analytics + Audit UI + Dark Mode +
UX Polish + Tests + Docker + Security/Performance Review +
Documentation
        ↓
Phase 4
Complete Fileora UI Redesign +
Design System Migration +
Desktop/Tablet/Mobile Responsive Implementation +
Functional Regression Validation
```

Each phase should be considered complete only after its completion gate passes.

Phase 4 intentionally occurs after the application's required functionality and final-quality work are established so that the redesign can focus on replacing the presentation layer without destabilizing the completed application architecture.

If implementation uncovers a genuine requirement or functionality change, update the relevant specification first and reconcile downstream plans/tasks rather than silently changing application behavior to match the visual prototype.

