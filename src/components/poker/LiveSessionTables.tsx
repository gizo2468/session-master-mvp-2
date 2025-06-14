
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-extrabold tracking-tight">Tables</h3>
      </div>
      
      {activeTables.length === 0 && inactiveTables.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
          <p className="mb-2">No tables added yet.</p>
          <p className="text-sm">Click "Add Table" to start tracking multiple tables.</p>
        </div>
      ) : (
        <div>
          {activeTables.length > 0 && (
            <div className="mb-4">
              <h4 className="text-lg font-bold mb-2">Active Tables</h4>
              <div className="space-y-3">
                {activeTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    sessionId={currentSession.id}
                    onEndTable={onEndTable}
                    onAddRebuy={onAddTableRebuy}
                  />
                ))}
              </div>
            </div>
          )}
          
          <CompletedTablesDisplay tables={inactiveTables} sessionId={currentSession.id} />
        </div>
      )}
    </div>
  );
};

export default LiveSessionTables;
