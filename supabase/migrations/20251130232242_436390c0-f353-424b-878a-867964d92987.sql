-- Create table for custom color labels per user
CREATE TABLE public.user_color_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  color_id TEXT NOT NULL,
  custom_label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, color_id)
);

-- Enable RLS
ALTER TABLE public.user_color_labels ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own color labels
CREATE POLICY "Users can manage own color labels" ON public.user_color_labels
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_color_labels_updated_at
  BEFORE UPDATE ON public.user_color_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();