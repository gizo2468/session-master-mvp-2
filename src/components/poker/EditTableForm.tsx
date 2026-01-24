

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableData } from '@/types/poker';
import { Badge } from '@/components/ui/badge';
import { X, Clock, Pencil } from 'lucide-react';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { addSeconds } from 'date-fns';

interface EditTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData;
  onSave: (updatedTable: TableData) => void;
  onDelete?: (tableId: string) => void;
  sessionCurrency?: string;
}

const EditTableForm: React.FC<EditTableFormProps> = ({
  open,
  onOpenChange,
  table,
  onSave,
  onDelete,
  sessionCurrency = 'USD'
}) => {
  const [formData, setFormData] = useState<TableData>(table);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingBuyIn, setEditingBuyIn] = useState<string>('');
  
  // Duration editing state
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(0);

  // Calculate initial duration from table data
  const calculateInitialDuration = () => {
    // Priority 1: Use tableDuration if set
    if (table.tableDuration && table.tableDuration > 0) {
      return table.tableDuration;
    }
    // Priority 2: Calculate from start/end times
    if (table.startTime && table.endTime) {
      const start = new Date(table.startTime).getTime();
      const end = new Date(table.endTime).getTime();
      return Math.floor((end - start) / 1000);
    }
    return 0;
  };

  useEffect(() => {
    setFormData(table);
    const initialBuyIn = table.initialBuyIn || table.buyIn;
    setEditingBuyIn(initialBuyIn.toString());
    
    // Initialize duration
    const duration = calculateInitialDuration();
    setDisplayDuration(duration);
    setDurationHours(Math.floor(duration / 3600));
    setDurationMinutes(Math.floor((duration % 3600) / 60));
  }, [table]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDurationSave = () => {
    const totalSeconds = (durationHours * 3600) + (durationMinutes * 60);
    setDisplayDuration(totalSeconds);
    setShowDurationModal(false);
  };

  const handleSave = () => {
    // Calculate rebuy amount to preserve existing rebuys
    const originalInitialBuyIn = table.initialBuyIn || table.buyIn;
    const rebuyAmount = table.buyIn - originalInitialBuyIn;
    const newInitialBuyIn = parseFloat(editingBuyIn) || 0;
    
    // Calculate new endTime based on duration if it was changed
    let newEndTime = formData.endTime;
    let newEndTimeUTC = formData.endTimeUTC;
    let newTableDuration: number | undefined = formData.tableDuration;
    
    // Check if duration was manually edited
    const originalDuration = calculateInitialDuration();
    if (displayDuration !== originalDuration && displayDuration > 0) {
      // Duration was changed - calculate new endTime from startTime + duration
      const startTime = new Date(formData.startTime);
      newEndTime = addSeconds(startTime, displayDuration);
      newEndTimeUTC = newEndTime.getTime();
      newTableDuration = displayDuration;
    }
    
    const updatedTable: TableData = {
      ...formData,
      buyIn: newInitialBuyIn + rebuyAmount,
      initialBuyIn: newInitialBuyIn,
      endTime: newEndTime,
      endTimeUTC: newEndTimeUTC,
      tableDuration: newTableDuration
    };
    
    onSave(updatedTable);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(table.id);
      onOpenChange(false);
      setShowDeleteConfirm(false);
    }
  };

  const tournamentTypes = [
    'Regular', 'Turbo', 'Hyper Turbo', 'Deepstack', 'Freezeout',
    'Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'
  ];

  const originalInitialBuyIn = table.initialBuyIn || table.buyIn;
  const rebuyAmountDisplay = table.buyIn - originalInitialBuyIn;
  const currentRebuys = table.rebuys || 0;
  
  const tableCurrency = table.currency || sessionCurrency;
  const currencySymbol = getCurrencySymbol(tableCurrency);

  // Check if table is completed (not active)
  const isCompleted = !formData.isActive;

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowDeleteConfirm(false);
          }
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className={`max-w-md max-h-[90vh] flex flex-col ${showDeleteConfirm ? '[&>button]:hidden' : ''}`}>
          {!showDeleteConfirm && (
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Table</DialogTitle>
            </DialogHeader>
          )}

          {!showDeleteConfirm ? (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <Label htmlFor="tableName">Table Name / Location</Label>
                <Input
                  id="tableName"
                  value={formData.name || formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, location: e.target.value }))}
                  placeholder="Table identifier"
                  autoComplete="off"
                  data-form-type="other"
                />
              </div>

              <div>
                <Label>Format</Label>
                <Select 
                  value={formData.format} 
                  onValueChange={(value: 'Cash' | 'Tournament') => setFormData(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash Game</SelectItem>
                    <SelectItem value="Tournament">Tournament</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Game Type</Label>
                <Select 
                  value={formData.gameType} 
                  onValueChange={(value: 'NLH' | 'PLO') => setFormData(prev => ({ ...prev, gameType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NLH">No Limit Hold'em</SelectItem>
                    <SelectItem value="PLO">Pot Limit Omaha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="buyIn">Initial Buy-in ({currencySymbol})</Label>
                <Input
                  id="buyIn"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingBuyIn}
                  onChange={(e) => setEditingBuyIn(e.target.value)}
                />
                {currentRebuys > 0 && rebuyAmountDisplay > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rebuys: {currentRebuys} × {currencySymbol}{(rebuyAmountDisplay / currentRebuys).toFixed(2)} = +{currencySymbol}{rebuyAmountDisplay.toFixed(2)}
                  </p>
                )}
              </div>

              {formData.format === 'Cash' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smallBlind">Small Blind ({currencySymbol})</Label>
                    <Input
                      id="smallBlind"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.smallBlind || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, smallBlind: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bigBlind">Big Blind ({currencySymbol})</Label>
                    <Input
                      id="bigBlind"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bigBlind || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bigBlind: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              )}

              {formData.format === 'Tournament' && (
                <>
                  <div>
                    <Label htmlFor="startingBB">Starting BBs</Label>
                    <Input
                      id="startingBB"
                      type="number"
                      min="0"
                      value={formData.startingBB || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, startingBB: parseInt(e.target.value) || 0 }))}
                      placeholder="Starting big blinds"
                    />
                  </div>

                  <div>
                    <Label>Tournament Type</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tournamentTypes.map(type => {
                        const isSelected = formData.tournamentTypes?.includes(type);
                        const hasOtherSelection = formData.tournamentTypes && formData.tournamentTypes.length > 0 && !isSelected;
                        
                        return (
                          <Badge
                            key={type}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer ${
                              hasOtherSelection ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => {
                              if (hasOtherSelection) return;
                              
                              const current = formData.tournamentTypes || [];
                              const updated = current.includes(type)
                                ? []
                                : [type];
                              setFormData(prev => ({ ...prev, tournamentTypes: updated }));
                            }}
                          >
                            {type}
                            {isSelected && (
                              <X className="w-3 h-3 ml-1" />
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {isCompleted && (
                <>
                  {/* Duration editing for completed tables */}
                  <div>
                    <Label>Duration</Label>
                    <div 
                      className="flex items-center gap-2 p-3 border rounded-md bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setShowDurationModal(true)}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{formatDuration(displayDuration)}</span>
                      <Pencil className="h-4 w-4 text-poker-gold ml-auto" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cashOut">Total Payout ({currencySymbol})</Label>
                    <Input
                      id="cashOut"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cashOut || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cashOut: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  {formData.format === 'Tournament' && (
                    <>
                      <div>
                        <Label htmlFor="finalPosition">Final Position</Label>
                        <Input
                          id="finalPosition"
                          type="number"
                          min="1"
                          value={formData.finalPosition || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, finalPosition: parseInt(e.target.value) || undefined }))}
                        />
                      </div>

                      {formData.tournamentTypes?.some(type => 
                        ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
                      ) && (
                        <>
                          <div>
                            <Label htmlFor="bountyCount">Players Eliminated</Label>
                            <Input
                              id="bountyCount"
                              type="number"
                              min="0"
                              value={formData.bountyCount || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, bountyCount: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="bountyAmount">Total Bounty Collected ({currencySymbol})</Label>
                            <Input
                              id="bountyAmount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.bountyAmount || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, bountyAmount: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-4">
                {onDelete && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                  >
                    Delete Table
                  </Button>
                )}
                <Button onClick={handleSave} className="flex-1 bg-poker-gold hover:bg-poker-darkGold">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold text-destructive">Delete Table</h3>
              <p className="text-muted-foreground">
                Are you sure you want to delete "{formData.name || formData.location}"? 
                This action cannot be undone and will remove all associated hand data.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Duration Edit Modal */}
      <Dialog open={showDurationModal} onOpenChange={setShowDurationModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Edit Duration</DialogTitle>
            <DialogDescription>
              Adjust the table play time
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="durationHours">Hours</Label>
              <Input
                id="durationHours"
                type="number"
                min="0"
                max="99"
                value={durationHours}
                onChange={(e) => setDurationHours(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
              />
            </div>
            <div>
              <Label htmlFor="durationMinutes">Minutes</Label>
              <Input
                id="durationMinutes"
                type="number"
                min="0"
                max="59"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDurationModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleDurationSave} className="bg-poker-gold hover:bg-poker-darkGold">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditTableForm;
