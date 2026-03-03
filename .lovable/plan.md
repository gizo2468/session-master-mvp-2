

## Plan: Update Player Card Back Side

### Changes

#### 1. `src/components/PlayerCard/PlayerCardModal.tsx`
- Pass `privateData` to `PlayerCardBack` so it has access to the profile picture URL.

#### 2. `src/components/PlayerCard/PlayerCardBack.tsx`

**Props**: Add `profilePicture: string | null` prop.

**Title**: Change "Session Master" to "Session Master ID".

**Large avatar**: Add a circular avatar below the title/subtitle, centered, ~20w/20h, with a gold ring border (`border-2 border-poker-gold/60`). Use `profilePicture` as `img src` with `object-cover rounded-full`. Show a fallback (User icon or initials) if no picture.

**Achievements row**: Always show all 3 achievement types (bracelet, ring, trophy) with their counts — display `0` when none exist. Remove the `hasAnyAchievements` conditional so the row is always visible.

**Layout adjustments**: Reduce margins slightly to fit the avatar without overflow. Move "Playing Focus" and "Coach Info" below the avatar. Keep "Unique Player Code" and "Flip Card" at the bottom as-is.

### Files changed
- `src/components/PlayerCard/PlayerCardBack.tsx`
- `src/components/PlayerCard/PlayerCardModal.tsx`

