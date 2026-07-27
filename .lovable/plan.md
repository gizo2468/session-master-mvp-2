Rebuild the five information rows in the Session Details card so they share one consistent, centered two-column layout.

### What will change
- In `src/components/poker/SessionDetailsCard.tsx`, wrap the Format, Game Type, Currency, Location, and Festival rows in a centered grid with fixed column widths.
- Left column: label (e.g., "Format:", "Game Type:")
- Right column: value (e.g., "Tournament", "NLH")
- Use a `grid grid-cols-[auto_1fr]` or similar fixed/fixed-width layout inside a centered container, with a consistent `gap-x` between the two columns.
- Remove `flex justify-between` from the Location and Festival rows so their values are no longer pushed to the far right.
- Keep the first three rows from using `gap-2` that makes labels and values touch.
- Preserve current font sizes, colors, and text exactly as they are.
- Leave the Share with Coach button, Shared With row, End Session button, Total Buy-Ins badge, and all other card content unchanged.

### Why this approach
A centered grid with fixed column widths keeps every row visually aligned regardless of content length, avoids the space-between problem, and looks polished on mobile without changing the card's overall structure.

### Verification
- Run a TypeScript typecheck/build to ensure no errors.
- Optionally capture a screenshot of the Live Session view to confirm the rows are centered and evenly spaced.