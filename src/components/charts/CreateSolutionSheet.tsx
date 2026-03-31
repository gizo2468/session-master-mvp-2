import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HandRangeGrid from '@/components/charts/HandRangeGrid';
import { useCreateSolution, POSITIONS, ACTION_TYPES } from '@/hooks/useChartsLibrary';
import { toast } from 'sonner';

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
  const createSolution = useCreateSolution();

  // Reset when sheet opens with new prefills
  React.useEffect(() => {
    if (open) {
      setHeroPosition(prefillHero || 'BU');
      setVillainPosition(prefillVillain || 'UTG');
      setActionType(prefillActionType || 'RFI');
      setRangeData({});
    }
  }, [open, prefillHero, prefillVillain, prefillActionType]);

  const spotLabel = useMemo(
    () => generateSpotLabel(heroPosition, actionType, actionType === 'RFI' ? null : villainPosition),
    [heroPosition, actionType, villainPosition]
  );

  const handleSave = async () => {
    const hasRange = Object.values(rangeData).some(v => v === 'raise' || v === 'call');
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

  return (
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

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Tap cells to cycle:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-500/80 inline-block" /> Raise
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/70 inline-block" /> Call
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-900/40 inline-block" /> Fold
            </span>
          </div>

          {/* Editable grid */}
          <div className="flex justify-center">
            <HandRangeGrid
              editable
              rangeState={rangeData}
              onRangeChange={setRangeData}
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
  );
};

export default CreateSolutionSheet;
