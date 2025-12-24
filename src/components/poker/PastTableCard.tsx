
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronDown, ChevronUp, Calendar, Plus, Hand } from 'lucide-react';
import { TableData } from '@/types/poker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PastEditTableForm from './PastEditTableForm';
import PastTableHandsPanel from './PastTableHandsPanel';
import PastMultiDayEndDialog from './PastMultiDayEndDialog';
import HandForm from './HandForm';
import HandsList from './HandsList';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

interface PastTableCardProps {
  table: TableData;
  onUpdate: (table: TableData) => void;
  onDelete: () => void;
}

const PastTableCard: React.FC<PastTableCardProps> = ({ table, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMultiDayDialog, setShowMultiDayDialog] = useState(false);
  const [showAddHandForm, setShowAddHandForm] = useState(false);

  const isMultiDayTable = table.isMultiDay && table.format === 'Tournament';
  const isContinuing = table.dayEndedWithoutElimination;

  // Updated profit/loss calculation - use ONLY cashOut, do NOT add bountyAmount
  const profitLoss = isContinuing ? 0 : (table.cashOut || 0) - table.buyIn;
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const getGameDetails = () => {
    const currencySymbol = getCurrencySymbol(table.currency || 'USD');
    if (table.format === 'Cash') {
      return `${currencySymbol}${table.smallBlind}/${currencySymbol}${table.bigBlind}`;
    }
    return table.finalPosition ? `Position: ${table.finalPosition}` : 'Tournament';
  };

  const handleMultiDayEnd = (
    isEliminated: boolean,
    cashOut?: number,
    notes?: string,
    bountyInfo?: { bountyCount?: number, bountyAmount?: number, finalPosition?: number },
    multiDayInfo?: { nextDayStart?: Date, chipsCarryover?: number, dayEndedWithoutElimination?: boolean }
  ) => {
    const updatedTable: TableData = {
      ...table,
      cashOut: isEliminated ? (cashOut || 0) : 0,
      notes: notes || table.notes,
      ...(isEliminated && bountyInfo?.bountyCount !== undefined && { bountyCount: bountyInfo.bountyCount }),
      ...(isEliminated && bountyInfo?.bountyAmount !== undefined && { bountyAmount: bountyInfo.bountyAmount }),
      ...(isEliminated && bountyInfo?.finalPosition !== undefined && { finalPosition: bountyInfo.finalPosition }),
      ...(multiDayInfo?.nextDayStart && { nextDayStart: multiDayInfo.nextDayStart }),
      ...(multiDayInfo?.chipsCarryover && { chipsCarryover: multiDayInfo.chipsCarryover }),
      ...(multiDayInfo?.dayEndedWithoutElimination && { dayEndedWithoutElimination: true })
    };
    
    onUpdate(updatedTable);
  };

  // Handle hand updates for this specific table
  const handleTableUpdate = (updatedHands: any[]) => {
    const updatedTable = {
      ...table,
      hands: updatedHands
    };
    onUpdate(updatedTable);
  };

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="w-full max-w-full overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardContent className="p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors min-w-0">
              <div className="flex flex-col items-center text-center gap-3 md:gap-4">
                <div className="w-full">
                  <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 mb-2">
                    <Badge variant="secondary" className="shrink-0 text-xs">{table.gameType}</Badge>
                    <Badge variant={table.format === 'Cash' ? 'default' : 'destructive'} className="shrink-0 text-xs">
                      {table.format}
                    </Badge>
                    {table.isOnline && (
                      <Badge variant="outline" className="shrink-0 text-xs">Online</Badge>
                    )}
                    {isMultiDayTable && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Multi-Day
                      </Badge>
                    )}
                    {isContinuing && (
                      <Badge variant="secondary" className="shrink-0 text-xs">Continuing</Badge>
                    )}
                    {table.tournamentTypes && table.tournamentTypes.length > 0 && (
                      <Badge variant="outline" className="shrink-0 max-w-[120px] md:max-w-[150px] truncate text-xs">
                        {table.tournamentTypes[0]}
                      </Badge>
                    )}
                    {table.hands && table.hands.length > 0 && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Hands: {table.hands.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">{getGameDetails()}</p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    {!isContinuing && (
                      <p className={`font-bold text-xl whitespace-nowrap ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitLoss >= 0 ? '+' : ''}{getCurrencySymbol(table.currency || 'USD')}{profitLoss.toFixed(2)}
                      </p>
                    )}
                    {isContinuing && (
                      <p className="text-sm text-blue-600 font-medium whitespace-nowrap">
                        In Progress
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center gap-1 shrink-0 flex-wrap">
                    {isMultiDayTable && !isContinuing && (
                      <Button
                        size="sm"
                        variant="poker"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMultiDayDialog(true);
                        }}
                        className="whitespace-nowrap text-xs"
                      >
                        End Day
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddHandForm(true);
                      }}
                      className="p-1"
                    >
                      <div className="flex items-center">
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                        <Hand className="h-3 w-3 md:h-4 md:w-4 ml-0.5" />
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditForm(true);
                      }}
                      className="p-1"
                    >
                      <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
                    ) : (
                      <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="border-t border-gray-200">
              <div className="p-4 space-y-4">
                {/* Financial Stats - Full Width Layout */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Initial Buy-in</span>
                    <span className="text-sm font-semibold">{getCurrencySymbol(table.currency || 'USD')}{table.initialBuyIn?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Rebuys</span>
                    <span className="text-sm font-semibold">{getCurrencySymbol(table.currency || 'USD')}{(table.rebuys || 0).toFixed(2)}</span>
                  </div>
                  {/* Only show cash out for non-continuing tournaments */}
                  {!isContinuing && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Total Payout</span>
                      <span className="text-sm font-semibold">{getCurrencySymbol(table.currency || 'USD')}{(table.cashOut || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {/* Only show bounties for non-continuing tournaments - display only, not included in totals */}
                  {!isContinuing && table.bountyAmount && table.bountyAmount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Bounty Payout (info only)</span>
                      <span className="text-sm font-semibold text-gray-500">{getCurrencySymbol(table.currency || 'USD')}{table.bountyAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Multi-Day Information */}
                {isMultiDayTable && isContinuing && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2 break-words">Multi-Day Tournament - Continuing</h5>
                    <div className="space-y-2">
                      {table.nextDayStart && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-blue-700 font-medium">Next Day Start:</span>
                          <span className="text-sm font-semibold break-words text-right max-w-[60%]">
                            {new Date(table.nextDayStart).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {table.chipsCarryover && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700 font-medium">Chips Carryover:</span>
                          <span className="text-sm font-semibold">{table.chipsCarryover.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {table.notes && (
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Notes:</span>
                    <p className="text-sm mt-1 break-words">{table.notes}</p>
                  </div>
                )}

                {/* Hands Display - Only show when expanded and has hands */}
                {table.hands && table.hands.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Hands Played</h4>
                    <HandsList
                      hands={table.hands}
                      onEditHand={() => {}} // Disable editing for now
                      onDeleteHand={() => {}} // Disable deleting for now
                      readOnly={true}
                      tables={[table]}
                    />
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <PastEditTableForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        table={table}
        onSubmit={onUpdate}
      />

      <PastMultiDayEndDialog
        open={showMultiDayDialog}
        onOpenChange={setShowMultiDayDialog}
        table={table}
        onComplete={handleMultiDayEnd}
      />

      {/* Add Hand Form - Direct form without intermediate popup */}
      <HandForm
        open={showAddHandForm}
        onOpenChange={setShowAddHandForm}
        onSubmit={(handData) => {
          const newHand = {
            ...handData,
            id: `${Date.now()}-${Math.random()}`,
            createdAt: new Date(),
            tableId: table.id,
            currencyType: table.format === 'Cash' ? 'currency' : 'chips'
          };
          
          const updatedHands = [...(table.hands || []), newHand];
          handleTableUpdate(updatedHands);
        }}
        sessionId={table.session_id || table.id}
        tableId={table.id}
        tableFormat={table.format}
      />
    </>
  );
};

export default PastTableCard;
