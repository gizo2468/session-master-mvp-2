import React, { useState } from 'react';
import { format } from 'date-fns';
import TableTimerDisplay from '@/components/poker/TableTimerDisplay';
import { TableData } from '@/types/poker';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import EditTableForm from './EditTableForm';
import { useSessionContext } from '@/context/SessionContext';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface CompletedTablesDisplayProps {
  tables: TableData[];
  sessionId: string;
  currency?: string; // Currency code from session
  isLiveSession?: boolean;
}

export default function CompletedTablesDisplay({ tables, sessionId, currency, isLiveSession }: CompletedTablesDisplayProps) {
  const { updateTable, deleteTable } = useSessionContext();
  // Remove global currencySymbol - calculate per table instead
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableData | null>(null);

  if (tables.length === 0) return null;

  const handleEditTable = (table: TableData) => {
    setSelectedTable(table);
    setShowEditForm(true);
  };

  const handleSaveTable = (updatedTable: TableData) => {
    updateTable(sessionId, updatedTable);
    setShowEditForm(false);
    setSelectedTable(null);
  };

  const handleDeleteTable = (table: TableData) => {
    setTableToDelete(table);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (tableToDelete && deleteTable) {
      deleteTable(sessionId, tableToDelete.id);
      setShowDeleteConfirm(false);
      setTableToDelete(null);
    }
  };

  return (
    <div>
      <h4 className="text-lg font-bold mb-2">Completed Tables</h4>
      <div className="space-y-4">
        {tables.map((table) => {
          const profitLoss = (table.cashOut ?? 0) - table.buyIn;
          // Fixed: Use actual cashOut amount, not calculated minimum
          const actualPayout = table.cashOut ?? 0;
          const currencySymbol = getCurrencySymbol(table.currency || currency);
          
          return (
            <div 
              key={table.id} 
              className="bg-gray-50 dark:bg-background p-4 rounded-lg border border-gray-200 dark:border-border shadow-sm dark:shadow-black/20 hover:shadow-md dark:shadow-black/30 transition-shadow relative"
            >
              {/* Edit and Delete Buttons */}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-white dark:bg-card"
                  onClick={() => handleEditTable(table)}
                >
                  <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDeleteTable(table)}
                >
                  <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
                </Button>
              </div>

              {isLiveSession ? (
                <>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {table.startTime && table.endTime && (
                      <div className="text-center">
                        <div className="text-gray-500 dark:text-muted-foreground font-medium text-xs uppercase mb-1">Duration</div>
                        <TableTimerDisplay 
                          startTime={table.startTime} 
                          endTime={table.endTime}
                          isActive={false}
                          className="flex justify-center"
                        />
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="font-bold">{table.name || table.location}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{table.gameType} • {table.format}</p>
                      {table.isMultiDay && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-poker-feltGreen/10 text-poker-feltGreen rounded-full text-xs">
                          Multi-Day
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2 pr-16">
                    <div>
                      <h3 className="font-bold">{table.name || table.location}</h3>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground font-semibold mt-0.5">{table.location}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{table.gameType} • {table.format}</p>
                      {table.isMultiDay && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-poker-feltGreen/10 text-poker-feltGreen rounded-full text-xs">
                          Multi-Day
                        </span>
                      )}
                    </div>
                    {table.cashOut !== undefined && !table.dayEndedWithoutElimination && (
                      <div className={`text-lg font-bold ${
                        table.cashOut >= table.buyIn ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {table.cashOut >= table.buyIn ? '+' : ''}
                        {currencySymbol}{(table.cashOut - table.buyIn).toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  {/* Start, Duration, End row */}
                  <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 dark:border-border pb-4">
                    <div className="flex flex-1 justify-center items-center">
                      <div className="text-center">
                        <div className="text-gray-500 dark:text-muted-foreground font-medium text-xs uppercase mb-1">Start</div>
                        <div className="font-medium">{format(new Date(table.startTime), 'd MMM, HH:mm')}</div>
                      </div>
                    </div>
                    
                    {table.startTime && table.endTime && (
                      <div className="flex-1 flex justify-center items-center border-x border-gray-100 dark:border-border px-4">
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-muted-foreground font-medium text-xs uppercase mb-1">Duration</div>
                          <TableTimerDisplay 
                            startTime={table.startTime} 
                            endTime={table.endTime}
                            isActive={false}
                            className="flex justify-center"
                          />
                        </div>
                      </div>
                    )}
                    
                    {table.endTime && (
                      <div className="flex-1 flex justify-center items-center">
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-muted-foreground font-medium text-xs uppercase mb-1">End</div>
                          <div className="font-medium">{format(new Date(table.endTime), 'd MMM, HH:mm')}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Styled Buy-in and Rebuy section with rebuy count */}
              <div className="flex items-center gap-4 mb-4 justify-center">
                <div className="text-right">
                  <span className="block uppercase text-xs text-gray-500 dark:text-muted-foreground font-medium tracking-wider">BUY-IN</span>
                  <span className="font-bold text-xl">
                    {currencySymbol}{(table.initialBuyIn ?? table.buyIn).toFixed(2)}
                  </span>
                </div>
                {(() => {
                  const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
                  const addOnTotal = table.addOns ? table.addOns : 0;
                  const extra = rebuyTotal + addOnTotal;
                  const rebuyCount = Math.floor(rebuyTotal / (table.initialBuyIn ?? table.buyIn));
                  return extra > 0 ? (
                    <div className="text-right">
                      <span className="block uppercase text-xs text-gray-500 dark:text-muted-foreground font-medium tracking-wider">REBUY</span>
                      <div>
                        <span className="font-bold text-xl text-amber-600">
                          +{currencySymbol}{extra.toFixed(2)}
                        </span>
                        {rebuyCount > 0 && (
                          <span className="text-sm text-gray-500 dark:text-muted-foreground ml-1">({rebuyCount})</span>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Tournament-specific fields */}
              <div className="text-xs space-y-1 mb-4">
                {table.format === 'Tournament' && table.startingBB && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Starting BBs:</span>
                    <span className="font-medium">{table.startingBB}BB</span>
                  </div>
                )}
                
                {table.tournamentTypes && table.tournamentTypes.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Tournament Type:</span>
                    <span className="inline-flex px-2 py-0.5 bg-gray-100 dark:bg-muted rounded-full text-xs">
                      {table.tournamentTypes[0]}
                    </span>
                  </div>
                )}
                
                {table.format === 'Tournament' && 
                table.tournamentTypes?.some(type => ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)) && 
                table.bountyCount !== undefined && 
                table.bountyCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Players Eliminated:</span>
                    <span className="font-medium">{table.bountyCount}</span>
                  </div>
                )}
                
                {table.format === 'Tournament' && 
                table.tournamentTypes?.some(type => ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)) && 
                table.bountyAmount !== undefined && 
                table.bountyAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Total Bounty Collected:</span>
                    <span className="font-medium text-poker-gold">{currencySymbol}{table.bountyAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {/* Multi-day tournament continuation details */}
              {table.dayEndedWithoutElimination && (
                <div className="bg-poker-feltGreen/5 p-3 rounded-lg mb-4 border border-poker-feltGreen/20">
                  <h5 className="font-bold text-sm text-poker-feltGreen mb-2">Tournament Continuing</h5>
                  
                  {table.chipsCarryover && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Continuing with:</span>
                      <span className="font-medium">{table.chipsCarryover.toLocaleString()} chips</span>
                    </div>
                  )}
                  
                  {table.nextDayStart && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Next Day:</span>
                      <span className="font-medium">{format(new Date(table.nextDayStart), 'd MMM, HH:mm')}</span>
                    </div>
                  )}
                  
                  {/* We don't have explicit day tracking in the data model, 
                     so we're showing a generic continuation message */}
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Status:</span>
                    <span className="font-medium">Day completed, continuing</span>
                  </div>
                  
                  {table.notes && (
                    <div className="mt-2 pt-2 border-t border-poker-feltGreen/10">
                      <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 italic">"{table.notes}"</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Fixed: Total Payout display using actual cashOut amount */}
              <div className="flex flex-col items-center justify-center mt-4 mb-2">
                <span className="block uppercase text-xs text-gray-500 dark:text-muted-foreground font-medium tracking-wider">
                  {table.dayEndedWithoutElimination ? 'STATUS' : 'TOTAL PAYOUT'}
                </span>
                {table.dayEndedWithoutElimination ? (
                  <span className="font-bold text-xl text-poker-feltGreen">Continuing</span>
                ) : (
                  <span className="font-bold text-xl text-poker-gold">
                    {currencySymbol}{actualPayout.toFixed(2)}
                  </span>
                )}

                {/* Profit/Loss moved to bottom for live sessions */}
                {isLiveSession && table.cashOut !== undefined && !table.dayEndedWithoutElimination && (
                  <div className="flex flex-col items-center mt-3">
                    <span className="block uppercase text-xs text-gray-500 dark:text-muted-foreground font-medium tracking-wider">PROFIT/LOSS</span>
                    <span className={`font-bold text-xl ${
                      profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profitLoss >= 0 ? '+' : ''}
                      {currencySymbol}{profitLoss.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Table Form */}
      {selectedTable && (
        <EditTableForm
          open={showEditForm}
          onOpenChange={setShowEditForm}
          table={selectedTable}
          onSave={handleSaveTable}
          onDelete={() => handleDeleteTable(selectedTable)}
          sessionCurrency={selectedTable.currency || currency}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{tableToDelete?.name || tableToDelete?.location}"? 
              This action cannot be undone and will remove all associated hand data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
