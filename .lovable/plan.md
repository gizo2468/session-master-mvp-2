

## Plan: Make "Edit Photo" button clearly visible in avatar lightbox

### Problem
The pencil button exists but is too subtle — a small icon on a dark background, easy to miss. Need to make it obvious.

### Change: `src/components/PlayerCard/PlayerCardFront.tsx` (lines 290-298)

Replace the small pencil icon button with a larger, labeled button bar at the bottom of the lightbox:

```tsx
{/* Bottom action bar */}
<div className="absolute bottom-6 left-0 right-0 flex justify-center z-50">
  <button
    onClick={async () => {
      await handlePhotoClick();
      setIsImageFullscreen(false);
    }}
    className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-5 py-2.5 text-white text-sm font-medium hover:bg-white/30 transition-colors border border-white/30"
  >
    <Pencil className="w-4 h-4" />
    Edit Photo
  </button>
</div>
```

This replaces the tiny top-right pencil icon with a clearly labeled "Edit Photo" button centered at the bottom of the overlay — always visible and obvious.

### Files changed
- `src/components/PlayerCard/PlayerCardFront.tsx` (lines 290-298)

