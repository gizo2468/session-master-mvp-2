-- Enable RLS on storage.objects (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access to the tutorial_images bucket
CREATE POLICY "Public read tutorial_images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tutorial_images');

-- Allow authenticated users to upload images to their own player_goals_images folder
CREATE POLICY "Users can upload player goals images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tutorial_images'
  AND (storage.foldername(name))[1] = 'player_goals_images'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update their own images in player_goals_images folder
CREATE POLICY "Users can update own player goals images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tutorial_images'
  AND (storage.foldername(name))[1] = 'player_goals_images'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tutorial_images'
  AND (storage.foldername(name))[1] = 'player_goals_images'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own images in player_goals_images folder
CREATE POLICY "Users can delete own player goals images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tutorial_images'
  AND (storage.foldername(name))[1] = 'player_goals_images'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
