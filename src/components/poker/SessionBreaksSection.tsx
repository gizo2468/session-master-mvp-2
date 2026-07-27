import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/Icon';

interface SessionBreakRow {
  id: string;
  start_time_utc: number;
  end_time_utc: number | null;
  planned_duration_seconds: number;
  notes: string | null;
}

interface Props {
  sessionId: string;
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

function fmtTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

const SessionBreaksSection: React.FC<Props> = ({ sessionId }) => {
  const [breaks, setBreaks] = useState<SessionBreakRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('session_breaks')
        .select('id,start_time_utc,end_time_utc,planned_duration_seconds,notes')
        .eq('session_id', sessionId)
        .order('start_time_utc', { ascending: true });
      if (!cancelled) {
        setBreaks((data as SessionBreakRow[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (loading || breaks.length === 0) return null;

  const totalSeconds = breaks.reduce((sum, b) => {
    if (b.end_time_utc) return sum + Math.floor((b.end_time_utc - b.start_time_utc) / 1000);
    return sum + b.planned_duration_seconds;
  }, 0);

  return (
    <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="Coffee" size={18} className="text-poker-gold" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground">Breaks</h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-muted-foreground">
          {breaks.length} · {fmtDuration(totalSeconds)}
        </div>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-border">
        {breaks.map((b, i) => {
          const actual = b.end_time_utc
            ? Math.max(0, Math.floor((b.end_time_utc - b.start_time_utc) / 1000))
            : null;
          return (
            <li key={b.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-foreground">
                  Break #{i + 1}
                </div>
                <div className="text-xs text-gray-500 dark:text-muted-foreground">
                  {fmtTime(b.start_time_utc)}
                  {b.end_time_utc ? ` – ${fmtTime(b.end_time_utc)}` : ' – ongoing'}
                </div>
                {b.notes && (
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 break-words">
                    {b.notes}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-gray-800 dark:text-foreground">
                  {actual != null ? fmtDuration(actual) : fmtDuration(b.planned_duration_seconds)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {actual != null ? 'Actual' : 'Planned'}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SessionBreaksSection;
