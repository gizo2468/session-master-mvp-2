import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HandRangeGrid, { parseCellAction, serializeCellAction } from '@/components/charts/HandRangeGrid';
import CellMixEditor from '@/components/charts/CellMixEditor';
import type { CellAction } from '@/components/charts/CellMixEditor';
import { useCreateSolution, POSITIONS, ACTION_TYPES } from '@/hooks/useChartsLibrary';
import { toast } from 'sonner';
import Icon from '@/components/ui/Lucide';

interface CreateSolutionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  prefillHero?: string;
  prefillVillain?: string | null;
  prefillActionType?: string;
}

function generateSpotLabel(heroPos: string, actionType: string, villainPos: string | null): string {
  if (actionType === 'RFI') return `${heroPos} RFI`;
  if (actionType === '3BET') return `${heroPos} 3Bet vs ${villainPos}`;
  return `${heroPos} vs ${villainPos}`;
}

const AVAILABLE_ACTIONS = ['raise', 'call', 'fold'];

const CreateSolutionSheet: React.FC<CreateSolutionSheetProps> = ({
  open,
  onOpenChange,
  collectionId,
  prefillHero,
  prefillVillain,
  prefillActionType,
}) => {
  const [heroPosition, setHeroPosition] = useState(prefillHero || 'BU');
  const [villainPosition, setVillainPosition] = useState<string>(prefillVillain || 'UTG');
  const [actionType, setActionType] = useState(prefillActionType || 'RFI');
  const [rangeData, setRangeData] = useState<Record<string, string>>({});
  const [paintMode, setPaintMode] = useState<string | null>(null);
  const [mixEditHand, setMixEditHand] = useState<string | null>(null);
  const createSolution = useCreateSolution();

  React.useEffect(() => {
    if (open) {
      setHeroPosition(prefillHero || 'BU');
      setVillainPosition(prefillVillain || 'UTG');
      setActionType(prefillActionType || 'RFI');
      setRangeData({});
      setPaintMode(null);
      setMixEditHand(null);
    }
  }, [open, prefillHero, prefillVillain, prefillActionType]);

  const spotLabel = useMemo(
    () => generateSpotLabel(heroPosition, actionType, actionType === 'RFI' ? null : villainPosition),
    [heroPosition, actionType, villainPosition]
  );

  const handleSave = async () => {
    const hasRange = Object.values(rangeData).some(v => {
      const actions = parseCellAction(v);
      return actions.some(a => a.action !== 'fold');
    });
    if (!hasRange) {
      toast.error('Please select at least one hand to raise or call');
      return;
    }

    try {
      await createSolution.mutateAsync({
        collection_id: collectionId,
        hero_position: heroPosition,
        villain_position: actionType === 'RFI' ? null : villainPosition,
        action_type: actionType,
        spot_label: spotLabel,
        range_data: rangeData,
      });
      toast.success('Solution created');
      onOpenChange(false);
    } catch {
      toast.error('Failed to create solution');
    }
  };

  const handleMixSave = (mix: CellAction[]) => {
    if (!mixEditHand) return;
    const serialized = serializeCellAction(mix);
    setRangeData(prev => ({ ...prev, [mixEditHand]: serialized }));
    setMixEditHand(null);
  };

  const currentMixActions = mixEditHand ? parseCellAction(rangeData[mixEditHand]) : [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Solution — {spotLabel}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            {/* Position selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Action Type</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hero Position</Label>
                <Select value={heroPosition} onValueChange={setHeroPosition}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {actionType !== 'RFI' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Villain Position</Label>
                <Select value={villainPosition} onValueChange={setVillainPosition}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.filter(p => p !== heroPosition).map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Legend / Brush selector */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>Brush:</span>
              {[
                { action: 'raise', label: 'Raise', colorClass: 'bg-red-500/80' },
                { action: 'call', label: 'Call', colorClass: 'bg-emerald-500/70' },
                { action: 'fold', label: 'Fold', colorClass: 'bg-blue-900/40' },
              ].map(({ action, label, colorClass }) => (
                <button
                  key={action}
                  type="button"
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
                    paintMode === action
                      ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setPaintMode(prev => prev === action ? null : action)}
                >
                  <span className={`w-3 h-3 rounded-sm ${colorClass} inline-block`} />
                  {label}
                </button>
              ))}
              {/* Mix brush */}
              <button
                type="button"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
                  paintMode === 'mix'
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
                onClick={() => setPaintMode(prev => prev === 'mix' ? null : 'mix')}
              >
                <Icon name="Blend" className="h-3 w-3" />
                Mix
              </button>
            </div>

            {paintMode === 'mix' && (
              <p className="text-[10px] text-muted-foreground/80 -mt-2">
                Tap any cell to open the mix editor
              </p>
            )}

            {/* Editable grid */}
            <div className="flex justify-center">
              <HandRangeGrid
                editable
                rangeState={rangeData}
                onRangeChange={setRangeData}
                paintMode={paintMode}
                onMixEdit={(hand) => setMixEditHand(hand)}
                availableActions={AVAILABLE_ACTIONS}
              />
            </div>

            {/* Save */}
            <div className="flex gap-2 pt-2 pb-4">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={createSolution.isPending}>
                {createSolution.isPending ? 'Saving...' : 'Save Solution'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mix Editor Modal */}
      <CellMixEditor
        open={!!mixEditHand}
        onOpenChange={(open) => { if (!open) setMixEditHand(null); }}
        hand={mixEditHand || ''}
        currentMix={currentMixActions}
        availableActions={AVAILABLE_ACTIONS}
        onSave={handleMixSave}
      />
    </>
  );
};

export default CreateSolutionSheet;
