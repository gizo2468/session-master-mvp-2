import React, { useState } from 'react';
import { RANKS, getHandLabel, getHandType } from '@/hooks/useChartsLibrary';
import { cn } from '@/lib/utils';
import type { CellAction } from './CellMixEditor';

interface HandRangeGridProps {
  rangeData?: Record<string, any>;
  onCellClick?: (hand: string, row: number, col: number) => void;
  compact?: boolean;
  editable?: boolean;
  rangeState?: Record<string, string>;
  onRangeChange?: (newState: Record<string, string>) => void;
  paintMode?: string | null;
  onMixEdit?: (hand: string) => void;
  availableActions?: string[];
}

const TIER_COLORS: Record<string, string> = {
  raise: 'bg-red-500/80 text-white',
  call: 'bg-emerald-500/70 text-white',
  fold: 'bg-blue-900/40 text-blue-200',
};

export const ACTION_COLORS: Record<string, string> = {
  raise: 'rgba(239,68,68,0.85)',
  call: 'rgba(16,185,129,0.75)',
  fold: 'rgba(30,58,138,0.5)',
  '3bet': 'rgba(168,85,247,0.8)',
};

// Parse cell value → array of {action, weight}
export function parseCellAction(value: string | undefined): CellAction[] {
  if (!value || value === 'fold') return [{ action: 'fold', weight: 100 }];
  // Try JSON array
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value) as CellAction[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
  }
  // Legacy slash-separated (e.g. "call/raise")
  if (value.includes('/')) {
    const parts = value.split('/');
    const w = Math.round(100 / parts.length);
    return parts.map((p, i) => ({
      action: p,
      weight: i === parts.length - 1 ? 100 - w * (parts.length - 1) : w,
    }));
  }
  // Single action
  return [{ action: value, weight: 100 }];
}

// Serialize back to string for storage
export function serializeCellAction(actions: CellAction[]): string {
  if (actions.length === 0) return 'fold';
  if (actions.length === 1) return actions[0].action;
  return JSON.stringify(actions);
}

// Build CSS style for cell background
function getCellStyle(actions: CellAction[]): React.CSSProperties | null {
  if (actions.length <= 1) return null;
  
  // Build horizontal gradient stops
  let cumulative = 0;
  const stops: string[] = [];
  for (const { action, weight } of actions) {
    const color = ACTION_COLORS[action] || ACTION_COLORS.fold;
    stops.push(`${color} ${cumulative}%`);
    cumulative += weight;
    stops.push(`${color} ${cumulative}%`);
  }
  return { background: `linear-gradient(to bottom, ${stops.join(', ')})` };
}

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
  const simple = ['fold', 'raise', 'call'];
  const parsed = parseCellAction(current);
  const singleAction = parsed.length === 1 ? parsed[0].action : 'fold';
  const idx = simple.indexOf(singleAction);
  return simple[(idx + 1) % simple.length];
}

function getCellsBetween(
  r1: number, c1: number, r2: number, c2: number
): Array<[number, number]> | null {
  if (r1 === c1 && r2 === c2) {
    const min = Math.min(r1, r2);
    const max = Math.max(r1, r2);
    const cells: Array<[number, number]> = [];
    for (let i = min; i <= max; i++) cells.push([i, i]);
    return cells;
  }
  if (c1 > r1 && c2 > r2 && r1 === r2) {
    const min = Math.min(c1, c2);
    const max = Math.max(c1, c2);
    const cells: Array<[number, number]> = [];
    for (let j = min; j <= max; j++) cells.push([r1, j]);
    return cells;
  }
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
  onMixEdit,
}) => {
  const [rangeStart, setRangeStart] = useState<{ row: number; col: number } | null>(null);

  const textSize = compact ? 'text-[6px] sm:text-[8px]' : 'text-[7px] sm:text-[10px]';

  const handleCellClick = (hand: string, row: number, col: number) => {
    if (editable && rangeState && onRangeChange) {
      // Mix edit mode: paintMode === 'mix'
      if (paintMode === 'mix' && onMixEdit) {
        onMixEdit(hand);
        return;
      }
      if (paintMode && paintMode !== 'mix') {
        const parsed = parseCellAction(rangeState[hand]);
        const isSingle = parsed.length === 1;
        const singleAction = isSingle ? parsed[0].action : null;

        let next: string;
        if (singleAction === 'fold') {
          next = paintMode;
        } else if (singleAction === paintMode) {
          next = 'fold';
        } else {
          // Just set to paint action (for quick paint, use mix editor for weighted)
          next = paintMode;
        }
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
    if (!editable || !paintMode || paintMode === 'mix' || !rangeState || !onRangeChange) return;

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

  React.useEffect(() => {
    setRangeStart(null);
  }, [paintMode]);

  return (
    <div className="grid w-full grid-cols-13 gap-[1px] bg-border/30 rounded-lg overflow-hidden">
      {RANKS.map((_, rowIdx) =>
        RANKS.map((_, colIdx) => {
          const hand = getHandLabel(rowIdx, colIdx);
          const rawAction = editable
            ? (rangeState?.[hand] || 'fold')
            : getDefaultAction(rowIdx, colIdx);
          const actions = parseCellAction(rawAction);
          const isMixed = actions.length > 1;
          const cellStyle = getCellStyle(actions);
          const singleColor = !isMixed ? (TIER_COLORS[actions[0]?.action] || TIER_COLORS.fold) : 'text-white';
          const isRangeStart = rangeStart?.row === rowIdx && rangeStart?.col === colIdx;

          return (
            <button
              key={`${rowIdx}-${colIdx}`}
              className={cn(
                'aspect-square w-full flex items-center justify-center font-mono font-semibold transition-all',
                textSize,
                'hover:brightness-125 hover:scale-105 active:scale-95',
                singleColor,
                isRangeStart && 'ring-2 ring-white ring-offset-1 ring-offset-background z-10'
              )}
              style={{
                ...(cellStyle || {}),
                ...(isMixed ? { textShadow: '0 1px 2px rgba(0,0,0,0.7)' } : {}),
              }}
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
