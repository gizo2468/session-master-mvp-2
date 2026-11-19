import { memo } from 'react';
import { fmtAmount, useTableStore } from '@/stores/useTableStore';

/** Small chip stack with amount (BB or chips). Purely presentational; motion is done with transform only. */
function ChipStack({ amount, bb = 0, className = '' }: { amount: number; bb?: number; className?: string }) {
  const showBB = useTableStore((s) => s.showBB);
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="relative h-[4.2cqw] w-[6cqw]">
        <span className="absolute left-0 top-[0.6cqw] h-[3.6cqw] w-[3.6cqw] rounded-full border-[0.5cqw] border-dashed border-[#FAFAF7] bg-red-800" />
        <span className="absolute right-0 top-0 h-[3.6cqw] w-[3.6cqw] rounded-full border-[0.5cqw] border-dashed border-[#FAFAF7] bg-poker-gold" />
      </span>
      <span className="mt-[0.3cqw] whitespace-nowrap rounded-full bg-black/60 px-[1.6cqw] text-[3cqw] font-bold text-[#F5F5F0]">{fmtAmount(amount, bb, bb ? showBB : false)}</span>
    </div>
  );
}
export default memo(ChipStack);
