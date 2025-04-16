
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import TableCard from './TableCard';
import TableForm, { TableFormValues } from './TableForm';
import HandManagementPanel from './HandManagementPanel';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TableManagementPanelProps {
  sessionId: string;
}

const TableManagementPanel: React.FC<TableManagementPanelProps> = ({ sessionId }) => {
  const { activeSession, addTable, updateTable, deleteTable, endTable } = useSessionContext();
  const { toast } = useToast();
  
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [tableToEnd, setTableToEnd] = useState<string | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [tableNotes, setTableNotes] = useState('');
  
  // For expanding/collapsing tables
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  
  // For showing hands for a specific table
  const [activeTableForHands, setActiveTableForHands] = useState<string | null>(null);
  
  const tables = activeSession?.tables || [];
  
  const handleAddTable = (data: TableFormValues) => {
    const newTableId = addTable(sessionId, {
      name: data.name,
      gameType: data.gameType,
      format: data.format,
      buyIn: parseFloat(data.buyIn),
      smallBlind: parseFloat(data.smallBlind),
      bigBlind: parseFloat(data.bigBlind),
    });
    
    setIsAddTableOpen(false);
    toast({
      title: "Table Added",
      description: `"${data.name}" has been successfully added.`
    });
    
    // Expand the newly created table
    setExpandedTableId(newTableId);
  };
  
  const handleDeleteTable = () => {
    if (tableToDelete) {
      const table = tables.find(t => t.id === tableToDelete);
      if (table) {
        deleteTable(sessionId, tableToDelete);
        toast({
          title: "Table Deleted",
          description: `"${table.name}" has been deleted.`,
        });
      }
      setTableToDelete(null);
    }
  };
  
  const handleEndTable = () => {
    if (tableToEnd && cashOutAmount) {
      const table = tables.find(t => t.id === tableToEnd);
      if (table) {
        endTable(
          sessionId, 
          tableToEnd, 
          parseFloat(cashOutAmount), 
          tableNotes || undefined
        );
        toast({
          title: "Table Ended",
          description: `"${table.name}" has been ended.`,
        });
      }
      
      setTableToEnd(null);
      setCashOutAmount('');
      setTableNotes('');
    }
  };
  
  const toggleTableExpand = (tableId: string) => {
    if (expandedTableId === tableId) {
      setExpandedTableId(null);
    } else {
      setExpandedTableId(tableId);
    }
  };
  
  const handleAddHandClick = (tableId: string) => {
    setActiveTableForHands(tableId);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Tables</h3>
        <Button 
          onClick={() => setIsAddTableOpen(true)}
          className="bg-poker-gold hover:bg-poker-darkGold text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Add Table
        </Button>
      </div>
      
      <div className="space-y-2">
        {tables.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-gray-500">No tables added yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "Add Table" to start tracking your games.
            </p>
          </div>
        ) : (
          tables.map((table) => (
            <React.Fragment key={table.id}>
              <TableCard 
                table={table}
                isExpanded={expandedTableId === table.id}
                onToggleExpand={() => toggleTableExpand(table.id)}
                onEndTable={() => {
                  setTableToEnd(table.id);
                  setTableNotes(table.notes || '');
                }}
                onAddHand={() => handleAddHandClick(table.id)}
                onDeleteTable={() => setTableToDelete(table.id)}
              />
              
              {activeTableForHands === table.id && (
                <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
                  <HandManagementPanel 
                    sessionId={sessionId}
                    tableId={table.id}
                    hands={table.hands || []}
                    onClose={() => setActiveTableForHands(null)}
                  />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
      
      <TableForm 
        open={isAddTableOpen} 
        onOpenChange={setIsAddTableOpen} 
        onSubmit={handleAddTable} 
      />
      
      <AlertDialog open={!!tableToDelete} onOpenChange={() => setTableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the table and all associated hand records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTable}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={!!tableToEnd} onOpenChange={(open) => {
        if (!open) setTableToEnd(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Table</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="cashout" className="text-sm font-medium">
                Cash Out Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <Input
                  id="cashout"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={cashOutAmount}
                  onChange={(e) => setCashOutAmount(e.target.value)}
                />
              </div>
            </div>
            
            {tableToEnd && (
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Profit/Loss:</span>
                  <span className={`text-sm font-bold ${
                    cashOutAmount && tableToEnd ? 
                      (parseFloat(cashOutAmount) >= tables.find(t => t.id === tableToEnd)?.buyIn || 0) 
                        ? 'text-green-600' 
                        : 'text-red-600' 
                      : 'text-gray-500'
                  }`}>
                    {cashOutAmount && tableToEnd
                      ? `$${(parseFloat(cashOutAmount) - (tables.find(t => t.id === tableToEnd)?.buyIn || 0)).toFixed(2)}` 
                      : '$0.00'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this table..."
                className="min-h-[100px]"
                value={tableNotes}
                onChange={(e) => setTableNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableToEnd(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEndTable}
              disabled={!cashOutAmount}
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
            >
              End Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagementPanel;
