import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tl } from '@/hooks/useTrainingLessons';

export interface TSeat {
  seat: number; type: 'student' | 'bot' | 'coach' | 'closed'; player_id: string | null; name: string; style: string | null;
  stack: number; bet: number; committed: number; folded: boolean; all_in: boolean; acted: boolean; in_hand: boolean;
  ready?: boolean; sitting_out?: boolean; last_seen?: number; auto_out?: boolean;
}
export interface TState {
  status: 'waiting' | 'in_hand' | 'hand_over' | 'ended';
  hand_id: string | null; hand_number: number; dealer_seat: number | null; sb_seat: number | null; bb_seat: number | null;
  street: string; board: string[]; seats: Record<string, TSeat>; to_act: number | null; current_bet: number; min_raise: number;
  pot_total: number; deadline: number | null; seq: number; last_action: { seat: number; action: string; amount: number } | null;
  results: { seat: number; amount: number; desc: string }[] | null; shown: Record<string, string[]>;
  paused: boolean; discuss: string | null; settings: { auto_deal: boolean; timer: number }; preset: any;
  turn_started?: number | null; recent_actions?: { seat: number; name: string; action: string; amount: number }[];
}

export const useTrainingTable = (lessonId?: string, userId?: string) => {
  const [lesson, setLesson] = useState<any>(null);
  const [state, setState] = useState<TState | null>(null);
  const [cards, setCards] = useState<Record<string, string[]>>({});
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const versionRef = useRef(-1);

  const applyRow = useCallback((row: any) => {
    if (!row || row.version < versionRef.current) return;
    versionRef.current = row.version;
    setState(row.state as TState);
  }, []);

  const reload = useCallback(async () => {
    if (!lessonId) return;
    try {
      const [{ data: l }, { data: st }] = await Promise.all([
        tl.from('training_lessons').select('*').eq('id', lessonId).maybeSingle(),
        tl.from('training_table_state').select('state, version').eq('lesson_id', lessonId).maybeSingle(),
      ]);
      setLesson(l);
      if (st) { versionRef.current = -1; applyRow(st); }
    } catch {
      setError('load');
    }
  }, [lessonId, applyRow]);

  useEffect(() => { reload(); }, [reload]);

  // Live table state
  useEffect(() => {
    if (!lessonId) return;
    const channel = supabase
      .channel(`training-state-${lessonId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_table_state', filter: `lesson_id=eq.${lessonId}` },
        (payload: any) => applyRow(payload.new))
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { supabase.removeChannel(channel); document.removeEventListener('visibilitychange', onVisible); };
  }, [lessonId, applyRow, reload]);

  // Presence: who is connected to this table (shared room)
  useEffect(() => {
    if (!lessonId || !userId) return;
    const channel = supabase.channel(`training-presence-${lessonId}`, { config: { presence: { key: userId } } });
    channel
      .on('presence', { event: 'sync' }, () => setOnline(new Set(Object.keys(channel.presenceState()))))
      .subscribe((status) => { if (status === 'SUBSCRIBED') channel.track({ at: Date.now() }); });
    return () => { supabase.removeChannel(channel); };
  }, [lessonId, userId]);

  // Hole cards for the current hand (RLS: own seat only; coach sees all)
  const handId = state?.hand_id;
  useEffect(() => {
    if (!handId) { setCards({}); return; }
    let cancelled = false;
    (async () => {
      const { data } = await tl.from('training_hand_private_cards').select('seat_number, hole_cards').eq('hand_id', handId);
      if (cancelled) return;
      const m: Record<string, string[]> = {};
      for (const r of data || []) m[r.seat_number] = r.hole_cards.match(/../g) || [];
      setCards(m);
    })();
    return () => { cancelled = true; };
  }, [handId]);

  const send = useCallback(async (cmd: string, payload: Record<string, unknown> = {}) => {
    if (!lessonId) return null;
    setBusy(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('training-table', { body: { cmd, lesson_id: lessonId, ...payload } });
      const msg = (data as any)?.error || (error ? await (error as any).context?.json?.().then((j: any) => j?.error).catch(() => null) || error.message : null);
      if (msg) { setError(msg); return null; }
      if ((data as any)?.state) applyRow({ state: (data as any).state, version: versionRef.current + 1 });
      if (['start', 'pause', 'resume', 'end', 'discuss'].includes(cmd)) reload();
      return data;
    } finally {
      setBusy(false);
    }
  }, [lessonId, applyRow, reload]);

  // Action timer: when the deadline passes, ask the server to apply the timeout (server re-checks).
  const timeoutKey = useRef('');
  useEffect(() => {
    if (!state?.deadline || state.status !== 'in_hand') return;
    const key = `${state.hand_id}-${state.seq}`;
    const ms = state.deadline - Date.now() + 300;
    const t = setTimeout(() => {
      if (timeoutKey.current === key) return;
      timeoutKey.current = key;
      send('timeout');
    }, Math.max(0, ms));
    return () => clearTimeout(t);
  }, [state?.deadline, state?.hand_id, state?.seq, state?.status, send]);

  // Heartbeat: tells the server this player is at the table (deal-in, disconnect handling).
  useEffect(() => {
    if (!lessonId || !userId) return;
    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      supabase.functions.invoke('training-table', { body: { cmd: 'heartbeat', lesson_id: lessonId } })
        .then(({ data }) => { if ((data as any)?.state) applyRow({ state: (data as any).state, version: versionRef.current + 1 }); }, () => {});
    };
    beat();
    const iv = setInterval(beat, 10_000);
    const onVis = () => beat();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); };
  }, [lessonId, userId, applyRow]);

  return { lesson, state, cards, online, error, setError, busy, send, reload };
};
