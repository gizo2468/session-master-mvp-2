import { memo, useEffect, useState } from 'react';
import PlayingCard from './PlayingCard';
import type { TSeat } from '@/hooks/useTrainingTable';
import { fmtAmount, useTableStore } from '@/stores/useTableStore';

interface Props {
  seat: TSeat; label?: string; isDealer: boolean; isTurn: boolean; deadline: number | null; timer: number;
  cards?: string[]; holeCount: number; connected: boolean; waitingText: string; foldedText: string; winner?: number;
  onClick?: (seat: number) => void; isMe?: boolean; youText?: string; sittingOut?: boolean; sitOutText?: string;
  handKey?: string | null; dealIndex?: number; dealFrom?: { dx: string; dy: string }; bigBlind: number;
}

/** Countdown bar under the plate; scaleX only so it never causes layout work. */
function TurnBar({ deadline, timer }: { deadline: number | null; timer: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!deadline) return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [deadline]);
  if (!deadline || !timer) return null;
  const frac = Math.max(0, Math.min(1, (deadline - now) / (timer * 1000)));
  return (
    <span className="absolute inset-x-[6%] -bottom-[1.4cqw] h-[0.9cqw] overflow-hidden rounded-full bg-black/60">
      <span className={`block h-full origin-left rounded-full ${frac < 0.25 ? 'bg-destructive' : 'bg-poker-gold'}`}
        style={{ transform: `scaleX(${frac})`, transition: 'transform 250ms linear' }} />
    </span>
  );
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

/** A seat on the rail: round avatar, dark plate with name + stack, cards, dealer chip, turn ring and countdown. */
function TableSeat(p: Props) {
  const showBB = useTableStore((s) => s.showBB);
  const s = p.seat;
  const big = !!p.isMe;
  const avatar = big ? 'w-[min(15cqw,8.5cqh)] h-[min(15cqw,8.5cqh)] text-[min(5cqw,3cqh)]' : 'w-[min(11.5cqw,6.6cqh)] h-[min(11.5cqw,6.6cqh)] text-[min(4cqw,2.4cqh)]';
  if (s.type === 'closed') return <div className={`${avatar} rounded-full border border-dashed border-white/15`} />;
  const human = s.type === 'student' || s.type === 'coach';
  const waiting = human && !p.connected;
  const out = p.sittingOut && !s.in_hand;
  const dim = s.folded || out;
  const showCards = s.in_hand && !s.folded;
  const size = big ? (p.holeCount > 2 ? 'hero4' : 'hero') : 'opp';
  const status = waiting ? p.waitingText : out ? p.sitOutText : s.folded ? p.foldedText : s.all_in ? 'ALL-IN' : null;

  return (
    <button type="button" onClick={() => p.onClick?.(s.seat)} disabled={!p.onClick}
      className={`relative flex flex-col items-center bg-transparent transition-opacity duration-200 ${big ? 'w-[28cqw]' : 'w-[22cqw]'} ${dim ? 'opacity-40' : ''}`}>
      {/* Avatar + cards */}
      <div className="relative">
        <span className={`relative flex items-center justify-center rounded-full border-2 font-black ${avatar}
          ${s.type === 'bot' ? 'border-white/20 tl-plate' : 'border-poker-gold/70 bg-poker-darkGold text-poker-black'}
          ${p.isTurn ? 'shadow-[0_0_0_2px_hsl(var(--primary)),0_0_18px_4px_hsl(var(--primary)/0.7)]' : ''}`}>
          {initials(s.name)}
        </span>
        {showCards && (
          <div className={`absolute flex ${big
            ? `bottom-[35%] left-1/2 -translate-x-1/2 ${p.holeCount > 2 ? '-space-x-[5cqw]' : '-space-x-[3.5cqw]'}`
            : `-top-[2cqw] left-[55%] ${p.holeCount > 2 ? '-space-x-[3.6cqw]' : '-space-x-[2.6cqw]'}`}`}>
            {Array.from({ length: p.holeCount }).map((_, i) => (
              <PlayingCard key={`${p.handKey}-${i}-${p.cards?.[i] ?? 'x'}`} size={size as any} card={p.cards?.[i] ?? null}
                className={`${p.cards?.[i] ? 'tl-flip' : 'tl-deal'} shadow-md`}
                style={{ rotate: big ? `${(i - (p.holeCount - 1) / 2) * 6}deg` : undefined, animationDelay: `${((p.dealIndex ?? 0) + i * 4) * 40}ms`, ['--dx' as any]: p.dealFrom?.dx, ['--dy' as any]: p.dealFrom?.dy }} />
            ))}
          </div>
        )}
        {p.isDealer && (
          <span className="absolute -right-[1.5cqw] bottom-0 flex h-[5cqw] w-[5cqw] items-center justify-center rounded-full border border-poker-darkGold bg-poker-gold text-[2.8cqw] font-black italic text-poker-black shadow">D</span>
        )}
      </div>
      {/* Plate */}
      <div className={`tl-plate relative -mt-[2cqw] w-full rounded-[1.6cqw] border px-[1cqw] py-[0.6cqw] text-center leading-tight shadow-lg
        ${p.isTurn ? 'border-primary' : big ? 'border-poker-gold/80' : 'border-white/10'}`}>
        <span className={`block truncate font-semibold ${big ? 'text-[3.6cqw]' : 'text-[3cqw]'}`}>{s.name}</span>
        <span className={`block truncate font-black ${big ? 'text-[4.6cqw]' : 'text-[3.6cqw]'} ${status ? 'text-muted-foreground' : 'tl-stack'}`}>
          {status ?? fmtAmount(s.stack, p.bigBlind, showBB)}
        </span>
        {p.isTurn && <TurnBar deadline={p.deadline} timer={p.timer} />}
      </div>
      {p.label && <span className="mt-[0.8cqw] rounded bg-black/50 px-[1cqw] text-[2.4cqw] font-bold text-white/70">{p.label}</span>}
      {p.winner != null && <span className="absolute -top-[3cqw] left-1/2 -translate-x-1/2 rounded-full bg-primary px-[2cqw] text-[3.2cqw] font-black text-primary-foreground tl-pop">+{fmtAmount(p.winner, p.bigBlind, showBB)}</span>}
    </button>
  );
}

const same = (a: Props, b: Props) =>
  a.isTurn === b.isTurn && a.deadline === b.deadline && a.label === b.label && a.isDealer === b.isDealer && a.connected === b.connected &&
  a.winner === b.winner && a.sittingOut === b.sittingOut && a.isMe === b.isMe && a.handKey === b.handKey && a.onClick === b.onClick &&
  a.holeCount === b.holeCount && a.bigBlind === b.bigBlind &&
  (a.cards || []).join() === (b.cards || []).join() && JSON.stringify(a.seat) === JSON.stringify(b.seat) && a.waitingText === b.waitingText;

export default memo(TableSeat, same);
