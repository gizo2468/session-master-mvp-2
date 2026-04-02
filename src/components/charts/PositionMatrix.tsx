import React from 'react';
import { POSITIONS, type ChartSolution } from '@/hooks/useChartsLibrary';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Lucide';

interface PositionMatrixProps {
  solutions: ChartSolution[];
  onSpotClick: (solution: ChartSolution) => void;
  stackDepth: number;
  isUserOwned?: boolean;
  onCreateSpot?: (heroPos: string, scenario: { actionType: string; villain: string | null }) => void;
}

const SCENARIOS = [
  { label: 'RFI', actionType: 'RFI', villain: null },
  { label: 'vs UTG', actionType: 'DEFEND', villain: 'UTG' },
  { label: 'vs MP', actionType: 'DEFEND', villain: 'MP' },
  { label: 'vs LJ', actionType: 'DEFEND', villain: 'LJ' },
  { label: 'vs HJ', actionType: 'DEFEND', villain: 'HJ' },
  { label: 'vs CO', actionType: 'DEFEND', villain: 'CO' },
  { label: 'vs BU', actionType: 'DEFEND', villain: 'BU' },
  { label: 'vs SB', actionType: 'DEFEND', villain: 'SB' },
  { label: '3Bet vs UTG', actionType: '3BET', villain: 'UTG' },
  { label: '3Bet vs CO', actionType: '3BET', villain: 'CO' },
  { label: '3Bet vs BU', actionType: '3BET', villain: 'BU' },
];

function findSolution(
  solutions: ChartSolution[],
  heroPos: string,
  scenario: typeof SCENARIOS[number]
): ChartSolution | null {
  return solutions.find(s => {
    if (s.hero_position !== heroPos) return false;
    if (scenario.actionType === 'RFI') return s.action_type === 'RFI';
    return s.action_type === scenario.actionType && s.villain_position === scenario.villain;
  }) || null;
}

function isValidSpot(heroPos: string, scenario: typeof SCENARIOS[number]): boolean {
  if (scenario.actionType === 'RFI') return true;
  if (!scenario.villain) return false;

  const heroIdx = POSITIONS.indexOf(heroPos as any);
  const villainIdx = POSITIONS.indexOf(scenario.villain as any);

  if (heroPos === 'BB' || heroPos === 'SB') return villainIdx < heroIdx;
  return heroIdx > villainIdx;
}

const PositionMatrix: React.FC<PositionMatrixProps> = ({ solutions, onSpotClick, stackDepth, isUserOwned, onCreateSpot }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header row */}
        <div className="grid grid-cols-[100px_repeat(8,1fr)] gap-1 mb-1">
          <div className="flex items-center justify-center text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            {stackDepth}bb
          </div>
          {POSITIONS.map(pos => (
            <div
              key={pos}
              className="flex items-center justify-center py-2 rounded-md bg-primary/20 text-primary font-bold text-sm"
            >
              {pos}
            </div>
          ))}
        </div>

        {/* Scenario rows */}
        {SCENARIOS.map(scenario => (
          <div key={scenario.label} className="grid grid-cols-[100px_repeat(8,1fr)] gap-1 mb-1">
            <div className="flex items-center text-[11px] font-medium text-muted-foreground px-1 truncate">
              {scenario.label}
            </div>

            {POSITIONS.map(pos => {
              const valid = isValidSpot(pos, scenario);
              const solution = valid ? findSolution(solutions, pos, scenario) : null;

              if (!valid) {
                return (
                  <div
                    key={pos}
                    className="flex items-center justify-center h-11 rounded-md bg-muted/20"
                  >
                    <span className="text-[10px] text-muted-foreground/30">—</span>
                  </div>
                );
              }

              const freq = solution?.range_data?.frequency;

              return (
                <button
                  key={pos}
                  onClick={() => {
                    if (solution) {
                      onSpotClick(solution);
                    } else if (isUserOwned && onCreateSpot) {
                      onCreateSpot(pos, { actionType: scenario.actionType, villain: scenario.villain });
                    }
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center h-11 rounded-md transition-all text-[10px] font-medium',
                    'active:scale-95',
                    solution
                      ? scenario.actionType === 'RFI'
                        ? 'bg-primary/25 text-primary hover:bg-primary/35 border border-primary/20'
                        : scenario.actionType === '3BET'
                          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'
                      : isUserOwned
                        ? 'bg-muted/40 text-muted-foreground/50 border border-dashed border-muted-foreground/20 hover:border-primary/40 hover:text-primary/60'
                        : 'bg-muted/40 text-muted-foreground/50 border border-transparent'
                  )}
                  disabled={!solution && !isUserOwned}
                >
                  {solution ? (
                    <span className="font-bold text-xs leading-none">{freq ? `${freq}%` : '—'}</span>
                  ) : (
                    <Icon name="Plus" className="h-4 w-4 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PositionMatrix;
