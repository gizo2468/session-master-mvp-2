CREATE OR REPLACE FUNCTION public.commit_training_deal(p_lesson_id uuid, p_version integer, p_state jsonb, p_deck text[], p_holes jsonb, p_actions jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_version integer; v_state jsonb; v_hand uuid := (p_state->>'hand_id')::uuid; v_number integer := (p_state->>'hand_number')::integer;
BEGIN
  SELECT version, state INTO v_version, v_state FROM public.training_table_state WHERE lesson_id = p_lesson_id FOR UPDATE;
  IF NOT FOUND OR v_version <> p_version THEN RETURN false; END IF;
  IF v_state->>'status' = 'in_hand' THEN RETURN false; END IF;
  -- Recover only an unpublished partial deal left by the old non-atomic writer.
  DELETE FROM public.training_hands h WHERE h.lesson_id = p_lesson_id AND h.hand_number = v_number AND h.status = 'in_progress'
    AND NOT EXISTS (SELECT 1 FROM public.training_table_state t WHERE t.state->>'hand_id' = h.id::text);
  INSERT INTO public.training_hands(id, lesson_id, hand_number, dealer_seat, status, scenario_preset)
    VALUES(v_hand, p_lesson_id, v_number, (p_state->>'dealer_seat')::integer, 'in_progress', p_state->'preset');
  INSERT INTO public.training_hand_secrets(hand_id, deck) VALUES(v_hand, p_deck);
  INSERT INTO public.training_hand_private_cards(hand_id, seat_number, player_id, hole_cards)
    SELECT v_hand, key::integer, (p_state->'seats'->key->>'player_id')::uuid,
      (SELECT string_agg(card, '' ORDER BY ord) FROM jsonb_array_elements_text(value) WITH ORDINALITY c(card, ord))
    FROM jsonb_each(p_holes);
  INSERT INTO public.training_hand_actions(hand_id, seat_number, player_id, street, action, amount, pot_after, sequence, revealed_cards)
    SELECT v_hand, (a->>'seat')::integer, (p_state->'seats'->(a->>'seat')->>'player_id')::uuid,
      a->>'street', a->>'action', (a->>'amount')::numeric, (a->>'pot_after')::numeric, (a->>'sequence')::integer, a->>'revealed_cards'
    FROM jsonb_array_elements(p_actions) a;
  UPDATE public.training_table_state SET state = p_state, version = v_version + 1, updated_at = now() WHERE lesson_id = p_lesson_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.commit_training_deal(uuid, integer, jsonb, text[], jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_training_deal(uuid, integer, jsonb, text[], jsonb, jsonb) TO service_role;