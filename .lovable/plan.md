

## Plan: Add Unique Hand ID to Export Header

### Approach

Each hand in `session_hands_new` already has a unique `id` (UUID) in the database. We will derive a **deterministic numeric ID** from this UUID so:
- It is unique per hand
- It is consistent across exports (same hand always gets same ID)
- It looks clean (e.g., `#1847931181`) — no UUIDs in the output

### How

Convert the UUID to a numeric hash using a simple deterministic algorithm: take the hex digits of the UUID, parse chunks as integers, and combine them into a 9-10 digit number. This is the same approach used previously with `uuidToNumericId`.

### File to Modify

**`src/utils/pt4HandHistoryExport.ts`**

1. **Add `uuidToNumericId` helper** — deterministic conversion of UUID string to a stable numeric ID
   ```typescript
   function uuidToNumericId(uuid: string): string {
     const hex = uuid.replace(/-/g, '');
     let hash = 0;
     for (let i = 0; i < hex.length; i++) {
       hash = ((hash << 5) - hash + hex.charCodeAt(i)) & 0x7fffffff;
     }
     return String(hash || 1);
   }
   ```

2. **Update `generateHandHistory`** (line 283) — change header from `SessionMaster Hand` to `SessionMaster Hand #<numeric_id>`:
   ```
   - lines.push('SessionMaster Hand');
   + const handId = uuidToNumericId(hand.id);
   + lines.push(`SessionMaster Hand #${handId}`);
   ```

### What Stays The Same
- All other export logic unchanged
- The `stripIds` function still removes UUIDs from action text — this numeric ID is not a UUID so it won't be stripped
- No database schema changes needed — we use the existing `hand.id` UUID as the source

### Result
```text
SessionMaster Hand #1847931181
Session: home (Tournament)
Table: home
Game: NLH
Blinds: 2/4
...
```

