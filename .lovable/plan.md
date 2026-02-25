

## Plan: Fix Date Picker Month Navigation in Export Modal

### Problem

The Calendar component is rendered inside a Popover, which is itself inside a Dialog. The Dialog's overlay intercepts pointer events, preventing the month navigation arrows from working. This is a known issue with Radix UI layering.

### Fix

Add `pointer-events-auto` class to both Calendar instances in `src/components/poker/HandHistoryExportModal.tsx` (lines 96-102 and 116-122).

**Changes:**
- Line 96-102: Add `className="p-3 pointer-events-auto"` to the start date Calendar
- Line 116-122: Add `className="p-3 pointer-events-auto"` to the end date Calendar

No other files or logic changed.

