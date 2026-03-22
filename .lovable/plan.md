

## Fix: Settings → Subscription Back Navigation Loop

### Problem
The Subscription page's back button uses `navigate('/settings')` which **pushes** a new `/settings` entry onto the history stack instead of popping back. This creates the stack: `Home → Settings → Subscription → Settings(new)`, so pressing back from the new Settings entry returns to Subscription.

### Fix

**`src/pages/Subscription.tsx`** — two changes:

1. **Back button** (line 75): Change `navigate('/settings')` to `navigate(-1)` — this pops back to the existing Settings entry instead of pushing a duplicate.

2. **Post-purchase redirect** (line 47): Change `navigate('/settings')` to `navigate(-1)` — same reason; after a successful purchase, go back rather than push.

Both changes ensure Subscription is removed from the stack when leaving it, so the subsequent back from Settings correctly returns to Home.

