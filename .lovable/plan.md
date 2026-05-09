## Plan

### 1. Move "Share with Coach" button into Session Details card

**`src/components/poker/SessionDetailsCard.tsx`**
- Add modal state and import `CoachSelectionModal`, `Button`, and `useAuth` (the hook `useSessionSharing` is already imported here).
- Render the button centered horizontally between the Game Type row and the Total Buy-Ins pill, only for player accounts (`user?.role === 'student'`) — same condition currently used in `LiveSessionTables`.
- Same button visuals/behavior as today: outline button, share icon, label switches between "Share with Coach" and "Shared with N coach(es)", disabled while loading or when no connected coaches.
- Reuse existing `shareSession` / `sharedCoaches` / `connectedCoaches` from `useSessionSharing(session.id)`.
- Mount `CoachSelectionModal` from this card.

**`src/components/poker/LiveSessionTables.tsx`**
- Remove the share button, modal, and the `useSessionSharing` / `useAuth` / modal state code paths that exist solely to render it.
- Keep the Active Tables list and Completed Tables display unchanged.

### 2. Color the "Active Tables (N)" heading gold

**`src/components/poker/LiveSessionTables.tsx`**
- Change the `<h4>Active Tables ({activeTables.length})</h4>` className from `text-lg font-bold mb-2` to `text-lg font-bold mb-2 text-poker-gold`.
- No other element in this section is recolored.

### Out of scope
- "Shared With:" status row in Session Details (already exists, unchanged).
- Total Buy-Ins / Game Type styling.
- Any other sharing entry points.

### Expected result
- Session Details card shows: "Session Details" → name → Game Type row → centered "Share with Coach" button → Total Buy-Ins pill.
- Active Tables block no longer shows the share button; its heading is gold.