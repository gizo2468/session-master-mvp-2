
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CurrencySelector } from '@/components/ui/CurrencySelector';
import { TableData } from '@/types/poker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrencySymbol, useDefaultCurrency } from '@/hooks/useDefaultCurrency';

interface AddTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTable: (tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  fixedFormat?: 'Cash' | 'Tournament';
  sessionFormat?: 'Cash' | 'Tournament';
  isCompletedSession?: boolean;
  sessionCurrency?: string;
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

const AddTableForm: React.FC<AddTableFormProps> = ({ 
  open, 
  onOpenChange, 
  onAddTable, 
  fixedFormat,
  sessionFormat,
  isCompletedSession = false,
  sessionCurrency = 'USD'
}) => {
  const { defaultCurrency } = useDefaultCurrency();
  const [format, setFormat] = useState<'Cash' | 'Tournament'>(
    fixedFormat || sessionFormat || 'Cash'
  );
  const [gameType, setGameType] = useState<'NLH' | 'PLO'>('NLH');
  const [tableName, setTableName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [payout, setPayout] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');
  const [smallBlindIndex, setSmallBlindIndex] = useState(2);
  const [smallBlind, setSmallBlind] = useState(BLIND_PRESETS.smallBlind[smallBlindIndex]);
  const [bigBlind, setBigBlind] = useState(BLIND_PRESETS.smallBlind[smallBlindIndex] * 2);
  const [startingBB, setStartingBB] = useState('');
  const [tournamentType, setTournamentType] = useState<string>('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [lateRegistration, setLateRegistration] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isTournamentTypeOpen, setIsTournamentTypeOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!fixedFormat && sessionFormat) {
      setFormat(sessionFormat);
    }
  }, [fixedFormat, sessionFormat]);

  useEffect(() => {
    if (defaultCurrency) {
      setCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);

  useEffect(() => {
    if (fixedFormat) {
      setFormat(fixedFormat);
    }
  }, [fixedFormat]);

  useEffect(() => {
    if (format === 'Cash') {
      setBigBlind(smallBlind * 2);
    }
  }, [smallBlind, format]);
  
  const validateForm = (): boolean => {
    setValidationError(null);
    
    if (!buyIn) {
      setValidationError('Please enter a buy-in amount');
      return false;
    }
    
    if (isCompletedSession && !payout) {
      setValidationError('Please enter a payout amount');
      return false;
    }
    
    // Tournament Type is optional - no validation required
    
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
      name: tableName || `${format} Game`,
      location: tableName || `${format} Game`,
      buyIn: parseFloat(buyIn),
      initialBuyIn: parseFloat(buyIn),
      currency,
      ...(isCompletedSession && payout && {
        endTime: new Date(),
        cashOut: parseFloat(payout),
      }),
      ...(format === 'Cash' && {
        smallBlind: smallBlind,
        bigBlind: bigBlind,
      }),
      ...(format === 'Tournament' && {
        startingBB: startingBB ? parseInt(startingBB) : undefined,
        tournamentTypes: tournamentType ? [tournamentType] : undefined,
        isMultiDay: format === 'Tournament' ? isMultiDay : undefined,
        lateRegistration: format === 'Tournament' ? lateRegistration : undefined,
      }),
      rebuys: 0,
      addOns: 0,
    };
    
    onAddTable(tableData);
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    setFormat(fixedFormat || sessionFormat || 'Cash');
    setGameType('NLH');
    setTableName('');
    setBuyIn('');
    setPayout('');
    setCurrency(defaultCurrency || 'USD');
    setSmallBlindIndex(2);
    setSmallBlind(BLIND_PRESETS.smallBlind[2]);
    setBigBlind(BLIND_PRESETS.smallBlind[2] * 2);
    setStartingBB('');
    setTournamentType('');
    setIsMultiDay(false);
    setLateRegistration(false);
    setValidationError(null);
    setIsTournamentTypeOpen(false);
    setIsAdvancedOpen(false);
  };
  
  const handleSmallBlindChange = (value: number[]) => {
    const index = value[0];
    setSmallBlindIndex(index);
    const newSmallBlind = BLIND_PRESETS.smallBlind[index];
    setSmallBlind(newSmallBlind);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Enter the details for the new table you're playing at.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Table Name */}
            <div className="space-y-2">
              <Label htmlFor="tableName">Table Name (Optional)</Label>
              <Input
                id="tableName"
                placeholder="Table identifier"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                autoComplete="off"
                data-form-type="other"
              />
            </div>

            {/* Game Type - Moved up after Table Name */}
            <div className="space-y-2">
              <Label>Game Type <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {(['NLH', 'PLO'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGameType(type)}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                      gameType === type
                        ? 'bg-poker-gold text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            {!fixedFormat && (
              <div className="space-y-2">
                <Label>Format <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {(['Cash', 'Tournament'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                        format === f
                          ? 'bg-poker-gold text-white'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tournament Type - Collapsible */}
            {format === 'Tournament' && (
              <Collapsible open={isTournamentTypeOpen} onOpenChange={setIsTournamentTypeOpen}>
                <CollapsibleTrigger className="flex items-center justify-center gap-2 w-full py-2">
                  <span className="text-base font-medium text-poker-gold">
                    Tournament Type{tournamentType ? ` - ${tournamentType}` : ''}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-poker-gold transition-transform duration-200 ${isTournamentTypeOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <RadioGroup 
                    value={tournamentType}
                    onValueChange={(value) => {
                      setTournamentType(value);
                    }}
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
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
              <CurrencySelector
                value={currency}
                onValueChange={setCurrency}
                placeholder="Select currency"
              />
            </div>

            {/* Buy-in */}
            <div className="space-y-2">
              <Label htmlFor="buyIn">Buy-in Amount ({getCurrencySymbol(currency)}) <span className="text-red-500">*</span></Label>
              <Input
                id="buyIn"
                type="number"
                min="0"
                step="0.01"
                placeholder="100.00"
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            {/* Payout for completed sessions */}
            {isCompletedSession && (
              <div className="space-y-2">
                <Label htmlFor="payout">Payout / Cash-out Amount ({getCurrencySymbol(currency)})</Label>
                <Input
                  id="payout"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            )}

            {/* Tournament Starting BB */}
            {format === 'Tournament' && (
              <div className="space-y-2">
                <Label htmlFor="startingBB">Starting BB Amount</Label>
                <Input
                  id="startingBB"
                  type="number"
                  min="0"
                  placeholder="Enter starting big blinds"
                  value={startingBB}
                  onChange={(e) => setStartingBB(e.target.value)}
                  autoComplete="off"
                />
              </div>
            )}

            {/* Cash Game Blinds */}
            {format === 'Cash' && (
              <div className="space-y-4">
                <div className="flex justify-between mb-1">
                  <Label className="text-base font-medium">Blinds</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Small Blind</Label>
                      <span className="text-sm font-medium">{getCurrencySymbol(currency)}{smallBlind}</span>
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
                      <span className="text-sm font-medium">{getCurrencySymbol(currency)}{bigBlind}</span>
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

            {/* Advanced Options - Collapsible */}
            {format === 'Tournament' && (
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger className="flex items-center justify-center gap-2 w-full py-3">
                  <span className="text-base font-medium text-poker-gold">Advanced Options</span>
                  <ChevronDown className={`h-4 w-4 text-poker-gold transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  {/* Multi-Day Tournament */}
                  <div className="flex items-center space-x-3 rounded-md border p-3">
                    <Checkbox
                      id="multiDay"
                      checked={isMultiDay}
                      onCheckedChange={(checked) => setIsMultiDay(checked === true)}
                    />
                    <div className="space-y-0.5 leading-none">
                      <Label htmlFor="multiDay" className="cursor-pointer text-sm">
                        Multi-Day Tournament
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        For tournaments spanning multiple days
                      </p>
                    </div>
                  </div>

                  {/* Late Registration */}
                  <div className="flex items-center space-x-3 rounded-md border p-3">
                    <Checkbox
                      id="lateReg"
                      checked={lateRegistration}
                      onCheckedChange={(checked) => setLateRegistration(checked === true)}
                    />
                    <div className="space-y-0.5 leading-none">
                      <Label htmlFor="lateReg" className="cursor-pointer text-sm">
                        Late Registration
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Registered after the tournament started
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Action Buttons */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTableForm;
