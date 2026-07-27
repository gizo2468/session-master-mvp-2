Make a small, targeted adjustment inside the Session Details card (`src/components/poker/SessionDetailsCard.tsx`).

1. Remove the colon after each of these five labels only: `Format`, `Game Type`, `Currency`, `Location`, `Festival`. Leave other colons in the card untouched (e.g., `Shared With:` and `Profit/Loss:`).
2. Keep the label/value group rendered in a centered two-column grid using the existing `flex justify-center` wrapper.
3. Align the label cells to the right end of the first column so every label’s text terminates at the same vertical line. This gives a consistent, equal gap between each label and its value on every row.
4. Leave the values left-aligned in the second column so they share a single clean vertical alignment.
5. Keep row spacing, font sizes, font colors, text content, and overall card spacing exactly as they are.

No other files need to change. After editing, verify the build/typecheck passes and the visual result is centered and balanced.