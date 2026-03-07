

## Plan: Fix Session Time Frame Centering

### Root cause
The frame uses `mx-auto w-fit` for centering within a `text-center` parent. While this should work, the combination of `w-fit`, inline `padding: 16px 28px`, `outline` with negative offset, and the `boxShadow` glow can create visual misalignment. The parent card relies on `text-center` (text alignment) rather than a proper flex centering layout.

### Fix (single file: `src/components/poker/SessionTimerCard.tsx`)

**Line 187** — Change the outer card wrapper to use flexbox column centering instead of `text-center`:
```
"bg-white rounded-lg shadow-md p-6 mb-6 text-center"
→
"bg-white rounded-lg shadow-md p-6 mb-6 flex flex-col items-center"
```

This ensures all direct children (including the frame div) are mathematically centered via flexbox, regardless of `w-fit`, outline offsets, or box-shadow.

**Line 189** — The frame div can keep `w-fit` but drop `mx-auto` since the parent flex handles centering:
```
"mx-auto rounded-xl mb-3 relative w-fit"
→
"rounded-xl mb-3 relative w-fit"
```

**Lines 219, 238** — The stats grid and button sections below need `w-full` added so they still span the full card width under the flex parent:
- Grid (line 219): `"grid grid-cols-2 gap-4 mb-6"` → `"grid grid-cols-2 gap-4 mb-6 w-full"`
- Buttons (line 238): `"flex flex-col gap-2"` → `"flex flex-col gap-2 w-full"`

### What stays unchanged
- Frame colors, border, glow, outline — untouched
- Digits font, size, logic — untouched
- All other UI elements — untouched

