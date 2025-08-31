import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { TableData } from '@/types/poker';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { useSessionLiveState } from '@/hooks/useSessionLiveState';
import { useToast } from '@/hooks/use-toast';
import { BBStackUpdateService } from '@/services/bbStackUpdateService';
import { useBBStackHistory } from '@/hooks/useBBStackHistory';

interface BBStackUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableData[];
  sessionFormat: string;
  currency?: string;
  sessionId: string;
  onDataSaved?: () => void; // Callback to refresh data after save
}

interface TableUpdateData {
  tableId: string;
  // Tournament fields
  level: number;
  stack: string;
  bb: string;
  // Cash game fields  
  smallBlind: number;
  bigBlind: number;
}

// Blind presets for cash games (same as AddTableForm)
const BLIND_PRESETS = {
  smallBlind: [0.25, 0.5, 1, 2, 3, 5, 10, 25, 50, 100, 200, 500],
  bigBlind: [0.5, 1, 2, 5, 10, 25, 50, 100, 200, 500, 1000]
};

const BBStackUpdateModal: React.FC<BBStackUpdateModalProps> = ({
  isOpen,
  onClose,
  tables,
  sessionFormat,
  currency = 'USD',
  sessionId,
  onDataSaved
}) => {
  const [updateData, setUpdateData] = useState<TableUpdateData[]>([]);
  const [highestLevels, setHighestLevels] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState<string>('');
  const { liveState, updateLiveState } = useSessionLiveState(sessionId);
  const { toast } = useToast();

  // Remove session-level format check - we'll check per table instead
  const currencySymbol = getCurrencySymbol(currency);

  // Initialize state when modal opens or tables change
  useEffect(() => {
    const loadHighestLevels = async () => {
      if (isOpen && tables.length > 0) {
        const levels: Record<string, number> = {};
        
        for (const table of tables) {
          if (table.format !== 'Cash') {
            levels[table.id] = await BBStackUpdateService.getHighestLevel(table.id);
          }
        }
        
        setHighestLevels(levels);
        
        setUpdateData(
          tables.map(table => {
            const isCashTable = table.format === 'Cash';
            const savedData = liveState.bbStackUpdates?.[table.id];
            
            if (isCashTable) {
              // For cash games, use saved data or fall back to table defaults
              const smallBlindValue = savedData?.smallBlind ?? table.smallBlind ?? 1;
              const bigBlindValue = savedData?.bigBlind ?? table.bigBlind ?? (smallBlindValue * 2);
              
              return {
                tableId: table.id,
                level: 1, // Not used for cash games
                stack: '', // Not used for cash games  
                bb: '', // Not used for cash games
                smallBlind: smallBlindValue,
                bigBlind: bigBlindValue
              };
            } else {
              // For tournaments, use highest level + 1 as default, or 1 if no history
              const highestLevel = levels[table.id] || 0;
              const defaultLevel = highestLevel > 0 ? highestLevel : 1;
              
              return {
                tableId: table.id,
                level: savedData?.level ?? defaultLevel,
                stack: savedData?.stack ?? table.currentStack?.toString() ?? '',
                bb: savedData?.bb ?? table.startingBB?.toString() ?? '',
                smallBlind: 0, // Not used for tournaments
                bigBlind: 0 // Not used for tournaments
              };
            }
          })
        );
      }
    };

    if (isOpen) {
      loadHighestLevels();
      setValidationError('');
    }
  }, [isOpen, tables, liveState.bbStackUpdates]);

  const handleLevelChange = (tableId: string, level: string) => {
    const newLevel = parseInt(level);
    const highestLevel = highestLevels[tableId] || 0;
    
    // Validate level - cannot go below highest existing level
    if (newLevel < highestLevel) {
      setValidationError(`Cannot select Level ${newLevel}. Current highest level is ${highestLevel}.`);
      setTimeout(() => setValidationError(''), 3000);
      return;
    }
    
    setValidationError('');
    setUpdateData(prev =>
      prev.map(data =>
        data.tableId === tableId
          ? { ...data, level: newLevel }
          : data
      )
    );
  };

  const handleStackChange = (tableId: string, stack: string) => {
    // Only allow numeric input
    if (stack === '' || /^\d+$/.test(stack)) {
      setUpdateData(prev =>
        prev.map(data =>
          data.tableId === tableId
            ? { ...data, stack }
            : data
        )
      );
    }
  };

  const handleBBChange = (tableId: string, bb: string) => {
    // Only allow numeric input
    if (bb === '' || /^\d+$/.test(bb)) {
      setUpdateData(prev =>
        prev.map(data =>
          data.tableId === tableId
            ? { ...data, bb }
            : data
        )
      );
    }
  };

  const handleSmallBlindChange = (tableId: string, values: number[]) => {
    const newSmallBlind = BLIND_PRESETS.smallBlind[values[0]];
    setUpdateData(prev =>
      prev.map(data =>
        data.tableId === tableId
          ? { ...data, smallBlind: newSmallBlind, bigBlind: newSmallBlind * 2 }
          : data
      )
    );
  };

  const handleBigBlindSliderChange = (tableId: string, values: number[]) => {
    const newBigBlind = BLIND_PRESETS.bigBlind[values[0]];
    setUpdateData(prev =>
      prev.map(data =>
        data.tableId === tableId
          ? { ...data, bigBlind: newBigBlind }
          : data
      )
    );
  };

  const handleSave = async () => {
    try {
      // Validate per table based on its format
      for (const data of updateData) {
        const table = tables.find(t => t.id === data.tableId);
        if (!table) continue;
        
        const isCashTable = table.format === 'Cash';
        
        if (isCashTable) {
          // Validation for cash games
          if (data.smallBlind <= 0 || data.bigBlind <= 0) {
            setValidationError('Cash game blinds cannot be 0 or empty');
            setTimeout(() => setValidationError(''), 3000);
            return;
          }
        } else {
          // For tournaments, validate numeric fields
          if (data.stack !== '' && !/^\d+$/.test(data.stack) ||
              data.bb !== '' && !/^\d+$/.test(data.bb)) {
            setValidationError('Tournament fields must contain only numbers');
            setTimeout(() => setValidationError(''), 3000);
            return;
          }

          // Check for identical duplicates on the same level
          const history = await BBStackUpdateService.getBBStackHistory(data.tableId);
          const lastEntryForLevel = history
            .filter(h => h.level === data.level)
            .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
          
          if (lastEntryForLevel) {
            const currentStack = data.stack || '0';
            const currentBB = data.bb || '0';
            const lastStack = lastEntryForLevel.stack?.toString() || '0';
            const lastBB = lastEntryForLevel.bb?.toString() || '0';
            
            if (currentStack === lastStack && currentBB === lastBB) {
              setValidationError(`Level ${data.level} already has identical BB/Stack values. Please change at least one value.`);
              setTimeout(() => setValidationError(''), 3000);
              return;
            }
          }
        }
      }
      
      // Save to database first
      for (const data of updateData) {
        const table = tables.find(t => t.id === data.tableId);
        if (!table) continue;
        
        const isCashTable = table.format === 'Cash';
        
        if (isCashTable) {
          await BBStackUpdateService.saveBBStackUpdate({
            sessionId,
            tableId: data.tableId,
            smallBlind: data.smallBlind,
            bigBlind: data.bigBlind
          });
        } else {
          // Get the latest values for inheritance if empty
          const history = await BBStackUpdateService.getBBStackHistory(data.tableId);
          const latestEntry = history
            .filter(h => h.level !== null)
            .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
          
          const inheritedStack = data.stack || latestEntry?.stack?.toString() || '';
          const inheritedBB = data.bb || latestEntry?.bb?.toString() || '';
          
          await BBStackUpdateService.saveBBStackUpdate({
            sessionId,
            tableId: data.tableId,
            level: data.level,
            stack: inheritedStack,
            bb: inheritedBB
          });
        }
      }
      
      // Save the data to live state
      const bbStackUpdates = { ...liveState.bbStackUpdates };
      
      updateData.forEach(data => {
        const table = tables.find(t => t.id === data.tableId);
        if (!table) return;
        
        const isCashTable = table.format === 'Cash';
        
        if (isCashTable) {
          bbStackUpdates[data.tableId] = {
            smallBlind: data.smallBlind,
            bigBlind: data.bigBlind
          };
        } else {
          bbStackUpdates[data.tableId] = {
            level: data.level,
            stack: data.stack,
            bb: data.bb
          };
        }
      });
      
      updateLiveState({ bbStackUpdates });
      
      toast({
        title: "BB/Stack Updates Saved",
        description: "Your table settings have been updated successfully.",
      });
      
      console.log('BB/Stack Update Data saved to database and live state');
      
      // Call refresh callback if provided
      if (onDataSaved) {
        onDataSaved();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving BB/Stack updates:', error);
      toast({
        title: "Error",
        description: "Failed to save BB/Stack updates. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    // Reset state and close
    setUpdateData([]);
    onClose();
  };

  // Generate level options (Lvl 1 through Lvl 50)
  const levelOptions = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>BB / Stack Update</DialogTitle>
          {validationError && (
            <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
              {validationError}
            </div>
          )}
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {tables.map((table, index) => {
              const tableData = updateData.find(data => data.tableId === table.id);
              if (!tableData) return null;
              
              const isCashTable = table.format === 'Cash';

              return (
                <div key={table.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">
                    Table {index + 1}
                    {table.buyIn && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({currencySymbol}{table.buyIn}
                        {isCashTable ? 
                          '' : 
                          table.tournamentTypes && table.tournamentTypes.length > 0 ? 
                            ` – ${table.tournamentTypes[0]}` : 
                            ''
                        })
                      </span>
                    )}
                  </h4>
                  
                  {isCashTable ? (
                    // Cash Game UI - Show sliders for Small Blind and Big Blind
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs text-gray-500">Small Blind</Label>
                            <span className="text-xs font-medium">{currencySymbol}{tableData.smallBlind}</span>
                          </div>
                          <Slider
                            value={[BLIND_PRESETS.smallBlind.findIndex(val => val === tableData.smallBlind)]}
                            max={BLIND_PRESETS.smallBlind.length - 1}
                            step={1}
                            onValueChange={(values) => handleSmallBlindChange(table.id, values)}
                            className="py-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs text-gray-500">Big Blind</Label>
                            <span className="text-xs font-medium">{currencySymbol}{tableData.bigBlind}</span>
                          </div>
                          <Slider
                            value={[BLIND_PRESETS.bigBlind.findIndex(val => val === tableData.bigBlind) !== -1 
                              ? BLIND_PRESETS.bigBlind.findIndex(val => val === tableData.bigBlind) 
                              : 0]}
                            max={BLIND_PRESETS.bigBlind.length - 1}
                            step={1}
                            onValueChange={(values) => handleBigBlindSliderChange(table.id, values)}
                            className="py-2"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Tournament UI - Keep existing design
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Level
                          {highestLevels[table.id] > 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              (min: {highestLevels[table.id]})
                            </span>
                          )}
                        </label>
                        <Select
                          value={tableData.level.toString()}
                          onValueChange={(value) => handleLevelChange(table.id, value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {levelOptions
                              .filter(level => level >= (highestLevels[table.id] || 1))
                              .map(level => (
                                <SelectItem key={level} value={level.toString()}>
                                  Lvl {level}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Stack</label>
                        <Input
                          type="text"
                          placeholder="Stack"
                          value={tableData.stack}
                          onChange={(e) => handleStackChange(table.id, e.target.value)}
                          className="h-10"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">BB</label>
                        <Input
                          type="text"
                          placeholder="BB"
                          value={tableData.bb}
                          onChange={(e) => handleBBChange(table.id, e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {tables.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No active tables to update.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-poker-gold hover:bg-poker-darkGold text-white">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BBStackUpdateModal;
