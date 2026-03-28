import React from 'react';
import { RANKS, getHandLabel, getHandType } from '@/hooks/useChartsLibrary';
import { cn } from '@/lib/utils';

interface HandRangeGridProps {
  rangeData?: Record<string, any>;
  onCellClick?: (hand: string, row: number, col: number) => void;
  compact?: boolean;
}

// Default GTO-approximated ranges by hand strength tier
const TIER_COLORS: Record<string, string> = {
  raise: 'bg-red-500/80 text-white',
  call: 'bg-emerald-500/70 text-white',
  fold: 'bg-blue-900/40 text-blue-200',
};

// Simple default range classification (not proprietary, app-created heuristic)
function getDefaultAction(row: number, col: number): 'raise' | 'call' | 'fold' {
  const hand = getHandLabel(row, col);
  const type = getHandType(row, col);

  // Premium pairs
  if (type === 'pair' && row <= 3) return 'raise'; // AA-JJ
  if (type === 'pair' && row <= 6) return 'call';  // TT-88
  if (type === 'pair') return 'fold';

  // Premium suited
  if (type === 'suited') {
    if (row === 0 && col <= 4) return 'raise'; // AKs-ATs
    if (row === 0) return 'call'; // A9s-A2s
    if (row === 1 && col <= 4) return 'raise'; // KQs-KTs
    if (row <= 2 && col <= 5) return 'call';
    if (col - row <= 2 && row <= 6) return 'call'; // connectors
    return 'fold';
  }

  // Offsuit
  if (type === 'offsuit') {
    if (row === 0 && col === 1) return 'raise'; // AKo
    if (row === 0 && col <= 3) return 'call';   // AQo-AJo
    if (row === 1 && col <= 3) return 'call';   // KQo-KJo
    return 'fold';
  }

  return 'fold';
}

const HandRangeGrid: React.FC<HandRangeGridProps> = ({ rangeData, onCellClick, compact = false }) => {
  const cellSize = compact ? 'w-6 h-6 text-[8px]' : 'w-8 h-8 text-[10px] sm:w-9 sm:h-9 sm:text-xs';

  return (
    <div className="inline-grid grid-cols-13 gap-[1px] bg-border/30 rounded-lg overflow-hidden">
      {RANKS.map((_, rowIdx) =>
        RANKS.map((_, colIdx) => {
          const hand = getHandLabel(rowIdx, colIdx);
          const action = getDefaultAction(rowIdx, colIdx);
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
              onClick={() => onCellClick?.(hand, rowIdx, colIdx)}
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
