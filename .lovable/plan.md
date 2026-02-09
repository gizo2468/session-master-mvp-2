
# Add Two Chip Buttons Below START SESSION

## Overview
Add two smaller poker chip icon buttons directly beneath the START SESSION button on the Home screen. The left chip (User ID card) will open the Player Card modal, and the right chip (My Notes) will navigate to the Dashboard where My Notes is displayed.

## What Will Change

### New Assets
- Copy the uploaded User ID card chip image to `src/assets/chip-player-card.png`
- Copy the uploaded My Notes chip image to `src/assets/chip-my-notes.png`

### Home Screen Layout (src/pages/Index.tsx)
- Add a new horizontal row directly below the START SESSION button wrapper (inside the same flex column, before the stats section)
- The row will contain two smaller chip buttons spaced apart with `justify-between` or `justify-center gap-X`
- Left button: User ID card chip -- opens the PlayerCardModal (same behavior as the existing floating PlayerCardButton)
- Right button: My Notes chip -- navigates to `/dashboard` (where My Notes section lives)
- Apply tight negative margins to keep the spacing consistent with the current layout

### Button Behavior
- Left chip: Uses local state to open `PlayerCardModal` (imported from existing component)
- Right chip: Calls `navigate('/dashboard')` to go to the Dashboard page with My Notes
- Both buttons get the same hover/active scale transitions as the START SESSION button

## Technical Details

### src/pages/Index.tsx Changes
- Import `PlayerCardModal` from `@/components/PlayerCard/PlayerCardModal`
- Import two new chip images from `@/assets/`
- Add `useState` for controlling the PlayerCardModal open state
- Insert a new `div` with `flex justify-center gap-8` containing two `button` elements after the NewSessionButton wrapper
- Each button renders an `img` tag sized at approximately `w-20` or `w-24` (much smaller than the main chip)
- Apply negative top margin (e.g., `-mt-8`) to pull the row tight against the START SESSION chip
- Adjust the stats section margin if needed to keep the gap minimal

### File Changes Summary
1. **Copy** `user-uploads://image-379.png` to `src/assets/chip-player-card.png`
2. **Copy** `user-uploads://image-378.png` to `src/assets/chip-my-notes.png`
3. **Edit** `src/pages/Index.tsx` -- add the two chip buttons row and PlayerCardModal state/component
