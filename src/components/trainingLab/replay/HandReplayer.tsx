import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Lucide';
import TableFelt from '../table/TableFelt';
import { useTL } from '../i18n';
import { handSeats, type LessonReview } from '@/hooks/useLessonReview';
import { buildTimeline, carryStacks, STREETS, streetStarts, visibleCards } from './replayTimeline';
import type { TSeat } from '@/hooks/useTrainingTable';

const POS_LABELS: Record<number, string[]> = {
  2: ['BTN/SB', 'BB'], 3: ['BTN', 'SB', 'BB'], 4: ['BTN', 'SB', 'BB', 'UTG'], 5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'], 7: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'], 9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
};
const SPEEDS = [0.5, 1, 2];
const online = () => true;

interface Props {
  review: LessonReview; handId: string; viewerId?: string; isCoach: boolean;
  /** Coach view: only show notes for this student (plus notes for everyone). */
  studentId?: string; onClose: () => void;
}

/** Full-screen replay of one saved hand on the same table as live play. Purely local: it never sends anything to the live game. */
export default function HandReplayer({ review, handId, viewerId, isCoach, studentId, onClose }: Props) {
  const { t } = useTL();
  const hand = review.hands.find((h) => h.id === handId);
  const bb = Number(review.lesson.big_blind) || 1;
  const seats = useMemo(() => handSeats(review, handId), [review, handId]);
  const frames = useMemo(() => {
    if (!hand) return [];
    const stacks = carryStacks(review.hands, review.actions, Number(review.lesson.default_stack_bb) * bb)[hand.id] || {};
    return buildTimeline(hand, review.actions, seats, stacks);
  }, [hand, review, seats, bb]);
  const starts = useMemo(() => streetStarts(frames), [frames]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const frame = frames[Math.min(i, frames.length - 1)];

  const notes = review.notes.filter((n) => (n.hand_id === handId) && (!studentId || !n.student_id || n.student_id === studentId));
  const notesAt = (idx: number) => {
    const f = frames[idx]; if (!f) return [];
    return f.actionId ? notes.filter((n) => n.action_id === f.actionId) : idx === 0 ? notes.filter((n) => !n.action_id) : [];
  };
  const here = notesAt(i);

  useEffect(() => {
    if (!playing) return;
    if (i >= frames.length - 1) { setPlaying(false); return; }
    const id = setTimeout(() => {
      const next = i + 1;
      setI(next);
      if (notesAt(next).length) setPlaying(false); // a coach note pauses playback
    }, 900 / speed);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, i, speed, frames.length]);

  if (!hand || !frame) return null;
  const mySeat = seats.find((s) => s.player_id && s.player_id === viewerId)?.seat;
  const holes = review.holes[handId] || {};
  const tSeats = Object.values(frame.state.seats).sort((a, b) => a.seat - b.seat) as TSeat[];
  const labels: Record<number, string> = {};
  if (hand.dealer_seat) {
    const inHand = tSeats.filter((s) => s.in_hand).map((s) => s.seat);
    const k = inHand.indexOf(hand.dealer_seat);
    if (k >= 0) { const order = [...inHand.slice(k), ...inHand.slice(0, k)]; (POS_LABELS[order.length] || []).forEach((l, j) => { labels[order[j]] = l; }); }
  }
  const total = Math.max(Number(review.lesson.max_seats) || 2, ...tSeats.map((s) => s.seat));
  const go = (n: number) => { setPlaying(false); setI(Math.max(0, Math.min(frames.length - 1, n))); };

  return createPortal(
    <div className="tl-stage-bg fixed inset-0 z-[80] overflow-hidden overscroll-none touch-manipulation">
      <div className="relative mx-auto flex h-full w-full max-w-[min(480px,62dvh)] flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-12 shrink-0 items-center gap-1 px-2">
          <button type="button" className="tl-icon-btn" aria-label={t('close')} onClick={onClose}><Icon name="X" size={20} /></button>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-bold text-poker-gold">{t('replay')} · {t('hand')} #{hand.hand_number}</p>
          <span className="w-11" />
        </div>
        <div className="relative min-h-0 flex-1 [container-type:size]">
          <TableFelt state={frame.state} seats={tSeats} total={total} anchor={mySeat ?? tSeats[0]?.seat ?? 1}
            holeCount={review.lesson.game_type === 'PLO' ? 4 : 2} bigBlind={bb} labels={labels} mySeat={mySeat}
            cardsFor={(s) => visibleCards(s, frame.state.shown, holes, { isCoach, mySeat })} isOnline={online}
            waitingDeal={false} gameType={review.lesson.game_type} info={[`${review.lesson.small_blind}/${review.lesson.big_blind}`, review.lesson.title]} />
          {here.length > 0 && (
            <div className="absolute inset-x-[4cqw] bottom-[2cqw] z-50 space-y-2">
              {here.map((n) => (
                <div key={n.id} className={`tl-pop rounded-2xl border-2 bg-black/90 p-3 shadow-2xl ${n.flag === 'mistake' ? 'border-destructive' : n.flag === 'good_play' ? 'border-emerald-500' : 'border-poker-gold'}`}>
                  <p className="flex items-center gap-1 text-xs font-bold uppercase text-poker-gold">
                    <Icon name="MessageSquare" size={14} />{t('coach_note')}
                    {n.flag && <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${n.flag === 'mistake' ? 'bg-destructive text-destructive-foreground' : 'bg-emerald-600 text-white'}`}>{t(n.flag)}</span>}
                  </p>
                  {n.note && <p className="mt-1 whitespace-pre-wrap text-sm tl-ink">{n.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Controls */}
        <div className="shrink-0 space-y-2 px-3 pb-3 pt-2">
          <div className="flex gap-1">
            {STREETS.map((s) => (
              <button key={s} type="button" disabled={starts[s] === undefined} onClick={() => go(starts[s])}
                className={`min-h-[40px] flex-1 rounded-lg text-[11px] font-bold disabled:opacity-25 ${frame.street === s ? 'bg-poker-gold text-poker-black' : 'bg-white/10 text-white/80'}`}>
                {t(`street_${s}` as any)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="tl-icon-btn" aria-label={t('step_back')} onClick={() => go(i - 1)} disabled={i === 0}><Icon name="SkipBack" size={20} /></button>
            <button type="button" aria-label={playing ? t('pause') : t('play')}
              onClick={() => { if (i >= frames.length - 1) setI(0); setPlaying((p) => !p); }}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-poker-gold text-poker-black">
              <Icon name={playing ? 'Pause' : 'Play'} size={22} />
            </button>
            <button type="button" className="tl-icon-btn" aria-label={t('step_fwd')} onClick={() => go(i + 1)} disabled={i >= frames.length - 1}><Icon name="SkipForward" size={20} /></button>
            <button type="button" aria-label={t('speed')} onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
              className="h-11 min-w-[52px] rounded-full bg-white/10 px-2 text-sm font-black text-white">{speed}x</button>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full origin-left bg-poker-gold transition-transform duration-200" style={{ transform: `scaleX(${frames.length > 1 ? i / (frames.length - 1) : 1})` }} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
