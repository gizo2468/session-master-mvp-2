## Plan: Update Session Setup Instructional Text

Only string updates — no layout, color, or logic changes.

### 1. `src/components/onboarding/tourSteps.ts` (line 49)
Update the "Optional Details" tour body:

- **From:** "Give your session or first table a custom name so it's easier to find in your history. You can also log the location or online poker site here. Don't worry, you can skip this if you're in a rush!"
- **To:** "Give your session a custom name so it's easier to find in your history. You can also log the location or online poker site here."

### 2. `src/pages/SessionForm.tsx` (line 832)
Update the First Table Name helper text:

- **From:** "Leave blank to use the Session Name for this table."
- **To:** "Leave blank to use the Session Name as the name for this table."

### 3. Physical Location placeholder (line 756)
Already "Where are you playing from?" — no change needed, verified in place.

No other files affected. No data binding or navigation logic touched.