Update `src/components/poker/SessionDetailsCard.tsx` only:

1. Remove the `session.location?.trim()` paragraph that renders below the "Session Details" title (this is the source of the "Session Jul 27" text).
2. Change the layout of the three rows — Format, Game Type, and Currency — from `flex justify-between` to a compact left-aligned layout (e.g., `flex items-center gap-2`) so the label and value sit next to each other on the left side with a small, consistent gap.
3. Leave all other rows, buttons, colors, spacing, text, and functionality unchanged.

Verify by checking the rendered Session Details card in the preview for the current live session.