

## Add Screenshot Indicator to Hand Cards in Session Summary

### Problem
The hand list query intentionally excludes `hand_image` (base64 data) for performance. This means `hand.hand_image` is always undefined on the hand card, so the existing "Screenshot" badge (lines 640-652) never renders.

### Solution
Query only a boolean indicator of whether each hand has an image, without fetching the heavy base64 data.

### Changes — single file: `src/components/coaching/SharedSessionModal.tsx`

**A. Add state to track which hands have images**
- Add a `Set<string>` state variable `handsWithImages` (similar to existing `handsWithFeedback`)

**B. After fetching hands, query for image existence**
- After the hands are loaded (around line 218), add a lightweight query:
  ```sql
  SELECT id FROM session_hands_new WHERE id IN (...) AND hand_image IS NOT NULL
  ```
  This returns only IDs, not the actual image data, keeping it fast.

**C. Update the Screenshot badge condition (line 640)**
- Change `hand.hand_image &&` to `handsWithImages.has(hand.id) &&`
- Remove the `onClick` that tries to use `hand.hand_image` directly (since it's not loaded)
- Instead, make the badge a visual-only indicator (no click action needed — clicking the card already opens the Hand Review modal which lazy-loads the image)

### Result
- A gold "Screenshot" pill badge appears on hand cards that have an attached image
- No performance impact — only hand IDs are fetched, not base64 data
- Clicking the hand card still opens Hand Review where the full image loads on demand

