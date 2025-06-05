
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { Badge } from '@/components/ui/badge';
import { TableData } from '@/types/poker';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import EditTableForm from '@/components/poker/EditTableForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TableCardProps {
  table: TableData;
  sessionId: string;
  onEndTable: (
    tableId: string, 
    cashOut: number, 
    notes?: string,
    bounty?: { 
      bountyCount?: number, 
      bountyAmount?: number, 
      finalPosition?: number 
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => void;
  onAddRebuy: (tableId: string, amount: number) => void;
}

export default function TableCard({ table, sessionId, onEndTable, onAddRebuy }: TableCardProps) {
  const { updateTable, deleteTable } = useSessionContext();
  const { toast } = useToast();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleUpdateTable = (updatedTable: TableData) => {
    try {
      updateTable(sessionId, updatedTable);
      toast({
        title: "Table Updated",
        description: "Table information has been successfully updated."
      });
    } catch (error) {
      console.error("Error updating table:", error);
      toast({
        title: "Error Updating Table",
        description: "There was a problem updating the table. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTable = () => {
    try {
      deleteTable(sessionId, table.id);
      toast({
        title: "Table Deleted",
        description: "The table has been successfully removed from the session."
      });
    } catch (error) {
      console.error("Error deleting table:", error);
      toast({
        title: "Error Deleting Table",
        description: error instanceof Error ? error.message : "There was a problem deleting the table.",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{table.name || table.location}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditForm(true)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                <Icon name="pencil" size={16} />
              </Button>
            </div>
            <p className="text-sm text-gray-600">{table.gameType} • {table.format}</p>
            {table.format === 'Cash' && table.smallBlind && table.bigBlind && (
              <p className="text-sm text-gray-500">${table.smallBlind}/${table.bigBlind}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Buy-in:</span>
            <span className="font-medium">${table.buyIn.toFixed(2)}</span>
          </div>

          {table.currentStack && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Stack:</span>
              <span className="font-medium">{table.currentStack.toLocaleString()}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddRebuy(table.id, table.initialBuyIn || table.buyIn)}
              className="flex-1"
            >
              <Icon name="plus" size={14} className="mr-1" />
              Rebuy
            </Button>
            <Button
              size="sm"
              onClick={() => onEndTable(table.id, 0)}
              className="flex-1 bg-poker-gold hover:bg-poker-darkGold text-white"
            >
              End Table
            </Button>
          </div>
        </div>
      </div>

      <EditTableForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        table={table}
        onUpdateTable={handleUpdateTable}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{table.name || table.location}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
