# Async and Overlay Remediation Inventory

| Route/state | Expected behavior | Failing assertion | Source path | Owner | Status |
|---|---|---|---|---|---|
| `/files`, newly mounted create-folder dialog under React Strict Mode | Dialog becomes visible, contains focus, Escape closes, opener regains focus | `Create folder` dialog not found after activation | `client/src/components/overlays/overlay.tsx` | T067 | Resolved: portal host creation is effect-owned and survives Strict Mode effect replay. |
| `/files`, create-folder close after first remediation | Escape restores focus to the New folder trigger | Trigger remained inactive after dialog disappeared | `client/src/components/overlays/overlay.tsx` | T067 | Resolved: cleanup stabilizes opener focus after the closing React commit while guarding effect replay. |
| `/files`, auto-focused create-folder field | Opener is captured before descendant `autoFocus` commit | Active element after close was `body`; effect-time capture had recorded the dialog input | `client/src/components/overlays/overlay.tsx` | T067 | Resolved: closed-to-open render transition captures the opener before portal commit. |
| Protected/admin route navigation | No React external-store runtime warning | Repeated `getServerSnapshot should be cached` console errors | `client/src/features/auth/auth-store.ts` | T067 | Resolved: the server snapshot is a stable module value. |

Final evidence: component overlay suites passed 9/9 targeted tests; `ui-inclusive-interactions.spec.ts` passed 2/2 on the local project on 2026-08-25.
