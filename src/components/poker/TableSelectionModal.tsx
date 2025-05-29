
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableData } from '@/types/poker';
import { format } from 'date-fns';

interface TableSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableData[];
  onSelectTable: (table: TableData) => void;
}

const TableSelectionModal: React.FC<TableSelectionModalProps> = ({
  open,
  onOpenChange,
  tables,
  onSelectTable
}) => {
  const formatTableDetails = (table: TableData) => {
    let details = `${table.gameType} • ${table.format}`;
    
    if (table.format === 'Tournament') {
      const tournamentDetails = [];
      
      if (table.tournamentTypes && table.tournamentTypes.length > 0) {
        tournamentDetails.push(...table.tournamentTypes);
      }
      
      if (table.isMultiDay) {
        tournamentDetails.push('Multi-Day');
      }
      
      if (tournamentDetails.length > 0) {
        details += ` (${tournamentDetails.join(', ')})`;
      }
    }
    
    return details;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Table to Edit</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {tables.map((table, index) => {
            const profit = (table.cashOut || 0) - table.buyIn;
            const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
            const formattedStart = format(new Date(table.startTime), 'MMM d, h:mm a');
            
            return (
              <div
                key={table.id}
                className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectTable(table)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">
                      Table {index + 1} - {table.location}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatTableDetails(table)} • {formattedStart}
                    </p>
                  </div>
                  <span className={`font-bold ${profitClass}`}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Buy-in: ${table.buyIn.toFixed(2)}</span>
                  {table.cashOut !== undefined && (
                    <span>Cash out: ${table.cashOut.toFixed(2)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableSelectionModal;
