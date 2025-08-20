import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TableData } from '@/types/poker';

interface BBStackUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableData[];
}

interface TableUpdateData {
  tableId: string;
  level: number;
  stack: string;
  bb: string;
}

const BBStackUpdateModal: React.FC<BBStackUpdateModalProps> = ({
  isOpen,
  onClose,
  tables
}) => {
  const [updateData, setUpdateData] = useState<TableUpdateData[]>([]);

  // Initialize state when modal opens or tables change
  useEffect(() => {
    if (isOpen && tables.length > 0) {
      setUpdateData(
        tables.map(table => ({
          tableId: table.id,
          level: 1,
          stack: '',
          bb: ''
        }))
      );
    }
  }, [isOpen, tables]);

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

  const handleSave = () => {
    // For now, just keep values in local state and close modal
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
                    {table.name && (
                      <span className="text-sm text-gray-500 ml-2">({table.name})</span>
                    )}
                  </h4>
                  
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
