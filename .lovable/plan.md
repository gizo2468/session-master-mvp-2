

## Enlarge Session Master Logo in Header

### Change

**`src/components/Logo.tsx`** — line 14:
- `w-56 max-h-16` → `w-72 max-h-20`
- Width increases from 224px to 288px, height cap from 64px to 80px
- The logo will fill significantly more of the header row
- All other classes (object-contain, dark drop-shadow) unchanged

Single line, single file. No other header elements affected.

