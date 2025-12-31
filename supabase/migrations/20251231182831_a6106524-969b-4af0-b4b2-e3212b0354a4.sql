-- ============================================
-- STORAGE BUCKET SECURITY MIGRATION
-- Make user-specific buckets private and add proper RLS
-- Keep tutorial_images public (non-sensitive coach content)
-- ============================================

-- 1. Make avatars bucket private (if exists, update; if not, create)
DO $$
BEGIN
  -- Check if avatars bucket exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    -- Update to private
    UPDATE storage.buckets SET public = false WHERE id = 'avatars';
  ELSE
    -- Create private bucket
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false);
  END IF;
END $$;

-- 2. Make opponent-avatars bucket private
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'opponent-avatars') THEN
    UPDATE storage.buckets SET public = false WHERE id = 'opponent-avatars';
  ELSE
    INSERT INTO storage.buckets (id, name, public) VALUES ('opponent-avatars', 'opponent-avatars', false);
  END IF;
END $$;

-- 3. Drop old public read policies for these buckets
DROP POLICY IF EXISTS "Public read access for opponent avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- ============================================
-- AVATARS BUCKET POLICIES (user profile pictures)
-- Only owner can read/write their own avatar
-- ============================================

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read avatars (for viewing other profiles)
-- This is needed since profile pictures are shown to other users
CREATE POLICY "Authenticated users can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================
-- OPPONENT-AVATARS BUCKET POLICIES
-- Only owner can read/write their own opponent avatars
-- ============================================

-- Keep existing upload/update/delete policies (they're correct)
-- Only add owner-scoped read policy

-- Allow users to read only their own opponent avatars
CREATE POLICY "Users can read own opponent avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'opponent-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- TUTORIAL_IMAGES stays public (coach content for students)
-- No changes needed - already has public read policy
-- ============================================