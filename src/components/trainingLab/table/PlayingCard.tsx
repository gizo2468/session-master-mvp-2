const SUIT: Record<string, { s: string; red: boolean }> = { s: { s: '♠', red: false }, h: { s: '♥', red: true }, d: { s: '♦', red: true }, c: { s: '♣', red: false } };

export default function PlayingCard({ card, size = 'md', faded }: { card?: string | null; size?: 'sm' | 'md'; faded?: boolean }) {
  const dims = size === 'sm' ? 'w-7 h-10 text-xs' : 'w-10 h-14 text-sm';
  if (!card) {
    return <div className={`${dims} rounded-md border border-poker-gold/60 bg-gradient-to-br from-poker-darkGold to-poker-gold shadow-sm`} aria-hidden />;
  }
  const suit = SUIT[card[1]] || SUIT.s;
  return (
    <div className={`${dims} ${faded ? 'opacity-50' : ''} flex flex-col items-center justify-center rounded-md border border-border bg-[#FAFAF7] font-bold leading-none shadow-sm ${suit.red ? 'text-red-600' : 'text-neutral-900'}`}>
      <span>{card[0] === 'T' ? '10' : card[0]}</span>
      <span>{suit.s}</span>
    </div>
  );
}
