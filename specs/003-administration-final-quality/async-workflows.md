# Asynchronous Workflow Inventory

Every row is a required user-facing state contract. “N/A” means the workflow has
no meaningful state of that kind; the reason is recorded rather than silently
omitted. Shared `PageState`, `ErrorPanel`, form status, toast, skeleton, retry,
and guarded-dialog primitives provide consistent presentation.

| Workflow | Loading / pending | Empty | Validation | Success | Failure and recovery |
|---|---|---|---|---|---|
| Register account | submit pending | N/A: form always exists | field and server issues | verification redirect | safe error; edit/retry |
| Sign in | submit pending/session restore | N/A | field/server issues | requested route | safe error; retry or verify |
| Verify email | submit/resend pending | N/A | code/email issues | sign-in link | invalid/expired; resend |
| Sign out | button pending | N/A | N/A | anonymous landing | fail-open local cleanup |
| Restore/refresh session | full-page loading | anonymous state | N/A | protected content | sign-in recovery |
| File upload policy | dropzone loading | N/A | provider policy | quota shown | retry policy fetch |
| Upload queue item | queued/uploading | queue hidden | file/type/size issue | completed metadata | per-item retry/remove |
| File collection | skeleton/previous page | no matching files | filter bounds | list/grid page | error panel and retry |
| File detail | drawer loading | missing closes/not found | N/A | safe metadata | retry/close |
| Preview/download | content loading | N/A | unsupported preview | content/download | safe error/retry |
| Move file | mutation pending | no folders message | target ownership | refreshed location | retry/reselect |
| Delete file | guarded pending | N/A | target confirmation | toast/refreshed lists | safe retry |
| Folder browsing | loading | no folders | N/A | hierarchy rendered | retry |
| Create/rename folder | mutation pending | N/A | name/depth/conflict | toast/refetch | edit/retry |
| Delete folder | guarded pending | N/A | non-empty conflict | toast/refetch | safe retry |
| User dashboard | skeleton | zero-filled totals/history | timezone validation | exact cards/charts | retry |
| Profile | restoring/loading | N/A: authenticated user exists | N/A | safe profile | session/sign-in recovery |
| Admin user directory | loading/previous page | no matches | strict filters | stable page | retry |
| Admin role change | request pending | N/A | target/version guards | toast/refetch | 409 reload/reconfirm |
| Admin user deletion | request pending | N/A | typed email/version | toast/cleanup | 409 reconfirm or 503 retry |
| Admin global files | loading/previous page | no matches | strict ranges/filters | stable metadata page | retry |
| Admin file deletion | request pending | N/A | typed name/version | toast/stat refetch | 409 reconfirm or 503 retry |
| Admin statistics | loading | exact zero totals | N/A | exact current snapshot | retry |
| Admin audit history | loading/previous page | no events | strict filters | sanitized page | retry |

All pending controls remain labeled and disabled where repeat submission is
unsafe. Error copy is sanitized and includes an actionable retry, edit,
re-authentication, reload/reconfirmation, or navigation path when recovery is
possible. Reduced motion removes nonessential animation without removing state.
