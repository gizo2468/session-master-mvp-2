import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TableData } from '@/types/poker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

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
  const [smallBlind, setSmallBlind] = useState(BLIND_PRESETS.smallBlind[smallBlindIndex]);
  const [bigBlind, setBigBlind] = useState(BLIND_PRESETS.smallBlind[smallBlindIndex] * 2); // Always 2x small blind for cash
  const [startingBB, setStartingBB] = useState('');
  const [tournamentType, setTournamentType] = useState<string>('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (fixedFormat) {
      setFormat(fixedFormat);
    }
  }, [fixedFormat]);

  // Update big blind whenever small blind changes for cash games
  useEffect(() => {
    if (format === 'Cash') {
      setBigBlind(smallBlind * 2);
    }
  }, [smallBlind, format]);
  
  const validateForm = (): boolean => {
    // Clear previous validation error
    setValidationError(null);
    
    if (!location) {
      setValidationError('Please enter a location');
      return false;
    }
    
    if (!buyIn) {
      setValidationError('Please enter a buy-in amount');
      return false;
    }
    
    if (format === 'Tournament' && !tournamentType) {
      setValidationError('Please select a Tournament Type before continuing');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(validationError || 'Please correct the errors before continuing');
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
    setSmallBlind(BLIND_PRESETS.smallBlind[2]);
    setBigBlind(BLIND_PRESETS.smallBlind[2] * 2); // Reset to 2x small blind
    setStartingBB('');
    setTournamentType('');
    setIsMultiDay(false);
    setValidationError(null);
  };
  
  const handleSmallBlindChange = (value: number[]) => {
    const index = value[0];
    setSmallBlindIndex(index);
    const newSmallBlind = BLIND_PRESETS.smallBlind[index];
    setSmallBlind(newSmallBlind);
    // Big blind will be automatically updated by useEffect
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
              <Label className={`${format === 'Tournament' ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`}>Tournament Type</Label>
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
                      required={format === 'Tournament'}
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
              {format === 'Tournament' && validationError && validationError.includes('Tournament Type') && (
                <p className="text-sm font-medium text-destructive">{validationError}</p>
              )}
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
              
              <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                <Checkbox
                  id="multiDay"
                  checked={isMultiDay}
                  onCheckedChange={(checked) => setIsMultiDay(checked === true)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="multiDay" className="cursor-pointer">
                    Multi-Day Tournament
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Check this for tournaments that span multiple days
                  </p>
                </div>
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
                  <div className="py-2 px-3 bg-gray-100 rounded-md border">
                    <div className="text-sm text-gray-600 text-center">
                      Auto-set to 2× Small Blind
                    </div>
                  </div>
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
