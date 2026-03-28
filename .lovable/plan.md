

## Replace Home Screen Header Logo

### What
Replace the current logo image (`/lovable-uploads/9dacd61d-...`) with the new uploaded Session Master logo in the header, ensuring it looks crisp in both light and dark mode.

### Changes

**1. Copy asset** — Copy `user-uploads://image-515.png` to `src/assets/session-master-logo.png`

**2. Update `src/components/Logo.tsx`**
- Import the new asset via ES module: `import logoSrc from '@/assets/session-master-logo.png'`
- Replace the hardcoded `/lovable-uploads/...` path with the imported `logoSrc`
- Increase size from `w-40` to `w-44` for better visual presence in the header
- Add `dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]` for subtle glow/contrast boost in dark mode
- The logo has a white/transparent background — it naturally works on light backgrounds; the drop shadow ensures visibility on dark

**3. Splash screen** — Same `<Logo />` component is used in the splash (line 144 of Index.tsx), so it updates automatically.

### What stays the same
- Header layout, button positions, spacing, navigation
- Logo placement (center of header, flex justified)
- All other pages and components

Single asset copy + one component file edit.

