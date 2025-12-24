-- Add opponent_image column to player_notes table
ALTER TABLE player_notes 
ADD COLUMN opponent_image TEXT;

-- Create opponent-avatars storage bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('opponent-avatars', 'opponent-avatars', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload opponent avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'opponent-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own files
CREATE POLICY "Users can update own opponent avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'opponent-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own opponent avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'opponent-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access for opponent avatars
CREATE POLICY "Public read access for opponent avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'opponent-avatars');