
## Fix Connected Players identity on the actual Coach Dashboard

### What I found
- The **Coach Dashboard** screen (`src/pages/Dashboard.tsx`) renders the Connected Players section through **`src/components/coaching/MyCoachingNetwork.tsx`**.
- The player rows shown on the dashboard and the **View All Connected Players** modal both come from that same component.
- The current dashboard logic loads connected players with:
  - `profiles` for `username`
  - direct `user_private_data` access for `full_name` / `profile_picture`
- The **Player Profile header** uses a different source: the security-definer RPC **`get_student_header_identity`**, which is the reason that screen can show the correct Full Name while the dashboard still falls back to username.

### Root cause
The dashboard is not using the same identity source as the Player Profile header for connected students, so `full_name` is not being resolved the same way there.

### Implementation plan
1. **Update the real dashboard data loader**
   - In `src/components/coaching/MyCoachingNetwork.tsx`, change the coach-side Connected Players fetch inside `loadConnectedUsers()`.
   - Keep the existing `profiles` query for public fields like `username`, `bio`, and `role`.
   - Replace the direct student private-data lookup with the same identity RPC used by the header: `get_student_header_identity`.

2. **Build each connected player from the same identity logic as the header**
   - For each approved connected student:
     - main title = RPC `full_name`
     - subtitle = `@username` from `profiles`
     - avatar = RPC `profile_picture`, resolved the same way as the header/avatar flow
   - Keep a safe fallback to username only if the account truly has no full name stored.

3. **Apply it everywhere this dashboard component renders Connected Players**
   - The main **Connected Players** list on the Coach Dashboard
   - The **All Connected Players** modal in the same component
   - No changes to Connected Coaches or unrelated sections

4. **Keep UI unchanged**
   - No layout changes
   - No navigation changes
   - No card styling changes
   - Only the identity data source/display is corrected

### Technical details
- Files involved:
  - `src/components/coaching/MyCoachingNetwork.tsx` — actual fix
  - `src/pages/Dashboard.tsx` — confirmed wrapper only, no display logic change needed
  - `src/pages/PlayerProfile.tsx` — reference for the correct identity pattern
- Identity source to mirror:
  - `profiles.username`
  - `get_student_header_identity(...).full_name`
  - `get_student_header_identity(...).profile_picture`
- Result:
  - dashboard card shows **profile image**
  - top line shows **Full Name**
  - second line shows **@username**
  - same identity logic as the Player Profile header

### Verification
- Open the **Coach Dashboard**
- Confirm each Connected Player card shows:
  - correct avatar
  - Full Name on top
  - `@username` below
- Open **View All** and confirm the same identity display there too
