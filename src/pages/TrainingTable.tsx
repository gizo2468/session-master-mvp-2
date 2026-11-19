import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useTrainingTable } from '@/hooks/useTrainingTable';
import { useTL } from '@/components/trainingLab/i18n';
import TrainingLabBoundary from '@/components/trainingLab/TrainingLabBoundary';
import TableFelt from '@/components/trainingLab/table/TableFelt';
import HandHistoryDrawer from '@/components/trainingLab/table/HandHistoryDrawer';
import { playSound } from '@/components/trainingLab/table/sounds';
import { useTableStore } from '@/stores/useTableStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import ActionBar from '@/components/trainingLab/table/ActionBar';
import CoachControls from '@/components/trainingLab/table/CoachControls';
import SeatMenu from '@/components/trainingLab/table/SeatMenu';
import ActionLog from '@/components/trainingLab/table/ActionLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const mySeat = seats.find((s) => (s.type === 'student' && s.player_id === user?.id) || (s.type === 'coach' && isCoach));
  const actingSeat = state?.to_act != null ? state.seats[state.to_act] : null;
  const canActNow = !!actingSeat && state?.status === 'in_hand' && !state.paused &&
    ((actingSeat.type === 'student' && actingSeat.player_id === user?.id) || (actingSeat.type === 'coach' && isCoach));

  // Alert once each time it becomes my turn.
  const turnKey = canActNow ? `${state?.hand_id}-${state?.seq}` : '';
  useEffect(() => { if (turnKey) playSound('turn'); }, [turnKey]);
  const [coachPick, setCoachPick] = useState<string>('');
  const [coachOpen, setCoachOpen] = useState(false);
  const isMobile = useIsMobile();
  const muted = useTableStore((s) => s.muted);
  const fourColor = useTableStore((s) => s.fourColor);
  const setPref = useTableStore((s) => s.setPref);
  const onSeatClick = useCallback((n: number) => setSeatMenu(n), []);

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

  const total = Math.max(lesson.max_seats, seats.length || 2);
  const anchor = mySeat?.seat ?? 1;
  const holeCount = lesson.game_type === 'PLO' ? 4 : 2;
  const cardsFor = (seatNo: number) => {
    if (state?.shown?.[seatNo]) return state.shown[seatNo];
    if (seatNo === mySeat?.seat) return cards[seatNo];
    if (isCoach && (godView || state?.seats[seatNo]?.type === 'coach')) return cards[seatNo];
    return undefined;
  };
  const studentsList = myStudents.map((s) => ({ id: s.userId, name: s.displayName }));
  const connected = seats.filter((s) => s.type === 'student' && s.player_id && online.has(s.player_id)).length;
  const studentSeats = seats.filter((s) => s.type === 'student').length;
  const humans = seats.filter((s) => s.type === 'student' || s.type === 'coach');
  const isOnline = (s: typeof seats[number]) => !!s.player_id && online.has(s.player_id);
  const readyCount = humans.filter((s) => s.ready && !s.sitting_out && isOnline(s)).length;
  const between = state?.status !== 'in_hand';
  const live = lesson.status === 'live' || lesson.status === 'paused';
  const coachFreeSeats = seats.filter((s) => s.type === 'bot' || s.type === 'closed');
  const meReady = !!mySeat && !!mySeat.ready && !mySeat.sitting_out;

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
      {/* Who am I at this table */}
      {isCoach && !mySeat && live && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
          <Icon name="Eye" size={16} /><span className="flex-1 font-semibold">{t('watching_coach')}</span>
          {between && coachFreeSeats.length > 0 && (<>
            <Select value={coachPick} onValueChange={setCoachPick}>
              <SelectTrigger className="h-11 w-28"><SelectValue placeholder={t('coach_seat_pick')} /></SelectTrigger>
              <SelectContent>{coachFreeSeats.map((s) => <SelectItem key={s.seat} value={String(s.seat)}>{t('seat_n', { n: s.seat })}</SelectItem>)}</SelectContent>
            </Select>
            <Button className="min-h-[44px]" disabled={busy || !coachPick} onClick={() => send('set_coach_seat', { coach_seat: Number(coachPick) })}>{t('play_seat')}</Button>
          </>)}
        </div>
      )}
      {mySeat && live && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/50 bg-primary/5 p-2 text-sm">
          <span className="flex-1">{meReady ? `${t('you')} · ${t('seat_n', { n: mySeat.seat })}` : t('not_ready_hint')}</span>
          {meReady
            ? <Button variant="outline" className="min-h-[44px]" disabled={busy} onClick={() => send('sit_out')}>{t('sit_out')}</Button>
            : <Button className="min-h-[44px] bg-poker-gold text-poker-black hover:bg-poker-darkGold" disabled={busy} onClick={() => send('sit_in')}>{t('sit_in')}</Button>}
          {isCoach && between && <Button variant="ghost" className="min-h-[44px]" disabled={busy} onClick={() => send('set_coach_seat', { coach_seat: null })}>{t('leave_seat')}</Button>}
        </div>
      )}
      {isCoach && live && between && humans.length > 0 && (
        <p className={`rounded-md p-2 text-center text-sm font-semibold ${readyCount < humans.length ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {t(readyCount < humans.length ? 'players_ready' : 'all_ready', { r: readyCount, n: humans.length })}
        </p>
      )}
      {state?.status === 'in_hand' && !state.paused && actingSeat && (
        canActNow
          ? <div className="rounded-lg bg-primary p-2 text-center text-lg font-black text-primary-foreground animate-pulse">{t('your_turn')}</div>
          : <p className="text-center text-sm text-muted-foreground">{t('waiting_for', { name: actingSeat.name })}</p>
      )}

      {error && (
        <button className="w-full rounded-md bg-destructive/10 p-2 text-sm text-destructive" onClick={() => setError(null)}>{error}</button>
      )}
      {lesson.status === 'ended' && <p className="text-center text-muted-foreground">{t('lesson_ended')}</p>}

      {/* Table toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <HandHistoryDrawer lessonId={lesson.id} mySeat={mySeat?.seat} isCoach={isCoach} refreshKey={state?.hand_number || 0}
          seatNames={Object.fromEntries(seats.map((x) => [x.seat, x.name]))} />
        <Button variant="outline" size="sm" className="min-h-[44px]" aria-label={muted ? t('unmute') : t('mute')} onClick={() => setPref('muted', !muted)}>
          <Icon name={muted ? 'VolumeX' : 'Volume2'} size={16} />
        </Button>
        <Button variant={fourColor ? 'default' : 'outline'} size="sm" className="min-h-[44px]" onClick={() => setPref('fourColor', !fourColor)}>
          <Icon name="Palette" size={16} />{t('four_color')}
        </Button>
        {isCoach && state && isMobile && lesson.status !== 'ended' && (
          <Button size="sm" className="min-h-[44px]" onClick={() => setCoachOpen(true)}><Icon name="SlidersHorizontal" size={16} />{t('coach_panel')}</Button>
        )}
      </div>

      <TableFelt state={state} seats={seats} total={total} anchor={anchor} holeCount={holeCount} bigBlind={Number(lesson.big_blind)}
        labels={labels} mySeat={mySeat?.seat} cardsFor={cardsFor} isOnline={isOnline}
        onSeatClick={isCoach && state?.status !== 'in_hand' && lesson.status !== 'ended' ? onSeatClick : undefined}
        waitingDeal={(!state || state.status === 'waiting') && lesson.status !== 'ended'} />

      {state && <ActionLog state={state} />}

      {canActNow && state && actingSeat && (<>
        <div className="h-56" aria-hidden />
        <div className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-primary bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur animate-in slide-in-from-bottom duration-300">
          <div className="mx-auto max-w-3xl">
            <ActionBar state={state} seat={actingSeat.seat} bigBlind={Number(lesson.big_blind)} plo={lesson.game_type === 'PLO'} disabled={busy}
              onAct={(action, amount) => send('act', { seat: actingSeat.seat, action, amount })} />
          </div>
        </div>
      </>)}

      {isCoach && state && (() => {
        const panel = (
          <CoachControls state={state} lessonStatus={lesson.status} busy={busy} godView={godView} setGodView={setGodView} send={send} students={studentsList}
            dealLabel={humans.length && readyCount < humans.length ? t('deal_anyway') : undefined} />
        );
        if (!isMobile) return panel;
        return (
          <Drawer open={coachOpen} onOpenChange={setCoachOpen}>
            <DrawerContent dir={dir} className="max-h-[85dvh]">
              <DrawerHeader><DrawerTitle className="text-primary">{t('controls')}</DrawerTitle></DrawerHeader>
              <div className="overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{panel}</div>
            </DrawerContent>
          </Drawer>
        );
      })()}
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
