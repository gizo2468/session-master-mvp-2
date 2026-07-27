import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableData } from '@/types/poker';
import { format as dateFormat, differenceInMinutes, isValid } from 'date-fns';
import Icon from '@/components/ui/Lucide';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { useSessionLiveState } from '@/hooks/useSessionLiveState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TableTimerDisplay from './TableTimerDisplay';
import { Badge } from '@/components/ui/badge';
import HandManagementPanel from './HandManagementPanel';
import { useSessionContext } from '@/context/SessionContext';
import { Plus, Pencil } from 'lucide-react';
import EditTableForm from './EditTableForm';
import { useBBStackHistory } from '@/hooks/useBBStackHistory';
import BlindHistoryModal from './BlindHistoryModal';
import BBStackUpdateModal from './BBStackUpdateModal';
import { BBStackUpdateService } from '@/services/bbStackUpdateService';

interface TableCardProps {
  table: TableData;
  currency?: string; // Currency code from session
  onEndTable?: (tableId: string, cashOut: number, notes?: string, bounty?: { bountyCount?: number, bountyAmount?: number, finalPosition?: number }, multiDayInfo?: { nextDayStart?: Date, chipsCarryover?: number, dayEndedWithoutElimination?: boolean }) => void;
  onInitiateEndTable?: (tableId: string) => void;
  onAddRebuy: (tableId: string, amount: number) => void;
  sessionId: string;
}

const TableCard: React.FC<TableCardProps> = ({ table, currency, onEndTable, onInitiateEndTable, onAddRebuy, sessionId }) => {
  const { updateTable, deleteTable } = useSessionContext();
  const { liveState } = useSessionLiveState(sessionId);
  const { history: blindHistory, refreshHistory } = useBBStackHistory(table.id);
  const currencySymbol = getCurrencySymbol(table.currency || currency);
  const [showEndTableDialog, setShowEndTableDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBlindHistory, setShowBlindHistory] = useState(false);
  const [showBBStackUpdateModal, setShowBBStackUpdateModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<number | undefined>();
  const [editingBB, setEditingBB] = useState<number | undefined>();
  const [editingStack, setEditingStack] = useState<number | undefined>();
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [tableNotes, setTableNotes] = useState(table.notes || '');
  const [showRebuyDialog, setShowRebuyDialog] = useState(false);
  const [bountyCount, setBountyCount] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [finalPosition, setFinalPosition] = useState('');
  const [endReason, setEndReason] = useState<'eliminated' | 'day-ended' | null>(null);
  const [nextDayStart, setNextDayStart] = useState<Date | null>(null);
  const [chipsCarryover, setChipsCarryover] = useState('');

  const initialRebuyAmount = table.format === 'Tournament' 
    ? (table.tournamentBuyIn || table.initialBuyIn || table.buyIn).toString()
    : '';
  
  const [rebuyDialogAmount, setRebuyDialogAmount] = useState(initialRebuyAmount);

  // CRITICAL: Validate dates before formatting to prevent crashes
  const safeStartTime = table.startTime && isValid(table.startTime) ? table.startTime : new Date();
  const safeEndTime = table.endTime && isValid(table.endTime) ? table.endTime : undefined;
  
  const formattedStartTime = dateFormat(safeStartTime, 'HH:mm');

  const rebuyAmount = (table.buyIn - (table.initialBuyIn || 0)) > 0 ? table.buyIn - (table.initialBuyIn || 0) : 0;
  const rebuyCount = Math.floor(rebuyAmount / (table.initialBuyIn || table.buyIn || 1));

  const isBountyTournament = table.format === 'Tournament' &&
    table.tournamentTypes?.some(type =>
      ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
    );

  const isFreezeout = table.format === 'Tournament' && 
    table.tournamentTypes?.some(type => type === 'Freezeout');
  const handleEndTable = () => {
    if (!onEndTable) return;
    const finalCashOut = endReason === 'day-ended' ? 0 : parseFloat(cashOutAmount);

    onEndTable(
      table.id,
      finalCashOut,
      tableNotes,
      {
        bountyCount: bountyCount ? parseInt(bountyCount) : undefined,
        bountyAmount: bountyAmount ? parseFloat(bountyAmount) : undefined,
        finalPosition: finalPosition ? parseInt(finalPosition) : undefined
      },
      endReason === 'day-ended' ? {
        nextDayStart: nextDayStart || undefined,
        chipsCarryover: chipsCarryover ? parseInt(chipsCarryover) : undefined,
        dayEndedWithoutElimination: true
      } : undefined
    );
    setShowEndTableDialog(false);
    resetEndTableForm();
  };

  const resetEndTableForm = () => {
    setCashOutAmount('');
    setTableNotes(table.notes || '');
    setBountyCount('');
    setBountyAmount('');
    setFinalPosition('');
    setEndReason(null);
    setNextDayStart(null);
    setChipsCarryover('');
  };


  const handleEditTable = (updatedTable: TableData) => {
    updateTable(sessionId, updatedTable);
  };

  const handleDeleteTable = (tableId: string) => {
    if (deleteTable) {
      deleteTable(sessionId, tableId);
    }
  };

  const handleEditLevel = (level: number, currentBB?: number, currentStack?: number) => {
    setEditingLevel(level);
    setEditingBB(currentBB);
    setEditingStack(currentStack);
    setShowBBStackUpdateModal(true);
  };

  const handleBBStackUpdateSaved = () => {
    // Reset editing state
    setEditingLevel(undefined);
    setEditingBB(undefined);
    setEditingStack(undefined);
    // Refresh the blind history
    refreshHistory();
  };

  const handleAddRebuy = () => {
    if (rebuyDialogAmount) {
      onAddRebuy(table.id, parseFloat(rebuyDialogAmount));
      setShowRebuyDialog(false);
    }
  };
  
  const openRebuyDialog = () => {
    if (table.format === 'Tournament') {
      setRebuyDialogAmount((table.tournamentBuyIn || table.initialBuyIn || table.buyIn).toString());
    } else {
      setRebuyDialogAmount('');
    }
    setShowRebuyDialog(true);
  };

  return (
    <>
      <Card className="bg-white dark:bg-card p-4 relative border border-gray-200 dark:border-border shadow-md dark:shadow-black/30 rounded-xl">
        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-100 dark:bg-muted"
          onClick={() => setShowEditForm(true)}
        >
          <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
        </Button>

        <div data-tour="table-stats">
        <div className="text-center mb-2 pr-8">
          <h3 className="text-xl font-bold">{table.location}</h3>
          <div className="flex items-center justify-center gap-2 text-base text-gray-600 dark:text-gray-400 dark:text-gray-500">
            <span>{table.gameType}</span>
            <span>•</span> 
            <span>{table.format}</span>
          </div>
          {table.format === 'Tournament' && table.tournamentTypes?.[0] && (
            <span className="inline-block mt-1 px-3 py-1 bg-poker-gold/10 text-poker-gold rounded-full">
              {table.tournamentTypes[0].replace(' Tournament', '')}
            </span>
          )}
          {table.isMultiDay && (
            <span className="inline-block mt-1 px-3 py-1 bg-poker-feltGreen/10 text-poker-feltGreen rounded-full ml-2">
              Multi-Day
            </span>
          )}
          {table.lateRegistration && (
            <span className="inline-block mt-1 px-3 py-1 bg-red-500/10 text-red-600 rounded-full ml-2">
              Late-Reg
            </span>
          )}
        </div>

        <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 dark:border-border pb-4">
          <div className="flex flex-1 justify-center items-center">
            <div className="text-center">
              <div className="text-gray-500 dark:text-muted-foreground font-medium text-xs uppercase mb-1">Start</div>
              <div className="font-mono font-semibold text-sm text-gray-900 dark:text-foreground">{formattedStartTime}</div>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center items-center border-x border-gray-100 dark:border-border px-4">
            <div className="text-center">
              <div className="text-gray-500 dark:text-muted-foreground font-medium text-xs uppercase mb-1">Duration</div>
              <TableTimerDisplay 
                startTime={safeStartTime}
                startTimeUTC={table.startTimeUTC}
                endTime={safeEndTime}
                endTimeUTC={table.endTimeUTC}
                isActive={table.isActive}
                className="flex justify-center"
              />
            </div>
          </div>
          
          {!table.isActive && safeEndTime && (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-center">
                <div className="text-gray-500 dark:text-muted-foreground font-medium text-xs uppercase mb-1">End</div>
                <div className="font-medium">{dateFormat(safeEndTime, 'HH:mm')}</div>
              </div>
            </div>
          )}
        </div>

        {table.isMultiDay && table.dayEndedWithoutElimination && (
          <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 dark:border-border pb-4 bg-green-50 rounded-md p-2">
            {table.nextDayStart && (
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center">
                  <div className="text-green-600 font-medium text-xs uppercase mb-1">Next Day Starts</div>
                  <div className="font-medium text-green-800">{dateFormat(new Date(table.nextDayStart), 'd MMM, HH:mm')}</div>
                </div>
              </div>
            )}
            
            {table.chipsCarryover && (
              <div className="flex-1 flex justify-center items-center border-l border-gray-100 dark:border-border pl-4">
                <div className="text-center">
                  <div className="text-green-600 font-medium text-xs uppercase mb-1">Chips Carried Over</div>
                  <div className="font-medium text-green-800">{table.chipsCarryover.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-4 mb-4 justify-center">
            <div className="text-right">
              <span className="block uppercase text-xs text-gray-500 dark:text-muted-foreground font-medium tracking-wider">BUY-IN</span>
              <span className="font-bold text-2xl">
                {currencySymbol}{table.initialBuyIn?.toFixed(2) ?? table.buyIn.toFixed(2)}
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
                    <span className="font-bold text-2xl text-red-600">
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
          
          {table.format === 'Cash' && (() => {
            const latestUpdate = blindHistory.length > 0 ? blindHistory[blindHistory.length - 1] : null;
            const displaySmall = latestUpdate?.small_blind ?? table.smallBlind;
            const displayBig = latestUpdate?.big_blind ?? table.bigBlind;
            return (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Blinds:</span>
                  <span className="font-medium">{currencySymbol}{displaySmall}/{currencySymbol}{displayBig}</span>
                </div>
                {/* Show blind history with elapsed time */}
                {blindHistory.length > 0 && (
                  <div className="space-y-1">
                    {blindHistory.slice(-1).filter(update => 
                      update.small_blind != null && update.big_blind != null
                    ).map((update, index) => {
                      // Calculate elapsed time
                      const start = typeof table.startTime === 'string' ? new Date(table.startTime) : table.startTime;
                      const updateTime = update.created_at ? new Date(update.created_at) : new Date();
                      const diffMs = updateTime.getTime() - start.getTime();
                      const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      const timePart = hours > 0 ? `${hours}H ${minutes}M` : `${minutes}M`;

                      return (
                        <div key={update.id || index} className="flex flex-col gap-1 mt-1">
                          {update.stack != null && (
                            <span className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 font-medium">
                              CURRENT STACK: {currencySymbol}{update.stack}
                            </span>
                          )}
                          {diffMs >= 0 && (
                            <Badge variant="timeStarted" className="px-2 py-1 font-mono font-medium flex items-center gap-1.5 w-fit text-xs">
                              <Icon name="Clock" className="h-3 w-3" />
                              <span>Updated after {timePart}</span>
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                    {blindHistory.length > 1 && (
                      <button
                        onClick={() => setShowBlindHistory(true)}
                        className="text-xs text-gray-900 dark:text-foreground hover:text-gray-700 dark:text-gray-300"
                      >
                        View All Blinds Updates
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          
          {table.format === 'Tournament' && (
            <div className="space-y-2">
              {table.startingBB && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Starting BBs:</span>
                  <span className="font-medium">{table.startingBB}BB</span>
                </div>
              )}
              {liveState.bbStackUpdates?.[table.id]?.bb && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                    Lvl {liveState.bbStackUpdates[table.id].level || 1}:
                  </span>
                  <span className="font-medium">{liveState.bbStackUpdates[table.id].bb}BBs</span>
                </div>
              )}
              {/* Show blind history for tournaments */}
              {blindHistory.length > 0 && (
                <div className="space-y-1">
                  {blindHistory.slice(-1).filter(update => {
                    const formatted = BBStackUpdateService.formatHistoryLine(update);
                    // Filter out empty strings, null/null, and any invalid entries
                    return formatted && 
                           formatted.trim() !== '' && 
                           !formatted.includes('null') &&
                           !formatted.includes('undefined');
                  }).map((update, index) => (
                    <div key={update.id || index} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {BBStackUpdateService.formatHistoryLine(update)}
                      </span>
                    </div>
                  ))}
                  {blindHistory.length > 1 && (
                    <button
                      onClick={() => setShowBlindHistory(true)}
                      className="text-xs text-gray-900 dark:text-foreground hover:text-gray-700 dark:text-gray-300"
                    >
                      View All Blinds Updates
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
        {/* end data-tour="table-stats" */}

        <div data-tour="table-actions">
        {table.isActive ? (
          <div className="mt-4 flex gap-2 justify-between">
            {isFreezeout ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Icon name="Plus" className="mr-1 h-4 w-4" /> Rebuy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rebuys not allowed in Freezeout tournaments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={openRebuyDialog}
              >
                <Icon name="Plus" className="mr-1 h-4 w-4" /> Rebuy
              </Button>
            )}
            <Button 
              variant="destructive" 
              className="flex-1"
              data-tour="end-table-button"
              onClick={() => {
                if (onInitiateEndTable) {
                  onInitiateEndTable(table.id);
                  return;
                }
                setShowEndTableDialog(true);
              }}
            >
              <Icon name="CircleStop" className="mr-1 h-4 w-4" /> End Table
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {table.format === 'Tournament' && (
              <div className="space-y-1 mt-2 text-xs">
                {table.tournamentTypes?.[0] && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Tournament Type:</span>
                    <span className="font-medium">{table.tournamentTypes[0]}</span>
                  </div>
                )}
                {table.bountyCount > 0 && table.tournamentTypes?.some(type => 
                  ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
                ) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Players Eliminated:</span>
                    <span className="font-medium">{table.bountyCount}</span>
                  </div>
                )}
                {table.bountyAmount > 0 && table.tournamentTypes?.some(type => 
                  ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
                ) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Total Bounty Collected:</span>
                    <span className="font-medium text-gray-500 dark:text-muted-foreground">{currencySymbol}{table.bountyAmount.toFixed(2)}</span>
                  </div>
                )}
                {table.finalPosition && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Final Position:</span>
                    <span className="font-medium">{table.finalPosition}th</span>
                  </div>
                )}
                
                {table.dayEndedWithoutElimination && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Status:</span>
                      <span className="font-medium text-poker-feltGreen">Day Ended (Continuing)</span>
                    </div>
                    {table.chipsCarryover && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Chips Carried Over:</span>
                        <span className="font-medium">{table.chipsCarryover.toLocaleString()}</span>
                      </div>
                    )}
                    {table.nextDayStart && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Next Day Starts:</span>
                        <span className="font-medium">{dateFormat(new Date(table.nextDayStart), 'd MMM yyyy HH:mm')}</span>
                      </div>
                    )}
                  </>
                )}
                
                {table.cashOut !== undefined && !table.dayEndedWithoutElimination && (
                  <div className="flex flex-col items-center justify-center mt-4 mb-2">
                    <span className="block uppercase text-xs text-gray-500 dark:text-muted-foreground font-medium tracking-wider">TOTAL PAYOUT</span>
                    <span className="font-bold text-2xl text-poker-gold">
                      {currencySymbol}{(table.cashOut ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {table.format === 'Cash' && table.cashOut !== undefined && (
              <div className="flex flex-col items-center justify-center mt-4 mb-2">
                <span className="block uppercase text-xs text-gray-500 dark:text-muted-foreground font-medium tracking-wider">TOTAL PAYOUT</span>
                <span className="font-bold text-2xl text-poker-gold">
                  {currencySymbol}{(table.cashOut ?? 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-border">
        <HandManagementPanel 
          sessionId={sessionId}
          tableId={table.id}
          tableFormat={table.format}
          hands={table.hands || []}
          readOnly={!table.isActive}
          previewLimit={2}
        />
        </div>
        </div>
        {/* end data-tour="table-actions" */}
      </Card>

      {/* Blind History Modal */}
      <BlindHistoryModal
        isOpen={showBlindHistory}
        onClose={() => setShowBlindHistory(false)}
        history={blindHistory}
        tableFormat={table.format}
        onEditLevel={handleEditLevel}
        tableStartTime={table.startTime}
        currencySymbol={currencySymbol}
      />

      {/* BB/Stack Update Modal for Editing */}
      <BBStackUpdateModal
        isOpen={showBBStackUpdateModal}
        onClose={() => {
          setShowBBStackUpdateModal(false);
          setEditingLevel(undefined);
          setEditingBB(undefined);
          setEditingStack(undefined);
        }}
        tables={[table]}
        sessionFormat={table.format}
        currency={currency}
        sessionId={sessionId}
        onDataSaved={handleBBStackUpdateSaved}
        editingLevel={editingLevel}
        initialBB={editingBB}
        initialStack={editingStack}
      />

      {/* Edit Table Form */}
      <EditTableForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        table={table}
        onSave={handleEditTable}
        onDelete={handleDeleteTable}
        sessionCurrency={currency}
      />

      {!onInitiateEndTable && (
      <Dialog open={showEndTableDialog} onOpenChange={setShowEndTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Table</DialogTitle>
            <DialogDescription>
              {table.isMultiDay && table.format === 'Tournament' && !endReason
                ? "Are you ending this multi-day tournament table because you were eliminated or because the day has ended?"
                : "Enter your payout amount to complete this table."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {table.isMultiDay && table.format === 'Tournament' && !endReason && (
              <div className="flex flex-col gap-4 mb-6">
                <Button
                  variant="outline"
                  className="w-full py-6 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setEndReason('eliminated')}
                >
                  <Icon name="X" className="mr-2 h-5 w-5" /> Eliminated (Cash Out)
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => setEndReason('day-ended')}
                >
                  <Icon name="Calendar" className="mr-2 h-5 w-5" /> Day Ended (Continuing)
                </Button>
              </div>
            )}
            
            {(!table.isMultiDay || endReason === 'eliminated' || (table.format === 'Cash')) && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="tableCashout" className="block text-sm font-medium mb-1">
                    Total Payout
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-muted-foreground">{currencySymbol}</span>
                    </div>
                    <input
                      id="tableCashout"
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-[#2C2C2E] rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen dark:bg-[#1C1C1E] dark:text-white dark:placeholder:text-[#8E8E93] dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
                      placeholder="0.00"
                      value={cashOutAmount}
                      onChange={(e) => setCashOutAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Enter the total amount you received (including all earnings)</p>
                </div>

                {table.format === 'Tournament' && endReason !== 'day-ended' && (
                  <div>
                    <label htmlFor="finalPosition" className="block text-sm font-medium mb-1">
                      Final Position
                    </label>
                    <input
                      id="finalPosition"
                      type="number"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#2C2C2E] rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen dark:bg-[#1C1C1E] dark:text-white dark:placeholder:text-[#8E8E93] dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
                      placeholder="Enter your final position (e.g. 3 for 3rd)"
                      value={finalPosition}
                      onChange={(e) => setFinalPosition(e.target.value)}
                      required={false}
                    />
                  </div>
                )}

                {isBountyTournament && endReason !== 'day-ended' && (
                  <>
                    <div>
                      <label htmlFor="bountyCount" className="block text-sm font-medium mb-1">
                        Players Eliminated (Optional)
                      </label>
                      <input
                        id="bountyCount"
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-[#2C2C2E] rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen dark:bg-[#1C1C1E] dark:text-white dark:placeholder:text-[#8E8E93] dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
                        placeholder="Number of players eliminated"
                        value={bountyCount}
                        onChange={(e) => setBountyCount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bountyAmount" className="block text-sm font-medium mb-1">
                        Total Bounty Collected (Optional)
                      </label>
                      <div className="flex rounded-md shadow-sm dark:shadow-black/20">
                        <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 dark:text-muted-foreground bg-gray-50 dark:bg-[#1C1C1E] border border-r-0 border-gray-300 dark:border-[#2C2C2E] rounded-l-md">
                          {currencySymbol}
                        </span>
                        <input
                          id="bountyAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-[#2C2C2E] rounded-r-md focus:ring-poker-feltGreen focus:border-poker-feltGreen focus:outline-none dark:bg-[#1C1C1E] dark:text-white dark:placeholder:text-[#8E8E93] dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
                          placeholder="0.00"
                          value={bountyAmount}
                          onChange={(e) => setBountyAmount(e.target.value)}
                        />
                       </div>
                       <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">For tracking only - should already be included in Total Payout above</p>
                     </div>
                  </>
                )}
                
                {endReason !== 'day-ended' && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Profit/Loss:</span>
                      <span className={`text-sm font-bold ${
                        cashOutAmount && parseFloat(cashOutAmount) >= table.buyIn
                          ? 'text-green-600' 
                          : cashOutAmount 
                            ? 'text-red-600' 
                            : 'text-gray-500 dark:text-muted-foreground'
                      }`}>
                        {cashOutAmount 
                        ? `${currencySymbol}${(parseFloat(cashOutAmount) - table.buyIn).toFixed(2)}` 
                        : `${currencySymbol}0.00`}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                      {cashOutAmount && (
                        <div 
                          className={`h-full ${
                            parseFloat(cashOutAmount) >= table.buyIn
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ 
                            width: cashOutAmount 
                              ? `${Math.min(Math.abs((parseFloat(cashOutAmount) - table.buyIn) / table.buyIn * 100), 100)}%` 
                              : '0%' 
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {endReason === 'day-ended' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="nextDayStart" className="block text-sm font-medium mb-1">
                    Next Day Start (Optional)
                  </label>
                  <input
                    id="nextDayStart"
                    type="datetime-local"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#2C2C2E] rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen dark:bg-[#1C1C1E] dark:text-white dark:placeholder:text-[#8E8E93] dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
                    value={nextDayStart ? nextDayStart.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setNextDayStart(e.target.value ? new Date(e.target.value) : null)}
                  />
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">When does the next day begin?</p>
                </div>
                
                <div>
                  <label htmlFor="chipsCarryover" className="block text-sm font-medium mb-1">
                    Chips Carryover
                  </label>
                  <input
                    id="chipsCarryover"
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#2C2C2E] rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen dark:bg-[#1C1C1E] dark:text-white dark:placeholder:text-[#8E8E93] dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
                    placeholder="Number of chips"
                    value={chipsCarryover}
                    onChange={(e) => setChipsCarryover(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">How many chips are you carrying over to the next day?</p>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <label htmlFor="tableNotes" className="block text-sm font-medium mb-1">
                Notes (Optional)
              </label>
              <Textarea
                id="tableNotes"
                className="w-full min-h-[100px] border border-gray-300 dark:border-[#2C2C2E] rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen dark:bg-[#141414] dark:text-white dark:placeholder:text-[#8E8E93] dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37]"
                placeholder="Table notes"
                value={tableNotes}
                onChange={(e) => setTableNotes(e.target.value)}
                autoComplete="off"
                data-form-type="other"
              />
            </div>
            
            <DialogFooter className="mt-6">
              {endReason !== null && table.isMultiDay && (
                <Button 
                  variant="ghost" 
                  onClick={() => setEndReason(null)}
                  className="mr-auto"
                >
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowEndTableDialog(false);
                  resetEndTableForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEndTable}
                disabled={
                  (endReason === 'eliminated' || !table.isMultiDay || table.format === 'Cash') 
                    ? !cashOutAmount 
                    : endReason === 'day-ended' 
                      ? !chipsCarryover 
                      : !endReason
                }
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                End Table
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      )}

      <Dialog open={showRebuyDialog} onOpenChange={setShowRebuyDialog}>
        <DialogContent className={table.format === 'Tournament' ? "max-w-sm" : ""}>
          <DialogHeader className={table.format === 'Tournament' ? "text-center" : ""}>
            <DialogTitle>
              {table.format === 'Tournament' ? 'Tournament Rebuy' : 'Add Cash Game Rebuy'}
            </DialogTitle>
            <DialogDescription className={table.format === 'Tournament' ? "sr-only" : ""}>
              {table.format === 'Tournament' 
                ? 'Confirm your tournament rebuy'
                : 'Enter the amount you want to add as a rebuy.'}
            </DialogDescription>
          </DialogHeader>
          
          {table.format === 'Tournament' ? (
            <>
              <div className="flex flex-col items-center space-y-6 py-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-poker-gold mb-2">
                    {currencySymbol}{(table.tournamentBuyIn || table.initialBuyIn || table.buyIn).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Tournament Rebuy Amount</div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowRebuyDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddRebuy} className="flex-1 bg-poker-gold hover:bg-poker-darkGold text-white">
                  Confirm Rebuy
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="py-4">
                <label htmlFor="rebuyAmount" className="block text-sm font-medium mb-2">
                  Rebuy Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-muted-foreground">{currencySymbol}</span>
                  </div>
                  <input
                    id="rebuyAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-border rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    placeholder="0.00"
                    value={rebuyDialogAmount}
                    onChange={(e) => setRebuyDialogAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRebuyDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddRebuy}
                  disabled={!rebuyDialogAmount}
                  className="bg-poker-gold hover:bg-poker-darkGold text-white"
                >
                  Add Rebuy
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TableCard;
