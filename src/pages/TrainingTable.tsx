import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useTrainingTable } from '@/hooks/useTrainingTable';
import { useTL } from '@/components/trainingLab/i18n';
import TrainingLabBoundary from '@/components/trainingLab/TrainingLabBoundary';
import PlayingCard from '@/components/trainingLab/table/PlayingCard';
import TableSeat from '@/components/trainingLab/table/TableSeat';
import ActionBar from '@/components/trainingLab/table/ActionBar';
import CoachControls from '@/components/trainingLab/table/CoachControls';
import SeatMenu from '@/components/trainingLab/table/SeatMenu';

const POS_LABELS: Record<number, string[]> = {
  2: ['BTN/SB', 'BB'], 3: ['BTN', 'SB', 'BB'], 4: ['BTN', 'SB', 'BB', 'UTG'], 5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'], 7: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'], 9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
};

function TableInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students: myStudents = [] } = useCoachStudent();
  const { t, dir } = useTL();
  const { lesson, state, cards, online, error, setError, busy, send } = useTrainingTable(id, user?.id);
  // Opening the table (from a notification or the Join button) clears its "lesson is live" notification.
  useEffect(() => {
    if (!id || !user?.id) return;
    (supabase as any).from('notifications').update({ is_read: true })
      .eq('recipient_user_id', user.id).eq('type', 'training_lesson_live')
      .eq('training_lesson_id', id).eq('is_read', false)
      .then(() => {}, () => {});
  }, [id, user?.id]);
  const [godView, setGodView] = useState(false);
  const [seatMenu, setSeatMenu] = useState<number | null>(null);

  const isCoach = !!lesson && lesson.coach_id === user?.id;
  const seats = useMemo(() => Object.values(state?.seats || {}).sort((a, b) => a.seat - b.seat), [state?.seats]);
  const mySeat = seats.find((s) => s.type === 'student' && s.player_id === user?.id);
  const actingSeat = state?.to_act != null ? state.seats[state.to_act] : null;
  const canActNow = !!actingSeat && state?.status === 'in_hand' && !state.paused &&
    ((actingSeat.type === 'student' && actingSeat.player_id === user?.id) || (actingSeat.type === 'coach' && isCoach));

  const labels = useMemo(() => {
    const out: Record<number, string> = {};
    if (!state?.dealer_seat || state.status === 'waiting') return out;
    const inHand = seats.filter((s) => s.in_hand).map((s) => s.seat);
    const start = inHand.indexOf(state.dealer_seat);
    if (start < 0) return out;
    const order = [...inHand.slice(start), ...inHand.slice(0, start)];
    (POS_LABELS[order.length] || []).forEach((l, i) => { out[order[i]] = l; });
    return out;
  }, [state?.dealer_seat, state?.status, seats]);

  const back = () => navigate(isCoach ? '/coach/training-lab' : '/player-dashboard', { replace: true });
  if (!lesson) return <div className="p-8 text-center text-muted-foreground">{t('table_coming')}</div>;
  if (!isCoach && state && !mySeat) return <div className="p-8 text-center text-muted-foreground">{t('not_seated')}</div>;

  // Rotate so the viewer's seat is at the bottom of the table.
  const total = Math.max(lesson.max_seats, seats.length || 2);
  const anchor = mySeat?.seat ?? 1;
  const posFor = (seatNo: number) => {
    const idx = (seatNo - anchor + total) % total;
    const angle = Math.PI / 2 + (idx / total) * 2 * Math.PI;
    return { left: `${50 + 42 * Math.cos(angle)}%`, top: `${50 + 40 * Math.sin(angle)}%` };
  };
  const holeCount = lesson.game_type === 'PLO' ? 4 : 2;
  const cardsFor = (seatNo: number, playerId: string | null) => {
    if (state?.shown?.[seatNo]) return state.shown[seatNo];
    if (playerId === user?.id && !isCoach) return cards[seatNo];
    if (isCoach && (godView || state?.seats[seatNo]?.type === 'coach')) return cards[seatNo];
    return undefined;
  };
  const winners = Object.fromEntries((state?.results || []).map((r) => [r.seat, r.amount]));
  const studentsList = myStudents.map((s) => ({ id: s.userId, name: s.displayName }));
  const connected = seats.filter((s) => s.type === 'student' && s.player_id && online.has(s.player_id)).length;
  const studentSeats = seats.filter((s) => s.type === 'student').length;

  return (
    <div dir={dir} className="mx-auto min-h-screen max-w-3xl space-y-3 p-3 content-safe">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-11 w-11" onClick={back}><Icon name={dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'} size={20} /></Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-primary">{lesson.title}</h1>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {lesson.game_type} {lesson.small_blind}/{lesson.big_blind}{Number(lesson.ante) ? ` (${lesson.ante})` : ''} · {t('hand')} #{state?.hand_number || 0} · {connected}/{studentSeats} {t('connected')}
          </p>
        </div>
      </div>

      {state?.paused && (
        <div className="rounded-lg border border-primary bg-primary/10 p-3 text-center">
          <p className="font-semibold text-primary">{t('table_paused')}</p>
          {state.discuss && <p className="mt-1 whitespace-pre-wrap text-sm">{state.discuss}</p>}
        </div>
      )}
      {error && (
        <button className="w-full rounded-md bg-destructive/10 p-2 text-sm text-destructive" onClick={() => setError(null)}>{error}</button>
      )}
      {lesson.status === 'ended' && <p className="text-center text-muted-foreground">{t('lesson_ended')}</p>}

      {/* Table: always LTR */}
      <div dir="ltr" className="relative mx-auto aspect-[4/3] w-full max-w-2xl sm:aspect-[16/9]">
        <div className="absolute inset-[12%] rounded-[50%] border-8 border-[#5a3d22] bg-[#35654D] shadow-inner" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <div className="flex gap-1">{(state?.board || []).map((c) => <PlayingCard key={c} card={c} />)}</div>
          <div className="rounded-full bg-black/40 px-3 py-1 text-sm font-bold text-[#F5F5F0]">{t('pot')}: {state?.pot_total ?? 0}</div>
          {state?.status === 'hand_over' && state.results?.map((r) => (
            <p key={r.seat} className="text-center text-xs text-[#F5F5F0]">{state.seats[r.seat]?.name} {t('wins')} {r.amount}{r.desc ? ` · ${r.desc}` : ''}</p>
          ))}
          {(!state || state.status === 'waiting') && lesson.status !== 'ended' && <p className="text-xs text-[#F5F5F0]/80">{t('waiting_deal')}</p>}
        </div>
        {seats.map((s) => (
          <div key={s.seat} className="absolute -translate-x-1/2 -translate-y-1/2" style={posFor(s.seat)}>
            <TableSeat seat={s} label={labels[s.seat]} isDealer={state?.dealer_seat === s.seat && state?.status !== 'waiting'}
              isTurn={state?.to_act === s.seat && state?.status === 'in_hand'} deadline={state?.deadline ?? null} timer={state?.settings.timer || 0}
              cards={cardsFor(s.seat, s.player_id)} holeCount={holeCount} connected={!!s.player_id && online.has(s.player_id)}
              waitingText={t('waiting_player')} foldedText={t('folded')} winner={state?.status === 'hand_over' ? winners[s.seat] : undefined}
              highlight={s.seat === mySeat?.seat}
              onClick={isCoach && state?.status !== 'in_hand' && lesson.status !== 'ended' ? () => setSeatMenu(s.seat) : undefined} />
          </div>
        ))}
      </div>

      {canActNow && state && actingSeat && (
        <ActionBar state={state} seat={actingSeat.seat} bigBlind={Number(lesson.big_blind)} plo={lesson.game_type === 'PLO'} disabled={busy}
          onAct={(action, amount) => send('act', { seat: actingSeat.seat, action, amount })} />
      )}

      {isCoach && state && (
        <CoachControls state={state} lessonStatus={lesson.status} busy={busy} godView={godView} setGodView={setGodView} send={send} students={studentsList} />
      )}
      {isCoach && !state && lesson.status !== 'ended' && (
        <Button className="w-full min-h-[52px] text-lg" disabled={busy} onClick={() => send('start')}><Icon name="Play" size={18} />{t('start_lesson')}</Button>
      )}
      {isCoach && (
        <SeatMenu seatNo={seatMenu} seat={seatMenu != null ? state?.seats[seatMenu] : undefined} bigBlind={Number(lesson.big_blind)}
          students={studentsList} onClose={() => setSeatMenu(null)} send={send} />
      )}
    </div>
  );
}

export default function TrainingTable() {
  return <TrainingLabBoundary emptyText="The table could not be loaded. Please reload."><TableInner /></TrainingLabBoundary>;
}
