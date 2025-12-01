-- Create opponent_profiles table
CREATE TABLE public.opponent_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nickname TEXT NOT NULL,
  image_url TEXT,
  color TEXT DEFAULT 'white',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create unique constraint for case-insensitive nickname per user
CREATE UNIQUE INDEX opponent_profiles_user_nickname_unique ON public.opponent_profiles (user_id, LOWER(nickname));

-- Enable RLS
ALTER TABLE public.opponent_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can manage their own opponent profiles
CREATE POLICY "Users can manage own opponent profiles" ON public.opponent_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add foreign key column to player_notes (nullable initially for migration)
ALTER TABLE public.player_notes 
ADD COLUMN opponent_profile_id UUID REFERENCES public.opponent_profiles(id) ON DELETE CASCADE;

-- Migrate existing data: Create profiles from existing notes
-- Uses first note's image/color per opponent (by created_at)
INSERT INTO public.opponent_profiles (user_id, nickname, image_url, color)
SELECT DISTINCT ON (user_id, LOWER(opponent_name))
  user_id,
  opponent_name,
  opponent_image,
  color
FROM public.player_notes
ORDER BY user_id, LOWER(opponent_name), created_at ASC;

-- Link existing notes to their profiles
UPDATE public.player_notes pn
SET opponent_profile_id = op.id
FROM public.opponent_profiles op
WHERE pn.user_id = op.user_id 
  AND LOWER(pn.opponent_name) = LOWER(op.nickname);

-- Make opponent_profile_id required (after migration)
ALTER TABLE public.player_notes 
ALTER COLUMN opponent_profile_id SET NOT NULL;

-- Drop old columns that are now in opponent_profiles
ALTER TABLE public.player_notes 
DROP COLUMN opponent_name,
DROP COLUMN opponent_image,
DROP COLUMN color;

-- Create updated_at trigger for opponent_profiles
CREATE TRIGGER update_opponent_profiles_updated_at
  BEFORE UPDATE ON public.opponent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();