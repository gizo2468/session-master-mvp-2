-- Create currency_conversions table for storing user currency conversions
CREATE TABLE currency_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  original_amount numeric NOT NULL,
  converted_amount numeric NOT NULL,
  exchange_rate numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE currency_conversions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own conversions
CREATE POLICY "Users can manage their own conversions"
  ON currency_conversions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);