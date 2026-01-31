
## Reduce Vertical Spacing on Home Screen

This plan addresses the excessive vertical spacing between the header/menu area, the "New Session" button, and the Sessions Stats section.

### Current State

Looking at the current layout in `src/pages/Index.tsx`:
- Main container has `py-3` padding (line 132)
- Flex container has `gap-3` between elements (line 136)
- The button wrapper has `-my-2` negative margin (line 138)

The screenshot shows there's still too much empty space above and below the poker chip button.

### Solution

Reduce spacing by:
1. Removing vertical padding from the main container (`py-3` → `py-1`)
2. Reducing the gap between flex items (`gap-3` → `gap-1`)
3. Increasing the negative margin on the button wrapper (`-my-2` → `-my-4`) to pull elements even closer

### Changes

**File: `src/pages/Index.tsx`**

Line 132 - Reduce main container padding:
```tsx
// From:
<main className="container mx-auto max-w-md px-4 py-3">

// To:
<main className="container mx-auto max-w-md px-4 py-1">
```

Line 136 - Reduce gap between flex items:
```tsx
// From:
<div className="flex flex-col items-center gap-3">

// To:
<div className="flex flex-col items-center gap-1">
```

Line 138 - Increase negative margin on button wrapper:
```tsx
// From:
<div className="flex justify-center -my-2">

// To:
<div className="flex justify-center -my-4">
```

### What Stays the Same

- Button size (w-72 sm:w-80 h-auto)
- All other element sizes
- Button position (centered)
- All functionality and navigation
