-- Create the push_tokens table
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  push_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate tokens for the same user
  CONSTRAINT push_tokens_user_token_unique UNIQUE (user_id, push_token)
);

-- Add an index on user_id for faster lookups
CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can INSERT their own push tokens
CREATE POLICY "Users can insert their own push tokens"
ON public.push_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can SELECT only their own push tokens
CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can DELETE only their own push tokens
CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comment to table for documentation
COMMENT ON TABLE public.push_tokens IS 'Stores push notification tokens for user devices';
COMMENT ON COLUMN public.push_tokens.platform IS 'Device platform: ios, android, etc.';
COMMENT ON COLUMN public.push_tokens.push_token IS 'The device push notification token';