
# Reposition Side Chip Icons

## Overview
Change the two chip buttons (Player Card and My Notes) from being spread to opposite edges to being centered together with a smaller gap beneath the START SESSION button.

## Change (src/pages/Index.tsx only)

Update the container `div` for the chip buttons (currently line 147):

**Before:**
```
<div className="flex justify-between px-6 -mt-24 w-full">
```

**After:**
```
<div className="flex justify-center gap-6 -mt-28 w-full">
```

- `justify-between px-6` replaced with `justify-center gap-6` -- centers the pair and uses a controlled gap instead of edge-pinning
- `-mt-24` changed to `-mt-28` to keep them pulled up close to the START SESSION chip
- `gap-6` (1.5rem) provides a compact spacing between the two icons

No changes to icon size, style, or functionality.
