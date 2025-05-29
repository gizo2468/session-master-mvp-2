
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { TableData } from '@/types/poker';
import { toast } from 'sonner';

interface EditTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData;
  onUpdateTable: (updatedTable: TableData) => void;
}

const TOURNAMENT_TYPES = [
  'Freezeout',
  'Re-Buy Tournament',
  'Bounty',
  'Progressive Bounty (PKO)',
  'Mystery Bounty',
  'Turbo / Hyper',
  'Satellite'
];

const BLIND_PRESETS = {
  smallBlind: [0.25, 0.5, 1, 2, 3, 5, 10, 25, 50, 100, 200, 500],
  bigBlind: [0.5, 1, 2, 5, 10, 25, 50, 100, 200, 500, 1000]
};

const EditTableForm: React.FC<EditTableFormProps> = ({
  open,
  onOpenChange,
  table,
  onUpdateTable
}) => {
  const [formData, setFormData] = useState({
    location: '',
    gameType: 'NLH' as 'NLH' | 'PLO',
    format: 'Cash' as 'Cash' | 'Tournament',
    initialBuyIn: 0,
    rebuysCount: 0,
    rebuysAmount: 0,
    cashOut: '',
    smallBlind: 0,
    bigBlind: 0,
    startingBB: '',
    tournamentTypes: [] as string[],
    isMultiDay: false,
    bountyCount: '',
    bountyAmount: '',
    finalPosition: '',
    notes: ''
  });
  
  const [smallBlindIndex, setSmallBlindIndex] = useState(2);

  useEffect(() => {
    if (table) {
      // Calculate rebuy count for tournaments
      const initialBuyIn = table.initialBuyIn || table.buyIn;
      const rebuysValue = table.rebuys || 0;
      const rebuysCount = initialBuyIn > 0 ? Math.round(rebuysValue / initialBuyIn) : 0;
      
      // Find the closest small blind index
      const closestIndex = BLIND_PRESETS.smallBlind.findIndex(
        blind => blind >= (table.smallBlind || 0)
      );
      const blindIndex = closestIndex >= 0 ? closestIndex : 2;
      
      setFormData({
        location: table.location || '',
        gameType: table.gameType || 'NLH',
        format: table.format || 'Cash',
        initialBuyIn: initialBuyIn,
        rebuysCount: rebuysCount,
        rebuysAmount: table.format === 'Cash' ? rebuysValue : 0,
        cashOut: table.cashOut?.toString() || '',
        smallBlind: table.smallBlind || 0,
        bigBlind: table.bigBlind || 0,
        startingBB: table.startingBB?.toString() || '',
        tournamentTypes: table.tournamentTypes || [],
        isMultiDay: table.isMultiDay || false,
        bountyCount: table.bountyCount?.toString() || '',
        bountyAmount: table.bountyAmount?.toString() || '',
        finalPosition: table.finalPosition?.toString() || '',
        notes: table.notes || ''
      });
      setSmallBlindIndex(blindIndex);
    }
  }, [table]);

  const handleSmallBlindChange = (value: number[]) => {
    const index = value[0];
    setSmallBlindIndex(index);
    const newSmallBlind = BLIND_PRESETS.smallBlind[index];
    setFormData(prev => ({
      ...prev,
      smallBlind: newSmallBlind,
      bigBlind: newSmallBlind * 2
    }));
  };

  const handleTournamentTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      tournamentTypes: prev.tournamentTypes.includes(type)
        ? prev.tournamentTypes.filter(t => t !== type)
        : [...prev.tournamentTypes, type]
    }));
  };

  const calculateTotalInvestment = () => {
    if (formData.format === 'Tournament') {
      return formData.initialBuyIn + (formData.rebuysCount * formData.initialBuyIn);
    }
    return formData.initialBuyIn + formData.rebuysAmount;
  };

  const calculateRebuysValue = () => {
    if (formData.format === 'Tournament') {
      return formData.rebuysCount * formData.initialBuyIn;
    }
    return formData.rebuysAmount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location || !formData.initialBuyIn) {
      toast.error('Please fill in all required fields');
      return;
    }

    const totalBuyIn = calculateTotalInvestment();
    const rebuysValue = calculateRebuysValue();

    const updatedTable: TableData = {
      ...table,
      location: formData.location,
      gameType: formData.gameType,
      format: formData.format,
      buyIn: totalBuyIn,
      initialBuyIn: formData.initialBuyIn,
      rebuys: rebuysValue,
      cashOut: formData.cashOut ? parseFloat(formData.cashOut) : undefined,
      notes: formData.notes,
      ...(formData.format === 'Cash' && {
        smallBlind: formData.smallBlind,
        bigBlind: formData.bigBlind,
      }),
      ...(formData.format === 'Tournament' && {
        startingBB: formData.startingBB ? parseInt(formData.startingBB) : undefined,
        tournamentTypes: formData.tournamentTypes.length > 0 ? formData.tournamentTypes : undefined,
        isMultiDay: formData.isMultiDay,
        bountyCount: formData.bountyCount ? parseInt(formData.bountyCount) : undefined,
        bountyAmount: formData.bountyAmount ? parseFloat(formData.bountyAmount) : undefined,
        finalPosition: formData.finalPosition ? parseInt(formData.finalPosition) : undefined,
      }),
    };

    onUpdateTable(updatedTable);
    onOpenChange(false);
    toast.success('Table updated successfully');
  };

  const isBountyTournament = formData.tournamentTypes.some(type => 
    ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Game Type</Label>
            <RadioGroup 
              value={formData.gameType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, gameType: value as 'NLH' | 'PLO' }))}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NLH" id="nlh" />
                <Label htmlFor="nlh">NLH</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PLO" id="plo" />
                <Label htmlFor="plo">PLO</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Buy-in and Rebuys Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initialBuyIn">Buy-in ($) *</Label>
              <Input
                id="initialBuyIn"
                type="number"
                min="0"
                step="0.01"
                value={formData.initialBuyIn}
                onChange={(e) => setFormData(prev => ({ ...prev, initialBuyIn: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            {formData.format === 'Tournament' ? (
              <div className="space-y-2">
                <Label htmlFor="rebuysCount">Rebuys (Count)</Label>
                <Input
                  id="rebuysCount"
                  type="number"
                  min="0"
                  value={formData.rebuysCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, rebuysCount: parseInt(e.target.value) || 0 }))}
                />
                {formData.rebuysCount > 0 && (
                  <div className="text-sm text-gray-600">
                    Rebuys Value: ${(formData.rebuysCount * formData.initialBuyIn).toFixed(2)}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="rebuysAmount">Rebuys ($)</Label>
                <Input
                  id="rebuysAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.rebuysAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, rebuysAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            )}

            {/* Total Investment Display */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium">Total Invested: ${calculateTotalInvestment().toFixed(2)}</div>
              {formData.format === 'Tournament' && (
                <div className="text-xs text-gray-600">
                  ${formData.initialBuyIn.toFixed(2)} + ({formData.rebuysCount} × ${formData.initialBuyIn.toFixed(2)})
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashOut">Cash Out ($)</Label>
              <Input
                id="cashOut"
                type="number"
                min="0"
                step="0.01"
                value={formData.cashOut}
                onChange={(e) => setFormData(prev => ({ ...prev, cashOut: e.target.value }))}
              />
            </div>
          </div>

          {formData.format === 'Cash' && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Blinds</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Small Blind</Label>
                    <span className="text-sm font-medium">${formData.smallBlind}</span>
                  </div>
                  <Slider
                    value={[smallBlindIndex]}
                    max={BLIND_PRESETS.smallBlind.length - 1}
                    step={1}
                    onValueChange={handleSmallBlindChange}
                    className="py-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Big Blind</Label>
                    <span className="text-sm font-medium">${formData.bigBlind}</span>
                  </div>
                  <div className="py-2 px-3 bg-gray-100 rounded-md border">
                    <div className="text-sm text-gray-600 text-center">
                      Auto-set to 2× Small Blind
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.format === 'Tournament' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startingBB">Starting BB Amount</Label>
                <Input
                  id="startingBB"
                  type="number"
                  min="0"
                  value={formData.startingBB}
                  onChange={(e) => setFormData(prev => ({ ...prev, startingBB: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tournament Types</Label>
                <div className="flex flex-wrap gap-2">
                  {TOURNAMENT_TYPES.map((type) => (
                    <div key={type} className="flex items-center">
                      <Label
                        className={`cursor-pointer px-3 py-1 rounded-full text-sm ${
                          formData.tournamentTypes.includes(type)
                            ? 'bg-poker-gold text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => handleTournamentTypeChange(type)}
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                <Checkbox
                  id="multiDay"
                  checked={formData.isMultiDay}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isMultiDay: checked === true }))}
                />
                <Label htmlFor="multiDay" className="cursor-pointer">
                  Multi-Day Tournament
                </Label>
              </div>

              {isBountyTournament && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bountyCount">Players Eliminated</Label>
                    <Input
                      id="bountyCount"
                      type="number"
                      min="0"
                      value={formData.bountyCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, bountyCount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bountyAmount">Bounty Payout ($)</Label>
                    <Input
                      id="bountyAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bountyAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, bountyAmount: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="finalPosition">Final Position</Label>
                <Input
                  id="finalPosition"
                  type="number"
                  min="1"
                  value={formData.finalPosition}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalPosition: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this table..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-poker-gold hover:bg-poker-darkGold text-white">
              Update Table
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTableForm;
