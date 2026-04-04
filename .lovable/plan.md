

## Fix Start New Session Screen Styling

### Problem
1. The title "Start New Session" uses `text-poker-black` (#212121) which is nearly invisible on a dark background
2. The Back button uses `text-poker-feltGreen` which doesn't match the app's gold accent system

### Changes — single file: `src/pages/SessionForm.tsx`

**A. Fix the title color (line 355)**
- Change `text-poker-black` to `text-foreground` so it automatically adapts to light/dark mode with proper contrast

**B. Fix the Back button color (line 350)**
- Change `text-poker-feltGreen` to `text-poker-gold` so it uses the app's gold accent (#D4AF37) in both light and dark mode
- This makes it consistent with the app's premium gold design language

### No other files or layout changes needed.

