## Update Active Tables Detected warning in End Session sheet

**File:** `src/components/poker/EndSessionSheet.tsx` (lines 123-140)

### 1. Center the content
- Add `text-center` to the outer warning `<div>`.
- Change the title row from `flex items-center gap-2` to `flex items-center justify-center gap-2` so the icon + "Active Tables Detected" label sit centered.
- Remove `ml-4` from the `<li>` and rely on the parent's centered text so bullet items align to center.

### 2. Make the box clickable (only when there are active tables)
The condition `hasActiveTables &&` already guarantees the box only renders when there are active tables — no change needed there.

Convert the outer `<div>` into a `<button type="button">` with the same classes plus `w-full text-left`-free centering, `cursor-pointer`, `hover:bg-yellow-100`, and `transition-colors`. On click:
1. Call `onOpenChange(false)` to close the End Session sheet.
2. Scroll to the active tables section on the current Live Session page by querying `document.querySelector('[data-tour="live-active-tables"]')` and calling `scrollIntoView({ behavior: 'smooth', block: 'start' })` inside a short `setTimeout` (so it runs after the sheet close animation).

No navigation is needed — the user is already on `/session/:id` (LiveSession), which renders `LiveSessionTables` with the `data-tour="live-active-tables"` anchor.

### Out of scope
- Colors, icon, spacing, typography, and all other styles remain unchanged.
- No changes to logic elsewhere (session state, routing, other modals).