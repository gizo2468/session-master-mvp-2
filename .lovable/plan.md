

## Fix: Remove Tap Flash from Home Chips

### Root Cause
All four chip buttons have `active:scale-95` which shrinks the button on press. Combined with `rounded-full overflow-hidden`, the momentary scale-down reveals the dark page background behind the chip image as a brief black circular flash.

### Fix
Remove `active:scale-95` and `active:translate-y-0` from all four chip buttons. No other changes.

### Files to Modify

**1. `src/components/NewSessionButton.tsx` (line 23)**
- Remove `active:scale-95 active:translate-y-0` from the button className

**2. `src/pages/Index.tsx` (lines 165, 175, 185)**
- Remove `active:scale-95` from each of the three small chip buttons (Player Card, Coach, My Notes)

### What stays the same
- All layout, spacing, sizes, positioning -- unchanged
- All hover effects (`hover:scale-105`) -- kept
- All focus outline suppression -- kept
- All functionality and navigation -- unchanged
