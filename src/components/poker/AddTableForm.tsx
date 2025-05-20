
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TableData } from '@/types/poker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface AddTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTable: (tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  fixedFormat?: 'Cash' | 'Tournament';
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

const AddTableForm: React.FC<AddTableFormProps> = ({ open, onOpenChange, onAddTable, fixedFormat }) => {
  const [format, setFormat] = useState<'Cash' | 'Tournament'>(fixedFormat || 'Cash');
  const [gameType, setGameType] = useState<'NLH' | 'PLO'>('NLH');
  const [location, setLocation] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [smallBlindIndex, setSmallBlindIndex] = useState(2); // Default to $1
  const [bigBlindIndex, setBigBlindIndex] = useState(2); // Default to $2
  const [smallBlind, setSmallBlind] = useState(BLIND_PRESETS.smallBlind[smallBlindIndex]);
  const [bigBlind, setBigBlind] = useState(BLIND_PRESETS.bigBlind[bigBlindIndex]); 
  const [startingBB, setStartingBB] = useState('');
  const [tournamentType, setTournamentType] = useState<string>('');
  const [isMultiDay, setIsMultiDay] = useState(false);

  useEffect(() => {
    if (fixedFormat) {
      setFormat(fixedFormat);
    }
  }, [fixedFormat]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !buyIn || (format === 'Cash' && (smallBlind === undefined || bigBlind === undefined))) {
      return;
    }
    
    const tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'> = {
      format,
      gameType,
      location,
      buyIn: parseFloat(buyIn),
      initialBuyIn: parseFloat(buyIn),
      ...(format === 'Cash' && {
        smallBlind: smallBlind,
        bigBlind: bigBlind,
      }),
      ...(format === 'Tournament' && {
        startingBB: startingBB ? parseInt(startingBB) : undefined,
        tournamentTypes: tournamentType ? [tournamentType] : undefined,
        isMultiDay: format === 'Tournament' ? isMultiDay : undefined,
      }),
      rebuys: 0,
      addOns: 0,
    };
    
    onAddTable(tableData);
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    setFormat(fixedFormat || 'Cash');
    setGameType('NLH');
    setLocation('');
    setBuyIn('');
    setSmallBlindIndex(2);
    setBigBlindIndex(2);
    setSmallBlind(BLIND_PRESETS.smallBlind[2]);
    setBigBlind(BLIND_PRESETS.bigBlind[2]);
    setStartingBB('');
    setTournamentType('');
    setIsMultiDay(false);
  };
  
  const handleSmallBlindChange = (value: number[]) => {
    const index = value[0];
    setSmallBlindIndex(index);
    const newSmallBlind = BLIND_PRESETS.smallBlind[index];
    setSmallBlind(newSmallBlind);
    
    // Ensure big blind is always greater than or equal to small blind
    if (bigBlind < newSmallBlind) {
      const newBigBlindIndex = BLIND_PRESETS.bigBlind.findIndex(bb => bb >= newSmallBlind);
      if (newBigBlindIndex !== -1) {
        setBigBlindIndex(newBigBlindIndex);
        setBigBlind(BLIND_PRESETS.bigBlind[newBigBlindIndex]);
      }
    }
  };

  const handleBigBlindChange = (value: number[]) => {
    const index = value[0];
    setBigBlindIndex(index);
    setBigBlind(BLIND_PRESETS.bigBlind[index]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>
            Enter the details for the new table you're playing at.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Casino name or online site"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          {!fixedFormat && (
            <div className="space-y-2">
              <Label>Format</Label>
              <RadioGroup 
                value={format} 
                onValueChange={(value) => setFormat(value as 'Cash' | 'Tournament')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Cash" id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Tournament" id="tournament" />
                  <Label htmlFor="tournament" className="cursor-pointer">Tournament</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {format === 'Tournament' && (
            <div className="space-y-2">
              <Label>Tournament Type</Label>
              <RadioGroup 
                value={tournamentType}
                onValueChange={setTournamentType}
                className="flex flex-wrap gap-2"
              >
                {TOURNAMENT_TYPES.map((type) => (
                  <div key={type} className="flex items-center">
                    <RadioGroupItem 
                      value={type}
                      id={`type-${type}`}
                      className="sr-only peer"
                    />
                    <Label
                      htmlFor={`type-${type}`}
                      className={`cursor-pointer px-3 py-1 rounded-full text-sm ${
                        tournamentType === type
                          ? 'bg-poker-gold text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label>Game Type</Label>
            <RadioGroup 
              value={gameType} 
              onValueChange={(value) => setGameType(value as 'NLH' | 'PLO')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NLH" id="nlh" />
                <Label htmlFor="nlh" className="cursor-pointer">NLH</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PLO" id="plo" />
                <Label htmlFor="plo" className="cursor-pointer">PLO</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyIn">Buy-in Amount ($)</Label>
            <Input
              id="buyIn"
              type="number"
              min="0"
              step="0.01"
              placeholder="100.00"
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              required
            />
          </div>

          {format === 'Tournament' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startingBB">Starting BB Amount</Label>
                <Input
                  id="startingBB"
                  type="number"
                  min="0"
                  placeholder="Enter starting big blinds"
                  value={startingBB}
                  onChange={(e) => setStartingBB(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2 py-2">
                <Switch
                  id="multiDay"
                  checked={isMultiDay}
                  onCheckedChange={setIsMultiDay}
                />
                <Label htmlFor="multiDay" className="cursor-pointer">
                  Is this a Multi-Day Tournament?
                </Label>
              </div>
            </>
          )}

          {format === 'Cash' && (
            <div className="space-y-4">
              <div className="flex justify-between mb-1">
                <Label className="text-base font-medium">Blinds</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Small Blind</Label>
                    <span className="text-sm font-medium">${smallBlind}</span>
                  </div>
                  <Slider
                    defaultValue={[smallBlindIndex]}
                    max={BLIND_PRESETS.smallBlind.length - 1}
                    step={1}
                    onValueChange={handleSmallBlindChange}
                    className="py-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Big Blind</Label>
                    <span className="text-sm font-medium">${bigBlind}</span>
                  </div>
                  <Slider
                    defaultValue={[bigBlindIndex]}
                    max={BLIND_PRESETS.bigBlind.length - 1}
                    step={1}
                    onValueChange={handleBigBlindChange}
                    className="py-2"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
            >
              Add Table
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTableForm;
