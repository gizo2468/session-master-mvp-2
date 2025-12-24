
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TableData, HandData } from '@/types/poker';
import { format } from 'date-fns';
import { Plus, Trash2, Hand, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import CardDisplay from './CardDisplay';
import HandForm from './HandForm';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

interface TableSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableData[];
  onSelectTable: (table: TableData) => void;
  onAddTable?: () => void;
  onDeleteTable?: (tableId: string) => void;
  onAddHand?: (tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => void;
  onEditHand?: (tableId: string, hand: HandData) => void;
  onDeleteHand?: (tableId: string, handId: string) => void;
  sessionCurrency?: string; // Add session currency prop
}

const TableSelectionModal: React.FC<TableSelectionModalProps> = ({
  open,
  onOpenChange,
  tables,
  onSelectTable,
  onAddTable,
  onDeleteTable,
  onAddHand,
  onEditHand,
  onDeleteHand,
  sessionCurrency = 'USD' // Default to USD if not provided
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableData | null>(null);
  const [handFormOpen, setHandFormOpen] = useState(false);
  const [selectedTableForHand, setSelectedTableForHand] = useState<TableData | null>(null);
  const [editingHand, setEditingHand] = useState<HandData | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

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

  const handleAddHand = (e: React.MouseEvent, table: TableData) => {
    e.stopPropagation();
    setSelectedTableForHand(table);
    setEditingHand(null);
    setHandFormOpen(true);
  };

  const handleEditHandClick = (hand: HandData) => {
    const table = tables.find(t => t.id === hand.tableId);
    if (table) {
      setSelectedTableForHand(table);
      setEditingHand(hand);
      setHandFormOpen(true);
    }
  };

  const handleDeleteHandClick = (handId: string) => {
    const hand = tables.flatMap(t => t.hands || []).find(h => h.id === handId);
    if (hand && onDeleteHand) {
      onDeleteHand(hand.tableId, handId);
    }
  };

  const handleEditClick = (e: React.MouseEvent, table: TableData) => {
    e.stopPropagation();
    onSelectTable(table);
  };

  const toggleHandsExpansion = (tableId: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      return newSet;
    });
  };

  const handleHandSubmit = (handData: Partial<HandData>) => {
    if (!selectedTableForHand) return;
    
    if (editingHand && onEditHand) {
      onEditHand(selectedTableForHand.id, { ...editingHand, ...handData });
    } else if (onAddHand) {
      onAddHand(selectedTableForHand.id, handData);
    }
    
    setHandFormOpen(false);
    setSelectedTableForHand(null);
    setEditingHand(null);
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
    const tableCurrency = table.currency || sessionCurrency;
    const currencySymbol = getCurrencySymbol(tableCurrency);
    const badges = [];

    // Buy-in badge
    badges.push(
      <Badge key="buyin" variant="secondary" className="text-xs">
        Buy-in: {currencySymbol}{initialBuyIn.toFixed(2)}
      </Badge>
    );

    // Rebuy badge (if applicable)
    if (table.format === 'Tournament') {
      const rebuyCount = table.rebuys || 0;
      const rebuyAmount = rebuyCount * initialBuyIn;
      
      if (rebuyAmount > 0) {
        badges.push(
          <Badge key="rebuy" variant="destructive" className="text-xs">
            Rebuy: {currencySymbol}{rebuyAmount.toFixed(2)}
          </Badge>
        );
      }
    } else {
      const rebuys = table.rebuys || 0;
      
      if (rebuys > 0) {
        badges.push(
          <Badge key="rebuy" variant="destructive" className="text-xs">
            Rebuy: {currencySymbol}{rebuys.toFixed(2)}
          </Badge>
        );
      }
    }

    // Cash out badge (if applicable)
    if (table.cashOut !== undefined) {
      badges.push(
        <Badge key="cashout" variant="success" className="text-xs">
          Cash out: {currencySymbol}{table.cashOut.toFixed(2)}
        </Badge>
      );
    }

    return badges;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Table to Edit</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Click a table card to view its added hands.
            </p>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-3 py-4">
            {tables.map((table, index) => {
              const profit = (table.cashOut || 0) - table.buyIn;
              const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
              const formattedStart = format(new Date(table.startTime), 'd MMM, HH:mm');
              const tableCurrency = table.currency || sessionCurrency;
              const currencySymbol = getCurrencySymbol(tableCurrency);
              
              return (
                <div
                  key={table.id}
                  className="border rounded-lg p-3 transition-colors relative cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleHandsExpansion(table.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 text-center">
                      <h4 className="font-medium text-center">
                        Table {index + 1} - {table.location}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${profitClass}`}>
                        {profit >= 0 ? '+' : ''}{currencySymbol}{profit.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEditClick(e, table)}
                        className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-800"
                        title="Edit Table"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
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
                  
                  {/* Add Hand button and table details on same row */}
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">
                      {formatTableDetails(table)} • {formattedStart}
                    </p>
                    {onAddHand && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleAddHand(e, table)}
                        className="h-8 px-3 hover:bg-blue-50 hover:text-blue-600"
                        title="Add Hand"
                      >
                        <div className="flex items-center gap-1">
                          <Hand className="h-3 w-3" />
                          <span className="text-xs ml-1">Add Hand</span>
                        </div>
                      </Button>
                    )}
                  </div>
                   
                   <div className="flex flex-wrap gap-2 justify-center">
                     {renderFinancialBadges(table)}
                   </div>
                  
                  {/* Hands List */}
                  {table.hands && table.hands.length > 0 && expandedTables.has(table.id) && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="max-h-32 overflow-y-auto overflow-x-hidden">
                        <div className="min-w-0 w-full">
                          {/* Compact hands list for modal */}
                          <div className="space-y-1">
                            {table.hands.map((hand, handIndex) => (
                              <div
                                key={hand.id}
                                className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="font-mono font-medium shrink-0">
                                    #{handIndex + 1}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <CardDisplay cards={hand.cards} size="sm" />
                                  </div>
                                  <span className="text-muted-foreground truncate">
                                    {hand.position} • {hand.action}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {hand.resultAmount !== undefined && (
                                    <span className={`font-medium ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {hand.resultAmount >= 0 ? '+' : ''}{currencySymbol}{hand.resultAmount.toFixed(0)}
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteHandClick(hand.id);
                                    }}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800 opacity-70 hover:opacity-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* Hand Form Dialog */}
      <HandForm
        open={handFormOpen}
        onOpenChange={setHandFormOpen}
        onSubmit={handleHandSubmit}
        initialData={editingHand || {}}
        isEditing={!!editingHand}
        sessionId={selectedTableForHand?.session_id || selectedTableForHand?.id || ''}
        tableId={selectedTableForHand?.id}
        tableFormat={selectedTableForHand?.format}
      />
    </>
  );
};

export default TableSelectionModal;
