

## Plan: Replace "Unique Player Code" with "Member Since"

### Changes

**1. `src/hooks/usePlayerCard.ts`** (~line 90)
- Add `created_at` to the profiles select query: `'username, online_nickname, role, country, default_currency, created_at'`
- Add `created_at` to the `PlayerProfile` interface

**2. `src/components/PlayerCard/PlayerCardModal.tsx`** (line 142-149)
- Pass `memberSince={profile?.created_at || null}` to `PlayerCardBack`

**3. `src/components/PlayerCard/PlayerCardBack.tsx`**
- Replace `barcodeValue` prop with `memberSince: string | null` in the interface
- Remove the "Unique Player Code" section (lines 94-100)
- Add "Member Since" section with same styling: small label + gold formatted date (e.g., "27 Feb 2026") using `date-fns` `format()`
- Remove unused `barcodeValue` prop references

### Date formatting
Use `format(new Date(memberSince), 'd MMM yyyy')` from `date-fns` (already installed) to produce e.g. "27 Feb 2026".

