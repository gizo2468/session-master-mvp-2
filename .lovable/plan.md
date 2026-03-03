

## Plan: Add "Edit Photo" button inside Avatar Lightbox

### Change: `src/components/PlayerCard/PlayerCardFront.tsx` (lines 280-298)

Add a "Pencil" (edit) button next to the X close button in the lightbox. On tap, it calls the existing `handlePhotoClick()` which already handles the native iOS/Android picker flow (`pickImage('prompt')`) and web fallback. After a successful upload, close the lightbox.

1. **Import `Pencil`** — already imported (line 2).

2. **Add an edit handler** that calls `handlePhotoClick()` then closes the lightbox:
```tsx
const handleEditFromLightbox = async () => {
  await handlePhotoClick();
  setIsImageFullscreen(false);
};
```

3. **Add edit button in lightbox** (top-right, next to X button):
```tsx
<button
  onClick={handleEditFromLightbox}
  className="absolute top-3 right-14 z-50 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
>
  <Pencil className="w-5 h-5" />
</button>
```

Placed at `right-14` to sit left of the X button. Same styling for consistency.

### Files changed
- `src/components/PlayerCard/PlayerCardFront.tsx`

