<!--
Sync Impact Report
- Version change: 1.2.0 -> 2.0.0
- Modified principles:
  - IV. Reusable, Complete User Experiences (theme support staged by delivery phase)
  - VI. Audit Important State Changes (default access and retention policy added)
- Added principles: none
- Modified sections:
  - Delivery Workflow and Quality Gates
- Added sections: none
- Removed sections: none
- Follow-up TODOs: none
-->
# Managing Your Files Constitution

## Core Principles

### I. Strict TypeScript and Layered Design
All frontend and backend application code MUST use TypeScript with strict type checking enabled.
Routes and controllers MUST coordinate requests rather than contain business or persistence logic.
Business rules, validation, persistence, and infrastructure integrations MUST remain in explicit,
separately testable layers. Shared types MUST express real contracts and MUST NOT use `any` to bypass
design decisions. This separation keeps security rules reviewable and prevents framework or provider
choices from spreading through the application.

### II. Server-Enforced Security (NON-NEGOTIABLE)
The server MUST authenticate and authorize every sensitive operation, including access by ownership
and role; frontend guards are UX aids only. Every external value MUST be validated at the backend
boundary, including bodies, route and query parameters, uploaded files, filenames, MIME types, and
configuration. Passwords, OTPs, access tokens, and refresh tokens MUST use appropriate hashing,
expiration, rotation, revocation, and least-exposure controls. Error responses and audit metadata
MUST NOT disclose secrets or unnecessary implementation details. Security checks MUST default to
denial when identity, ownership, role, or validation is uncertain.

### III. Stable Contracts and Replaceable Infrastructure
All API successes and failures MUST follow documented, predictable response contracts. File storage,
email delivery, authentication configuration, and other external infrastructure MUST be accessed
through narrow service abstractions; controllers MUST NOT couple directly to a provider or storage
path. User and administrator collections MUST use server-driven search, filtering, sorting, and
pagination. Data models, indexes, soft-deletion behavior, and migrations MUST preserve ownership,
authorization, query correctness, and a safe upgrade path. Breaking contract or schema changes MUST
be specified with migration and compatibility consequences before implementation and MUST follow
the database approval process in Principle IX.

### IV. Reusable, Complete User Experiences
Shared interaction patterns MUST be implemented through reusable React components and React Query
hooks rather than duplicated page logic. Every user-facing asynchronous workflow MUST provide
appropriate loading, success, empty, validation, and error states; destructive actions MUST require
clear confirmation. Interfaces MUST be responsive, keyboard-operable, accessibly labeled, and
usable in the themes required by the current approved phase. Phases 1 and 2 MAY ship a complete,
accessible light theme without dark-mode controls. Phase 3 MUST add dark and system theme support
across all existing user-facing interfaces without regressing accessibility or responsive behavior.
Motion MUST clarify state or interaction and MUST NOT obstruct access or mask latency.

### V. Environment Configuration Is a Verified Contract (NON-NEGOTIABLE)
Sensitive and deployment-specific configuration MUST come from environment variables and MUST be
validated at process startup. The repository MUST contain a safe `.env.example` listing every
required client, server, database, authentication, administrator-bootstrap, email, CORS, upload,
and storage key with non-secret placeholders and concise guidance. Real secrets and populated `.env`
files MUST NOT be committed, logged, returned by APIs, embedded in client bundles, or baked into
container images. Public client variables MUST be explicitly classified and MUST contain no secret
material. Any change that adds, renames, or removes a configuration key MUST update validation,
`.env.example`, setup documentation, tests, Docker/deployment configuration, and the current feature
artifacts in the same change.

### VI. Audit Important State Changes
Security-relevant and important data-changing operations MUST emit audit events through one audit
service. At minimum, authentication milestones, uploads, downloads, deletions, folder mutations,
role changes, and administrator actions MUST record actor, action, target, timestamp, and only safe,
useful metadata. Audit failure behavior MUST be consciously defined per operation, and audit records
MUST obey access control, retention, and privacy requirements. Until an approved phase defines a
more specific retention schedule and application access surface, audit records MUST have no
application-facing read API or UI, MUST be restricted to authorized operational database access,
and MUST be retained without automated deletion. A later retention policy MUST specify duration,
disposition, migration impact, and verification before it replaces this default. Logs MUST be
structured enough for operational investigation without becoming a secondary store of credentials
or private file data.

### VII. Spec-Driven, Tested, Incremental Delivery
Each implementation-plan phase MUST proceed through specification, clarification when needed,
planning, dependency-ordered tasks, consistency analysis, implementation, verification, and
convergence when gaps remain. Tests MUST prioritize business behavior and security boundaries,
especially authentication, authorization, ownership, upload constraints, soft deletion, and
administrator isolation; arbitrary coverage percentages MUST NOT replace risk-based evidence.
Implementation MUST remain aligned with approved artifacts. A discovered requirement change MUST
update the specification and dependent artifacts before code silently diverges. Every phase MUST
leave the repository runnable, internally consistent, and independently verifiable.

### VIII. Comment Every Function and Method
Every project-authored function or method implemented in client or server application code MUST
have a short comment immediately above it that explains its purpose or responsibility. This rule
applies to function declarations, class and object methods, arrow-function assignments, and inline
callbacks. Comments MUST describe intent rather than restate the implementation and MUST be updated
whenever the function's responsibility changes. Code review MUST reject new or changed functions
and methods that lack an accurate comment. This requirement keeps behavior discoverable and makes
maintenance and review faster across both application layers.

### IX. Database Schema Is a Maintainer-Approved Contract (NON-NEGOTIABLE)
`database-schema.mmd` MUST be the canonical approved baseline for database entities, table and field
names, data types, keys, nullability, and relationships. Every phase specification, plan, task set,
runtime schema, and migration MUST conform to that baseline. During planning, the proposed data
design MUST be compared explicitly with `database-schema.mmd`. If any difference is proposed, the
plan MUST identify the exact difference, rationale, migration and compatibility effects, then pause
for explicit project-maintainer confirmation before adopting the difference or finalizing the plan.
Silence, prior assumptions, and implementation convenience MUST NOT be treated as approval. After a
difference is confirmed, `database-schema.mmd` and every affected specification, plan, task set,
migration, fixture, and document MUST be updated together before implementation proceeds. An
unconfirmed or undocumented database deviation is prohibited. This rule keeps the diagram,
approved product design, and deployed database from silently diverging across phases.

## Project-Wide Technical Constraints

- The system MUST remain a TypeScript monorepo with a Next.js App Router client and Express REST API.
- The approved core stack is Tailwind CSS, Framer Motion, TanStack React Query, Axios, Prisma ORM,
  PostgreSQL, JWT access-token authentication with opaque stored refresh tokens, and Multer for
  upload intake. Replacements require a documented architectural reason and a
  constitution-compliant migration plan.
- The Prisma schema, migrations, seed data, and database-facing application contracts MUST match
  `database-schema.mmd` unless an exact deviation has received explicit maintainer confirmation
  during planning and the diagram has been updated to record that confirmed design.
- Prisma migrations MUST be reviewable, reproducible, and safe for the supported deployment path.
- Uploaded filenames MUST never be trusted as storage paths; storage keys MUST be generated safely.
- File preview and download MUST enforce authorization before content or signed access is exposed.
- Normal queries and aggregates MUST consistently exclude soft-deleted records unless the contract
  explicitly requests them and the caller is authorized.
- Production configuration MUST address CORS, secure cookies or token transport, proxy headers,
  email delivery, object/file storage, database migrations, and administrator initialization.
- Logging and errors MUST be useful for diagnosis while redacting credentials, tokens, OTPs,
  connection strings, private file contents, and other sensitive data.

## Delivery Workflow and Quality Gates

Every phase MUST use its specification and completion gate as acceptance criteria. Reviewers MUST
reject a phase when any applicable item below lacks evidence:

1. **Specify**: identify user-visible behavior, security boundaries, database impact relative to
   `database-schema.mmd`, and every configuration key the phase introduces, consumes, renames, or
   retires.
2. **Clarify**: resolve ambiguous ownership, authorization, retention, deletion, provider, and
   configuration semantics before planning. An audit-producing phase MAY adopt the default audit
   access and retention policy in Principle VI explicitly instead of defining a replacement policy.
3. **Plan**: define layer boundaries, API/data contracts, migration impact, threat controls, tests,
   and environment-variable validation, secrecy classification, defaults, and deployment mapping.
   The plan MUST compare its data design with `database-schema.mmd`; any difference MUST be shown to
   the maintainer and explicitly confirmed before the plan is finalized.
4. **Tasks**: include explicit work to keep `database-schema.mmd`, runtime schemas, migrations,
   `.env.example`, documentation, test fixtures, Docker configuration, and deployment settings
   synchronized for every confirmed change.
5. **Analyze**: compare the specification, plan, tasks, and `database-schema.mmd`; verify that the
   database design matches or has recorded maintainer confirmation, all environment keys are named
   consistently, and no required migration, compatibility action, or security test is missing.
6. **Implement**: access configuration only through validated configuration modules, add an
   accurate short comment above every client and server function or method, update `.env.example`
   in the same change, never commit usable secrets, and implement no database deviation that lacks
   prior planning approval and a corresponding `database-schema.mmd` update.
7. **Verify and Converge**: scan source, schemas, scripts, containers, and docs for environment-key
   usage; compare the result with `.env.example`; compare the deployed/runtime database design with
   `database-schema.mmd`; run relevant lint, type, test, migration, build, authorization, and
   clean-setup checks; append and complete any uncovered work.
8. **Phase Completion**: demonstrate the phase completion gate, confirm both client and server start
   from documented non-secret example configuration, prove database-schema alignment, and record
   any accepted risk with an owner and resolution condition.

Code review MUST verify the applicable principles and cite test or runtime evidence. Complexity,
new dependencies, duplicated abstractions, and exceptions MUST be justified in the relevant plan or
review. Phase 4 additionally requires the full clean-environment smoke test and verified README,
Docker, migration, production configuration, security, reliability, and performance instructions.

## Governance

This constitution governs all project specifications, plans, tasks, implementation, reviews, and
release decisions. When another project artifact conflicts with it, this constitution takes
precedence until an amendment is ratified.

Amendments MUST be proposed as a documented change that states the motivation, affected principles,
compatibility impact, required migrations, and verification plan. Approval requires explicit project
maintainer acceptance and corresponding updates to dependent feature artifacts or documentation.
Compliance MUST be reviewed during planning, before merging implementation, at every phase completion
gate, and during production-readiness review. Any temporary exception MUST be written, narrowly
scoped, time-bounded, owned, and accompanied by a remediation task; security-boundary and secret-
handling requirements cannot be waived without a formal constitutional amendment. A database
design change additionally requires the explicit planning-time confirmation and synchronized
`database-schema.mmd` update mandated by Principle IX; general approval of a feature or plan does
not substitute for confirmation of an undisclosed schema difference.

Constitution versions use semantic versioning: MAJOR for incompatible governance changes or removed
principles, MINOR for new principles or materially expanded obligations, and PATCH for clarifications
that do not change obligations. The ratification date remains the date of initial adoption; the last
amended date changes whenever constitutional content changes.

**Version**: 2.0.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-20
