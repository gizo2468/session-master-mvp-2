
# Reduce Vertical Spacing

## Changes (src/pages/Index.tsx only)

Two margin adjustments to make the layout tighter:

1. **Header to START SESSION**: Increase the negative margin on the NewSessionButton wrapper from `-my-20` to `-my-24` to pull it closer to the header.

2. **START SESSION to side chips**: Increase the negative margin on the side chips row from `-mt-20` to `-mt-24` to pull them closer to the START SESSION chip.

3. **Side chips to Stats**: Adjust the stats section margin from `-mt-14` to `-mt-16` to keep the tighter feel consistent.

All changes are Tailwind class adjustments on three existing `div` elements. No size, functionality, or other layout changes.
