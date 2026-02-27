

## Plan: Fix card shadow override

### Root Cause
The `.shadow-sm` override was placed in `@layer base` in `index.css`. Tailwind generates its `shadow-sm` utility in `@layer utilities`, which always wins over `@layer base` due to CSS cascade layer ordering. The green-tinted shadow never applies.

### Fix
Override `boxShadow` in **`tailwind.config.ts`** under `theme.extend` — this is the correct way to customize Tailwind utility values. This ensures every `shadow-sm` usage (including the Card component) uses the green-tinted shadow.

Also remove the ineffective `.shadow-sm` rule from `src/index.css` `@layer base`.

### Changes

**1. `tailwind.config.ts`** — Add `boxShadow` override in `theme.extend`:
```ts
boxShadow: {
  sm: '0 1px 3px 0 rgba(53, 101, 77, 0.15), 0 1px 2px -1px rgba(53, 101, 77, 0.1)',
},
```
Slightly increased opacity (0.15/0.1) vs the previous attempt (0.12/0.08) for more visible but still subtle effect.

**2. `src/index.css`** — Remove the ineffective `.shadow-sm` rule from `@layer base` (lines 159-161).

### Files changed
- `tailwind.config.ts`
- `src/index.css`

