-- Create player_cards table for storing player identity card data
CREATE TABLE public.player_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  primary_format text DEFAULT 'both',
  specialization text,
  improvement_goals text,
  year_started_playing integer,
  achievements jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_cards ENABLE ROW LEVEL SECURITY;

-- Users can only access their own player card
CREATE POLICY "Users can manage their own player card"
ON public.player_cards
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_player_cards_updated_at
BEFORE UPDATE ON public.player_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();