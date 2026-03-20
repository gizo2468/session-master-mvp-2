

## Plan: Fix Swipe-Back Navigation Stack Pollution

### Problem
SessionForm's back button (line 348) uses `navigate('/')`, which pushes a **new** `/` entry onto the history stack. The resulting stack looks like:

```text
[Home] → [SessionForm] → [Home (new push)] → [SessionDetail]
```

When swiping back from SessionDetail, the user lands on Home correctly. But one more swipe-back goes to SessionForm (still in the stack), which is unexpected.

### Fix

**`src/pages/SessionForm.tsx`** — Change the back button handler from `navigate('/')` to `navigate(-1)`:

```tsx
// Line 348: Before
onClick={() => navigate('/')}

// After  
onClick={() => navigate(-1)}
```

This pops SessionForm off the stack instead of pushing a duplicate Home entry, keeping the history clean.

### Scope
- One line change in `src/pages/SessionForm.tsx`

