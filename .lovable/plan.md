## Plan

Change the active/selected pill states in the session setup forms from felt-green to brand gold, keeping white text for legibility.

### Changes

1. **`src/pages/SessionForm.tsx`** — In the four selection labels (Game Type: NLH/PLO; Format: Cash/Tournament), replace the active classes:
   - From: `bg-poker-feltGreen text-white border-poker-feltGreen`
   - To: `bg-poker-gold text-white border-poker-gold`

2. **`src/components/poker/PastSessionForm.tsx`** — Same replacement on the four mirror selection pills (lines 369, 385, 420, 436) so the past-session entry flow stays consistent.

### Out of scope (intentionally untouched)

- The submit button (`bg-poker-feltGreen` on PastSessionForm L780) — primary CTA, not a selection state.
- Status badges, focus-ring inputs, "Continuing" labels, and back-button text colors that use `poker-feltGreen` for non-selection meanings.
- Tournament-type chevron and Advanced Options text already use `text-poker-gold`.

### Expected result

Selecting "No Limit Hold'em", "Pot Limit Omaha", "Cash Game", or "Tournament" highlights the chosen pill in the brand gold (`poker-gold`) with white text, matching the rest of the gold accent system. Unselected pills remain unchanged.