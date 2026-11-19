import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TSeat, TState } from '@/hooks/useTrainingTable';
import PlayingCard from './PlayingCard';
import TableSeat from './TableSeat';
import ChipStack from './ChipStack';
import ActionBadge from './ActionBadge';
import { geometry, seatPositions, toward, usePortrait, type Pt } from './useTableLayout';
import { playSound } from './sounds';
import { useTL } from '../i18n';

interface Props {
  state: TState | null; seats: TSeat[]; total: number; anchor: number; holeCount: number; bigBlind: number;
  labels: Record<number, string>; mySeat?: number; cardsFor: (seat: number) => string[] | undefined;
  isOnline: (s: TSeat) => boolean; onSeatClick?: (seat: number) => void; waitingDeal: boolean;
}

interface Fly { id: number; from: Pt; to: Pt; amount: number; kind: 'pot' | 'win' }
let flyId = 0;

/** The oval table: felt, board, pot, seats outside the rail, bets, badges and chip motion (transform/opacity only). */
function TableFelt({ state, seats, total, anchor, holeCount, bigBlind, labels, mySeat, cardsFor, isOnline, onSeatClick, waitingDeal }: Props) {
  const { t } = useTL();
  const portrait = usePortrait();
  const g = geometry(portrait);
  const pos = useMemo(() => seatPositions(total, anchor, portrait), [total, anchor, portrait]);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const px = (from: Pt, to: Pt) => ({ fx: `${((to.x - from.x) / 100) * size.w}px`, fy: `${((to.y - from.y) / 100) * size.h}px` });

  // Chip motion: bets fly to the pot when a street closes; the pot flies to the winner.
  const [flies, setFlies] = useState<Fly[]>([]);
  const prev = useRef<TState | null>(null);
  useEffect(() => {
    const p = prev.current; prev.current = state;
    if (!state || !p) return;
    const add: Fly[] = [];
    if (p.hand_id === state.hand_id && (p.street !== state.street || (p.status === 'in_hand' && state.status !== 'in_hand'))) {
      for (const s of Object.values(p.seats)) if (s.bet > 0 && pos[s.seat]) add.push({ id: ++flyId, from: toward(pos[s.seat]), to: { x: 50, y: 50 }, amount: s.bet, kind: 'pot' });
    }
    if (state.status === 'hand_over' && p.status !== 'hand_over') {
      for (const r of state.results || []) if (pos[r.seat]) add.push({ id: ++flyId, from: { x: 50, y: 50 }, to: pos[r.seat], amount: r.amount, kind: 'win' });
    }
    if (state.hand_id && state.hand_id !== p.hand_id) playSound('deal');
    else if (state.seq !== p.seq && state.last_action && state.last_action !== p.last_action) {
      const a = state.last_action.action;
      if (a === 'check') playSound('check'); else if (a !== 'fold') playSound('chips');
    }
    if (state.board.length > p.board.length && state.hand_id === p.hand_id) playSound('deal');
    if (add.length) {
      setFlies((f) => [...f, ...add]);
      const ids = new Set(add.map((x) => x.id));
      setTimeout(() => setFlies((f) => f.filter((x) => !ids.has(x.id))), 450);
    }
  }, [state, pos]);

  // Deal order: stagger cards around the table starting left of the dealer.
  const dealOrder = useMemo(() => {
    const inHand = seats.filter((s) => s.in_hand).map((s) => s.seat);
    const d = state?.dealer_seat ?? 0;
    const after = [...inHand.filter((x) => x > d), ...inHand.filter((x) => x <= d)];
    return Object.fromEntries(after.map((s, i) => [s, i]));
  }, [seats, state?.dealer_seat]);

  const winners = Object.fromEntries((state?.results || []).map((r) => [r.seat, r.amount]));
  const board = state?.board || [];
  const flopCount = Math.min(3, board.length);
  const last = state?.status === 'in_hand' ? state.last_action : null;
  const handKey = state?.hand_id ?? null;

  return (
    <div ref={box} dir="ltr" className={`relative mx-auto w-full select-none ${portrait ? 'aspect-[3/4.4] max-w-[min(100%,calc((100dvh-150px)*0.68))]' : 'aspect-[16/9] max-w-3xl'}`}>
      <div className="tl-felt absolute rounded-[50%]" style={{ left: `${g.feltX}%`, right: `${g.feltX}%`, top: `${g.feltY}%`, bottom: `${g.feltY}%` }} />

      {/* Board + pot */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
        <div className="flex h-14 gap-1">
          {board.map((c, i) => (
            <PlayingCard key={`${handKey}-${c}`} card={c} size={portrait ? 'sm' : 'md'} className="tl-flip"
              style={{ animationDelay: `${i < 3 ? (i * 25) : 0}ms`, animationDuration: i < 3 && flopCount === 3 ? '200ms' : '200ms' }} />
          ))}
        </div>
        {(state?.pot_total ?? 0) > 0 && <ChipStack amount={state!.pot_total} className="text-xs" />}
        {state?.status === 'hand_over' && state.results?.map((r) => (
          <p key={r.seat} className="max-w-[160px] text-center text-[11px] font-semibold text-[#F5F5F0]">{state.seats[r.seat]?.name} {t('wins')} {r.amount}{r.desc ? ` · ${r.desc}` : ''}</p>
        ))}
        {waitingDeal && <p className="text-xs text-[#F5F5F0]/80">{t('waiting_deal')}</p>}
      </div>

      {/* Bets between seat and centre */}
      {seats.map((s) => s.bet > 0 && pos[s.seat] ? (
        <div key={`bet-${s.seat}-${s.bet}`} className="tl-pop absolute z-10" style={{ left: `${toward(pos[s.seat]).x}%`, top: `${toward(pos[s.seat]).y}%` }}>
          <ChipStack amount={s.bet} />
        </div>
      ) : null)}

      {/* Flying chips */}
      {flies.map((f) => {
        const d = px(f.from, f.to);
        return (
          <div key={f.id} className={`absolute z-20 ${f.kind === 'pot' ? 'tl-fly-pot' : 'tl-fly-win'}`}
            style={{ left: `${f.from.x}%`, top: `${f.from.y}%`, ['--fx' as any]: d.fx, ['--fy' as any]: d.fy }}>
            <ChipStack amount={f.amount} />
          </div>
        );
      })}

      {/* Seats */}
      {seats.map((s) => {
        const p = pos[s.seat]; if (!p) return null;
        const d = px(p, { x: 50, y: 50 });
        return (
          <div key={s.seat} className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <TableSeat seat={s} label={labels[s.seat]} isDealer={state?.dealer_seat === s.seat && state?.status !== 'waiting'}
              isTurn={state?.to_act === s.seat && state?.status === 'in_hand'} deadline={state?.deadline ?? null} timer={state?.settings.timer || 0}
              cards={cardsFor(s.seat)} holeCount={holeCount} connected={isOnline(s)} isMe={s.seat === mySeat} youText={t('you')}
              sittingOut={(s.type === 'student' || s.type === 'coach') && (!s.ready || !!s.sitting_out)} sitOutText={t('sat_out')}
              waitingText={t('waiting_player')} foldedText={t('folded')} winner={state?.status === 'hand_over' ? winners[s.seat] : undefined}
              onClick={onSeatClick} handKey={handKey} dealIndex={dealOrder[s.seat]} dealFrom={{ dx: d.fx, dy: d.fy }} />
            {last && last.seat === s.seat && (
              <div key={state!.seq} className="absolute -top-3 left-1/2 z-40 -translate-x-1/2">
                <ActionBadge action={last.action} amount={last.amount} bb={bigBlind} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
export default memo(TableFelt);
