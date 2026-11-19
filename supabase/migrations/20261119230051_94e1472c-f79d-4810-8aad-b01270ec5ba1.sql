DO $$
DECLARE l uuid := 'ba25aaab-3028-4f48-a4ca-2abd7dee2540'; v integer; s jsonb; candidate jsonb; h uuid := gen_random_uuid(); before_count integer; result boolean;
BEGIN
 SELECT version, state INTO v, s FROM public.training_table_state WHERE lesson_id = l FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Regression fixture missing'; END IF;
 SELECT count(*) INTO before_count FROM public.training_hands WHERE lesson_id = l;
 candidate := s || jsonb_build_object('hand_id', h, 'hand_number', (s->>'hand_number')::integer + 1, 'status', 'in_hand');
 result := public.commit_training_deal(l, v - 1, candidate, ARRAY[]::text[], '{}'::jsonb, '[]'::jsonb);
 IF result THEN RAISE EXCEPTION 'Stale deal accepted'; END IF;
 BEGIN
   PERFORM public.commit_training_deal(l, v, candidate, ARRAY[]::text[], '{"1":null}'::jsonb, '[]'::jsonb);
   RAISE EXCEPTION 'Invalid private cards accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 IF EXISTS(SELECT 1 FROM public.training_hands WHERE id = h) THEN RAISE EXCEPTION 'Failed deal left orphan'; END IF;
 IF (SELECT version FROM public.training_table_state WHERE lesson_id = l) <> v THEN RAISE EXCEPTION 'Failed deal changed state'; END IF;
 BEGIN
   result := public.commit_training_deal(l, v, candidate, ARRAY[]::text[], '{}'::jsonb, '[]'::jsonb);
   IF NOT result THEN RAISE EXCEPTION 'Recovery deal failed'; END IF;
   IF (SELECT state->>'hand_id' FROM public.training_table_state WHERE lesson_id = l) <> h::text THEN RAISE EXCEPTION 'Hand not published'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.training_hand_secrets WHERE hand_id = h) THEN RAISE EXCEPTION 'Deck not saved'; END IF;
   result := public.commit_training_deal(l, v, candidate, ARRAY[]::text[], '{}'::jsonb, '[]'::jsonb);
   IF result THEN RAISE EXCEPTION 'Concurrent deal accepted'; END IF;
   RAISE EXCEPTION USING ERRCODE = 'Z0001', MESSAGE = 'Rollback successful regression fixture';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
 IF (SELECT count(*) FROM public.training_hands WHERE lesson_id = l) <> before_count OR (SELECT version FROM public.training_table_state WHERE lesson_id = l) <> v THEN RAISE EXCEPTION 'Regression failed to roll back'; END IF;
END $$;