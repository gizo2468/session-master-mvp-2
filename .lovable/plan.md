
# Remove Obsolete Player Card Floating Button

## What's changing
The circular gold floating button (bottom-left corner of the screen) that opens the Player Card modal will be removed. This button is now redundant because the Player Card chip button on the Home screen handles the same action.

## Changes

### 1. `src/pages/Index.tsx`
- Remove the `PlayerCardButton` import (line 12)
- Remove `<PlayerCardButton />` from the header (line 131)

### 2. No other files affected
The `PlayerCardButton` component file itself can remain in the codebase (it may be used elsewhere), but it will no longer be rendered on the Home screen.

## Technical Notes
- The existing `PlayerCardModal` at line 244 (controlled by the chip button state) remains untouched
- The chip button at line 149-155 continues to handle Player Card access
- No functionality, data flow, or other UI changes
