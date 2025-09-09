
import React, { useState } from 'react';
import { PokerSession } from '@/types/poker';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useSessionSharing } from '@/hooks/useSessionSharing';
import CoachSelectionModal from '@/components/coaching/CoachSelectionModal';
import Icon from '@/components/ui/Lucide';
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
  const { user } = useAuth();
  const [showCoachModal, setShowCoachModal] = useState(false);
  
  // Only show the toggle for players (students), not coaches
  const showShareToggle = user?.role === 'student';
  
  // Use the session sharing hook
  const {
    isShared,
    sharedCoaches,
    connectedCoaches,
    loading: sharingLoading,
    shareSession,
    unshareSession
  } = useSessionSharing(currentSession.id);

  const handleOpenShareModal = () => {
    setShowCoachModal(true);
  };

  const handleSelectCoaches = async (coachIds: string[]) => {
    await shareSession(coachIds);
  };

  const activeTables = currentSession.tables?.filter(table => table.isActive) || [];
  const inactiveTables = currentSession.tables?.filter(table => !table.isActive) || [];

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-extrabold tracking-tight">Tables</h3>
          {showShareToggle && (
            <Button
              onClick={handleOpenShareModal}
              disabled={sharingLoading || connectedCoaches.length === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {sharingLoading ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                <Icon name="Share" size={14} />
              )}
              {isShared ? `Shared with ${sharedCoaches.length} coach${sharedCoaches.length !== 1 ? 'es' : ''}` : 'Share with Coach'}
            </Button>
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
              <CompletedTablesDisplay tables={inactiveTables} sessionId={currentSession.id} currency={currentSession.currency} />
            )}
          </div>
        )}
      </div>

      <CoachSelectionModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        coaches={connectedCoaches}
        onSelectCoaches={handleSelectCoaches}
        selectedCoaches={sharedCoaches}
        loading={sharingLoading}
      />
    </>
  );
};

export default LiveSessionTables;
