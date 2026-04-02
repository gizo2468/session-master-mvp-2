import React, { useState } from 'react';
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

function getCellsBetween(
  r1: number, c1: number, r2: number, c2: number
): Array<[number, number]> | null {
  // Pairs: both on diagonal
  if (r1 === c1 && r2 === c2) {
    const min = Math.min(r1, r2);
    const max = Math.max(r1, r2);
    const cells: Array<[number, number]> = [];
    for (let i = min; i <= max; i++) cells.push([i, i]);
    return cells;
  }
  // Suited row: both above diagonal, same row
  if (c1 > r1 && c2 > r2 && r1 === r2) {
    const min = Math.min(c1, c2);
    const max = Math.max(c1, c2);
    const cells: Array<[number, number]> = [];
    for (let j = min; j <= max; j++) cells.push([r1, j]);
    return cells;
  }
  // Offsuit column: both below diagonal, same column
  if (r1 > c1 && r2 > c2 && c1 === c2) {
    const min = Math.min(r1, r2);
    const max = Math.max(r1, r2);
    const cells: Array<[number, number]> = [];
    for (let i = min; i <= max; i++) cells.push([i, c1]);
    return cells;
  }
  return null;
}

const HandRangeGrid: React.FC<HandRangeGridProps> = ({
  rangeData,
  onCellClick,
  compact = false,
  editable = false,
  rangeState,
  onRangeChange,
  paintMode,
}) => {
  const [rangeStart, setRangeStart] = useState<{ row: number; col: number } | null>(null);
  const cellSize = compact ? 'w-6 h-6 text-[8px]' : 'w-8 h-8 text-[10px] sm:w-9 sm:h-9 sm:text-xs';

  const handleCellClick = (hand: string, row: number, col: number) => {
    if (editable && rangeState && onRangeChange) {
      if (paintMode) {
        const current = rangeState[hand] || 'fold';
        const next = current === paintMode ? 'fold' : paintMode;
        onRangeChange({ ...rangeState, [hand]: next });
      } else {
        const current = rangeState[hand];
        const next = cycleAction(current);
        onRangeChange({ ...rangeState, [hand]: next });
      }
    } else {
      onCellClick?.(hand, row, col);
    }
  };

  const handleDoubleClick = (row: number, col: number) => {
    if (!editable || !paintMode || !rangeState || !onRangeChange) return;

    if (!rangeStart) {
      setRangeStart({ row, col });
      return;
    }

    const cells = getCellsBetween(rangeStart.row, rangeStart.col, row, col);
    if (cells) {
      const newState = { ...rangeState };
      for (const [r, c] of cells) {
        const hand = getHandLabel(r, c);
        newState[hand] = paintMode;
      }
      onRangeChange(newState);
    }
    setRangeStart(null);
  };

  // Clear range start when paint mode changes
  React.useEffect(() => {
    setRangeStart(null);
  }, [paintMode]);

  return (
    <div className="inline-grid grid-cols-13 gap-[1px] bg-border/30 rounded-lg overflow-hidden">
      {RANKS.map((_, rowIdx) =>
        RANKS.map((_, colIdx) => {
          const hand = getHandLabel(rowIdx, colIdx);
          const action = editable
            ? (rangeState?.[hand] || 'fold')
            : getDefaultAction(rowIdx, colIdx);
          const colorClass = TIER_COLORS[action] || TIER_COLORS.fold;
          const isRangeStart = rangeStart?.row === rowIdx && rangeStart?.col === colIdx;

          return (
            <button
              key={`${rowIdx}-${colIdx}`}
              className={cn(
                cellSize,
                'flex items-center justify-center font-mono font-semibold transition-all',
                'hover:brightness-125 hover:scale-105 active:scale-95',
                colorClass,
                isRangeStart && 'ring-2 ring-white ring-offset-1 ring-offset-background z-10'
              )}
              onClick={() => handleCellClick(hand, rowIdx, colIdx)}
              onDoubleClick={() => handleDoubleClick(rowIdx, colIdx)}
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
