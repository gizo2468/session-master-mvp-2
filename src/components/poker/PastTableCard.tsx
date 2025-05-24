
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { TableData } from '@/types/poker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PastEditTableForm from './PastEditTableForm';
import HandManagementPanel from './HandManagementPanel';
import PastMultiDayEndDialog from './PastMultiDayEndDialog';

interface PastTableCardProps {
  table: TableData;
  onUpdate: (table: TableData) => void;
  onDelete: () => void;
}

const PastTableCard: React.FC<PastTableCardProps> = ({ table, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMultiDayDialog, setShowMultiDayDialog] = useState(false);

  // Updated profit/loss calculation to include bounty amount
  const profitLoss = ((table.cashOut || 0) + (table.bountyAmount || 0)) - table.buyIn;
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getGameDetails = () => {
    if (table.format === 'Cash') {
      return `$${table.smallBlind}/$${table.bigBlind}`;
    }
    return table.finalPosition ? `Position: ${table.finalPosition}` : 'Tournament';
  };

  const handleMultiDayEnd = (
    isEliminated: boolean,
    cashOut?: number,
    notes?: string,
    multiDayInfo?: any
  ) => {
    const updatedTable: TableData = {
      ...table,
      cashOut: isEliminated ? (cashOut || 0) : 0,
      notes: notes || table.notes,
      ...(isEliminated && multiDayInfo?.bountyCount !== undefined && { bountyCount: multiDayInfo.bountyCount }),
      ...(isEliminated && multiDayInfo?.bountyAmount !== undefined && { bountyAmount: multiDayInfo.bountyAmount }),
      ...(isEliminated && multiDayInfo?.finalPosition !== undefined && { finalPosition: multiDayInfo.finalPosition }),
      ...(multiDayInfo?.nextDayStart && { nextDayStart: multiDayInfo.nextDayStart }),
      ...(multiDayInfo?.chipsCarryover && { chipsCarryover: multiDayInfo.chipsCarryover }),
      ...(multiDayInfo?.dayEndedWithoutElimination && { dayEndedWithoutElimination: true })
    };
    
    onUpdate(updatedTable);
  };

  const isMultiDayTable = table.isMultiDay && table.format === 'Tournament';
  const isContinuing = table.dayEndedWithoutElimination;

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="w-full">
          <CollapsibleTrigger asChild>
            <CardContent className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{table.gameType}</Badge>
                      <Badge variant={table.format === 'Cash' ? 'default' : 'destructive'}>
                        {table.format}
                      </Badge>
                      {table.isOnline && (
                        <Badge variant="outline">Online</Badge>
                      )}
                      {isMultiDayTable && (
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Multi-Day
                        </Badge>
                      )}
                      {isContinuing && (
                        <Badge variant="poker">Continuing</Badge>
                      )}
                      {table.tournamentTypes && table.tournamentTypes.length > 0 && (
                        <Badge variant="outline">{table.tournamentTypes[0]}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{getGameDetails()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Buy-in: ${table.buyIn.toFixed(2)}</p>
                    <p className={`font-semibold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {isMultiDayTable && !isContinuing && (
                      <Button
                        size="sm"
                        variant="poker"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMultiDayDialog(true);
                        }}
                      >
                        End Day
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="border-t border-gray-200">
              <div className="p-4 space-y-4">
                {/* Table Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Initial Buy-in:</span>
                    <p className="font-medium">${table.initialBuyIn?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Rebuys:</span>
                    <p className="font-medium">${(table.rebuys || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cash Out:</span>
                    <p className="font-medium">${(table.cashOut || 0).toFixed(2)}</p>
                  </div>
                  {table.bountyAmount && table.bountyAmount > 0 && (
                    <div>
                      <span className="text-gray-600">Bounties:</span>
                      <p className="font-medium">${table.bountyAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* Multi-Day Information */}
                {isMultiDayTable && isContinuing && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Multi-Day Tournament - Continuing</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {table.nextDayStart && (
                        <div>
                          <span className="text-blue-700">Next Day Start:</span>
                          <p className="font-medium">{new Date(table.nextDayStart).toLocaleString()}</p>
                        </div>
                      )}
                      {table.chipsCarryover && (
                        <div>
                          <span className="text-blue-700">Chips Carryover:</span>
                          <p className="font-medium">{table.chipsCarryover.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {table.notes && (
                  <div>
                    <span className="text-gray-600 text-sm">Notes:</span>
                    <p className="text-sm mt-1">{table.notes}</p>
                  </div>
                )}

                {/* Hands Management Panel */}
                <div className="border-t pt-4">
                  <HandManagementPanel
                    sessionId={`past-session-${Date.now()}`}
                    hands={table.hands || []}
                    tableId={table.id}
                    tableFormat={table.format}
                    readOnly={false}
                  />
                </div>
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
    </>
  );
};

export default PastTableCard;
