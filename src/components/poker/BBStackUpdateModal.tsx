import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [loadedTables, setLoadedTables] = useState<TableData[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const { liveState, updateLiveState } = useSessionLiveState(sessionId);
  const { toast } = useToast();

  // Fallback: fetch tables from database if prop is empty
  useEffect(() => {
    const fetchTables = async () => {
      if (isOpen && tables.length === 0 && sessionId && !isLoadingTables) {
        console.log('🔍 BBStackUpdateModal: Tables prop is empty, fetching from database...');
        setIsLoadingTables(true);
        
        try {
          const { data, error } = await supabase
            .from('session_tables')
            .select('*')
            .eq('session_id', sessionId)
            .eq('is_active', true);

          if (error) throw error;

          if (data && data.length > 0) {
            console.log('✅ BBStackUpdateModal: Fetched tables from database:', data.length);
            const convertedTables: TableData[] = data.map(table => ({
              id: table.id,
              name: table.table_name || '',
              format: (table.table_type || 'Cash') as 'Cash' | 'Tournament',
              gameType: (table.game_format || 'NLH') as 'NLH' | 'PLO',
              stakes: table.stakes || '',
              location: 'Online',
              buyIn: table.buy_in || 0,
              initialBuyIn: table.buy_in || 0,
              currentStack: table.current_stack || 0,
              startingStack: table.starting_stack || 0,
              smallBlind: 0,
              bigBlind: 0,
              startingBB: 0,
              isActive: table.is_active || false,
              startTime: new Date(table.start_time),
              rebuys: table.rebuys || 0,
              rebuyAmount: table.rebuy_amount || 0,
              cashOut: table.cashout || 0,
              hands: []
            }));
            setLoadedTables(convertedTables);
          } else {
            console.warn('⚠️ BBStackUpdateModal: No active tables found in database');
          }
        } catch (error) {
          console.error('❌ BBStackUpdateModal: Error fetching tables:', error);
          toast({
            title: "Error Loading Tables",
            description: "Could not load table data. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingTables(false);
        }
      }
    };

    fetchTables();
  }, [isOpen, tables.length, sessionId, toast, isLoadingTables]);

  // Use loaded tables if available, otherwise use prop
  const activeTables = loadedTables.length > 0 ? loadedTables : tables;
  const currencySymbol = getCurrencySymbol(currency);

  console.log('🔍 BBStackUpdateModal render:', {
    isOpen,
    tablesProp: tables.length,
    loadedTables: loadedTables.length,
    activeTables: activeTables.length,
    isLoadingTables
  });

  // Initialize state when modal opens - instant load with saved/default values
  useEffect(() => {
    if (isOpen && activeTables.length > 0) {
      // Initialize immediately with saved data or defaults (instant UI)
      console.log('✅ BBStackUpdateModal: Initializing with tables:', activeTables.length);
      const initialData = activeTables.map(table => {
        const isCashTable = table.format === 'Cash';
        const savedData = liveState.bbStackUpdates?.[table.id];
        
        if (isCashTable) {
          const smallBlindValue = savedData?.smallBlind ?? table.smallBlind ?? 1;
          const bigBlindValue = savedData?.bigBlind ?? table.bigBlind ?? (smallBlindValue * 2);
          
          return {
            tableId: table.id,
            level: 1,
            stack: '',
            bb: '',
            smallBlind: smallBlindValue,
            bigBlind: bigBlindValue
          };
        } else {
          // For tournaments, use editing level or saved level or default to 1
          const defaultLevel = editingLevel || savedData?.level || 1;
          
          return {
            tableId: table.id,
            level: defaultLevel,
            stack: editingLevel ? (initialStack?.toString() ?? '') : (savedData?.stack ?? table.currentStack?.toString() ?? ''),
            bb: editingLevel ? (initialBB?.toString() ?? '') : (savedData?.bb ?? table.startingBB?.toString() ?? ''),
            smallBlind: 0,
            bigBlind: 0
          };
        }
      });
      
      setUpdateData(initialData);
      setValidationError('');
      
      // Fetch highest levels in background (batch)
      const tournamentTableIds = activeTables.filter(t => t.format !== 'Cash').map(t => t.id);
      if (tournamentTableIds.length > 0 && !editingLevel) {
        BBStackUpdateService.getHighestLevelsBatch(tournamentTableIds).then(levels => {
          if (!isOpen) return; // Guard against unmounted state update
          
          setHighestLevels(levels);
          
          // Only adjust levels for tables that don't have explicit saved/editing levels
          setUpdateData(prev => prev.map(data => {
            const table = tables.find(t => t.id === data.tableId);
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
  }, [isOpen, activeTables, liveState.bbStackUpdates, editingLevel, initialBB, initialStack]);

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
        const table = tables.find(t => t.id === data.tableId);
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
        const table = tables.find(t => t.id === data.tableId);
        if (!table) return null;
        
        const isCashTable = table.format === 'Cash';
        
        if (isCashTable) {
          return {
            sessionId,
            tableId: data.tableId,
            smallBlind: data.smallBlind,
            bigBlind: data.bigBlind
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[80vh] flex flex-col">
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
        
        {isLoadingTables ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tables...</p>
            </div>
          </div>
        ) : activeTables.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No Active Tables</p>
              <p className="text-sm">Add a table to update BB/Stack values</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 h-0 pr-4">
            <div className="space-y-4">
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
          <Button onClick={handleSave} className="bg-poker-gold hover:bg-poker-darkGold text-white" disabled={isLoadingTables || activeTables.length === 0}>
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
  onBigBlindChange
}) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
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
                <Label className="text-xs text-gray-500">Small Blind</Label>
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
                <Label className="text-xs text-gray-500">Big Blind</Label>
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
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Level
              {editingLevel && (
                <span className="text-xs text-gray-400 ml-1">
                  (editing)
                </span>
              )}
              {!editingLevel && highestLevel && highestLevel > 0 && (
                <span className="text-xs text-gray-400 ml-1">
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
            <label className="text-xs text-gray-500 mb-1 block">Stack</label>
            <Input
              type="text"
              placeholder="Stack"
              value={tableData.stack}
              onChange={(e) => onStackChange(table.id, e.target.value)}
              className="h-10"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 mb-1 block">BB</label>
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
