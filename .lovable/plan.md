# Add "Delete Image" button to the hand image preview

## Behavior
In the fullscreen image preview (opened by tapping the uploaded hand image in Add New Hand), a second button appears next to "Edit Photo": a "Delete Image" button with a trash icon. Tapping it removes the image, closes the preview, and returns the image area to its empty "Add Hand Image" state so a new image can be uploaded.

## Technical details
- `src/components/poker/HandFormSections/ImageUploadSection.tsx`
  - Add optional prop `onImageRemove?: () => void`.
  - Import `Trash2` from lucide-react.
  - In the existing bottom button row (currently a single centered "Edit Photo"), wrap both buttons in a flex row with `gap-3`, keeping the current Edit Photo button and styling untouched. Add a destructive-variant button with `<Trash2 className="w-4 h-4 mr-2" /> Delete Image`, same size/padding and tap-highlight styles.
  - Its handler closes the lightbox and calls `onImageRemove?.()`; also clear the hidden file input value so re-selecting the same file still fires `onChange`.
- `src/components/poker/HandForm.tsx`
  - Pass `onImageRemove` that calls `setImagePreview(null)` and `form.setValue('image', undefined)`.
- Submission already uses `image: imagePreview`, so clearing state means no image is saved. When editing an existing hand, the cleared value persists the removal on save.

## Scope
Only the two files above; no layout or behavior changes elsewhere in the modal.
