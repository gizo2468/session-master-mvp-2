

## Plan: Tighten Glow Boundary to Inner Content Area

### What changes

**File: `src/components/poker/SessionTimerCard.tsx` (lines 188-234)**

Remove the `boxShadow` from the outer gold-bordered frame (lines 197-201) and reduce its padding. Add a new inner wrapper `div` around just the "Session Time" label + digits with tight padding and the glow applied to it.

**Before:**
- Gold frame div has `padding: '16px 32px'` and the full glow `boxShadow`
- Label + digits sit directly inside

**After:**
- Gold frame div keeps border/outline but with NO `boxShadow` and reduced padding (`8px 10px`)
- New inner content wrapper div with `padding: '8px 20px'`, `borderRadius: '8px'`, and the glow `boxShadow` wraps label + digits
- Background of inner wrapper stays white or very slightly tinted

This constrains the glow to hug the content tightly, matching the reference where the illumination area is minimal around the digits.

