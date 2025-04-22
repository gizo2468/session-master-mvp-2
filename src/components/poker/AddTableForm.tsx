import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TableData } from '@/types/poker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AddTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTable: (tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  fixedFormat?: 'Cash' | 'Tournament';
}

const AddTableForm: React.FC<AddTableFormProps> = ({ open, onOpenChange, onAddTable, fixedFormat }) => {
  const [format, setFormat] = useState<'Cash' | 'Tournament'>(fixedFormat || 'Cash');
  const [gameType, setGameType] = useState<'NLH' | 'PLO'>('NLH');
  const [location, setLocation] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [smallBlind, setSmallBlind] = useState('');
  const [bigBlind, setBigBlind] = useState('');
  const [startingBB, setStartingBB] = useState('');

  useEffect(() => {
    if (fixedFormat) {
      setFormat(fixedFormat);
    }
  }, [fixedFormat]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !buyIn || (format === 'Cash' && (!smallBlind || !bigBlind))) {
      return;
    }
    
    const tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'> = {
      name: location,
      format,
      gameType,
      location,
      buyIn: parseFloat(buyIn),
      initialBuyIn: parseFloat(buyIn),
      smallBlind: format === 'Cash' ? parseFloat(smallBlind) : 0,
      bigBlind: format === 'Cash' ? parseFloat(bigBlind) : 0,
      startingBB: format === 'Tournament' && startingBB ? parseInt(startingBB, 10) : undefined,
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
    setSmallBlind('');
    setBigBlind('');
    setStartingBB('');
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

          <div className="space-y-2">
            <Label>Format</Label>
            {fixedFormat ? (
              <div className="flex items-center h-10 rounded border px-3 bg-gray-100 text-gray-700 font-semibold">
                {fixedFormat}
              </div>
            ) : (
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
            )}
          </div>

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
            <div className="space-y-2">
              <Label htmlFor="startingBB">Starting BB Amount</Label>
              <Input
                id="startingBB"
                type="number"
                min="0"
                placeholder="Starting big blinds amount"
                value={startingBB}
                onChange={(e) => setStartingBB(e.target.value)}
              />
            </div>
          )}

          {format === 'Cash' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smallBlind">Small Blind</Label>
                <Input
                  id="smallBlind"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bigBlind">Big Blind</Label>
                <Input
                  id="bigBlind"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="2"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(e.target.value)}
                  required
                />
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
