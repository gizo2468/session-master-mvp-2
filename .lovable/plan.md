

## Widen the Home Screen Logo Without Increasing Header Height

### What
Increase the logo width from `w-44` (~176px) to `w-56` (~224px) so it appears larger and more prominent, without changing the header bar's vertical size. The logo already uses `h-auto` so it scales proportionally — the header height stays the same as long as the aspect ratio doesn't cause it to grow taller than the current bar.

To prevent any height increase, also add a `max-h` constraint (e.g., `max-h-12`) so the image scales wider but clips its height to the current bar size.

### Change

**`src/components/Logo.tsx`** — line 14:
- `w-44` → `w-56`
- Add `max-h-12` to cap the rendered height

Single line change, one file.

