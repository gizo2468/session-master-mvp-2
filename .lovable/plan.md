

## Plan: Fix profile image sync + Add back-card view on avatar tap

### Problem 1: Profile image not resolving correctly
The `CoachProfileCard` and `PlayerProfile` pages pass `profile_picture` directly to `AvatarImage`. Since the avatar upload system stores relative paths (e.g. `userId/avatar.jpg`) in `user_private_data.profile_picture`, these won't render without being resolved to full public URLs. The `usePlayerCard` hook has a `resolveProfilePicture()` helper, but the coach/player profile pages don't use it.

### Problem 2: No back-card view on avatar tap
Currently, tapping the avatar on the coach or player profile does nothing special. The request is to open a view-only back side of that user's Session Master ID card.

---

### Changes

**1. New component: `src/components/PlayerCard/ViewOnlyCardBack.tsx`**

A lightweight modal that shows just the back side of a specific user's card. It fetches that user's profile, private data, player_card (achievements), and `created_at` from Supabase, then renders `PlayerCardBack` in a dark overlay. No flip interaction — just the back side with a close button. The `onFlip` prop on `PlayerCardBack` will be repurposed as a close action.

Props: `userId: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`

Data fetching inside the component:
- `profiles` → `role`, `created_at`
- `user_private_data` → `full_name`, `profile_picture`
- `player_cards` → `achievements`

Uses existing `resolveProfilePicture` (extracted from `usePlayerCard.ts` or duplicated as a small utility).

**2. `src/pages/CoachProfile.tsx`**
- Import `resolveProfilePicture` and apply it when building `coachProfile` (line 138): `profile_picture: resolveProfilePicture(privateResult.data?.profile_picture)`
- Add state for `backCardOpen` + `backCardUserId`
- Make the avatar in `CoachProfileCard` clickable by passing an `onAvatarClick` prop
- Render `ViewOnlyCardBack` modal

**3. `src/components/coaching/CoachProfileCard.tsx`**
- Accept optional `onAvatarClick?: () => void` prop
- Wrap the Avatar in a clickable container that calls `onAvatarClick`

**4. `src/pages/PlayerProfile.tsx`**
- Import `resolveProfilePicture` and apply it when building `playerData` (line 127): `profile_picture: resolveProfilePicture(privateResult.data?.profile_picture)`
- Add state for `backCardOpen`
- Make the avatar clickable → opens `ViewOnlyCardBack` with the player's ID
- Render `ViewOnlyCardBack` modal

**5. Export `resolveProfilePicture` from `src/hooks/usePlayerCard.ts`**
- Add `export` keyword to the existing `resolveProfilePicture` function (line 17) and `buildAvatarPublicUrl` (line 9)

### Technical details

The `ViewOnlyCardBack` component will:
- Use the same dark overlay style as `PlayerCardModal` (`bg-black/80 backdrop-blur-sm`)
- Fetch data on mount via `useEffect` with the target `userId`
- Show a loading spinner while fetching
- Render `PlayerCardBack` with `onFlip` wired to close the modal (labeled as close, not flip)
- Use `aspect-[3/4]` container like the existing card

