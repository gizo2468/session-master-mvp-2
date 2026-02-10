

# Fix: User ID Chip Opens Blank Screen

## Root Cause
The previous mobile layout fix (removing `aspect-[3/4]` when `isFirstTimeUser` is true) broke the card display. The front and back card sides use `absolute inset-0` positioning, which requires a parent with a defined size. Without the aspect ratio, the container collapses to 0 height, resulting in a blank modal.

For first-time users, `isFirstTimeUser` is always true, so the modal always opens blank.

## Fix (src/components/PlayerCard/PlayerCardModal.tsx)

Make the front side use `relative` positioning (instead of `absolute`) when the onboarding/editing flow is active. This lets the form content naturally define the container height, while the back side stays hidden via absolute positioning.

### Changes at lines 101-106 (front side div):

**Before:**
```tsx
<div 
  key={`front-${flipKey}`}
  className={`absolute inset-0 ${
    isFlipped ? 'animate-card-flip-front' : flipKey > 0 ? 'animate-card-unflip-front' : ''
  }`}
```

**After:**
```tsx
<div 
  key={`front-${flipKey}`}
  className={`${(isEditing || isFirstTimeUser) && !isFlipped ? 'relative' : 'absolute inset-0'} ${
    isFlipped ? 'animate-card-flip-front' : flipKey > 0 ? 'animate-card-unflip-front' : ''
  }`}
```

When in onboarding/editing mode and showing the front side, use `relative` so the content sizes the parent. In all other cases (view mode, or when flipped to back), keep the original `absolute inset-0`.

## Files Modified
- `src/components/PlayerCard/PlayerCardModal.tsx` -- single line change to front side positioning

## What Stays the Same
- Card flip animations, back side, view mode layout
- Button design, size, position, spacing on Home screen
- All other functionality
