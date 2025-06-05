
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { Badge } from '@/components/ui/badge';
import { TableData } from '@/types/poker';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import EditTableForm from '@/components/poker/EditTableForm';
import { format, differenceInMinutes } from 'date-fns';
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

  // Calculate duration from start time
  const calculateDuration = () => {
    if (!table.startTime) return '0m';
    const start = new Date(table.startTime);
    const now = new Date();
    const minutes = differenceInMinutes(now, start);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  // Format start time
  const formatStartTime = () => {
    if (!table.startTime) return '';
    return format(new Date(table.startTime), 'MMM d, h:mm a');
  };

  // Calculate profit for active table (current stack vs buy-in)
  const calculateCurrentProfit = () => {
    if (!table.currentStack || !table.initialBuyIn) return 0;
    return table.currentStack - (table.buyIn || table.initialBuyIn || 0);
  };

  const currentProfit = calculateCurrentProfit();
  const profitClass = currentProfit >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-green-600">{table.name || table.location}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {currentProfit >= 0 ? '↗' : '↘'} ${Math.abs(currentProfit).toFixed(2)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditForm(true)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <Icon name="pencil" size={16} />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{table.gameType} • {table.format}</p>
          </div>
        </div>

        {/* Start Time and Duration */}
        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-500 block">START</span>
            <span className="font-medium">{formatStartTime()}</span>
          </div>
          <div>
            <span className="text-gray-500 block">DURATION</span>
            <div className="flex items-center">
              <Icon name="clock" size={12} className="mr-1 text-gray-400" />
              <span className="font-medium">{calculateDuration()}</span>
            </div>
          </div>
        </div>

        {/* Buy-in Information */}
        <div className="mb-3">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-500">BUY-IN</span>
            <span className="font-bold text-lg">${table.buyIn?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Starting BBs for Tournament */}
        {table.format === 'Tournament' && table.startingStack && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Starting BBs:</span>
            <span className="font-medium">{table.startingStack}BB</span>
          </div>
        )}

        {/* Tournament Type for Tournaments */}
        {table.format === 'Tournament' && table.gameType && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Tournament Type:</span>
            <span className="font-medium">{table.gameType}</span>
          </div>
        )}

        {/* Current Stack */}
        {table.currentStack && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Current Stack:</span>
            <span className="font-medium">{table.currentStack.toLocaleString()}</span>
          </div>
        )}

        {/* Blinds for Cash Games */}
        {table.format === 'Cash' && table.smallBlind && table.bigBlind && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Blinds:</span>
            <span className="font-medium">${table.smallBlind}/${table.bigBlind}</span>
          </div>
        )}

        {/* Bounty Information for Bounty Tournaments */}
        {table.format === 'Tournament' && table.gameType?.includes('Bounty') && (
          <>
            {table.bountyAmount && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Players Eliminated:</span>
                <span className="font-medium">{table.playersEliminated || 0}</span>
              </div>
            )}
            {table.bountyAmount && table.playersEliminated && table.playersEliminated > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Bounty Collected:</span>
                <span className="font-medium text-green-600">
                  ${(table.bountyAmount * table.playersEliminated).toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}

        {/* Rebuys */}
        {table.rebuys && table.rebuys > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Rebuys:</span>
            <span className="font-medium">{table.rebuys}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
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
