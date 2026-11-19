import { memo } from 'react';
import { useTableStore } from '@/stores/useTableStore';

// Original card faces: inline SVG suits, nothing to download.
const PATHS: Record<string, string> = {
  s: 'M12 2C9 6 3 9 3 14a4.5 4.5 0 0 0 7.5 3.3L9 22h6l-1.5-4.7A4.5 4.5 0 0 0 21 14c0-5-6-8-9-12z',
  h: 'M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z',
  d: 'M12 2l8 10-8 10-8-10z',
  c: 'M12 2a4.5 4.5 0 0 0-3.9 6.7A4.5 4.5 0 1 0 10.5 16L9 22h6l-1.5-6a4.5 4.5 0 1 0 2.4-7.3A4.5 4.5 0 0 0 12 2z',
};
const TWO = { s: 'text-neutral-900', h: 'text-red-600', d: 'text-red-600', c: 'text-neutral-900' } as Record<string, string>;
const FOUR = { s: 'text-neutral-900', h: 'text-red-600', d: 'text-blue-600', c: 'text-green-700' } as Record<string, string>;

export const SuitIcon = ({ suit, className }: { suit: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d={PATHS[suit] || PATHS.s} /></svg>
);

const DIMS = {
  xs: 'w-[22px] h-[31px] text-[10px]', sm: 'w-7 h-10 text-xs', md: 'w-10 h-14 text-sm', lg: 'w-12 h-[68px] text-base',
} as const;

interface Props { card?: string | null; size?: keyof typeof DIMS; faded?: boolean; className?: string; style?: React.CSSProperties }

function PlayingCard({ card, size = 'md', faded, className = '', style }: Props) {
  const four = useTableStore((s) => s.fourColor);
  const dims = DIMS[size];
  if (!card) {
    return (
      <div style={style} className={`${dims} ${className} rounded-[4px] border border-poker-gold/70 bg-poker-darkGold shadow-sm [background-image:repeating-linear-gradient(45deg,transparent_0_3px,hsl(var(--primary)/0.35)_3px_4px)]`} aria-hidden />
    );
  }
  const suit = card[1];
  const color = (four ? FOUR : TWO)[suit] || TWO.s;
  const rank = card[0] === 'T' ? '10' : card[0];
  return (
    <div style={style} className={`${dims} ${className} ${faded ? 'opacity-50' : ''} relative overflow-hidden rounded-[4px] border border-neutral-300 bg-[#FAFAF7] font-black leading-none shadow-sm ${color}`}>
      <span className="absolute left-[3px] top-[2px] tracking-tighter">{rank}</span>
      <SuitIcon suit={suit} className="absolute bottom-[3px] right-[2px] h-[55%] w-[55%]" />
    </div>
  );
}
export default memo(PlayingCard);
