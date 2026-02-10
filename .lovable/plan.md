
# Display Country and Currency on Profile Card

## Current State
- The `country` and `default_currency` columns already exist in the `profiles` table
- The `usePlayerCard` hook already fetches both fields and saves them via `updateProfile`
- The onboarding flow correctly persists selections to Supabase
- Data is confirmed working (e.g., user IsheepIT has country=IL, currency=ILS stored)
- **Missing**: The profile card front view (PlayerCardFront.tsx) does not display these fields

## Changes

### 1. `src/components/PlayerCard/PlayerCardFront.tsx`
Add country flag + name and currency below the username, in the existing header section. This keeps the layout intact -- just adds a small info line under the @username.

Add import for `COUNTRIES` and `CURRENCIES` from `@/utils/countries`.

In the header area (around line 157-164), after the username paragraph, add:
```tsx
{/* Country & Currency info */}
{(profile?.country || profile?.default_currency) && (
  <p className="text-xs text-zinc-400 mt-1">
    {profile?.country && (
      <span>
        {COUNTRIES.find(c => c.code === profile.country)?.flag}{' '}
        {COUNTRIES.find(c => c.code === profile.country)?.name}
      </span>
    )}
    {profile?.country && profile?.default_currency && (
      <span className="mx-1.5">·</span>
    )}
    {profile?.default_currency && (
      <span>{profile.default_currency}</span>
    )}
  </p>
)}
```

This displays something like: "Flag Israel . ILS" in a subtle line below the username, consistent with the existing card style.

## No other changes needed
- No database migrations required (columns already exist)
- No RLS changes needed (existing policies already cover these columns)
- Save and fetch logic already works end-to-end
- Layout and design remain consistent with the current card appearance
