

# Make the Green Border Visible

## Problem
The border styles in `src/App.css` are never loaded because the file is not imported anywhere in the application. The `#root` border rule is effectively dead code.

## Fix

### `src/App.tsx` (1 line addition)
Add the missing CSS import at the top of the file:
```tsx
import "./App.css";
```

This single import will activate the existing `#root` border rule (`2px solid #35654D`), making it visible on all screens globally.

## No other changes needed
- The CSS rule itself is already correct and complete
- `box-sizing: border-box` ensures it won't push layout
- `min-height: 100vh` ensures full-screen coverage
- Color `#35654D` already matches the poker chip green

