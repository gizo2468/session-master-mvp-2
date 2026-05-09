
import React from 'react';
import { PokerSession } from '@/types/poker';
import TableCard from './TableCard';
import CompletedTablesDisplay from './CompletedTablesDisplay';

interface LiveSessionTablesProps {
  currentSession: PokerSession;
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
  onAddTableRebuy: (tableId: string, amount: number) => void;
}

const LiveSessionTables: React.FC<LiveSessionTablesProps> = ({
  currentSession,
  onEndTable,
  onAddTableRebuy
}) => {
  const activeTables = currentSession.tables?.filter(table => table.isActive) || [];
  const inactiveTables = currentSession.tables?.filter(table => !table.isActive) || [];

  return (
    <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-6 mb-6">
      {activeTables.length === 0 && inactiveTables.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-muted-foreground bg-gray-50 dark:bg-background rounded-md">
          <p className="mb-2">No tables added yet.</p>
          <p className="text-sm">Click "Add Table" to start tracking multiple tables.</p>
        </div>
      ) : (
        <div>
          {activeTables.length > 0 && (
            <div className="mb-4">
              <h4 className="text-lg font-bold mb-2 text-poker-gold">Active Tables ({activeTables.length})</h4>
              <div className="space-y-5">
                {activeTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    currency={table.currency || currentSession.currency}
                    sessionId={currentSession.id}
                    onEndTable={onEndTable}
                    onAddRebuy={onAddTableRebuy}
                  />
                ))}
              </div>
            </div>
          )}
          
          {inactiveTables.length > 0 && (
            <CompletedTablesDisplay tables={inactiveTables} sessionId={currentSession.id} currency={currentSession.currency} isLiveSession />
          )}
        </div>
      )}
    </div>
  );
};

export default LiveSessionTables;
