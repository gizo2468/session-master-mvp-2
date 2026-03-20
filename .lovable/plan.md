
Root cause found: the remaining iPhone gap is not coming from `AppLayout` anymore. It is coming from the shared safe-area utility classes themselves:

- `.header-safe` = `env(safe-area-inset-top) + 1rem`
- `.content-safe` = `env(safe-area-inset-top) + 2rem`

So across the app, pages are still adding the real iPhone top inset plus extra visual spacing above the first header/content block. That is why the empty space still appears on Home, Start New Session, coach pages, and after navigation.

Plan to fix it properly across the app:

1. Redefine the shared top-safe utilities in `src/index.css`
- Change the top-safe classes so they only apply the actual iPhone inset, not extra spacing
- Split “safe area” from “design spacing”
- Example approach:
  - header wrapper gets only `padding-top: env(safe-area-inset-top)`
  - content pages get only `padding-top: env(safe-area-inset-top)`
  - normal visual spacing becomes explicit `pt-4`, `mb-4`, `py-4`, etc. below the safe area, not above it

2. Keep `AppLayout` as the global scroll/viewport shell
- No extra top padding there
- Keep the scroll reset behavior
- Keep bottom safe handling only if needed

3. Normalize the two shared page patterns
- Header-bar pages: Home, Dashboard, Notifications, Session History, Live Session, Confirm Session, Edit Session
  - Top bar background should start at the very top
  - Header content should sit directly under the notch inset, with no extra blank band above it
- Content/back-button pages: Session Form, Settings, Connect Coach, Coach Profile via `PageContainer`, Add Past Session, Session Detail, etc.
  - First content block should start after the real safe inset only
  - Any additional spacing should be intentional inside the page layout

4. Update `PageContainer` to be the canonical safe-top wrapper
- Make it apply only the true iPhone safe inset
- Keep regular content spacing separate
- This will fix a large group of pages in one place

5. Remove the remaining “double spacing” on representative pages
- Home (`Index.tsx`)
- Session Form
- Session Detail
- Settings
- Dashboard
- Notifications
- Session History
- Add Past Session
- Live Session header
- Any other page still using `header-safe` / `content-safe`

6. Preserve navigation behavior
- Keep the current swipe-back/history fixes
- Do not add new fixed wrappers or page-specific safe-area hacks
- Ensure returning Home does not reintroduce the gap because spacing will no longer be baked into the wrong layer

Expected result:
- No actual empty space above the header on iPhone
- Header/top bar sits correctly at the top edge, respecting only the real notch inset
- No repeated gap after back navigation or swipe-back
- One consistent safe-area system across the app instead of continued page-by-page adjustments
