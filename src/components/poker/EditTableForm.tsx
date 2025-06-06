

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TableData } from '@/types/poker';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface EditTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData;
  onSave: (updatedTable: TableData) => void;
  onDelete?: (tableId: string) => void;
}

const EditTableForm: React.FC<EditTableFormProps> = ({
  open,
  onOpenChange,
  table,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<TableData>(table);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingBuyIn, setEditingBuyIn] = useState<string>('');

  useEffect(() => {
    setFormData(table);
    // Set the initial buy-in for editing
    const initialBuyIn = table.initialBuyIn || table.buyIn;
    setEditingBuyIn(initialBuyIn.toString());
  }, [table]);

  const handleSave = () => {
    // Calculate rebuy amount to preserve existing rebuys
    const originalInitialBuyIn = table.initialBuyIn || table.buyIn;
    const rebuyAmount = table.buyIn - originalInitialBuyIn;
    const newInitialBuyIn = parseFloat(editingBuyIn) || 0;
    
    // When saving, preserve existing rebuys and update the buy-in correctly
    const updatedTable = {
      ...formData,
      buyIn: newInitialBuyIn + rebuyAmount, // New initial + existing rebuys
      initialBuyIn: newInitialBuyIn
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

  // Calculate display info for rebuys
  const originalInitialBuyIn = table.initialBuyIn || table.buyIn;
  const rebuyAmount = table.buyIn - originalInitialBuyIn;
  const currentRebuys = table.rebuys || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tableName">Table Name / Location</Label>
              <Input
                id="tableName"
                value={formData.name || formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, location: e.target.value }))}
                placeholder="Enter table name or location"
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
              <Label htmlFor="buyIn">Initial Buy-in ($)</Label>
              <Input
                id="buyIn"
                type="number"
                min="0"
                step="0.01"
                value={editingBuyIn}
                onChange={(e) => setEditingBuyIn(e.target.value)}
              />
              {currentRebuys > 0 && rebuyAmount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Rebuys: {currentRebuys} × ${(rebuyAmount / currentRebuys).toFixed(2)} = +${rebuyAmount.toFixed(2)}
                </p>
              )}
            </div>

            {formData.format === 'Cash' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smallBlind">Small Blind ($)</Label>
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
                  <Label htmlFor="bigBlind">Big Blind ($)</Label>
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
                  <Label>Tournament Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tournamentTypes.map(type => (
                      <Badge
                        key={type}
                        variant={formData.tournamentTypes?.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = formData.tournamentTypes || [];
                          const updated = current.includes(type)
                            ? current.filter(t => t !== type)
                            : [...current, type];
                          setFormData(prev => ({ ...prev, tournamentTypes: updated }));
                        }}
                      >
                        {type}
                        {formData.tournamentTypes?.includes(type) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!formData.isActive && (
              <>
                <div>
                  <Label htmlFor="cashOut">Total Payout ($)</Label>
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
                          <Label htmlFor="bountyAmount">Total Bounty Collected ($)</Label>
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

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this table..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1"
                >
                  Delete
                </Button>
              )}
              <Button onClick={handleSave} className="flex-1 bg-poker-gold hover:bg-poker-darkGold">
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold text-red-600">Delete Table</h3>
            <p className="text-gray-600">
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
  );
};

export default EditTableForm;

