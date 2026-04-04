
## Fix Coach > Player Profile header name source

### Root cause
The header currently falls back to `username` when `full_name` is not resolved in the coach view, so the screen ends up rendering the username on both lines.

### Implementation
1. **`src/pages/PlayerProfile.tsx`**
- Stop using the current header fallback logic for the main name.
- Keep `profiles` as the source for:
  - `username`
  - `bio`
  - `default_currency`
- Load the player’s stored **Full Name** from the same underlying account data used by their own Account screen, but through a **coach-safe access path** instead of the current direct approach.

2. **Secure data source**
- Use the existing coach-accessible identity source if it already returns the player’s stored full name.
- If that source is still blocked by the current privacy/RLS setup, add a **small Supabase migration** with a narrowly scoped function that returns only the connected player’s header identity (`id`, `full_name`, `profile_picture`) for an approved coach-student connection.

3. **Header rendering**
- Top line: render the resolved **Full Name**
- Second line: render **`@username`**
- Remove the visible `full_name || username` fallback from the header so the username cannot appear twice again

### Scope
- No layout changes
- No styling changes
- No changes to Session Overview or other sections
- This is only a data-source/display fix for the Player Profile header
