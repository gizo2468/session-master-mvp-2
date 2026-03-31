import React from 'react';
import { RANKS, getHandLabel, getHandType } from '@/hooks/useChartsLibrary';
import { cn } from '@/lib/utils';

interface HandRangeGridProps {
  rangeData?: Record<string, any>;
  onCellClick?: (hand: string, row: number, col: number) => void;
  compact?: boolean;
  editable?: boolean;
  rangeState?: Record<string, string>;
  onRangeChange?: (newState: Record<string, string>) => void;
  paintMode?: string | null;
}

const TIER_COLORS: Record<string, string> = {
  raise: 'bg-red-500/80 text-white',
  call: 'bg-emerald-500/70 text-white',
  fold: 'bg-blue-900/40 text-blue-200',
};

function getDefaultAction(row: number, col: number): 'raise' | 'call' | 'fold' {
  const type = getHandType(row, col);

  if (type === 'pair' && row <= 3) return 'raise';
  if (type === 'pair' && row <= 6) return 'call';
  if (type === 'pair') return 'fold';

  if (type === 'suited') {
    if (row === 0 && col <= 4) return 'raise';
    if (row === 0) return 'call';
    if (row === 1 && col <= 4) return 'raise';
    if (row <= 2 && col <= 5) return 'call';
    if (col - row <= 2 && row <= 6) return 'call';
    return 'fold';
  }

  if (type === 'offsuit') {
    if (row === 0 && col === 1) return 'raise';
    if (row === 0 && col <= 3) return 'call';
    if (row === 1 && col <= 3) return 'call';
    return 'fold';
  }

  return 'fold';
}

function cycleAction(current: string | undefined): string {
  if (!current || current === 'fold') return 'raise';
  if (current === 'raise') return 'call';
  return 'fold';
}

const HandRangeGrid: React.FC<HandRangeGridProps> = ({
  rangeData,
  onCellClick,
  compact = false,
  editable = false,
  rangeState,
  onRangeChange,
}) => {
  const cellSize = compact ? 'w-6 h-6 text-[8px]' : 'w-8 h-8 text-[10px] sm:w-9 sm:h-9 sm:text-xs';

  const handleCellClick = (hand: string, row: number, col: number) => {
    if (editable && rangeState && onRangeChange) {
      const current = rangeState[hand];
      const next = cycleAction(current);
      onRangeChange({ ...rangeState, [hand]: next });
    } else {
      onCellClick?.(hand, row, col);
    }
  };

  return (
    <div className="inline-grid grid-cols-13 gap-[1px] bg-border/30 rounded-lg overflow-hidden">
      {RANKS.map((_, rowIdx) =>
        RANKS.map((_, colIdx) => {
          const hand = getHandLabel(rowIdx, colIdx);

          // In editable mode use rangeState; otherwise use defaults
          const action = editable
            ? (rangeState?.[hand] || 'fold')
            : getDefaultAction(rowIdx, colIdx);
          const colorClass = TIER_COLORS[action] || TIER_COLORS.fold;

          return (
            <button
              key={`${rowIdx}-${colIdx}`}
              className={cn(
                cellSize,
                'flex items-center justify-center font-mono font-semibold transition-all',
                'hover:brightness-125 hover:scale-105 active:scale-95',
                colorClass
              )}
              onClick={() => handleCellClick(hand, rowIdx, colIdx)}
              title={hand}
            >
              {hand}
            </button>
          );
        })
      )}
    </div>
  );
};

export default HandRangeGrid;
