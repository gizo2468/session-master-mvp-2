
import React, { useState } from 'react';
import { PokerSession } from '@/types/poker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
    connectedCoaches,
    loading: sharingLoading,
    shareSession,
    unshareSession
  } = useSessionSharing(currentSession.id);

  const handleToggleShare = async () => {
    if (isShared) {
      // If already shared, unshare immediately
      await unshareSession();
    } else {
      // If not shared, show coach selection modal
      if (connectedCoaches.length === 0) {
        // No coaches connected - could show a message or redirect to coach connection
        return;
      } else if (connectedCoaches.length === 1) {
        // Only one coach - share directly
        await shareSession(connectedCoaches[0].id);
      } else {
        // Multiple coaches - show selection modal
        setShowCoachModal(true);
      }
    }
  };

  const handleSelectCoach = async (coachId: string) => {
    await shareSession(coachId);
  };

  const activeTables = currentSession.tables?.filter(table => table.isActive) || [];
  const inactiveTables = currentSession.tables?.filter(table => !table.isActive) || [];

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-extrabold tracking-tight">Tables</h3>
          {showShareToggle && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="share-coach-live" 
                checked={isShared}
                onCheckedChange={handleToggleShare}
                disabled={sharingLoading}
              />
              <Label htmlFor="share-coach-live" className="text-sm">
                Share with Coach
                {sharingLoading && (
                  <Icon name="Loader2" size={12} className="ml-1 animate-spin inline" />
                )}
              </Label>
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
                      currency={currentSession.currency}
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
        onSelectCoach={handleSelectCoach}
        loading={sharingLoading}
      />
    </>
  );
};

export default LiveSessionTables;
