
-- Create table for storing UI state per user and screen
CREATE TABLE public.ui_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name TEXT NOT NULL,
  state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, screen_name, session_id)
);

-- Enable RLS
ALTER TABLE public.ui_state ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own UI state
CREATE POLICY "Users can manage their own UI state"
ON public.ui_state
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ui_state_user_id ON public.ui_state(user_id);
CREATE INDEX IF NOT EXISTS idx_ui_state_screen_name ON public.ui_state(screen_name);
CREATE INDEX IF NOT EXISTS idx_ui_state_user_screen ON public.ui_state(user_id, screen_name);

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ui_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ui_state_updated_at
  BEFORE UPDATE ON public.ui_state
  FOR EACH ROW
  EXECUTE FUNCTION update_ui_state_updated_at();
