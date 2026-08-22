# Configuration evidence

Verified 2026-08-22:

- Missing required settings, weak/malformed settings, and fixed Phase 2 limit changes are rejected by startup parsing tests. File page-size values are validated by the file-query schema.
- Both checked-in example configurations parse through their respective server/client contracts and expose no browser secret.
- Storage readiness accepts a private bucket and safely rejects public or missing buckets using one non-disclosing failure category.
- The provider adapter suite remains isolated behind `SUPABASE_ADAPTER_TEST_*`; without those credentials its two live cases are skipped rather than redirected to production.
- Repository inventory found no Dockerfile, Compose, Kubernetes, or deployment manifest to synchronize. The local verification PostgreSQL container is disposable test infrastructure, not a checked-in deployment artifact.
- The eight server-only Phase 2 settings are synchronized in `server/.env.example` and documented in `README.md`: provider URL/key/bucket, upload byte limit/quota/MIME list/batch limit, and extraction byte limit. File page size is selected in the client UI and constrained to 5, 10, or 20.
