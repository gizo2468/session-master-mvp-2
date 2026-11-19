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
import { Switch } from '@/components/ui/switch';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const showBB = useTableStore((s) => s.showBB);
  // Try to keep phones in portrait (works in the installed app; browsers fall back to the rotate notice).
  useEffect(() => { (screen.orientation as any)?.lock?.('portrait')?.catch?.(() => {}); }, []);
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
  const blank = (msg: string) => (
    <div className="tl-stage-bg fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-white/70">{msg}</p><Button variant="outline" onClick={back}>{t('back')}</Button>
    </div>
  );
  if (!lesson) return blank(t('table_coming'));
  if (!isCoach && state && !mySeat) return blank(t('not_seated'));

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

  const info = [
    `${lesson.small_blind}/${lesson.big_blind}${Number(lesson.ante) ? ` (${lesson.ante})` : ''} · ${t('hand')} #${state?.hand_number || 0}`,
    lesson.title,
  ];
  const showWaiting = state?.status === 'in_hand' && !state.paused && !!actingSeat && !canActNow;

  return (
    <div dir={dir} className="tl-stage-bg fixed inset-0 z-50 overflow-hidden overscroll-none touch-manipulation">
      <div className="relative mx-auto flex h-full w-full max-w-[min(480px,62dvh)] flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Thin top bar */}
        <div className="flex h-12 shrink-0 items-center gap-1 px-2">
          <button type="button" className="tl-icon-btn" aria-label={t('exit_table')} onClick={back}><Icon name={dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'} size={20} /></button>
          <p className="min-w-0 flex-1 truncate px-1 text-center text-xs text-white/50" dir="ltr">
            {isCoach && live ? `${connected}/${studentSeats} ${t('connected')}` : ''}
          </p>
          <HandHistoryDrawer lessonId={lesson.id} mySeat={mySeat?.seat} isCoach={isCoach} refreshKey={state?.hand_number || 0}
            seatNames={Object.fromEntries(seats.map((x) => [x.seat, x.name]))} />
          <button type="button" className="tl-icon-btn" aria-label={t('table_menu')} onClick={() => setMenuOpen(true)}><Icon name="Menu" size={20} /></button>
          {isCoach && lesson.status !== 'ended' && (
            <button type="button" aria-label={t('controls')} onClick={() => setCoachOpen(true)}
              className="ml-1 flex h-11 min-w-11 items-center justify-center gap-1 rounded-full bg-poker-gold px-3 text-xs font-black text-poker-black shadow-lg">
              <Icon name="SlidersHorizontal" size={16} />{t('coach_short')}
            </button>
          )}
        </div>

        {/* Game stage */}
        <div className="relative min-h-0 flex-1 [container-type:size]">
          <TableFelt state={state} seats={seats} total={total} anchor={anchor} holeCount={holeCount} bigBlind={Number(lesson.big_blind)}
            labels={labels} mySeat={mySeat?.seat} cardsFor={cardsFor} isOnline={isOnline} gameType={lesson.game_type} info={info}
            onSeatClick={isCoach && state?.status !== 'in_hand' && lesson.status !== 'ended' ? onSeatClick : undefined}
            waitingDeal={(!state || state.status === 'waiting') && lesson.status !== 'ended'}>
            {isCoach && !state && lesson.status !== 'ended' && (
              <div className="absolute left-1/2 top-[48%] z-40 -translate-x-1/2 -translate-y-1/2">
                <Button className="min-h-[52px] px-6 text-lg shadow-xl" disabled={busy} onClick={() => send('start')}><Icon name="Play" size={18} />{t('start_lesson')}</Button>
              </div>
            )}
          </TableFelt>

          {/* Top notices (overlay, never pushes the table) */}
          <div className="pointer-events-none absolute inset-x-[4cqw] top-[1cqw] z-40 flex flex-col items-center gap-[1cqw]">
            {state?.paused && (
              <div className="pointer-events-auto max-w-full rounded-xl border border-primary bg-black/80 px-3 py-2 text-center">
                <p className="text-sm font-bold text-primary">{t('table_paused')}</p>
                {state.discuss && <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-xs tl-ink">{state.discuss}</p>}
              </div>
            )}
            {error && (
              <button type="button" className="pointer-events-auto rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground" onClick={() => setError(null)}>{error}</button>
            )}
            {lesson.status === 'ended' && <p className="rounded-full bg-black/70 px-3 py-1 text-xs tl-ink">{t('lesson_ended')}</p>}
          </div>

          {canActNow && state && actingSeat ? (
            <ActionBar key={`${state.hand_id}-${state.street}`} state={state} seat={actingSeat.seat} bigBlind={Number(lesson.big_blind)} plo={lesson.game_type === 'PLO'} disabled={busy}
              onAct={(action, amount) => send('act', { seat: actingSeat.seat, action, amount })} />
          ) : (
            <div className="absolute bottom-[max(2.5cqw,env(safe-area-inset-bottom))] left-[40cqw] right-[3cqw] z-40 flex flex-col items-end gap-[1.5cqw] text-right">
              {isCoach && live && between && humans.length > 0 && (
                <p className={`rounded-full bg-black/60 px-3 py-1 text-xs font-semibold ${readyCount < humans.length ? 'text-destructive' : 'text-primary'}`}>
                  {t(readyCount < humans.length ? 'players_ready' : 'all_ready', { r: readyCount, n: humans.length })}
                </p>
              )}
              {isCoach && !mySeat && live && <p className="flex items-center gap-1 text-xs text-white/60"><Icon name="Eye" size={14} />{t('watching_coach')}</p>}
              {showWaiting && <p className="text-xs text-white/60">{t('waiting_for', { name: actingSeat!.name })}</p>}
              {mySeat && live && !meReady && (
                <Button className="min-h-[52px] bg-poker-gold px-6 text-base font-black text-poker-black hover:bg-poker-darkGold" disabled={busy} onClick={() => send('sit_in')}>{t('sit_in')}</Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Portrait only on small screens */}
      <div className="tl-stage-bg fixed inset-0 z-[70] hidden flex-col items-center justify-center gap-3 p-6 text-center [@media(orientation:landscape)_and_(max-height:500px)]:flex">
        <Icon name="Smartphone" size={40} className="text-poker-gold" />
        <p className="text-lg font-bold tl-ink">{t('rotate_phone')}</p>
      </div>

      {/* Table menu */}
      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent dir={dir} className="max-h-[85dvh]">
          <DrawerHeader><DrawerTitle className="text-primary">{t('table_menu')}</DrawerTitle></DrawerHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {([['muted', !muted, t('mute'), (v: boolean) => setPref('muted', !v)], ['fourColor', fourColor, t('four_color'), (v: boolean) => setPref('fourColor', v)], ['showBB', showBB, t('show_bb'), (v: boolean) => setPref('showBB', v)]] as const).map(([k, v, label, on]) => (
              <label key={k} className="flex min-h-[44px] items-center justify-between gap-3 text-sm font-medium">
                <span>{k === 'muted' ? (muted ? t('unmute') : label) : label}</span>
                <Switch checked={v} onCheckedChange={on} />
              </label>
            ))}
            {mySeat && live && meReady && (
              <Button variant="outline" className="min-h-[44px] w-full" disabled={busy} onClick={() => { send('sit_out'); setMenuOpen(false); }}>{t('sit_out')}</Button>
            )}
            {state && <ActionLog state={state} />}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Coach controls */}
      {isCoach && (
        <Drawer open={coachOpen} onOpenChange={setCoachOpen}>
          <DrawerContent dir={dir} className="max-h-[88dvh]">
            <DrawerHeader><DrawerTitle className="text-primary">{t('controls')}</DrawerTitle></DrawerHeader>
            <div className="space-y-3 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {live && !mySeat && between && coachFreeSeats.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                  <span className="flex-1 font-semibold">{t('watching_coach')}</span>
                  <Select value={coachPick} onValueChange={setCoachPick}>
                    <SelectTrigger className="h-11 w-28"><SelectValue placeholder={t('coach_seat_pick')} /></SelectTrigger>
                    <SelectContent>{coachFreeSeats.map((s) => <SelectItem key={s.seat} value={String(s.seat)}>{t('seat_n', { n: s.seat })}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button className="min-h-[44px]" disabled={busy || !coachPick} onClick={() => send('set_coach_seat', { coach_seat: Number(coachPick) })}>{t('play_seat')}</Button>
                </div>
              )}
              {live && mySeat && between && (
                <Button variant="outline" className="min-h-[44px] w-full" disabled={busy} onClick={() => send('set_coach_seat', { coach_seat: null })}>{t('leave_seat')}</Button>
              )}
              {state ? (
                <CoachControls state={state} lessonStatus={lesson.status} busy={busy} godView={godView} setGodView={setGodView} send={send} students={studentsList}
                  dealLabel={humans.length && readyCount < humans.length ? t('deal_anyway') : undefined} />
              ) : lesson.status !== 'ended' && (
                <Button className="min-h-[52px] w-full text-lg" disabled={busy} onClick={() => { send('start'); setCoachOpen(false); }}><Icon name="Play" size={18} />{t('start_lesson')}</Button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
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
