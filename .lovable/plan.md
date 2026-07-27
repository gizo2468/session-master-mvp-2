Improve the subtle pulse on the “Active Tables Detected” warning card in the End Session sheet so it breathes between two shades of red instead of only fading a shadow ring.

### Current state
- `src/components/poker/EndSessionSheet.tsx` renders the warning as a clickable `button` with `bg-red-50 border border-red-200` and the class `animate-pulse-subtle`.
- `tailwind.config.ts` defines `pulse-subtle` as a 2.5s infinite box-shadow ring animation (`rgba(220, 38, 38, 0.15)` → `rgba(220, 38, 38, 0.05)`).
- The user wants the card itself to feel more noticeable by pulsing between a lighter and a slightly darker red background.

### Changes to make

1. **Add a new color-breathing keyframe in `tailwind.config.ts`**
   - Create a new keyframe, e.g. `pulse-red-breathe`.
   - Animate `backgroundColor` between a lighter red (`#FEF2F2`, Tailwind `red-50`) and a richer, slightly darker red (`#FEE2E2`, Tailwind `red-100`).
   - Set duration to about 2.5–3s, `ease-in-out`, `infinite`.

2. **Apply the new animation in `src/components/poker/EndSessionSheet.tsx`**
   - Replace `animate-pulse-subtle` with the new animation class on the warning card.
   - Keep the existing `bg-red-50` as the base state so the 0%/100% keyframe color matches the static class.
   - Keep layout, text, click behavior, border, and everything else unchanged.

3. **Clean up the old `pulse-subtle` keyframe**
   - Since `pulse-subtle` is only used for this warning card, remove the unused `pulse-subtle` keyframe and animation entry from `tailwind.config.ts` to avoid dead code.

### Verification
- Build/typecheck passes.
- Visual check in the End Session sheet confirms the warning card gently breathes between light red and a slightly richer red every ~2.5s.