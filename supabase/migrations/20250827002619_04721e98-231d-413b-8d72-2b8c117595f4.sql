-- Fix the storage issue and complete tutorial removal

-- First clear all objects from tutorial_images bucket
DELETE FROM storage.objects WHERE bucket_id = 'tutorial_images';

-- Now we can safely delete the bucket
DELETE FROM storage.buckets WHERE name = 'tutorial_images';

-- Remove tutorial-related columns from profiles table if they exist
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS has_completed_tutorial,
  DROP COLUMN IF EXISTS has_seen_tutorial;