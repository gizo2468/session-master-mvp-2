import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface SessionBreak {
  id: string;
  session_id: string;
  user_id: string;
  start_time_utc: number;
  planned_duration_seconds: number;
  end_time_utc: number | null;
  notes: string | null;
  created_at: string;
}

export function useSessionBreak(sessionId: string | undefined) {
  const { user } = useAuth();
  const [breaks, setBreaks] = useState<SessionBreak[]>([]);
  const [now, setNow] = useState<number>(() => Date.now());
  const endingRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await supabase
      .from('session_breaks')
      .select('*')
      .eq('session_id', sessionId)
      .order('start_time_utc', { ascending: true });
    if (!error && data) setBreaks(data as SessionBreak[]);
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  // Refresh on tab focus
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  // 1s ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeBreak = breaks.find(b => b.end_time_utc == null) || null;

  const completedBreaks = breaks.filter(b => b.end_time_utc != null);
  const totalCompletedBreakSeconds = completedBreaks.reduce(
    (sum, b) => sum + Math.max(0, Math.floor(((b.end_time_utc as number) - b.start_time_utc) / 1000)),
    0,
  );

  const activeBreakElapsed = activeBreak
    ? Math.max(0, Math.floor((now - activeBreak.start_time_utc) / 1000))
    : 0;
  const activeBreakRemaining = activeBreak
    ? Math.max(0, activeBreak.planned_duration_seconds - activeBreakElapsed)
    : 0;
  const activeBreakCountedSeconds = activeBreak
    ? Math.min(activeBreakElapsed, activeBreak.planned_duration_seconds)
    : 0;

  const totalBreakSecondsToSubtract = totalCompletedBreakSeconds + activeBreakCountedSeconds;

  const endBreakRow = useCallback(async (id: string) => {
    if (endingRef.current.has(id)) return;
    endingRef.current.add(id);
    try {
      const endMs = Date.now();
      const { error } = await supabase
        .from('session_breaks')
        .update({ end_time_utc: endMs })
        .eq('id', id)
        .is('end_time_utc', null);
      if (!error) {
        setBreaks(prev => prev.map(b => b.id === id ? { ...b, end_time_utc: endMs } : b));
      }
    } finally {
      endingRef.current.delete(id);
    }
  }, []);

  // Auto-end when timer hits zero
  useEffect(() => {
    if (activeBreak && activeBreakRemaining === 0) {
      endBreakRow(activeBreak.id);
    }
  }, [activeBreak, activeBreakRemaining, endBreakRow]);

  const startBreak = useCallback(async (minutes: number, notes?: string) => {
    if (!sessionId || !user?.id) return { error: 'not-ready' as const };
    if (activeBreak) return { error: 'already-active' as const };
    const seconds = Math.max(1, Math.floor(minutes * 60));
    const { data, error } = await supabase
      .from('session_breaks')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        start_time_utc: Date.now(),
        planned_duration_seconds: seconds,
        notes: notes?.trim() || null,
      })
      .select('*')
      .single();
    if (error) return { error: error.message };
    setBreaks(prev => [...prev, data as SessionBreak]);
    return { data: data as SessionBreak };
  }, [sessionId, user?.id, activeBreak]);

  const endBreakEarly = useCallback(async () => {
    if (activeBreak) await endBreakRow(activeBreak.id);
  }, [activeBreak, endBreakRow]);

  return {
    breaks,
    activeBreak,
    completedBreaks,
    activeBreakRemaining,
    totalCompletedBreakSeconds,
    totalBreakSecondsToSubtract,
    startBreak,
    endBreakEarly,
    reload: load,
  };
}
