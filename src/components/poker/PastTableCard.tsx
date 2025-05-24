
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { TableData } from '@/types/poker';
import HandManagementPanel from './HandManagementPanel';
import PastEditTableForm from './PastEditTableForm';
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

interface PastTableCardProps {
  table: TableData;
  onUpdate: (table: TableData) => void;
  onDelete: () => void;
}

const PastTableCard: React.FC<PastTableCardProps> = ({
  table,
  onUpdate,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const profit = (table.cashOut || 0) - table.buyIn;
  const handCount = table.hands?.length || 0;

  const handleHandUpdate = (updatedTable: TableData) => {
    onUpdate(updatedTable);
  };

  return (
    <>
      <Card className="w-full">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {table.name || `${table.gameType} ${table.format}`}
                    <span className="text-sm font-normal text-gray-500">
                      ({handCount} hands)
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{table.gameType} • {table.format}</span>
                    {table.format === 'Cash' && table.smallBlind && table.bigBlind && (
                      <span>${table.smallBlind}/${table.bigBlind}</span>
                    )}
                    <span>Buy-in: ${table.buyIn}</span>
                    <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      P/L: {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditForm(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
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
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {/* Table Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">Buy-in</span>
                    <p className="font-medium">${table.initialBuyIn}</p>
                    {table.rebuys && table.rebuys > 0 && (
                      <p className="text-xs text-gray-500">
                        +{table.rebuys} rebuys (${(table.buyIn - table.initialBuyIn).toFixed(2)})
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Cash Out</span>
                    <p className="font-medium">${table.cashOut?.toFixed(2) || '0.00'}</p>
                  </div>
                  {table.format === 'Tournament' && (
                    <>
                      {table.finalPosition && (
                        <div>
                          <span className="text-sm text-gray-600">Position</span>
                          <p className="font-medium">{table.finalPosition}</p>
                        </div>
                      )}
                      {table.bountyCount && table.bountyCount > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Bounties</span>
                          <p className="font-medium">
                            {table.bountyCount} (${table.bountyAmount?.toFixed(2) || '0.00'})
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Hand Management */}
                <HandManagementPanel
                  sessionId="temp-session-id"
                  hands={table.hands || []}
                  tableId={table.id}
                  tableFormat={table.format}
                  readOnly={false}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <PastEditTableForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        table={table}
        onSubmit={(updatedTable) => {
          onUpdate(updatedTable);
          setShowEditForm(false);
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this table? This action cannot be undone and will remove all associated hands.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PastTableCard;
