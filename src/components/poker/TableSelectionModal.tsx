
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TableData } from '@/types/poker';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

interface TableSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableData[];
  onSelectTable: (table: TableData) => void;
  onAddTable?: () => void;
  onDeleteTable?: (tableId: string) => void;
}

const TableSelectionModal: React.FC<TableSelectionModalProps> = ({
  open,
  onOpenChange,
  tables,
  onSelectTable,
  onAddTable,
  onDeleteTable
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableData | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, table: TableData) => {
    e.stopPropagation(); // Prevent triggering table selection
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tableToDelete && onDeleteTable) {
      onDeleteTable(tableToDelete.id);
      setDeleteDialogOpen(false);
      setTableToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTableToDelete(null);
  };
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

  const renderFinancialBadges = (table: TableData) => {
    const initialBuyIn = table.initialBuyIn || 0;
    const badges = [];

    // Buy-in badge
    badges.push(
      <Badge key="buyin" variant="secondary" className="text-xs">
        Buy-in: ${initialBuyIn.toFixed(2)}
      </Badge>
    );

    // Rebuy badge (if applicable)
    if (table.format === 'Tournament') {
      const rebuyCount = table.rebuys || 0;
      const rebuyAmount = rebuyCount * initialBuyIn;
      
      if (rebuyAmount > 0) {
        badges.push(
          <Badge key="rebuy" variant="destructive" className="text-xs">
            Rebuy: ${rebuyAmount.toFixed(2)}
          </Badge>
        );
      }
    } else {
      const rebuys = table.rebuys || 0;
      
      if (rebuys > 0) {
        badges.push(
          <Badge key="rebuy" variant="destructive" className="text-xs">
            Rebuy: ${rebuys.toFixed(2)}
          </Badge>
        );
      }
    }

    // Cash out badge (if applicable)
    if (table.cashOut !== undefined) {
      badges.push(
        <Badge key="cashout" variant="success" className="text-xs">
          Cash out: ${table.cashOut.toFixed(2)}
        </Badge>
      );
    }

    return badges;
  };

  return (
    <>
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
                  className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors relative"
                  onClick={() => onSelectTable(table)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 text-center">
                      <h4 className="font-medium text-center">
                        Table {index + 1} - {table.location}
                      </h4>
                      <p className="text-sm text-gray-500 text-center">
                        {formatTableDetails(table)} • {formattedStart}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${profitClass}`}>
                        {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                      </span>
                      {onDeleteTable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteClick(e, table)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {renderFinancialBadges(table)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {onAddTable && (
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={onAddTable}
                className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this table? This action cannot be undone and will remove all associated data including hands and statistics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TableSelectionModal;
