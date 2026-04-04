

## Fix Dark Mode Input Readability in End Table Dialog

### Problem
All `<input>` elements in `EndTableDialog.tsx` use raw HTML inputs without dark mode background or text color classes. They inherit the dialog's dark background but have no explicit text color, making typed text invisible or very hard to read.

### Fix — Single file: `src/components/poker/EndTableDialog.tsx`

Add a shared dark mode class set to every `<input>` and `<Textarea>` element:

**Input dark mode classes to add:**
- `dark:bg-[hsl(0,0%,13%)]` — matches the card surface color
- `dark:text-gray-100` — bright text for readability
- `dark:placeholder-gray-500` — visible but secondary placeholders
- `dark:border-[hsl(30,5%,24%)]` — subtle warm border matching the app's dark divider system

**Affected inputs (6 total):**
1. Cash Out Amount input (line 131)
2. Final Position input (line 148)
3. Bounty Count input (line 166)
4. Bounty Amount input (line 186)
5. Next Day Start input (line 259)
6. Chips Carryover input (line 276)

**Affected textarea (1):**
7. Notes textarea (line 239) — same dark classes

**Currency prefix span** (line 178): already has `dark:bg-background` — update to `dark:bg-[hsl(0,0%,10%)]` for subtle distinction from the input field.

No layout, functionality, or light mode changes.

