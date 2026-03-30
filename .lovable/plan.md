

## Fix Logo Size — Make It More Prominent

### Problem
The `max-h-12` (48px) height cap is too restrictive, keeping the logo tiny despite the `w-56` width.

### Change

**`src/components/Logo.tsx`** — line 14:
- Change `max-h-12` → `max-h-16` (64px max height)
- This gives the logo ~33% more vertical room to render at a visible size while still fitting within the header bar

Single line, single file.

