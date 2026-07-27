Update `src/components/poker/SessionDetailsCard.tsx` only:

1. Move the "Shared With:" row (including the Share2 icon, label, and coach username) from its current position below the red "End Session" button to directly above it, within the same centered vertical stack.
2. Change the row's layout from `flex justify-between` to `flex items-center gap-2` so the label and coach username sit close together and left-aligned instead of being spread across the full width.
3. Keep the Share2 icon, label text, amber username color, hover underline, and all other styling unchanged.
4. Ensure the row remains centered on mobile by keeping it inside the existing centered card content container.

Verify by checking the Session Details card in the preview for the current live session.