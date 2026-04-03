import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export type CellAction = { action: string; weight: number };

const ACTION_DISPLAY: Record<string, { label: string; color: string }> = {
  raise: { label: 'Raise', color: 'rgba(239,68,68,0.85)' },
  call: { label: 'Call', color: 'rgba(16,185,129,0.75)' },
  fold: { label: 'Fold', color: 'rgba(30,58,138,0.5)' },
  '3bet': { label: '3Bet', color: 'rgba(168,85,247,0.8)' },
};

interface CellMixEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hand: string;
  currentMix: CellAction[];
  availableActions: string[];
  onSave: (mix: CellAction[]) => void;
}

const STEP = 5;

const PRESETS_2 = [
  { label: '50/50', weights: [50, 50] },
  { label: '70/30', weights: [70, 30] },
  { label: '25/75', weights: [25, 75] },
];

const PRESETS_3 = [
  { label: '33/33/34', weights: [33, 33, 34] },
  { label: '50/25/25', weights: [50, 25, 25] },
  { label: '40/40/20', weights: [40, 40, 20] },
];

const CellMixEditor: React.FC<CellMixEditorProps> = ({
  open,
  onOpenChange,
  hand,
  currentMix,
  availableActions,
  onSave,
}) => {
  const [weights, setWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      const w: Record<string, number> = {};
      for (const a of availableActions) {
        const found = currentMix.find(m => m.action === a);
        w[a] = found ? found.weight : 0;
      }
      // If all zero, default fold to 100
      const total = Object.values(w).reduce((s, v) => s + v, 0);
      if (total === 0) {
        w['fold'] = 100;
      }
      setWeights(w);
    }
  }, [open, currentMix, availableActions]);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);

  const handleSliderChange = (action: string, newVal: number) => {
    const oldVal = weights[action] || 0;
    const diff = newVal - oldVal;
    const otherActions = availableActions.filter(a => a !== action);
    
    // Distribute the difference among other actions proportionally
    const otherTotal = otherActions.reduce((s, a) => s + (weights[a] || 0), 0);
    
    const newWeights = { ...weights, [action]: newVal };
    
    if (otherTotal > 0 && diff !== 0) {
      let remaining = -diff;
      for (const oa of otherActions) {
        const proportion = (weights[oa] || 0) / otherTotal;
        const adjustment = Math.round(proportion * remaining / STEP) * STEP;
        newWeights[oa] = Math.max(0, (weights[oa] || 0) + adjustment);
      }
    } else if (otherTotal === 0 && diff > 0) {
      // Can't increase if others are all 0 and we're already at max
      newWeights[action] = 100;
    }
    
    // Normalize to 100
    const newTotal = Object.values(newWeights).reduce((s, v) => s + v, 0);
    if (newTotal !== 100 && newTotal > 0) {
      // Find the largest other action and adjust it
      const sortedOthers = otherActions.sort((a, b) => (newWeights[b] || 0) - (newWeights[a] || 0));
      if (sortedOthers.length > 0) {
        newWeights[sortedOthers[0]] = Math.max(0, (newWeights[sortedOthers[0]] || 0) + (100 - newTotal));
      }
    }
    
    setWeights(newWeights);
  };

  const handleSave = () => {
    const mix: CellAction[] = availableActions
      .filter(a => (weights[a] || 0) > 0)
      .map(a => ({ action: a, weight: weights[a] }));
    
    if (mix.length === 0) {
      mix.push({ action: 'fold', weight: 100 });
    }
    onSave(mix);
    onOpenChange(false);
  };

  const handleClear = () => {
    const w: Record<string, number> = {};
    for (const a of availableActions) w[a] = 0;
    w['fold'] = 100;
    setWeights(w);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-4">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="font-mono text-lg">{hand}</span>
            <span className="text-sm text-muted-foreground ml-2">Mix Editor</span>
          </DialogTitle>
        </DialogHeader>

        {/* Preview bar */}
        <div className="h-6 rounded-md overflow-hidden flex w-full border border-border">
          {availableActions.map(a => {
            const w = weights[a] || 0;
            if (w === 0) return null;
            const info = ACTION_DISPLAY[a] || { label: a, color: 'rgba(100,100,100,0.5)' };
            return (
              <div
                key={a}
                style={{ width: `${w}%`, background: info.color }}
                className="h-full flex items-center justify-center text-[9px] font-semibold text-white transition-all"
              >
                {w >= 15 && `${w}%`}
              </div>
            );
          })}
        </div>

        {/* Sliders */}
        <div className="space-y-3 mt-2">
          {availableActions.map(a => {
            const info = ACTION_DISPLAY[a] || { label: a, color: 'rgba(100,100,100,0.5)' };
            const w = weights[a] || 0;
            return (
              <div key={a} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: info.color }} />
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{w}%</span>
                </div>
                <Slider
                  value={[w]}
                  min={0}
                  max={100}
                  step={STEP}
                  onValueChange={([v]) => handleSliderChange(a, v)}
                  className="h-5"
                />
              </div>
            );
          })}
        </div>

        {totalWeight !== 100 && (
          <p className="text-xs text-destructive text-center">
            Total: {totalWeight}% (must be 100%)
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSave}
            disabled={totalWeight !== 100}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CellMixEditor;
