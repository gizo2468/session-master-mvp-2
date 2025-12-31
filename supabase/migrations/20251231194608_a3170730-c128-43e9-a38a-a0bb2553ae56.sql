-- Schedule session-reminders edge function to run every hour
SELECT cron.schedule(
  'session-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wfmvvpbpuqbzidptxbqx.supabase.co/functions/v1/session-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXZ2cGJwdXFiemlkcHR4YnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjY3NjEsImV4cCI6MjA2MTIwMjc2MX0.CNRkqP5Rmup3CIGTm1QjSEJZC4PA7FP3RoRgmRebhyw'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);