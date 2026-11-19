import { memo, useEffect, useState } from 'react';
import PlayingCard from './PlayingCard';
import type { TSeat } from '@/hooks/useTrainingTable';

interface Props {
  seat: TSeat; label?: string; isDealer: boolean; isTurn: boolean; deadline: number | null; timer: number;
  cards?: string[]; holeCount: number; connected: boolean; waitingText: string; foldedText: string; winner?: number;
  onClick?: (seat: number) => void; isMe?: boolean; youText?: string; sittingOut?: boolean; sitOutText?: string;
  handKey?: string | null; dealIndex?: number; dealFrom?: { dx: string; dy: string };
}

function TurnRing({ deadline, timer }: { deadline: number | null; timer: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!deadline) return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [deadline]);
  const frac = deadline && timer ? Math.max(0, Math.min(1, (deadline - now) / (timer * 1000))) : 1;
  const C = 2 * Math.PI * 21;
  return (
    <svg className="pointer-events-none absolute -inset-[5px] h-[calc(100%+10px)] w-[calc(100%+10px)]" viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="21" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 24 24)" style={{ transition: 'stroke-dasharray 250ms linear' }} />
    </svg>
  );
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

/** Compact seat: avatar with initials, name, stack, position — cards tucked above. */
function TableSeat(p: Props) {
  const s = p.seat;
  if (s.type === 'closed') return <div className="h-12 w-12 rounded-full border border-dashed border-border/40" />;
  const human = s.type === 'student' || s.type === 'coach';
  const waiting = human && !p.connected;
  const out = p.sittingOut && !s.in_hand;
  const dim = s.folded || out;
  const big = p.isMe;
  const showCards = s.in_hand && !s.folded;
  return (
    <button type="button" onClick={() => p.onClick?.(s.seat)} disabled={!p.onClick}
      className={`relative flex flex-col items-center ${big ? 'w-[92px]' : 'w-[74px]'} bg-transparent transition-transform`}>
      {/* Cards */}
      <div className={`flex h-[34px] items-end justify-center ${big ? (p.holeCount > 2 ? '-space-x-2' : 'gap-0.5') : p.holeCount > 2 ? '-space-x-3' : '-space-x-1.5'} ${big ? 'h-[42px]' : ''}`}>
        {showCards && Array.from({ length: p.holeCount }).map((_, i) => (
          <PlayingCard key={`${p.handKey}-${i}-${p.cards?.[i] ?? 'x'}`} size={big ? 'sm' : 'xs'} card={p.cards?.[i] ?? null}
            className={p.cards?.[i] ? 'tl-flip' : 'tl-deal'}
            style={{ animationDelay: `${((p.dealIndex ?? 0) + i * 4) * 40}ms`, ['--dx' as any]: p.dealFrom?.dx, ['--dy' as any]: p.dealFrom?.dy }} />
        ))}
      </div>
      {/* Plate */}
      <div className={`relative -mt-1 flex w-full items-center gap-1 rounded-full border bg-card/95 py-0.5 pl-0.5 pr-1.5 shadow-md
        ${p.isTurn ? 'border-primary' : big ? 'border-primary/70' : 'border-border'} ${dim ? 'opacity-55' : ''}
        ${p.isTurn && big ? 'shadow-[0_0_18px_hsl(var(--primary))]' : ''}`}>
        <span className={`relative flex shrink-0 items-center justify-center rounded-full font-black ${big ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-[11px]'} ${s.type === 'bot' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}>
          {initials(s.name)}
          {p.isTurn && <TurnRing deadline={p.deadline} timer={p.timer} />}
        </span>
        <span className="min-w-0 flex-1 text-left leading-tight">
          <span className="block truncate text-[11px] font-semibold">{s.name}</span>
          <span className="block truncate text-[11px] font-bold text-primary">
            {waiting ? p.waitingText : out ? p.sitOutText : s.folded ? p.foldedText : s.all_in ? 'ALL-IN' : s.stack}
          </span>
        </span>
      </div>
      {p.isMe && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground">{p.youText}</span>}
      {p.label && <span className="absolute -bottom-2 left-1 rounded bg-muted px-1 text-[9px] font-bold">{p.label}</span>}
      {p.isDealer && <span className="absolute -bottom-2 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#FAFAF7] text-[9px] font-black text-neutral-900 shadow">D</span>}
      {p.winner != null && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 text-[11px] font-black text-primary-foreground">+{p.winner}</span>}
    </button>
  );
}

const same = (a: Props, b: Props) =>
  a.isTurn === b.isTurn && a.deadline === b.deadline && a.label === b.label && a.isDealer === b.isDealer && a.connected === b.connected &&
  a.winner === b.winner && a.sittingOut === b.sittingOut && a.isMe === b.isMe && a.handKey === b.handKey && a.onClick === b.onClick &&
  (a.cards || []).join() === (b.cards || []).join() && JSON.stringify(a.seat) === JSON.stringify(b.seat) && a.waitingText === b.waitingText;

export default memo(TableSeat, same);
