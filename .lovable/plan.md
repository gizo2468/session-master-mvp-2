

## Plan: Fix Hand Image Upload on iOS

### Problem
`ImageUploadSection` receives `onImageDataUrl` as an optional prop, but `HandForm.tsx` never passes it. On iOS native, the component uses the native Capacitor camera picker which returns a dataUrl via `onImageDataUrl`. Since the callback is missing, the selected image is silently discarded.

### Fix

**File: `src/components/poker/HandForm.tsx` (line 119-122)**

Pass `onImageDataUrl` to `ImageUploadSection` that sets the image preview and form value:

```tsx
<ImageUploadSection 
  imagePreview={imagePreview}
  onImageChange={handleImageChange}
  onImageDataUrl={(dataUrl) => {
    setImagePreview(dataUrl);
    form.setValue('image', dataUrl);
  }}
/>
```

`setImagePreview` and `form` are already exposed by `useHandForm` (line 393-394 in the hook). This mirrors what `handleImageChange` does for the web file input path.

**Single file change, ~3 lines added.**

