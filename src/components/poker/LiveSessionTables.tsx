
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
  // Debug logging to help identify the issue
  console.log('🔍 LiveSessionTables Debug:', {
    sessionId: currentSession.id,
    tablesArray: currentSession.tables,
    tablesLength: currentSession.tables?.length || 0,
    activeTables: currentSession.tables?.filter(table => table.isActive).length || 0,
    inactiveTables: currentSession.tables?.filter(table => !table.isActive).length || 0
  });

  const activeTables = currentSession.tables?.filter(table => table.isActive) || [];
  const inactiveTables = currentSession.tables?.filter(table => !table.isActive) || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-extrabold tracking-tight">Tables</h3>
      </div>
      
      {/* Debug info */}
      <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
        <p className="font-semibold text-blue-800">Debug Info:</p>
        <p>Total tables: {currentSession.tables?.length || 0}</p>
        <p>Active tables: {activeTables.length}</p>
        <p>Inactive tables: {inactiveTables.length}</p>
        {currentSession.tables?.length > 0 && (
          <div className="mt-2">
            <p className="font-medium">Table details:</p>
            {currentSession.tables.map((table, index) => (
              <p key={table.id} className="ml-2">
                {index + 1}. {table.name} - {table.isActive ? 'Active' : 'Inactive'}
              </p>
            ))}
          </div>
        )}
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
              <h4 className="text-lg font-bold mb-2">Active Tables ({activeTables.length})</h4>
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
          
          {inactiveTables.length > 0 && (
            <CompletedTablesDisplay tables={inactiveTables} sessionId={currentSession.id} />
          )}
        </div>
      )}
    </div>
  );
};

export default LiveSessionTables;
