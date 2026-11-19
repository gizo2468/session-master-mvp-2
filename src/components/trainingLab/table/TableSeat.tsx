import { useEffect, useState } from 'react';
import PlayingCard from './PlayingCard';
import type { TSeat } from '@/hooks/useTrainingTable';

interface Props {
  seat: TSeat; label?: string; isDealer: boolean; isTurn: boolean; deadline: number | null; timer: number;
  cards?: string[]; holeCount: number; connected: boolean; waitingText: string; foldedText: string; winner?: number;
  highlight?: boolean; onClick?: () => void; isMe?: boolean; youText?: string; sittingOut?: boolean; sitOutText?: string;
}

function TurnRing({ deadline, timer }: { deadline: number | null; timer: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(t); }, []);
  const frac = deadline && timer ? Math.max(0, Math.min(1, (deadline - now) / (timer * 1000))) : 1;
  const C = 2 * Math.PI * 22;
  return (
    <svg className="pointer-events-none absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)]" viewBox="0 0 48 48" preserveAspectRatio="none" aria-hidden>
      <circle cx="24" cy="24" r="22" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 24 24)" />
    </svg>
  );
}

export default function TableSeat(p: Props) {
  const s = p.seat;
  if (s.type === 'closed') return <div className="h-16 w-24 rounded-xl border border-dashed border-border/50" />;
  const human = s.type === 'student' || s.type === 'coach';
  const waiting = human && !p.connected;
  const glow = p.isTurn && p.isMe;
  return (
    <button type="button" onClick={p.onClick} disabled={!p.onClick}
      className={`relative flex flex-col items-center gap-1 rounded-xl border bg-card/95 px-1.5 py-1.5 text-center shadow-md transition-transform ${p.isMe ? 'w-32 border-2' : 'w-24'} ${p.isTurn ? 'border-primary' : p.isMe ? 'border-primary/70' : 'border-border'} ${s.folded || (p.sittingOut && !s.in_hand) ? 'opacity-50' : ''} ${glow ? 'animate-pulse shadow-[0_0_24px_hsl(var(--primary))]' : ''}`}>
      {p.isMe && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 text-[11px] font-black text-primary-foreground">{p.youText}</span>}
      {p.isTurn && <TurnRing deadline={p.deadline} timer={p.timer} />}
      <div className="flex min-h-[40px] gap-0.5">
        {s.in_hand && !s.folded && Array.from({ length: p.holeCount }).map((_, i) => (
          <PlayingCard key={i} size={p.isMe && p.holeCount <= 2 ? 'md' : 'sm'} card={p.cards?.[i] ?? null} />
        ))}
      </div>
      <div className="w-full truncate text-xs font-semibold">{s.name}</div>
      <div className="text-xs text-primary">{waiting ? p.waitingText : p.sittingOut && !s.in_hand ? p.sitOutText : s.folded ? p.foldedText : s.all_in ? 'ALL-IN' : s.stack}</div>
      {p.label && <span className="absolute -top-2 left-1 rounded bg-muted px-1 text-[10px] font-bold">{p.label}</span>}
      {p.isDealer && <span className="absolute -top-2 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FAFAF7] text-[10px] font-bold text-neutral-900 shadow">D</span>}
      {s.bet > 0 && <span className="absolute -bottom-3 rounded-full bg-primary px-2 text-[11px] font-bold text-primary-foreground">{s.bet}</span>}
      {p.winner != null && <span className="absolute -bottom-3 rounded-full bg-[#35654D] px-2 text-[11px] font-bold text-[#F5F5F0]">+{p.winner}</span>}
    </button>
  );
}
