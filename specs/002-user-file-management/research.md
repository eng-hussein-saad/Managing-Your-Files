# Phase 2 Research: User File Management

## Private object storage boundary

- **Decision**: Use the current Node-compatible `@supabase/supabase-js` v2 client only inside a `StoragePort` adapter. Configure it with `SUPABASE_URL`, the server-only `SUPABASE_SECRET_KEY`, and one existing private bucket. Proxy uploads, previews, and downloads through Express after application authentication and ownership checks; do not expose the privileged client or durable object URLs to the browser.
- **Rationale**: The application remains the policy boundary, storage keys remain private implementation details, and Supabase can be replaced without changing controllers or domain services. Private buckets require an authenticated or signed request; the server secret authorizes the adapter after the application has made its own decision.
- **Alternatives considered**: Direct browser uploads with a publishable key were rejected because they expand the client/storage policy surface and are not required by the specification. Long-lived public URLs were rejected because the bucket must remain private. Short-lived signed URLs remain a future optimization, but proxying the maximum 5 MB objects gives Phase 2 one auditable authorization path and full control of response headers.

## Upload request and per-file progress

- **Decision**: Treat a browser selection of up to ten files as a client-side batch, then submit one authenticated multipart request per file in displayed selection order. Use Axios upload progress for each request and retain independent item state. Express uses route-scoped Multer 2 temporary-disk intake with random temporary names, `.single("file")`, a hard `5,242,880` byte limit, tight part/field limits, and guaranteed cleanup.
- **Rationale**: One request per item provides genuine per-file network progress, naturally isolates failures, and preserves deterministic quota admission order. Disk-backed intake prevents a ten-file batch multiplied by concurrent requests from consuming large process memory. The server still enforces every individual content rule; the authenticated upload-policy endpoint exposes the effective batch limit for immediate client validation.
- **Alternatives considered**: One ten-file multipart request was rejected because browser progress is request-wide and item failure/progress becomes ambiguous. Parallel individual requests were rejected because the specification requires quota admission in displayed order.

## Authoritative content validation and extraction

- **Decision**: Validate the Multer byte count, then detect binary formats from magic bytes using the ESM `file-type` package. Accept canonical MIME values for PDF, JPEG, PNG, and WebP. A DOCX candidate must be detected as OOXML and its ZIP directory must contain `[Content_Types].xml` and `word/document.xml`; a generic ZIP is rejected. Treat plain text separately: require fatal UTF-8 decoding, reject NUL and every C0 control character except tab, line feed, and carriage return, and canonicalize it to `text/plain`. Never authorize from the submitted extension or `Content-Type`. Extract plain text directly. Run PDF.js extraction in a terminable worker with a five-second deadline, 200-page ceiling, and 1,000,000-character output ceiling; only files at or below `FILE_EXTRACTION_MAX_BYTES` enter extraction. Do not extract or preview DOCX. Any limit, parse, or worker failure becomes an unavailable extraction state without invalidating the upload.
- **Rationale**: Signature and container checks address common spoofing while preserving the explicit allowlist. Plain text has no reliable magic signature, so an explicit deterministic character rule is appropriate. A terminated worker provides a real resource boundary for hostile or malformed PDFs; a promise timeout alone would leave parsing work running. PDF.js exposes page text without adding a provider-specific service. Extraction failure does not invalidate an otherwise valid stored file.
- **Alternatives considered**: Trusting Multer MIME metadata or filename extensions was rejected as insecure. Antivirus scanning, OCR, DOCX parsing, and document conversion were rejected as outside Phase 2. Persisting a separate extraction status was rejected because it would deviate from the approved schema; `extractedContent = null` plus contract-level availability communicates the state.

## Generated keys and safe filenames

- **Decision**: Generate object keys from trusted identifiers, for example `users/{ownerUuid}/files/{fileUuid}`, with no submitted filename fragments. Preserve a trimmed, control-character-free display name of at most 255 Unicode code points. Encode download names with standards-compliant `Content-Disposition` parameters and provide a conservative ASCII fallback.
- **Rationale**: A generated key prevents path traversal, collisions, and storage-layout disclosure through user input. Safe header encoding prevents response splitting and filename confusion while preserving the user's display metadata.
- **Alternatives considered**: Sanitizing and reusing the submitted filename as a storage path was rejected because normalization is difficult to make collision- and platform-safe. Returning `storageKey` in public contracts was rejected because it is infrastructure metadata.

## Concurrency-safe quota without a schema deviation

- **Decision**: Serialize upload admission per user by locking the authenticated `USER` row with `SELECT ... FOR UPDATE`. While holding the lock, sum authoritative `FILE.size`, compare the next file with `104,857,600`, upload the private object, create the `FILE` row, and release the lock only after the database result is known. If metadata creation fails, attempt to remove the private object and log a sanitized compensation failure. A transaction-level advisory lock keyed by user UUID is an acceptable implementation alternative if tests prove identical cross-replica serialization.
- **Rationale**: The canonical schema has no quota counter or reservation entity. A database-visible per-user mutex prevents concurrent replicas from both admitting against the same remaining capacity without changing the approved database contract.
- **Alternatives considered**: A `usedBytes` column, reservation table, outbox, or unique/index additions would simplify coordination but are prohibited absent a new explicit schema approval. Serializable isolation alone was rejected because aggregate write skew is not reliably prevented when separate rows are inserted.

## Provider/database consistency and permanent deletion

- **Decision**: Follow Constitution VI's approved best-effort consistency model without adding database state. Uploads write the private object before inserting active metadata; a metadata failure triggers best-effort object removal. Deletion first verifies ownership and captures the trusted storage key, removes the private object idempotently, then permanently deletes metadata in an owner-scoped transaction; a known failure returns a safe retryable result. Successful primary operations attempt audit recording after the business outcome is established, and audit failure is sanitized operational logging only. Provider absence is treated as an idempotent successful remove only after the adapter distinguishes not-found from operational failure.
- **Rationale**: Constitution v3.0.0 and FR-007/FR-022/FR-025/FR-031 explicitly permit temporary private inaccessible objects or temporarily unavailable metadata after partial infrastructure failure, require reasonable compensation and safe outcomes, and state that no durable outbox, operation table, reconciliation worker, or distributed transaction is required. The private bucket prevents an orphan from becoming publicly accessible, while the `FILE` row remains the sole quota authority.
- **Alternatives considered**: Database-first upload was rejected because it creates an application-visible record before bytes exist. Metadata-first deletion was rejected because a provider failure would lose the only authoritative storage reference. A durable operation/outbox table and reconciliation worker were rejected as unapproved schema additions and explicitly unnecessary for Phase 2. Reusing `AUDIT_LOG` as workflow state was rejected because audit is fail-open and not a business-state store.

## Folder hierarchy and sibling naming

- **Decision**: Store the trimmed display name in `FOLDER.name`; compare siblings with a case-folded normalized value inside an owner-scoped advisory lock. Validate the selected parent belongs to the same active owner and walk ancestors to prove a maximum depth of ten. Parent is immutable after creation. Delete only after locked checks find no child folder and no file.
- **Rationale**: The approved schema has no normalized-name column or uniqueness index. Transaction locking preserves the required sibling rule and prevents concurrent create/delete races without altering the schema.
- **Alternatives considered**: A normalized-name column or expression index would provide stronger database-native enforcement but is an unapproved schema deviation. Moving folders was rejected as explicitly out of scope.

## Queries, pagination, and statistics

- **Decision**: Use offset pagination with validated `page` and `pageSize` (default 20, maximum 100), ownership-scoped Prisma filters, case-insensitive filename search, normalized type-category filters, and allowlisted sort fields. Every sort appends `FILE.id` as a deterministic tie-breaker. The statistics endpoint accepts a validated IANA `timeZone`; the server derives the last 30 local date boundaries, queries UTC timestamps, and returns all 30 labels with zero-filled gaps. Byte totals serialize as decimal strings.
- **Rationale**: Offset pagination matches page-number UX and remains adequate for the 10,000-record acceptance scale. An explicit timezone makes the displayed calendar definition reproducible while timestamps remain UTC. Decimal strings avoid JavaScript `bigint` precision loss.
- **Alternatives considered**: Cursor pagination was rejected because the requirement is page-based and supports multiple sort fields. Server-local time was rejected because it would not match the user's displayed calendar. Database indexes were not added because they are outside the approved canonical schema; the performance gate will determine whether a separately approved optimization is needed.

## API and client organization

- **Decision**: Extend the shared Zod contracts and stable envelopes; add authenticated `/api/v1/files`, `/api/v1/folders`, and `/api/v1/file-statistics` routes. Keep validation in HTTP schemas, orchestration in controllers, rules in `modules/files` and `modules/folders`, persistence in repositories, and Supabase/PDF/MIME details in infrastructure adapters. Build reusable React Query hooks, an upload queue, file collection/details views, specialized preview components, folder navigation, confirmation dialogs, and dashboard charts inside feature modules.
- **Rationale**: This follows the existing strict TypeScript layering and prevents storage and rendering branches from accumulating in controllers or pages.
- **Alternatives considered**: Server Actions or direct Prisma/Supabase access from Next.js were rejected because Express is the established authoritative service boundary. A generic repository abstraction was rejected in favor of focused file/folder repositories with explicit ownership methods.

## Testing and operational verification

- **Decision**: Retain Vitest, Supertest, Testing Library, and Playwright. Add fake storage/extractor ports for unit and contract tests; PostgreSQL integration tests for locks, ownership, hierarchy, permanent deletion, fail-open audit behavior, aggregates, and the approved migration; and Supabase-compatible adapter tests against a dedicated private test bucket. Run concurrency tests with at least 20 uploads and security scans over responses, logs, audits, examples, and built client assets. Before implementation source changes, pnpm resolves exact Multer, Supabase, `file-type`, and PDF.js versions, records them in the lockfile, and a Node 24 smoke test verifies ESM imports, DOCX detection, PDF worker execution, and private-bucket calls; incompatibility is resolved by selecting the newest compatible release rather than weakening the design.
- **Rationale**: Provider fakes keep business tests deterministic while a narrow real-adapter suite catches SDK/bucket behavior. Existing project commands already separate unit, integration, security, and end-to-end evidence.
- **Alternatives considered**: Mock-only provider testing was rejected because it cannot prove private bucket configuration or adapter compatibility. Broad coverage targets were rejected in favor of the risk-based constitutional gates.

## Sources consulted

- Supabase private bucket access: <https://supabase.com/docs/guides/storage/buckets/fundamentals>
- Supabase JavaScript upload API: <https://supabase.com/docs/reference/javascript/storage-from-upload>
- Supabase JavaScript download API: <https://supabase.com/docs/reference/javascript/storage-from-download>
- Supabase JavaScript remove API: <https://supabase.com/docs/reference/javascript/storage-from-remove>
- Supabase API key guidance: <https://supabase.com/docs/guides/api/api-keys>
- `file-type` package documentation: <https://github.com/sindresorhus/file-type>
- PDF.js project: <https://github.com/mozilla/pdf.js>

All technology choices and planning clarifications are resolved. Exact dependency versions will be pinned by the repository lockfile during implementation after Node 24 compatibility checks.
