
# Adjust Spacing of START SESSION and Side Icons

## Changes (src/pages/Index.tsx only)

1. **Spread the two small chip icons to the edges**: Change the chip buttons container from `flex justify-center gap-8` to `flex justify-between px-8` so the Player Card chip sits near the left edge and My Notes chip sits near the right edge, with the START SESSION chip centered above them.

2. **Reduce vertical space between header and START SESSION chip**: Change the main content container's top padding from `py-1` to `py-0` or remove it, and increase the negative margin on the NewSessionButton wrapper from `-my-16` to `-my-20` (or similar) to pull the chip closer to the header.

No other layout, size, or functionality changes.
