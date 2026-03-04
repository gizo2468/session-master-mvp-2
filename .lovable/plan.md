

## Plan: Back Card UI Tweaks

### File: `src/components/PlayerCard/PlayerCardBack.tsx`

**5 changes:**

1. **Enlarge avatar** — Change `w-20 h-20` to `w-32 h-32`, border to `border-3`, fallback icon to `w-12 h-12`
2. **Remove "CAREER SNAPSHOT" text** — Delete line 73 entirely
3. **Remove "PLAYING FOCUS" label** — Delete line 93, keep only the pill (centered)
4. **Center "ACHIEVEMENTS" + shrink icons** — Add `text-center` to achievements label, reduce icons from `w-10 h-10` to `w-7 h-7`, reduce count text from `text-lg` to `text-base`
5. **Shrink player code** — Change label from `text-[10px]` to `text-[8px]`, code text from `text-sm` to `text-xs`, reduce `mb-4` to `mb-2`

