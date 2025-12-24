-- Migration to fix table_bb_stack_updates schema

-- First, backup existing data if any and convert text to numeric
DO $$
BEGIN
  -- Update existing text data to numeric types if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'table_bb_stack_updates') THEN
    -- Convert stack from text to numeric where possible
    UPDATE table_bb_stack_updates 
    SET stack = CASE 
      WHEN stack ~ '^[0-9]+$' THEN stack::BIGINT::TEXT
      ELSE NULL 
    END
    WHERE stack IS NOT NULL AND stack != '';
    
    -- Convert bb from text to numeric where possible  
    UPDATE table_bb_stack_updates 
    SET bb = CASE 
      WHEN bb ~ '^[0-9]+$' THEN bb::INTEGER::TEXT
      ELSE NULL 
    END
    WHERE bb IS NOT NULL AND bb != '';
    
    -- Convert blinds from text to numeric where possible
    UPDATE table_bb_stack_updates 
    SET small_blind = CASE 
      WHEN small_blind ~ '^[0-9]+\.?[0-9]*$' THEN small_blind::NUMERIC::TEXT
      ELSE NULL 
    END
    WHERE small_blind IS NOT NULL AND small_blind != '';
    
    UPDATE table_bb_stack_updates 
    SET big_blind = CASE 
      WHEN big_blind ~ '^[0-9]+\.?[0-9]*$' THEN big_blind::NUMERIC::TEXT
      ELSE NULL 
    END
    WHERE big_blind IS NOT NULL AND big_blind != '';
  END IF;
END $$;

-- Drop existing table if it exists to recreate with proper schema
DROP TABLE IF EXISTS public.table_bb_stack_updates CASCADE;

-- Create the table with proper column types
CREATE TABLE public.table_bb_stack_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  table_id UUID NOT NULL,
  
  -- Tournament fields (mutually exclusive with cash fields)
  level INTEGER,
  stack BIGINT,
  bb INTEGER,
  
  -- Cash game fields (mutually exclusive with tournament fields)
  small_blind NUMERIC(10,2),
  big_blind NUMERIC(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Integrity constraint for exclusive modes
  CONSTRAINT exclusive_game_type CHECK (
    (level IS NOT NULL AND stack IS NOT NULL AND bb IS NOT NULL AND small_blind IS NULL AND big_blind IS NULL) OR
    (small_blind IS NOT NULL AND big_blind IS NOT NULL AND level IS NULL AND stack IS NULL AND bb IS NULL)
  )
);

-- Add foreign key constraints
ALTER TABLE public.table_bb_stack_updates 
ADD CONSTRAINT fk_session_id 
FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE public.table_bb_stack_updates 
ADD CONSTRAINT fk_table_id 
FOREIGN KEY (table_id) REFERENCES public.session_tables(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_bb_stack_updates_user_session_table_created 
ON public.table_bb_stack_updates (user_id, session_id, table_id, created_at DESC);

CREATE INDEX idx_bb_stack_updates_session_table_created 
ON public.table_bb_stack_updates (session_id, table_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.table_bb_stack_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own updates
CREATE POLICY "Users can manage their own bb stack updates"
ON public.table_bb_stack_updates
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Coaches can view updates for shared sessions
CREATE POLICY "Coaches can view bb stack updates for shared sessions"
ON public.table_bb_stack_updates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.shared_sessions ss
    WHERE ss.session_id = table_bb_stack_updates.session_id 
      AND ss.coach_id = auth.uid()
  )
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_table_bb_stack_updates_updated_at
  BEFORE UPDATE ON public.table_bb_stack_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();