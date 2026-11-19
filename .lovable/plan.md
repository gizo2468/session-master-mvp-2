# Upgrade page route + Training Lab free for all coaches

## 1. Fix the blank upgrade page
- The upgrade page itself exists, but no route was ever registered for `/coach-upgrade`, so it opens blank. Register it in `App.tsx` alongside the other signed-in pages, lazy-loaded the same way.
- Check that every button leading to the upgrade page opens it:
  - Coach Dashboard plan badge and "View available plans"
  - The lock screen's Upgrade Now button (used for reviews, extra students and anywhere else that is locked)
  - Coach Session Review
  - Coach Hands List
  - Billing settings (both buttons)
- The upgrade page's back arrow currently uses "go back one step" (`navigate(-1)`), which the project rules forbid because it can loop. Change it to return to the page the lock screen saved before opening the upgrade page, and to the Coach Dashboard otherwise.

## 2. Training Lab free for every coach (temporary)
- Add one flag in `coachTiers.ts`: `TRAINING_LAB_FREE_FOR_ALL = true`.
- Add `hasTrainingLabAccess(role, tier)`. It returns true for any coach while the flag is on; otherwise it falls back to the existing `hasFeatureAccess(..., 'Training Lab')` check.
- `'Training Lab'` stays in the Starter, Pro and Elite feature lists.
- Use the new check in all four places. The lock icon, sample preview, lock screen and upgrade redirect stay in the code, hidden while the flag is on:
  - Coach Dashboard entry
  - Training Lab page
  - Create Lesson wizard
  - Training Lab card on the student's profile
- **Student seat limit per lesson:** add a `getTrainingLabStudentLimit(tier)` helper. It follows each plan's existing student limit: Free 5, Starter 10, Pro 15, Elite 25. The wizard already uses these per-plan limits, so Free coaches get 5.

## 3. Database seat check
- Update the seat-check trigger so Free coaches (and coaches with no plan set) get **5** student seats instead of 0. Starter, Pro and Elite stay at 10, 15 and 25.
- This trigger lives in the database, so the app flag can't control it. Locking Training Lab again later means flipping the flag **and** setting the Free limit back to 0 in the database. I'll note this next to the flag.

## Verification
- Open `/coach-upgrade` and confirm the page shows.
- Confirm the build passes and no lock screen appears in the Training Lab code paths for a Free coach.
- Signed-in checks aren't possible here, because the Supabase project is user-managed. I'll say which pages need a check on your side.
