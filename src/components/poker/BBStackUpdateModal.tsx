import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

interface BBStackUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableData[];
  sessionFormat: string;
  currency?: string;
  sessionId: string;
  onDataSaved?: () => void; // Callback to refresh data after save
  editingLevel?: number; // Level being edited (for edit mode)
  initialBB?: number; // Pre-filled BB value for editing
  initialStack?: number; // Pre-filled Stack value for editing
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
  stackBB: string; // Stack size in BB for cash games
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
  onDataSaved,
  editingLevel,
  initialBB,
  initialStack
}) => {
  const [updateData, setUpdateData] = useState<TableUpdateData[]>([]);
  const [highestLevels, setHighestLevels] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState<string>('');
  const [latestByTable, setLatestByTable] = useState<Record<string, { level?: number; bb?: number; smallBlind?: number; bigBlind?: number }>>({});
  const { liveState, updateLiveState } = useSessionLiveState(sessionId);
  const { toast } = useToast();
  
  // Track if we've already initialized to prevent state resets while typing
  const hasInitializedRef = useRef(false);

  // Use tables directly from props (already loaded in session)
  const activeTables = tables;
  const currencySymbol = getCurrencySymbol(currency);
  
  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [isOpen]);

  // Fetch latest BB/Stack per table for this session (for prefill)
  useEffect(() => {
    const run = async () => {
      if (!isOpen || activeTables.length === 0) return;
      try {
        const latestMap = await BBStackUpdateService.getLatestBBStackForSharedSession(sessionId);
        const simple: Record<string, { level?: number; bb?: number; smallBlind?: number; bigBlind?: number }> = {};
        latestMap.forEach((u, tableId) => {
          simple[tableId] = {
            level: u.level ?? undefined,
            bb: u.bb ?? undefined,
            smallBlind: u.small_blind ?? undefined,
            bigBlind: u.big_blind ?? undefined,
          };
        });
        setLatestByTable(simple);
      } catch (e) {
        console.warn('BBStackUpdateModal: No latest updates available yet');
      }
    };
    run();
  }, [isOpen, sessionId, activeTables.length]);


  console.log('🔍 BBStackUpdateModal render:', {
    isOpen,
    activeTables: activeTables.length,
    updateData: updateData.length
  });

  // Initialize state when modal opens - only runs once per modal open
  useEffect(() => {
    // Only initialize once when modal opens
    if (isOpen && activeTables.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Initialize immediately with saved data or defaults (instant UI)
      console.log('✅ BBStackUpdateModal: Initializing with tables:', activeTables.length);
      const initialData = activeTables.map(table => {
        const isCashTable = table.format === 'Cash';
        const savedData = liveState.bbStackUpdates?.[table.id];
        const latest = latestByTable[table.id] || {};
        
        if (isCashTable) {
          const smallBlindValue = savedData?.smallBlind ?? latest.smallBlind ?? table.smallBlind ?? 1;
          const bigBlindValue = savedData?.bigBlind ?? latest.bigBlind ?? table.bigBlind ?? (smallBlindValue * 2);
          
          // Get saved stack BB from latest update
          const savedStackBB = (savedData as any)?.stackBB ?? (latest.bb ? latest.bb.toString() : '');
          
          return {
            tableId: table.id,
            level: 1,
            stack: '',
            bb: '',
            smallBlind: smallBlindValue,
            bigBlind: bigBlindValue,
            stackBB: savedStackBB
          };
        } else {
          // For tournaments, use editing level or saved level or default to 1
          const defaultLevel = editingLevel || savedData?.level || latest.level || 1;
          const defaultBB = editingLevel ? initialBB : (savedData?.bb ? parseInt(savedData.bb) : latest.bb ?? table.startingBB);
          const defaultStack = editingLevel ? initialStack : (savedData?.stack ? parseInt(savedData.stack) : table.currentStack);
          
          return {
            tableId: table.id,
            level: defaultLevel,
            stack: defaultStack?.toString() ?? '',
            bb: defaultBB?.toString() ?? '',
            smallBlind: 0,
            bigBlind: 0,
            stackBB: ''
          };
        }
      });
      
      setUpdateData(initialData);
      setValidationError('');
      
      // Fetch highest levels in background (batch) for tournaments
      const tournamentTableIds = activeTables.filter(t => t.format !== 'Cash').map(t => t.id);
      if (tournamentTableIds.length > 0 && !editingLevel) {
        BBStackUpdateService.getHighestLevelsBatch(tournamentTableIds).then(levels => {
          if (!isOpen) return; // Guard against unmounted state update
          
          setHighestLevels(levels);
          
          // Only adjust levels for tables that don't have explicit saved/editing levels
          setUpdateData(prev => prev.map(data => {
            const table = activeTables.find(t => t.id === data.tableId);
            if (!table || table.format === 'Cash') return data;
            
            const savedData = liveState.bbStackUpdates?.[data.tableId];
            const highestLevel = levels[data.tableId] || 0;
            
            // Don't adjust if editing a specific level or if saved level exists
            if (editingLevel || savedData?.level) return data;
            
            // Adjust to highest level if current is default
            const adjustedLevel = highestLevel > 0 ? highestLevel : 1;
            return data.level === 1 ? { ...data, level: adjustedLevel } : data;
          }));
        });
      }
    }
  }, [isOpen, activeTables, editingLevel, initialBB, initialStack]); // Removed liveState.bbStackUpdates from deps

  const handleLevelChange = (tableId: string, level: string) => {
    const newLevel = parseInt(level);
    const highestLevel = highestLevels[tableId] || 0;
    
    // When editing a specific level, allow selecting that level even if it's not the highest
    const minAllowedLevel = editingLevel ? Math.min(editingLevel, highestLevel || 1) : highestLevel;
    
    // Validate level - cannot go below highest existing level (unless editing)
    if (newLevel < minAllowedLevel) {
      setValidationError(`Cannot select Level ${newLevel}. ${editingLevel ? 'Editing level' : 'Current highest level'} is ${editingLevel || highestLevel}.`);
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

  const handleStackBBChange = (tableId: string, value: string) => {
    // Allow empty, integers, and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setUpdateData(prev =>
        prev.map(data =>
          data.tableId === tableId
            ? { ...data, stackBB: value }
            : data
        )
      );
    }
  };

  const handleSave = async () => {
    try {
      const tournamentTableIds = updateData
        .filter(data => {
          const table = tables.find(t => t.id === data.tableId);
          return table && table.format !== 'Cash';
        })
        .map(data => data.tableId);

      // Fetch all histories in batch (single query)
      const historiesMap = tournamentTableIds.length > 0
        ? await BBStackUpdateService.getBBStackHistoriesBatch(tournamentTableIds)
        : {};

      // Validate all tables
      for (const data of updateData) {
        const table = activeTables.find(t => t.id === data.tableId);
        if (!table) continue;
        
        const isCashTable = table.format === 'Cash';
        
        if (isCashTable) {
          if (data.smallBlind <= 0 || data.bigBlind <= 0) {
            setValidationError('Cash game blinds cannot be 0 or empty');
            setTimeout(() => setValidationError(''), 3000);
            return;
          }
        } else {
          if (data.stack !== '' && !/^\d+$/.test(data.stack) ||
              data.bb !== '' && !/^\d+$/.test(data.bb)) {
            setValidationError('Tournament fields must contain only numbers');
            setTimeout(() => setValidationError(''), 3000);
            return;
          }

          // Use pre-fetched history for duplicate detection
          const history = historiesMap[data.tableId] || [];
          const lastEntryForLevel = history
            .filter(h => h.level === data.level)
            .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
          
          if (lastEntryForLevel) {
            const inheritedHistory = history
              .filter(h => h.level !== null && h.level < data.level)
              .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
            
            const currentStack = data.stack || inheritedHistory?.stack?.toString() || '';
            const currentBB = data.bb || inheritedHistory?.bb?.toString() || '';
            const lastStack = lastEntryForLevel.stack?.toString() || '';
            const lastBB = lastEntryForLevel.bb?.toString() || '';
            
            const hasCurrentValues = currentStack !== '' || currentBB !== '';
            const hasLastValues = lastStack !== '' || lastBB !== '';
            
            if (hasCurrentValues && hasLastValues && currentStack === lastStack && currentBB === lastBB) {
              setValidationError(`Level ${data.level} already has identical BB/Stack values. Please change at least one value.`);
              setTimeout(() => setValidationError(''), 3000);
              return;
            }
          }
        }
      }
      
      // Build bulk insert rows
      const bulkUpdates = updateData.map(data => {
        const table = activeTables.find(t => t.id === data.tableId);
        if (!table) return null;
        
        const isCashTable = table.format === 'Cash';
        
        if (isCashTable) {
          return {
            sessionId,
            tableId: data.tableId,
            smallBlind: data.smallBlind,
            bigBlind: data.bigBlind,
            // If stack amount is provided, store the raw money value in the stack column
            ...(data.stackBB && data.stackBB !== '' ? { stack: data.stackBB } : {})
          };
        } else {
          const history = historiesMap[data.tableId] || [];
          const latestEntry = history
            .filter(h => h.level !== null)
            .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
          
          const inheritedStack = data.stack || latestEntry?.stack?.toString() || '';
          const inheritedBB = data.bb || latestEntry?.bb?.toString() || '';
          
          return {
            sessionId,
            tableId: data.tableId,
            level: data.level,
            stack: inheritedStack,
            bb: inheritedBB
          };
        }
      }).filter(Boolean) as Array<{
        sessionId: string;
        tableId: string;
        level?: number;
        stack?: string;
        bb?: string;
        smallBlind?: number;
        bigBlind?: number;
      }>;

      // Save all in one bulk insert
      await BBStackUpdateService.saveBBStackUpdatesBulk(bulkUpdates);
      
      // Update live state
      const bbStackUpdates = { ...liveState.bbStackUpdates };
      
      updateData.forEach(data => {
        const table = activeTables.find(t => t.id === data.tableId);
        if (!table) return;
        
        const isCashTable = table.format === 'Cash';
        
        if (isCashTable) {
          bbStackUpdates[data.tableId] = {
            smallBlind: data.smallBlind,
            bigBlind: data.bigBlind,
            stackBB: data.stackBB
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

  // Memoize level options (constant)
  const levelOptions = useMemo(() => Array.from({ length: 50 }, (_, i) => i + 1), []);

  // Memoize blind index maps for O(1) slider lookups
  const smallBlindIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    BLIND_PRESETS.smallBlind.forEach((val, idx) => map.set(val, idx));
    return map;
  }, []);

  const bigBlindIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    BLIND_PRESETS.bigBlind.forEach((val, idx) => map.set(val, idx));
    return map;
  }, []);

  // Memoized handlers to prevent re-renders
  const handleLevelChangeMemo = useCallback((tableId: string, level: string) => {
    handleLevelChange(tableId, level);
  }, [highestLevels, editingLevel, validationError]);

  const handleStackChangeMemo = useCallback((tableId: string, stack: string) => {
    handleStackChange(tableId, stack);
  }, []);

  const handleBBChangeMemo = useCallback((tableId: string, bb: string) => {
    handleBBChange(tableId, bb);
  }, []);

  const handleSmallBlindChangeMemo = useCallback((tableId: string, values: number[]) => {
    handleSmallBlindChange(tableId, values);
  }, []);

  const handleBigBlindSliderChangeMemo = useCallback((tableId: string, values: number[]) => {
    handleBigBlindSliderChange(tableId, values);
  }, []);

  const handleStackBBChangeMemo = useCallback((tableId: string, value: string) => {
    handleStackBBChange(tableId, value);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingLevel ? `Edit Level ${editingLevel}` : 'BB / Stack Update'}
          </DialogTitle>
          {validationError && (
            <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
              {validationError}
            </div>
          )}
        </DialogHeader>
        
        {activeTables.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center text-gray-500 dark:text-muted-foreground">
              <p className="text-lg font-medium mb-2">No Active Tables</p>
              <p className="text-sm">Add a table to update BB/Stack values</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {activeTables.map((table, index) => {
              const tableData = updateData.find(data => data.tableId === table.id);
              if (!tableData) return null;
              
              const isCashTable = table.format === 'Cash';

              return (
                <TableRow
                  key={table.id}
                  table={table}
                  index={index}
                  tableData={tableData}
                  isCashTable={isCashTable}
                  currencySymbol={currencySymbol}
                  editingLevel={editingLevel}
                  highestLevel={highestLevels[table.id]}
                  levelOptions={levelOptions}
                  smallBlindIndex={smallBlindIndexMap.get(tableData.smallBlind) ?? 0}
                  bigBlindIndex={bigBlindIndexMap.get(tableData.bigBlind) ?? 0}
                  onLevelChange={handleLevelChangeMemo}
                  onStackChange={handleStackChangeMemo}
                  onBBChange={handleBBChangeMemo}
                  onSmallBlindChange={handleSmallBlindChangeMemo}
                  onBigBlindChange={handleBigBlindSliderChangeMemo}
                  onStackBBChange={handleStackBBChangeMemo}
                />
              );
            })}
            </div>
          </ScrollArea>
        )}
        
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-poker-gold hover:bg-poker-darkGold text-white" disabled={activeTables.length === 0}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Memoized TableRow component to prevent unnecessary re-renders
const TableRow = React.memo<{
  table: TableData;
  index: number;
  tableData: TableUpdateData;
  isCashTable: boolean;
  currencySymbol: string;
  editingLevel?: number;
  highestLevel?: number;
  levelOptions: number[];
  smallBlindIndex: number;
  bigBlindIndex: number;
  onLevelChange: (tableId: string, level: string) => void;
  onStackChange: (tableId: string, stack: string) => void;
  onBBChange: (tableId: string, bb: string) => void;
  onSmallBlindChange: (tableId: string, values: number[]) => void;
  onBigBlindChange: (tableId: string, values: number[]) => void;
  onStackBBChange: (tableId: string, value: string) => void;
}>(({
  table,
  index,
  tableData,
  isCashTable,
  currencySymbol,
  editingLevel,
  highestLevel,
  levelOptions,
  smallBlindIndex,
  bigBlindIndex,
  onLevelChange,
  onStackChange,
  onBBChange,
  onSmallBlindChange,
  onBigBlindChange,
  onStackBBChange
}) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-background">
      <h4 className="font-medium mb-3">
        Table {index + 1}
        {table.buyIn && (
          <span className="text-sm text-poker-gold ml-2">
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-gray-500 dark:text-muted-foreground">Small Blind</Label>
                <span className="text-xs font-medium">{currencySymbol}{tableData.smallBlind}</span>
              </div>
              <Slider
                value={[smallBlindIndex]}
                max={BLIND_PRESETS.smallBlind.length - 1}
                step={1}
                onValueChange={(values) => onSmallBlindChange(table.id, values)}
                className="py-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-gray-500 dark:text-muted-foreground">Big Blind</Label>
                <span className="text-xs font-medium">{currencySymbol}{tableData.bigBlind}</span>
              </div>
              <Slider
                value={[bigBlindIndex]}
                max={BLIND_PRESETS.bigBlind.length - 1}
                step={1}
                onValueChange={(values) => onBigBlindChange(table.id, values)}
                className="py-2"
              />
            </div>
          </div>
          
          {/* Stack Amount (money) */}
          <div className="space-y-2 mt-3">
            <Label className="text-xs text-gray-500 dark:text-muted-foreground">Stack Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">{currencySymbol}</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 500"
                value={tableData.stackBB}
                onChange={(e) => onStackBBChange(table.id, e.target.value)}
                className="h-10 pl-7"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-muted-foreground mb-1 block">
              Level
              {editingLevel && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  (editing)
                </span>
              )}
              {!editingLevel && highestLevel && highestLevel > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  (min: {highestLevel})
                </span>
              )}
            </label>
            <Select
              value={tableData.level.toString()}
              onValueChange={(value) => onLevelChange(table.id, value)}
              disabled={!!editingLevel}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {levelOptions
                  .filter(level => {
                    if (editingLevel) {
                      return level === editingLevel;
                    }
                    return level >= (highestLevel || 1);
                  })
                  .map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      Lvl {level}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-gray-500 dark:text-muted-foreground mb-1 block">Stack</label>
            <Input
              type="text"
              placeholder="Stack"
              value={tableData.stack}
              onChange={(e) => onStackChange(table.id, e.target.value)}
              className="h-10"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 dark:text-muted-foreground mb-1 block">BB</label>
            <Input
              type="text"
              placeholder="BB"
              value={tableData.bb}
              onChange={(e) => onBBChange(table.id, e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      )}
    </div>
  );
});

TableRow.displayName = 'TableRow';

export default BBStackUpdateModal;
