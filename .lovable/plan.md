

## Plan: Fix Lightbox Dismiss Behavior on iOS

### Problem
The `DialogContent` spans the entire screen (`w-screen h-[100dvh]`), so there is no "outside" area — the Radix overlay's click-to-close never fires. Combined with `[&>button]:hidden` hiding the default close button, users can get trapped on iOS where the custom X button may not respond reliably.

### Fix (single file: `ImageUploadSection.tsx`)

1. **Make the background area dismissible**: Add an `onClick` handler on the `DialogContent` itself that calls `setIsLightboxOpen(false)`, and add `e.stopPropagation()` on the image and buttons so tapping them doesn't close the modal.

2. **Ensure the X button is always tappable on iOS**: Give the close button a minimum 44×44px touch target, add `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` inline styles, and increase its `z-20` to sit above everything.

3. **Remove `[&>button]:hidden`**: Instead, keep hiding the *default* Radix close button but ensure our custom one is always visible. Use the more specific selector `[&>button.absolute.right-4]:hidden` or simply keep the existing approach but verify the custom button isn't accidentally hidden.

### Implementation detail

```tsx
<DialogContent 
  className="... [&>button]:hidden"
  onClick={() => setIsLightboxOpen(false)}
>
  {/* Close button - stops propagation so it doesn't double-fire */}
  <Button
    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
    className="absolute top-4 right-4 z-20 text-white hover:bg-white/10 min-w-[44px] min-h-[44px]"
    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
  >
    <X className="w-6 h-6" />
  </Button>

  {/* Image - stops propagation so tapping doesn't close */}
  <img onClick={(e) => e.stopPropagation()} ... />

  {/* Edit button - stops propagation */}
  <div onClick={(e) => e.stopPropagation()} ...>
    <Button onClick={handleEditPhoto} ...>Edit Photo</Button>
  </div>
</DialogContent>
```

Single file change, no UI/design/layout changes — only fixes the dismiss behavior.

