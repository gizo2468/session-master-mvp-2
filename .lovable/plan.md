

## Plan: Add Image Lightbox Preview to Hand Image Upload

### What changes

**Single file: `src/components/poker/HandFormSections/ImageUploadSection.tsx`**

When an image is already uploaded (i.e. `imagePreview` exists), tapping the circular thumbnail will open a fullscreen lightbox dialog instead of immediately triggering the image picker. The lightbox follows the same pattern as the Profile Card's avatar lightbox:

- Dark blurred background (`bg-black/95 backdrop-blur-sm`)
- Large image displayed with `object-contain`
- Top-right X close button
- Bottom-center "Edit Photo" button (with `Pencil` icon) that triggers the native/web image picker and closes the lightbox

When no image exists yet, tapping still opens the picker directly (current behavior unchanged).

### Implementation details

1. Add `useState` for `isLightboxOpen`
2. Import `Dialog`, `DialogContent`, `DialogTitle` from `@/components/ui/dialog`, `Pencil` and `X` from `lucide-react`
3. Split the `handleClick` logic:
   - If `imagePreview` exists → open lightbox
   - If no image → run existing picker flow
4. Extract picker logic into `handlePickImage()` (reused by both the no-image click and the lightbox "Edit Photo" button)
5. Add the lightbox Dialog after the existing JSX, matching the Profile Card's lightbox styling exactly

No other files change. The `onImageChange` and `onImageDataUrl` callbacks remain the same.

