

## Plan: Eliminate Layout Shift on Home Page Load

### Root Cause

The Home page has a two-stage loading problem:

1. **Index.tsx** wraps `StatsQuickView` in its own loading gate (lines 190-196) showing a tiny spinner (`h-6 w-6` with `py-4`)
2. When that resolves, `StatsQuickView` renders and hits **its own** internal loading state (lines 151-183) showing a taller skeleton
3. When *that* resolves, the real stats content appears

This creates two visible layout shifts — the spinner is much shorter than the skeleton, which is shorter than the final content. Same issue for Recent Sessions (lines 232-235): a small spinner swaps to a list of cards.

### Fix

**`src/pages/Index.tsx`**:
- Remove the Index-level loading spinners that gate `StatsQuickView` and Recent Sessions
- Render `StatsQuickView` immediately — it already has a proper internal skeleton that matches its final height
- For Recent Sessions, replace the small loading spinner with skeleton `SessionCard` placeholders (3 cards) that match the real card height, preventing the "pop-up" effect
- Keep `ActiveSessionsList` gated since it conditionally appears

**`src/components/StatsQuickView.tsx`**:
- No structural changes needed — its internal skeleton already handles loading well

### Result
The page will render with correctly-sized placeholders from the first frame, then content fills in without any height changes or visible "rising" effect. No artificial delay added.

