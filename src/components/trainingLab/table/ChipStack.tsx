import { memo } from 'react';

/** Small chip stack with amount. Purely presentational; motion is done with transform only. */
function ChipStack({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <div className={`flex items-center gap-1 rounded-full bg-black/55 py-0.5 pl-0.5 pr-1.5 text-[11px] font-bold text-[#F5F5F0] ${className}`}>
      <span className="relative h-4 w-4">
        <span className="absolute inset-0 translate-y-[2px] rounded-full border border-dashed border-[#FAFAF7] bg-red-700" />
        <span className="absolute inset-0 rounded-full border-2 border-dashed border-[#FAFAF7] bg-poker-gold" />
      </span>
      {amount}
    </div>
  );
}
export default memo(ChipStack);
