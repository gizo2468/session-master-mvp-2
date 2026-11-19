# Fix: Coach Profile crash

## The actual error
`Uncaught Error: useLanguage must be used within a LanguageProvider`

The new Training Lab card gets its English/Hebrew text through the app's language helper (`useLanguage`). That helper only works inside a "language provider" wrapper, and that wrapper is never added to the app. Nothing on screen used the helper until now, so the problem never showed. As soon as the Training Lab card loaded, the helper threw an error and the whole Coach Profile page crashed. The same crash would also hit the Training Lab lessons list, the Create Lesson wizard and the lesson summary page.

It has nothing to do with the database or its access rules, or with the removed Key Focus Points. A search of the code finds no remaining references to the goals table, goal notifications or goal images (besides the auto-generated database types file, which updates itself).

## Fix
1. **Language helper never crashes.** The Training Lab text helper no longer depends on the missing wrapper. It reads the user's saved language (EN or HE) directly from their profile and falls back to English. This fixes every Training Lab screen at once.
2. **Training Lab card fails safely.**
   - It gets a small error safety net of its own. If anything inside it ever breaks, it shows "No lesson summaries yet" instead of crashing the page.
   - Its data fetch catches errors and returns empty lists. A failed load shows the empty state, not an error.
3. **App-wide crash risk removed.** The app-wide language wrapper is not added in this fix. Several Settings screens also call the same language helper, so I'll check that they aren't on screen today (and so can't crash).

## Verification
Using a signed-in test student linked to a coach, and a test coach, open each screen headlessly and confirm it loads with no console errors:
- Coach Profile (student view)
- Player Dashboard
- Player Profile (coach view)
- Notifications
- Training Lab list and Create Lesson wizard
