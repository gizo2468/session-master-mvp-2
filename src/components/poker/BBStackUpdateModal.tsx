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

interface BBStackUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableData[];
  sessionFormat: string;
  currency?: string;
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
  currency = 'USD'
}) => {
  const [updateData, setUpdateData] = useState<TableUpdateData[]>([]);

  const isCashGame = sessionFormat === 'Cash';
  const currencySymbol = getCurrencySymbol(currency);

  // Initialize state when modal opens or tables change
  useEffect(() => {
    if (isOpen && tables.length > 0) {
      setUpdateData(
        tables.map(table => {
          if (isCashGame) {
            // For cash games, initialize with current table blinds or defaults
            const smallBlindValue = table.smallBlind || 1;
            const bigBlindValue = table.bigBlind || (smallBlindValue * 2);
            
            return {
              tableId: table.id,
              level: 1, // Not used for cash games
              stack: '', // Not used for cash games  
              bb: '', // Not used for cash games
              smallBlind: smallBlindValue,
              bigBlind: bigBlindValue
            };
          } else {
            // For tournaments, initialize with empty values
            return {
              tableId: table.id,
              level: 1,
              stack: '',
              bb: '',
              smallBlind: 0, // Not used for tournaments
              bigBlind: 0 // Not used for tournaments
            };
          }
        })
      );
    }
  }, [isOpen, tables, isCashGame]);

  const handleLevelChange = (tableId: string, level: string) => {
    setUpdateData(prev =>
      prev.map(data =>
        data.tableId === tableId
          ? { ...data, level: parseInt(level) }
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

  const handleSave = () => {
    // Validation for cash games
    if (isCashGame) {
      const hasInvalidBlinds = updateData.some(data => data.smallBlind <= 0 || data.bigBlind <= 0);
      if (hasInvalidBlinds) {
        alert('Cash game blinds cannot be 0 or empty');
        return;
      }
    }
    
    // For tournaments, validate numeric fields
    if (!isCashGame) {
      const hasInvalidFields = updateData.some(data => 
        data.stack !== '' && !/^\d+$/.test(data.stack) ||
        data.bb !== '' && !/^\d+$/.test(data.bb)
      );
      if (hasInvalidFields) {
        alert('Tournament fields must contain only numbers');
        return;
      }
    }
    
    console.log('BB/Stack Update Data:', updateData);
    onClose();
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
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {tables.map((table, index) => {
              const tableData = updateData.find(data => data.tableId === table.id);
              if (!tableData) return null;

              return (
                <div key={table.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">
                    Table {index + 1}
                    {table.buyIn && (
                      <span className="text-sm text-gray-500 ml-2">({currencySymbol}{table.buyIn})</span>
                    )}
                  </h4>
                  
                  {isCashGame ? (
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
                        <label className="text-xs text-gray-500 mb-1 block">Level</label>
                        <Select
                          value={tableData.level.toString()}
                          onValueChange={(value) => handleLevelChange(table.id, value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {levelOptions.map(level => (
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
