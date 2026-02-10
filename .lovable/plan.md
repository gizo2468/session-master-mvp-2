
# Add Country and Currency Fields to Profile Setup

## Overview
Add "Country of Residence" and "Primary Playing Currency" dropdowns to Step 1 (Basic Identity) of the profile onboarding flow. Both fields will be stored in the `profiles` table and displayed during create and edit.

## Database Change

### Migration: Add `country` column to `profiles` table
```sql
ALTER TABLE profiles ADD COLUMN country text DEFAULT NULL;
```

No RLS changes needed -- existing policies already allow users to read/update their own profile.

## Code Changes

### 1. Create `src/utils/countries.ts` (new file)
- Export a `COUNTRIES` array of `{ code, name, flag }` objects (ISO 3166-1 codes)
- Include all commonly recognized countries with their flag emoji (e.g., `{ code: 'US', name: 'United States', flag: '🇺🇸' }`)
- Exclude Palestine per requirement
- ~195 entries, sorted alphabetically by name

### 2. Update `src/hooks/usePlayerCard.ts`
- Add `country` and `default_currency` to the `PlayerProfile` interface (read from `profiles` table)
- Fetch `country` and `default_currency` alongside `username, online_nickname, role` in the existing profiles query
- Add an `updateProfile` callback that updates the `profiles` table (for country and default_currency)
- Return `updateProfile` from the hook

### 3. Update `src/components/PlayerCard/ProfileOnboardingFlow.tsx`
- Add props: `profile: PlayerProfile | null`, `onUpdateProfile: (updates) => void`
- Add local state for `country` and `currency`, initialized from `profile`
- In `renderStep1()`, after Game Focus, add:
  - **Country** dropdown: searchable Select showing flag + country name, styled consistently
  - **Currency** dropdown: Select with the existing `CURRENCIES` list from `useDefaultCurrency`
- On `handleNext` (step 1) and `handleComplete`, call `onUpdateProfile({ country, default_currency: currency })`

### 4. Update `src/components/PlayerCard/PlayerCardFront.tsx`
- Pass `profile` and `onUpdateProfile` through to `ProfileOnboardingFlow`

### 5. Update `src/integrations/supabase/types.ts`
- Add `country` to the `profiles` table type (Row, Insert, Update)

## UI Design Details
- Both dropdowns use the existing `Select` / `SelectContent` / `SelectItem` components
- Country dropdown shows flag emoji next to country name (e.g., "🇺🇸 United States")
- Currency dropdown shows symbol + code (e.g., "$ USD")
- Both fields are optional (can be skipped)
- Styled with the same `bg-zinc-700 border-poker-gold/40` pattern as the Display Name input
- Labels use the same `text-xs text-zinc-500 uppercase tracking-wider` style

## What stays the same
- All other UI elements, functionality, and data flows remain unchanged
- The existing `default_currency` in the profiles table is reused (no new currency column)
- Step 2 (Poker Background) and Step 3 (Achievements) are untouched
