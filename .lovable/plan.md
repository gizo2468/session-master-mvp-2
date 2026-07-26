## Goal

Remove all in-app success toast/banner notifications across the application. Keep error toasts, confirmation dialogs, loading states, and system alerts untouched.

## Rule for what counts as a "success toast" (to remove)

A `toast(...)` / `toast.success(...)` / `useToast().toast({...})` call is removed when it:
- Has no `variant: "destructive"`, AND
- Is fired on a successful outcome path (e.g. after a successful create/save/update/delete/end/share/copy/upload/sign-in-out/etc.), including titles like "Session Deleted", "Session Ended", "Table Added", "Rebuy Added", "Hand Added", "Note Saved", "Copied", "Profile Updated", "Session saved to cloud", etc.

A toast is kept when it:
- Uses `variant: "destructive"` (error/failure feedback).
- Signals a validation error, permission block, or failure ("Cannot End Session", "Error Adding …", "Failed to …", "Unable to …", network/sync failure, etc.).
- Is a warning/informational block that prevents an action (e.g. "You must end all active tables before ending the session.").

Confirmation dialogs (AlertDialog / Sheet-based confirms), loading spinners/screens, inline UI state, and native system alerts are out of scope.

## Scope of changes (files with toast calls)

Approximately 60 files call `toast(...)`. For each file, delete only the success-path toast invocations and any now-unused imports/variables. No behavior changes to the surrounding logic.

Representative examples of removals (non-exhaustive; the same rule is applied everywhere):

- `src/hooks/useSessionActions.ts` — remove success toasts in `handleEndSession` ("Session Ended"), `handleAddRebuy` ("Rebuy Added"), `handleAddTable` ("Table Added"), `handleEndTable` ("Table Ended" / "Day Ended"), `handleAddTableRebuy` ("Rebuy Added"). Keep the "Cannot End Session" block and all `variant: "destructive"` error toasts.
- `src/context/session/supabaseSync.ts` — remove "Session saved to cloud" success toast; keep "Cloud sync failed" destructive toast.
- `src/components/ActiveSessionsList.tsx` — remove "Session Deleted" success toast (shown in the uploaded screenshot). Keep any error toast.
- `src/components/poker/HandTableSelectionModal.tsx` — remove "Hand Added" success toast; keep "Error Adding Hand".
- `src/hooks/useRebuyActions.ts`, `src/hooks/useEndTableActions.ts` — remove success toasts, keep error toasts.
- `src/pages/SessionDetail.tsx`, `src/pages/EditSession.tsx`, `src/pages/SessionForm.tsx`, `src/pages/ConfirmSession.tsx`, `src/pages/AddPastSession.tsx`, `src/pages/CoachProfile.tsx`, `src/pages/CoachSessionReview.tsx`, `src/pages/CoachUpgrade.tsx`, `src/pages/Notifications.tsx`, `src/pages/Settings.tsx`, `src/pages/Subscription.tsx` — strip success toasts (saved/updated/created/copied/etc.), keep destructive/error toasts.
- Auth pages (`Login.tsx`, `Signup.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`) — remove success confirmations ("Signed in", "Check your email", "Password updated", etc.). Keep error toasts. Do not touch the actual auth flow or navigation.
- Coaching (`MyCoachingNetwork.tsx`, `HandReviewModal.tsx`, `PlayerGoalsTasks.tsx`, `StudentSessions.tsx`, `ConnectWithCoach.tsx`, etc.) — remove success toasts (connection sent, feedback saved, goal added, hearted, etc.), keep errors.
- Notes (`AddNoteModal.tsx`, `ViewEditNoteModal.tsx`, `EditColorCategoriesModal.tsx`) — remove "Note added/updated/deleted" success toasts, keep errors and free-tier limit warnings (kept as informational blocks).
- Poker forms (`PastSessionForm.tsx`, `AddPastSessionForm.tsx`, `PastTableHandsPanel.tsx`, `HandManagementPanel.tsx`, `CardSlotPicker.tsx`, `BBStackUpdateModal.tsx`) — remove success toasts, keep validation/error toasts.
- Settings (`AccountSettings.tsx`, `BillingSettings.tsx`, `SupportSettings.tsx`) — remove "Saved", "Copied", "Restored", "Feedback sent" success toasts; keep errors.
- Contexts (`AuthContext.tsx`, `CoachStudentContext.tsx`, `session/sessionOperations.ts`, `session/useSessionInitialization.ts`) — remove success toasts (signed out, session recovered, etc.), keep failure toasts.
- Hooks (`useSessionSharing.ts`, `usePlayerCard.ts`, `useSessionLoader.ts`) — remove success toasts, keep errors.

Any file whose only remaining `toast` usage is destructive keeps its `useToast` / `toast` import as-is. If a file no longer uses `toast` at all after edits, its import is removed to keep the build clean.

## Out of scope / not changed

- `src/hooks/use-toast.ts` and `sonner` infrastructure remain in place (still used for errors).
- Toast styling, duration, and z-index behavior are unchanged.
- Confirmation dialogs before destructive actions (delete confirms, end session confirm) remain unchanged.
- Loading indicators, splash/loading screens, empty states — unchanged.
- Tutorial/onboarding flow — unchanged.
- No changes to business logic, navigation, or data mutations; only the toast side-effect calls are deleted.

## Validation

- Rely on the automatic build/type check to catch stray unused imports or references.
- Spot-check the flows shown in the uploaded screenshots (add table, delete active session) to confirm no success banner appears and the underlying action still works.

## Summary

Strip roughly ~120 success-path `toast(...)` calls across ~60 files using the rule above. Keep every destructive/error toast and all other UI feedback intact.