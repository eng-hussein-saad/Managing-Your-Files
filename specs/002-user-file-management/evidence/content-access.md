# Content access evidence

- TXT, image, and PDF preview contracts return inline content with authoritative type/length, `private, no-store`, and `nosniff`.
- Every accepted type downloads as an attachment with sanitized ASCII fallback plus UTF-8 `filename*`.
- DOCX presents an explicit unavailable-preview fallback while remaining downloadable.
- Authorization is checked before storage access and rechecked before response; deleted, foreign, malformed, missing-object, and provider-failure cases return safe outcomes.
- Abort, bounded stream, deletion-wins, object URL cleanup, and successful download-audit behavior pass integration/component coverage.
- Response bodies, headers, client state, audits, and built browser assets expose zero storage keys or provider object URLs.

Browser journey: `tests/e2e/file-content.spec.ts`.
