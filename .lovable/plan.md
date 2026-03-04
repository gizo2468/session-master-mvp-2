

## Plan: Back Card Layout Adjustments

### Changes

#### 1. `src/components/PlayerCard/PlayerCardBack.tsx`

**Add new props**: `fullName: string | null` and pass from modal.

**Replace "Cash & MTT" pill** (lines 90-97) with user identity:
- Full name in gold, large, centered (`text-lg font-bold text-poker-gold`)
- Role label below: "Coach" or "Player" (`text-sm text-zinc-400`)

**Remove "Achievements" title** (line 122) but keep the 3 icons + counts row.

**Enlarge avatar** from `w-32 h-32` to `w-40 h-40`.

**Restructure layout** so achievements row sits just above the player code (bottom area), with `flex-1` spacer pushing it down.

Remove `getFormatLabel` function and `primaryFormat` prop (no longer needed). Remove coach info section too since role is now shown under the name.

#### 2. `src/components/PlayerCard/PlayerCardModal.tsx`

Pass `fullName={privateData?.full_name || null}` to `PlayerCardBack`.

### Layout order (top to bottom):
1. "SESSION MASTER ID" title
2. Large avatar (w-40 h-40)
3. Full name (gold, centered)
4. Role label ("Coach" / "Player")
5. Spacer
6. Achievement icons row (3 icons + counts, no title)
7. Unique Player Code
8. Flip Card button

