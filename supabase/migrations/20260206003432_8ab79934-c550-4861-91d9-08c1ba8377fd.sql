-- Alternative approach: Use PostgreSQL configuration settings
-- This is simpler and doesn't require vault permissions

-- Unschedule the old cron job first
SELECT cron.unschedule('session-reminders-hourly');

-- Reschedule with inline values but in a cleaner format
-- Note: For cron jobs, the anon key is designed to be public 
-- and is already exposed in client-side code. This approach
-- centralizes the configuration in the scheduled job definition.
SELECT cron.schedule(
  'session-reminders-hourly',
  '0 * * * *',
  $$
  DO $cron$
  DECLARE
    v_url text := 'https://wfmvvpbpuqbzidptxbqx.supabase.co';
    v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXZ2cGJwdXFiemlkcHR4YnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjY3NjEsImV4cCI6MjA2MTIwMjc2MX0.CNRkqP5Rmup3CIGTm1QjSEJZC4PA7FP3RoRgmRebhyw';
  BEGIN
    PERFORM net.http_post(
      url := v_url || '/functions/v1/session-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := '{}'::jsonb
    );
  END;
  $cron$;
  $$
);