
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TableData } from '@/types/poker';
import { formatCurrency } from '@/lib/utils';
import { Clock, Edit, Plus } from 'lucide-react';
import ProfitLossBadge from './ProfitLossBadge';
import SessionTimeBadge from './SessionTimeBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EditTableForm from './EditTableForm';
import { useSessionContext } from '@/context/SessionContext';

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

const TableCard: React.FC<TableCardProps> = ({
  table,
  sessionId,
  onEndTable,
  onAddRebuy
}) => {
  const { updateTable } = useSessionContext();
  const [showRebuyInput, setShowRebuyInput] = useState(false);
  const [rebuyAmount, setRebuyAmount] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleAddRebuy = () => {
    const amount = parseFloat(rebuyAmount);
    if (amount > 0) {
      onAddRebuy(table.id, amount);
      setRebuyAmount('');
      setShowRebuyInput(false);
    }
  };

  const handleSaveEditedTable = (updatedTable: TableData) => {
    updateTable(sessionId, updatedTable);
    setShowEditDialog(false);
  };

  const rebuysValue = table.rebuys || 0;
  const totalInvested = table.buyIn + (rebuysValue * (table.rebuyAmount || 0));

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {table.name || table.location || `${table.gameType} ${table.format}`}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="secondary">{table.gameType}</Badge>
                <Badge variant="outline">{table.format}</Badge>
                {table.tournamentTypes?.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <SessionTimeBadge startTime={table.startTime} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Financial Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">BUY-IN</p>
              <p className="text-lg font-bold">{formatCurrency(table.buyIn)}</p>
            </div>
            {rebuysValue > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">REBUY</p>
                <p className="text-lg font-semibold text-red-600">
                  +{formatCurrency(rebuysValue * (table.rebuyAmount || 0))}
                </p>
              </div>
            )}
          </div>

          {/* Stakes/Starting Info */}
          {table.format === 'Cash' && table.smallBlind && table.bigBlind && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">STAKES</p>
              <p className="font-medium">${table.smallBlind}/${table.bigBlind}</p>
            </div>
          )}

          {table.format === 'Tournament' && table.startingBB && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Starting BBs</p>
              <p className="font-medium">{table.startingBB}BB</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!showRebuyInput ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRebuyInput(true)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Rebuy
              </Button>
            ) : (
              <div className="flex gap-2 flex-1">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={rebuyAmount}
                  onChange={(e) => setRebuyAmount(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddRebuy}>
                  Add
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowRebuyInput(false);
                    setRebuyAmount('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onEndTable(table.id, 0)}
              className="flex-1"
            >
              End Table
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditTableForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        table={table}
        onSave={handleSaveEditedTable}
      />
    </>
  );
};

export default TableCard;
