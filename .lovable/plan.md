Make a small, targeted typography change in two files to make the two section titles slightly larger.

1. In `src/components/poker/SessionDetailsCard.tsx`, update the "Session Details" `<CardTitle>` from `text-lg` to `text-xl` (or an equivalent size) while keeping its `font-bold`, `text-poker-gold`, and `text-center` styling unchanged.
2. In `src/components/poker/LiveSessionTables.tsx`, update the "Active Tables (n)" heading from `text-lg` to the same new size as above, preserving its `font-bold`, `text-poker-gold`, and margin/spacing classes.
3. Leave every other text element, button, card, table content, and surrounding spacing untouched.

After the change, the two titles will share a larger, consistent size and stand out more clearly without changing color, weight, alignment, or layout.