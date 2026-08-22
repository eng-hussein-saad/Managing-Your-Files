# Upload and quota evidence

Verified on 2026-08-22 against disposable PostgreSQL with deterministic storage and extraction fakes.

- Mixed outcomes: valid TXT commits object-first metadata; spoofed/unsupported bytes, foreign folders, provider failures, and quota failures create no accessible row or retained object.
- Ordered client behavior: component coverage proves displayed-order sequential upload, independent success, retry, progress, quota snapshots, and whole-batch rejection at eleven files.
- Concurrency: 20 same-owner admissions completed under a locked `USER` row; retained bytes never exceeded `104857600`, and failed provider admission released capacity.
- Boundaries: `5242880` bytes is accepted and `5242881` is rejected before persistence.
- Privacy: generated keys match the server-only owner/file UUID pattern; responses and audits contain no key, provider URL, temporary path, extracted content, or credential.

Reproduce with the contract, integration, component, and security commands in `automated-verification.md`. Browser journey: `tests/e2e/file-upload.spec.ts`.
