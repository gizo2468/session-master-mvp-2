
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { TableData } from '@/types/poker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PastEditTableForm from './PastEditTableForm';
import HandManagementPanel from './HandManagementPanel';

interface PastTableCardProps {
  table: TableData;
  onUpdate: (table: TableData) => void;
  onDelete: () => void;
}

const PastTableCard: React.FC<PastTableCardProps> = ({ table, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

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

                {table.notes && (
                  <div>
                    <span className="text-gray-600 text-sm">Notes:</span>
                    <p className="text-sm mt-1">{table.notes}</p>
                  </div>
                )}

                {/* Hands Management Panel - Reusing existing component */}
                <div className="border-t pt-4">
                  <HandManagementPanel
                    sessionId={`past-session-${Date.now()}`} // Temporary session ID for past sessions
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
    </>
  );
};

export default PastTableCard;
