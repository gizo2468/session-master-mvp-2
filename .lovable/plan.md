

## Plan: Fix iOS Avatar Upload (Capacitor)

### Root Cause
`PlayerCardModal` never passes `onUploadPhotoDataUrl` to `PlayerCardFront`. The native image picker returns a data URL string, but no handler exists for it. The spinner stays forever because no code runs.

### Secondary Issue
The `avatars` bucket is **public**, but the code uses `getSignedUrl` (for private buckets). We should use public URLs consistently — simpler, no expiry issues.

### Changes

**1. `src/hooks/usePlayerCard.ts`**
- Add `uploadPhotoFromDataUrl(dataUrl: string)` function:
  - Convert base64 data URL to Blob via `fetch(dataUrl).then(r => r.blob())`
  - Upload to `avatars/{userId}/avatar.jpg` with `upsert: true`, `contentType: 'image/jpeg'`
  - Get public URL via `supabase.storage.from('avatars').getPublicUrl()`
  - Store the **file path** (`{userId}/avatar.jpg`) in `user_private_data.profile_picture` (not a full URL — keeps it portable)
  - Set local state to public URL + cache-bust query param for immediate display
  - Wrap in `try/catch/finally` — spinner always stops in `finally`
  - Show success/error toast
- Update `uploadPhoto(file: File)` to also store just the file path in DB and use public URL for display (consistency)
- Update `fetchData` to resolve `profile_picture`: if it's a path (no `http`), build public URL; if it's already a full URL, use as-is (backward compat)
- Export `uploadPhotoFromDataUrl` from hook return

**2. `src/components/PlayerCard/PlayerCardModal.tsx`**
- Destructure `uploadPhotoFromDataUrl` from `usePlayerCard()`
- Pass `onUploadPhotoDataUrl={uploadPhotoFromDataUrl}` to `PlayerCardFront` (line ~120)

### Acceptance Criteria
1. File created at `avatars/{userId}/avatar.jpg` in Supabase Storage
2. `user_private_data.profile_picture` updated with file path `{userId}/avatar.jpg`
3. UI refreshes immediately showing the new avatar (public URL with cache-bust)
4. Spinner always stops — `finally` block sets `isSaving(false)` in both upload functions
5. Error toast shown if upload or DB update fails
6. Existing web file upload (`onUploadPhoto`) continues to work with same path convention
7. Backward compatible with any existing full-URL values in `profile_picture`

### Files Changed
- `src/hooks/usePlayerCard.ts`
- `src/components/PlayerCard/PlayerCardModal.tsx`

