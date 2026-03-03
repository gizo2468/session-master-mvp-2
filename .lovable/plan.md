

## Plan: Profile Avatar Tap-to-Zoom Lightbox

### Problem
Currently, tapping the avatar in view mode triggers photo upload. We need to separate concerns: **view mode** opens a lightbox, **edit/onboarding mode** triggers upload.

### Changes: `src/components/PlayerCard/PlayerCardFront.tsx`

1. **Add state** `isImageFullscreen` (boolean, default false).

2. **Change avatar click behavior in view mode** (lines 124-127): Instead of calling `handlePhotoClick` (upload), call `setIsImageFullscreen(true)` — but only when there's an actual image. If no image exists, do nothing (no lightbox for the placeholder).

3. **Add fullscreen lightbox dialog** after the card's closing div, using the same Dialog pattern from `ViewEditNoteModal.tsx`:
   - Dark/blurred backdrop
   - Centered image with `object-contain`, max 90vw/90vh
   - Small X close button (top-right, white on dark circle)
   - Click outside to close (handled by Dialog)
   - Smooth scale-in animation via existing `animate-scale-in`

4. **Import** `Dialog, DialogContent, DialogHeader, DialogTitle` and `X` icon.

### Key Detail
The avatar upload functionality (`handlePhotoClick`) is preserved but only used during onboarding/edit flow (which already has its own component `ProfileOnboardingFlow`). In view mode, the avatar becomes a lightbox trigger instead.

### Files changed
- `src/components/PlayerCard/PlayerCardFront.tsx`

