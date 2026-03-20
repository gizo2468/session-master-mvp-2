

## Fix Image Preview Layering & Layout in All Notes

### Problem
The fullscreen image lightbox (`z-[100]`) renders as a sibling **outside** the `<Dialog>` component. Radix Dialog renders via a portal with its own stacking context, so the lightbox appears **behind** the dialog overlay.

### Fix 1: Move lightbox inside DialogContent (or use a separate Dialog)
Move the fullscreen lightbox `div` **inside** the `<DialogContent>` so it shares the same portal stacking context — or better, wrap it in its own `<Dialog>` component which will portal at the same level with proper z-index control. Using a separate `<Dialog>` with `modal={false}` and a manual overlay at `z-[200]` is cleanest.

**Approach**: Convert the raw `div` lightbox into a Radix `Dialog` so it portals correctly above the All Notes dialog.

### Fix 2: Move image thumbnail to right of player name
In `OpponentRowInner`, move the `{signedUrl && <img ...>}` block from **before** the nickname `<span>` to **after** it (but before the note count badge).

Current order: color dot → image → name → badge
New order: color dot → name → image → badge

### File: `src/components/notes/ViewAllNotesModal.tsx`

1. **Lines 80-87**: Move the image `<img>` block to after line 89 (after the nickname span)
2. **Lines 347-366**: Replace the raw `div` lightbox with a `<Dialog>` component:
```tsx
<Dialog open={isImageFullscreen} onOpenChange={setIsImageFullscreen}>
  <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none flex items-center justify-center">
    <button onClick={() => setIsImageFullscreen(false)} className="absolute top-4 right-4 z-10 ...">
      <X />
    </button>
    <img src={fullscreenImageUrl} ... />
  </DialogContent>
</Dialog>
```

