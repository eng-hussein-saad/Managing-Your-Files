# UI Surface and State Matrix

**Matrix version**: 1.0.0  
**Acceptance contract**: [../contracts/ui-acceptance.md](../contracts/ui-acceptance.md)  
**Status**: Seeded; evidence pending

Each checkpoint cell must link a visual-review record that covers every state named in the row. The
320 px cell must additionally prove no page-level overflow and access to every required action.
`PENDING` and `BLOCKED` do not pass SC-001.

| ID | Surface | Route / trigger | Applicable states and outcomes | 1440 light | 1440 dark | 768 light | 768 dark | 390 light | 390 dark | 320 overflow/actions | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
| UI-001 | Landing | `/` | default; long copy; keyboard focus; reduced motion; theme/system change | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-002 | Register | `/register` | default; validation; submitting/disabled; safe success; safe failure; transition to verification | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-003 | Sign in | `/login` | default; validation; submitting/disabled; invalid; unverified; success; session restoration | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-004 | Verify email | `/verify-email` | default; eight-digit entry; invalid; expired; superseded; resend pending; resend success/failure; verification success; safe enumeration | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-005 | Access outcomes | protected/admin navigation and auth errors | expired session; unauthenticated; unauthorized; forbidden; retry; sign-out | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-006 | Authenticated shell | protected user routes | desktop; compact/off-canvas; backdrop; active route; storage summary; profile; theme; sign-out; admin link absent; resize/orientation | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-007 | Dashboard | `/dashboard` | populated; zero; loading; error/retry; exact metrics; chart text equivalent; time zone; long identity | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-008 | Files workspace | `/files` | populated; loading; error/retry; empty; no results; search/filter/sort/page; list/grid; nested folder; long names; local scroll | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-009 | Upload | file picker/drop | default; count/type/size/quota validation; queued; uploading; success; failed; invalid; retry; partial batch; session expiry | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-010 | File details/preview | open owned file | loading; safe metadata; extracted text; image; PDF; text; unsupported; preview failure; denied; download; move; permanent-delete entry; resize/orientation | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-011 | Folder/file destructive flows | create/rename/delete/move dialogs | default; validation; fixed parent; depth; duplicate; ownership denial; non-empty folder; exact irreversible confirmation; pending; failure/retry; cancel; success | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-012 | Profile | `/profile` | loading; safe identity; long name/email; user/admin role; verified state; error/session outcome | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-013 | Admin shell/dashboard | `/admin` | restricted cue; admin-only; populated; zero; loading; error/retry; recent activity; type summary; no private content; normal-user denial | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-014 | Admin users | `/admin/users` | populated; empty; loading; error/retry; search/filter/sort/page; long identity; role confirmation/success/failure/stale; exact delete confirmation; self/final-admin denial; session/cascade/audit outcomes | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-015 | Admin files | `/admin/files` | populated; empty; loading; error/retry; safe owner metadata; search/filter/page; exact delete confirmation/pending/failure/success; no preview/download/content; normal-user denial | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-016 | Admin audit | `/admin/audit` | populated; empty; loading; error/retry; filter/page; deleted actor; system actor; sanitized metadata; reads create no event; normal-user denial | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-017 | Shared toast/alert | any async workflow | info; validation; submitting; success; failure; retry; bounded announcements; bounded toast count; dismissal | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| UI-018 | Shared dialog/drawer | navigation/details/destructive flows | labeled; initial focus; containment; Escape; safe backdrop; inert background; scroll lock; focus restoration; pending dismissal guard; resize/orientation | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

## Completion summary

| Status | Count |
|---|---:|
| PASS | 0 |
| APPROVED DEVIATION | 0 |
| FAIL | 0 |
| BLOCKED | 0 |
| PENDING | 18 |
