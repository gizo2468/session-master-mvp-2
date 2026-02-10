

# Fix Mobile Layout and Dropdown Display Issues

## Problem 1: Screen Cut Off on Mobile
The Player Card modal uses a fixed `aspect-[3/4]` ratio container (PlayerCardModal.tsx, line 97). With the new Country and Currency fields added to Step 1, the form content exceeds this fixed height on mobile screens, making it impossible to see or interact with the bottom fields.

### Fix (PlayerCardModal.tsx)
When the onboarding/editing flow is active, remove the fixed aspect ratio and instead use `max-h-[85vh]` so the card can grow to fit its content while remaining scrollable within the viewport.

**Line 97 change:**
- Current: `className="relative w-full aspect-[3/4]"`
- Updated: conditionally apply `aspect-[3/4]` only when NOT in onboarding/edit mode; otherwise use flexible height

This requires passing `isEditing` and `isFirstTimeUser` knowledge to the container. Since both are already available in the component, the container class will be:
- Onboarding/editing: `"relative w-full"` (no fixed aspect, content determines height)
- View mode: `"relative w-full aspect-[3/4]"` (original behavior preserved)

## Problem 2: Country Dropdown Shows "..."
The `SelectValue` component renders the raw value (country code like "IL") which gets truncated. To show the flag and full name, we need to provide custom content inside `SelectValue` when a country is selected.

### Fix (ProfileOnboardingFlow.tsx)
Replace the simple `<SelectValue placeholder="Select country" />` with a custom render that looks up the selected country from the COUNTRIES array and displays the flag + name.

**Lines 229-230 change:**
```tsx
<SelectTrigger className="bg-zinc-700 border-poker-gold/40 text-white">
  {country ? (
    <span className="flex items-center gap-2">
      <span>{COUNTRIES.find(c => c.code === country)?.flag}</span>
      <span>{COUNTRIES.find(c => c.code === country)?.name}</span>
    </span>
  ) : (
    <SelectValue placeholder="Select country" />
  )}
</SelectTrigger>
```

Same approach for the currency dropdown to keep it consistent.

## Files Modified
- `src/components/PlayerCard/PlayerCardModal.tsx` -- conditional aspect ratio
- `src/components/PlayerCard/ProfileOnboardingFlow.tsx` -- custom SelectValue rendering

## What Stays the Same
- All other UI, card flip animations, view mode layout, and functionality remain unchanged
- The fixed aspect ratio is preserved for the normal (non-editing) card view

