
# Fix: Header Click Area Blocked by START SESSION Button

## Problem
The negative margin (`-my-24`) on the START SESSION button container pulls the large image upward, overlapping the header area. Since the header lacks a `z-index`, the button's invisible click area sits on top of the header elements (Settings, User, Logo, Notification Bell), intercepting all clicks.

## Fix (src/pages/Index.tsx only)

### Add `relative z-10` to the header element (line 105)
This ensures the header renders above the overlapping button.

**Before:**
```
<header className="bg-white shadow-sm">
```

**After:**
```
<header className="bg-white shadow-sm relative z-10">
```

This is a single-line change. No other files or functionality are affected.
