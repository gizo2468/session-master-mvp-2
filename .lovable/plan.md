
## Fix "New Session" Icon Scaling

This plan addresses the zoomed-in/cropped appearance of the poker chip icon by adjusting how the image scales within its container.

### Problem

The current image styling uses fixed dimensions (`w-72 h-72`) which may not perfectly match the new poker chip image's natural aspect ratio, potentially causing it to appear cropped or scaled incorrectly.

### Solution

Adjust the image styling to ensure the full icon is always visible:
- Remove the fixed height constraint and use `h-auto` to preserve the image's natural aspect ratio
- Keep `object-contain` to prevent any cropping
- This ensures the icon scales proportionally based on width

### Changes

**File: `src/components/NewSessionButton.tsx`**

Update the image className from:
```tsx
className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
```

To:
```tsx
className="w-72 sm:w-80 h-auto object-contain"
```

This change:
- Keeps the same width (288px mobile, 320px larger screens)
- Allows height to adjust automatically based on the image's aspect ratio
- Ensures the full poker chip is visible without any cropping

### What Stays the Same

- Button position and centering
- Click behavior (navigates to `/new-session`)
- Hover and active animations
- Accessibility attributes
- No functional changes
