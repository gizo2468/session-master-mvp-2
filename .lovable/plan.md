

## Fix: LiveSession Back Button Crashes in Browser/Preview

### Root Cause

The `LiveSessionHeader` uses `navigateToHomeWithRefresh()` which checks `window.history.length > 1` to decide whether to call `navigate(-1)`. The problem: `window.history.length` reflects the **entire browser tab history**, not just in-app navigation. It's almost always > 1, even when there's no previous in-app route.

In the Lovable preview (iframe) or when opening the LiveSession URL directly in a browser, there is no previous React Router entry. `navigate(-1)` navigates the iframe/tab **out of the app entirely** — to a blank page or the previous non-app URL. This looks like a crash.

This doesn't happen on older phone builds because native navigation always starts from Home, so there's always a valid in-app history entry to go back to.

### Fix

**`src/hooks/useNavigateWithRefresh.ts`** — In `navigateToHomeWithRefresh`, replace the unreliable `window.history.length` check with React Router's internal history index (`window.history.state?.idx`). If the index is > 0, there's a real in-app entry to go back to. Otherwise, navigate directly to `'/'` with `replace: true`.

```typescript
// Before (broken)
if (window.history.length > 1) {
  navigate(-1);
} else {
  navigate('/', { replace: true });
}

// After (fixed)
const historyIndex = window.history.state?.idx;
if (typeof historyIndex === 'number' && historyIndex > 0) {
  navigate(-1);
} else {
  navigate('/', { replace: true });
}
```

Apply the same fix to the catch block (lines 35-38).

Single file change, same pattern applied in two places within the function.

