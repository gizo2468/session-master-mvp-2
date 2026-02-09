
# Change My Notes Chip to Open "View All Notes" Modal on Home Screen

## Overview
Update the My Notes chip button on the Home screen so it opens the "View All Notes" modal directly, instead of navigating to `/dashboard`.

## Challenge
The "View All Notes" modal is currently embedded inside `MyNotesCard` and relies on internal state and data-fetching logic (opponent profiles, notes, color filters, sort order). It cannot simply be imported as a standalone component.

## Approach
Extract the "View All Notes" dialog and its data-fetching/filtering logic into a new standalone component that can be rendered from both `MyNotesCard` and `Index.tsx`.

## Changes

### 1. Create `src/components/notes/ViewAllNotesModal.tsx` (new file)
- Extract the "All Notes" Dialog (lines 356-491 of MyNotesCard) into its own component
- Move the relevant data-fetching logic (notes query, grouping, color filtering, sort order) into this component
- Props: `open: boolean`, `onOpenChange: (open: boolean) => void`
- The component will self-contain its data fetching from Supabase, color filter state, sort state, and opponent click handling
- When an opponent is clicked, it opens the existing `ViewEditNoteModal` internally
- The "+ Add Note" button opens the existing `AddNoteModal` internally

### 2. Update `src/components/notes/MyNotesCard.tsx`
- Remove the extracted Dialog JSX (lines 356-491)
- Remove now-unused state variables (`isAllNotesModalOpen`, `modalColorFilter`, `modalSortOrder`)
- Import and render `ViewAllNotesModal` with `open={isAllNotesModalOpen}` and `onOpenChange={setIsAllNotesModalOpen}`
- Keep `isAllNotesModalOpen` state but delegate all modal internals to the new component

### 3. Update `src/pages/Index.tsx`
- Import `ViewAllNotesModal` from `@/components/notes/ViewAllNotesModal`
- Add `const [notesModalOpen, setNotesModalOpen] = useState(false)`
- Change the My Notes chip button `onClick` from `navigate('/dashboard')` to `setNotesModalOpen(true)`
- Render `<ViewAllNotesModal open={notesModalOpen} onOpenChange={setNotesModalOpen} />` alongside `PlayerCardModal`

## Technical Details
- The new `ViewAllNotesModal` will replicate the same Supabase query used in `MyNotesCard` (fetching `player_notes` joined with `opponent_profiles`)
- It will include the color filter buttons, sort dropdown, opponent list, and nested `AddNoteModal` / `ViewEditNoteModal`
- Premium access check (`usePremiumAccess`) will be included for the note limit logic
- No changes to appearance, position, or any other functionality
