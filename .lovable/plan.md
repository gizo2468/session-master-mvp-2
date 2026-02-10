

# Reposition Three Icons Around the START SESSION Chip

## Current Layout
The three small chip icons (Player Card, Coach, My Notes) are in a separate `flex` row below the START SESSION chip, using negative margins to pull them up. This makes them appear detached from the chip.

## Proposed Approach
Wrap the START SESSION chip and the three icons in a single `relative` container, then use `absolute` positioning to place each icon at the correct edge of the chip (lower-left, bottom-center, lower-right).

## Changes

### `src/pages/Index.tsx`
1. Merge the chip and icons into one `relative` positioned container
2. Remove the separate icon row (`flex justify-center gap-6 -mt-28`)
3. Position each icon using `absolute` with percentage-based coordinates so they sit half-on/half-off the chip edge:
   - **Left icon** (Player Card): `absolute bottom-[8%] left-[2%]` -- lower-left edge
   - **Middle icon** (Coach): `absolute -bottom-[8%] left-1/2 -translate-x-1/2` -- bottom-center
   - **Right icon** (My Notes): `absolute bottom-[8%] right-[2%]` -- lower-right edge
4. Each icon gets `z-10` to render above the chip
5. Icon size reduced from `w-32` to `w-16` (matching the reference image proportions)
6. Each button keeps a `p-2` padding for comfortable touch targets (min 44px)
7. Adjust the bottom margin of the combined container to account for the icons protruding below

## Technical Details
- The container stays `relative` with the chip image inside it
- Icons use `absolute` positioning with percentage values, making them responsive
- `z-10` on icons ensures they layer above the chip
- Touch targets remain independent since each `<button>` has its own absolute position and padding
- No changes to any other component, logic, or functionality
- The `StatsQuickView` margin (`-mt-16`) may need slight adjustment to prevent overlap with the bottom-protruding center icon

