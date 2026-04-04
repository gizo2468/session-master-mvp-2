

## Fix: Users Can Self-Grant Premium Subscriptions

### Problem
The `user_subscriptions` table has permissive INSERT and UPDATE RLS policies that only check `auth.uid() = user_id`. Any authenticated user can insert a row with `status = 'active', is_active = true, plan_type = 'premium'` and grant themselves free premium access.

### Root cause
The client-side `subscriptionSyncService.ts` writes directly to `user_subscriptions` using the anon key after an IAP purchase. The RLS policies were made permissive to allow this, but that opens the door to abuse.

### Fix — 2 parts

**1. New edge function: `sync-subscription`**
- Accepts `isPremium`, `expiryDate`, `productId` from the client
- Authenticates the user via JWT
- Uses `service_role` to write to `user_subscriptions` (INSERT/UPSERT and UPDATE for deactivation)
- Also updates `profiles.is_premium` via service_role
- This replaces the direct client-side writes

**2. Migration: lock down `user_subscriptions` RLS**
- Drop the existing INSERT policy (`Users can insert their own subscriptions`)
- Drop the existing UPDATE policy (`Users can update their own subscriptions`)
- Keep the SELECT policy so users can still read their own subscriptions
- All writes now go through the edge function (service_role bypasses RLS)

**3. Update client code: `src/services/subscriptionSyncService.ts`**
- Replace direct Supabase table writes with `supabase.functions.invoke('sync-subscription', ...)`
- The function sends `isPremium`, `expiryDate`, `productId` to the edge function
- The edge function handles all database writes securely

### What stays the same
- `verify-subscription-status` edge function — unchanged
- SELECT policy on `user_subscriptions` — users can still read their own rows
- `usePremiumAccess` hook and frontend gating — unchanged
- IAP purchase flow — unchanged, just the sync target moves server-side

### Scope
- 1 new edge function
- 1 migration (drop 2 policies)
- 1 client file updated

