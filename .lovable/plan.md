

## Plan: Back Card Layout Refinement

### File: `src/components/PlayerCard/PlayerCardBack.tsx`

**Reorder layout to:**
1. "SESSION MASTER ID" title
2. Role ("Player" / "Coach") — moved up, directly under title
3. Spacer (flex-1) — pushes avatar to center
4. Large avatar — enlarged from `w-40 h-40` to `w-48 h-48`
5. Spacer (flex-1) — balances centering
6. Full name — moved down, directly above achievements (tight spacing, `mb-1`)
7. Achievements row
8. Unique Player Code
9. Flip Card button

**Specific changes:**
- Move role text (`isCoach ? 'Coach' : 'Player'`) into the header section under the title
- Add `flex-1` spacers above and below the avatar to vertically center it
- Enlarge avatar to `w-48 h-48`, fallback icon to `w-20 h-20`
- Place full name (`text-poker-gold font-bold text-lg`) just above achievements with `mb-1`
- Keep everything else (achievements, code, flip button) as-is

