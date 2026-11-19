DROP POLICY IF EXISTS "Authenticated users can insert donation logs" ON public.donation_logs;
DROP POLICY IF EXISTS "donation_logs_insert" ON public.donation_logs;
CREATE POLICY "donation_logs_insert_own" ON public.donation_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow authenticated users to view tutorial images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own player goal images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own player goal images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own player goal images" ON storage.objects;