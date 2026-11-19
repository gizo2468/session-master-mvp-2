import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TSeat, TState } from '@/hooks/useTrainingTable';
import PlayingCard from './PlayingCard';
import TableSeat from './TableSeat';
import ChipStack from './ChipStack';
import ActionBadge from './ActionBadge';
import { betSpot, seatPositions, type Pt } from './seatLayouts';
import { playSound } from './sounds';
import { useTL } from '../i18n';
import { fmtAmount, useTableStore } from '@/stores/useTableStore';
import logo from '@/assets/session-master-logo.png';

interface Props {
  state: TState | null; seats: TSeat[]; total: number; anchor: number; holeCount: number; bigBlind: number;
  labels: Record<number, string>; mySeat?: number; cardsFor: (seat: number) => string[] | undefined;
  isOnline: (s: TSeat) => boolean; onSeatClick?: (seat: number) => void; waitingDeal: boolean;
  gameType: string; info: string[]; children?: ReactNode;
}

interface Fly { id: number; from: Pt; to: Pt; amount: number; kind: 'pot' | 'win' }
let flyId = 0;
const POT: Pt = { x: 50, y: 48 };

/** Stadium table on the full-screen stage: felt, board, pot, seats on the rail, bets and chip motion (transform/opacity only). */
function TableFelt({ state, seats, total, anchor, holeCount, bigBlind, labels, mySeat, cardsFor, isOnline, onSeatClick, waitingDeal, gameType, info, children }: Props) {
  const { t } = useTL();
  const showBB = useTableStore((s) => s.showBB);
  const pos = useMemo(() => seatPositions(total, anchor), [total, anchor]);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const px = (from: Pt, to: Pt) => ({ fx: `${((to.x - from.x) / 100) * size.w}px`, fy: `${((to.y - from.y) / 100) * size.h}px` });

  const [flies, setFlies] = useState<Fly[]>([]);
  const prev = useRef<TState | null>(null);
  useEffect(() => {
    const p = prev.current; prev.current = state;
    if (!state || !p) return;
    const add: Fly[] = [];
    if (p.hand_id === state.hand_id && (p.street !== state.street || (p.status === 'in_hand' && state.status !== 'in_hand'))) {
      for (const s of Object.values(p.seats)) if (s.bet > 0 && pos[s.seat]) add.push({ id: ++flyId, from: betSpot(pos[s.seat]), to: POT, amount: s.bet, kind: 'pot' });
    }
    if (state.status === 'hand_over' && p.status !== 'hand_over') {
      for (const r of state.results || []) if (pos[r.seat]) add.push({ id: ++flyId, from: POT, to: pos[r.seat], amount: r.amount, kind: 'win' });
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

  const dealOrder = useMemo(() => {
    const inHand = seats.filter((s) => s.in_hand).map((s) => s.seat);
    const d = state?.dealer_seat ?? 0;
    const after = [...inHand.filter((x) => x > d), ...inHand.filter((x) => x <= d)];
    return Object.fromEntries(after.map((s, i) => [s, i]));
  }, [seats, state?.dealer_seat]);

  const winners = Object.fromEntries((state?.results || []).map((r) => [r.seat, r.amount]));
  const board = state?.board || [];
  const last = state?.status === 'in_hand' ? state.last_action : null;
  const handKey = state?.hand_id ?? null;
  const pct = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` });

  return (
    <div ref={box} dir="ltr" className="absolute inset-0 select-none [container-type:size]">
      {/* Felt */}
      <div className="tl-stadium absolute" style={{ left: '6%', right: '6%', top: '4.5%', bottom: '11%' }} />
      {/* Watermark + info */}
      <div className="pointer-events-none absolute left-1/2 top-[56%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[1cqw] opacity-[0.14]">
        <img src={logo} alt="" className="h-[9cqw] w-auto grayscale" draggable={false} />
        <span className="rounded-full border-2 border-white px-[3cqw] text-[5cqw] font-black tracking-wider text-white">{gameType}</span>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[64%] w-[46cqw] -translate-x-1/2 -translate-y-1/2 text-center text-[2.8cqw] leading-snug text-white/40">
        {info.map((l) => <p key={l} className="truncate">{l}</p>)}
      </div>

      {/* Board + pot */}
      <div className="absolute left-1/2 top-[39%] flex -translate-x-1/2 -translate-y-1/2 gap-[1.2cqw]">
        {board.map((c, i) => (
          <PlayingCard key={`${handKey}-${c}`} card={c} size="board" className="tl-flip shadow-lg" style={{ animationDelay: `${i < 3 ? i * 25 : 0}ms` }} />
        ))}
      </div>
      <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={pct(POT)}>
        {(state?.pot_total ?? 0) > 0 && (
          <div className="rounded-full bg-black/45 px-[4cqw] py-[0.8cqw] text-center leading-tight">
            <p className="text-[2.8cqw] text-white/70">{t('total_pot')}</p>
            <p className="text-[4.8cqw] font-black text-poker-gold">{fmtAmount(state!.pot_total, bigBlind, showBB)}</p>
          </div>
        )}
        {state?.status === 'hand_over' && state.results?.map((r) => (
          <p key={r.seat} className="mt-[1cqw] max-w-[50cqw] truncate text-center text-[3cqw] font-semibold tl-ink">{state.seats[r.seat]?.name} {t('wins')} {fmtAmount(r.amount, bigBlind, showBB)}{r.desc ? ` · ${r.desc}` : ''}</p>
        ))}
        {waitingDeal && !(state?.pot_total) && <p className="text-[3.2cqw] text-white/70">{t('waiting_deal')}</p>}
      </div>

      {/* Bets */}
      {seats.map((s) => s.bet > 0 && pos[s.seat] ? (
        <div key={`bet-${s.seat}-${s.bet}`} className="tl-pop absolute z-10 -translate-x-1/2 -translate-y-1/2" style={pct(betSpot(pos[s.seat]))}>
          <ChipStack amount={s.bet} bb={bigBlind} />
        </div>
      ) : null)}

      {flies.map((f) => {
        const d = px(f.from, f.to);
        return (
          <div key={f.id} className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 ${f.kind === 'pot' ? 'tl-fly-pot' : 'tl-fly-win'}`}
            style={{ ...pct(f.from), ['--fx' as any]: d.fx, ['--fy' as any]: d.fy }}>
            <ChipStack amount={f.amount} bb={bigBlind} />
          </div>
        );
      })}

      {/* Seats */}
      {seats.map((s) => {
        const p = pos[s.seat]; if (!p) return null;
        const d = px(p, POT);
        return (
          <div key={s.seat} className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={pct(p)}>
            <TableSeat seat={s} label={labels[s.seat]} isDealer={state?.dealer_seat === s.seat && state?.status !== 'waiting'}
              isTurn={state?.to_act === s.seat && state?.status === 'in_hand'} deadline={state?.deadline ?? null} timer={state?.settings.timer || 0}
              cards={cardsFor(s.seat)} holeCount={holeCount} connected={isOnline(s)} isMe={s.seat === mySeat} youText={t('you')}
              sittingOut={(s.type === 'student' || s.type === 'coach') && (!s.ready || !!s.sitting_out)} sitOutText={t('sat_out')}
              waitingText={t('waiting_player')} foldedText={t('folded')} winner={state?.status === 'hand_over' ? winners[s.seat] : undefined}
              onClick={onSeatClick} handKey={handKey} dealIndex={dealOrder[s.seat]} dealFrom={{ dx: d.fx, dy: d.fy }} bigBlind={bigBlind} />
            {last && last.seat === s.seat && (
              <div key={state!.seq} className="absolute left-1/2 -top-[3cqw] z-40 -translate-x-1/2">
                <ActionBadge action={last.action} amount={last.amount} bb={bigBlind} />
              </div>
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
}
export default memo(TableFelt);
