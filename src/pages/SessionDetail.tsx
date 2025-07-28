
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useSessionLoader } from '@/hooks/useSessionLoader';
import { useToast } from '@/hooks/use-toast';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import TableDetailsCard from '@/components/poker/TableDetailsCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { TableData } from '@/types/poker';
import SessionDetailHeader from '@/components/poker/SessionDetailHeader';
import SessionStatusBadges from '@/components/poker/SessionStatusBadges';
import SessionInfoDisplay from '@/components/poker/SessionInfoDisplay';
import SessionActions from '@/components/poker/SessionActions';
import SessionModals from '@/components/poker/SessionModals';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { updateSession, deleteSession, endSession } = useSessionContext();
  const { toast } = useToast();
  
  // Use the session loader hook to properly load sessions from database
  const { currentSession: session, isLoadingSession, loadingError } = useSessionLoader(sessionId);
  
  const isMobile = useIsMobile();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [showEditTable, setShowEditTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  
  // Show loading state while fetching session
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <h1 className="text-xl font-bold mb-2">Loading Session...</h1>
          <p className="text-gray-600">Please wait while we fetch your session details.</p>
        </div>
      </div>
    );
  }
  
  // Show error state if loading failed
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Session</h1>
          <p className="text-gray-600 mb-4">{loadingError}</p>
          <button
            onClick={() => navigate('/')}
            className="py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  // Show not found if session doesn't exist
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <button
            onClick={() => navigate('/')}
            className="py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  // Check for completion using both isActive and cashOut
  const isCompleted = !session.isActive && session.cashOut !== undefined;
  
  // Calculate total initial buy-ins across all tables
  const calculateTotalInitialBuyin = () => {
    if (!session.tables || session.tables.length === 0) {
      return session.initialBuyIn || session.buyIn;
    }
    
    let totalInitialBuyin = 0;
    session.tables.forEach((table) => {
      totalInitialBuyin += table.initialBuyIn || 0;
    });
    
    return totalInitialBuyin;
  };
  
  // Calculate additional buy-ins (rebuys, add-ons)
  const calculateAdditionalBuyins = () => {
    if (!session.tables || session.tables.length === 0) {
      if (session.initialBuyIn) {
        return session.buyIn - session.initialBuyIn;
      }
      
      let additional = 0;
      
      if (session.rebuys && session.rebuys > 0) {
        additional += ((session.rebuys || 0) * (session.tournamentBuyIn || session.buyIn / session.rebuys));
      }
      
      if (session.addOns && session.addOns > 0) {
        additional += ((session.addOns || 0) * (session.tournamentBuyIn || session.buyIn / session.addOns));
      }
      
      return additional;
    }
    
    // Calculate from tables
    let totalBuyin = 0, totalInitialBuyin = 0;
    session.tables.forEach((table) => {
      totalBuyin += table.buyIn || 0;
      totalInitialBuyin += table.initialBuyIn || 0;
    });
    
    return totalBuyin - totalInitialBuyin;
  };
  
  // Calculate total rebuy count across all tables
  const calculateTotalRebuys = () => {
    if (!session.tables || session.tables.length === 0) {
      return session.rebuys || 0;
    }
    
    let totalRebuys = 0;
    session.tables.forEach((table) => {
      totalRebuys += table.rebuys || 0;
    });
    
    return totalRebuys;
  };
  
  // Calculate total cashout - using ONLY cashOut, do NOT include bounties
  const calculateTotalCashout = () => {
    if (!session.tables || session.tables.length === 0) {
      return session.cashOut || 0;
    }
    
    let totalCashout = 0;
    session.tables.forEach((table) => {
      // Add only regular cashout - do NOT add bounty earnings
      totalCashout += (table.cashOut || 0);
    });
    
    return totalCashout;
  };
  
  // Calculate total profit/loss from all tables (using the corrected total cashout)
  const calculateTotalProfitLoss = () => {
    if (!session.tables || session.tables.length === 0) {
      return (session.cashOut || 0) - session.buyIn;
    }
    
    const totalCashout = calculateTotalCashout();
    let totalBuyin = 0;
    
    session.tables.forEach((table) => {
      totalBuyin += table.buyIn || 0;
    });
    
    return totalCashout - totalBuyin;
  };
  
  const totalInitialBuyin = calculateTotalInitialBuyin();
  const additionalBuyins = calculateAdditionalBuyins();
  const totalRebuys = calculateTotalRebuys();
  const totalCashout = calculateTotalCashout();
  const profit = calculateTotalProfitLoss();

  const handleEditClick = () => {
    if (session.tables && session.tables.length > 0) {
      setShowTableSelection(true);
    } else {
      toast({
        title: "No Tables Found",
        description: "No tables found in this session to edit.",
        variant: "destructive"
      });
    }
  };

  const handleTableSelect = (table: TableData) => {
    setSelectedTable(table);
    setShowTableSelection(false);
    setShowEditTable(true);
  };

  const handleTableUpdate = (updatedTable: TableData) => {
    if (!session || !session.tables) return;
    
    const updatedTables = session.tables.map(table => 
      table.id === updatedTable.id ? updatedTable : table
    );
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    updateSession(updatedSession);
  };
  
  const handleEndSession = () => {
    if (!session || !cashOutAmount || !session.isActive) return;
    
    endSession(session.id, parseFloat(cashOutAmount));
    setShowEndSessionModal(false);
    navigate('/');
  };
  
  const handleDelete = () => {
    if (!session) return;
    
    deleteSession(session.id);
    setShowDeleteModal(false);
    navigate('/');
  };

  const handleNotesChange = (notes: string) => {
    if (session) {
      const updatedSession = {
        ...session,
        notes: notes
      };
      updateSession(updatedSession);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <SessionDetailHeader
          sessionId={sessionId}
          location={session.location}
          onEditClick={handleEditClick}
          onDeleteClick={() => setShowDeleteModal(true)}
        />
        
        {/* Only show timer for active sessions */}
        <SessionActions
          session={session}
          isActive={session.isActive}
          onEndSession={() => setShowEndSessionModal(true)}
        />
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <SessionStatusBadges
            startTime={session.startTime.toISOString()}
            endTime={session.endTime?.toISOString()}
          />
          
          <SessionInfoDisplay
            session={session}
            totalInitialBuyin={totalInitialBuyin}
            additionalBuyins={additionalBuyins}
            totalRebuys={totalRebuys}
            totalCashout={totalCashout}
            profit={profit}
            isCompleted={isCompleted}
          />
          
          {/* Only show end session button for active sessions */}
          {session.isActive && (
            <button
              onClick={() => setShowEndSessionModal(true)}
              className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
            >
              End Session
            </button>
          )}
        </div>
        
        {!session.isActive && Array.isArray(session.tables) && session.tables.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">Tables Played</h2>
            {session.tables.map(table => {
              return (
                <TableDetailsCard key={table.id} table={table} />
              );
            })}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <HandManagementPanel 
            sessionId={session.id} 
            hands={[
              ...(session.hands || []),
              ...(session.tables?.flatMap(table => table.hands || []) || [])
            ]}
            tables={session.tables}
            readOnly={!session.isActive}
            sessionBuyIn={session.buyIn}
          />
        </div>

        <SessionModals
          session={session}
          showDeleteModal={showDeleteModal}
          showEndSessionModal={showEndSessionModal}
          showTableSelection={showTableSelection}
          showEditTable={showEditTable}
          selectedTable={selectedTable}
          cashOutAmount={cashOutAmount}
          onDeleteModalClose={() => setShowDeleteModal(false)}
          onEndSessionModalClose={() => setShowEndSessionModal(false)}
          onTableSelectionClose={() => setShowTableSelection(false)}
          onEditTableClose={() => setShowEditTable(false)}
          onTableSelect={handleTableSelect}
          onTableUpdate={handleTableUpdate}
          onDelete={handleDelete}
          onEndSession={handleEndSession}
          onCashOutAmountChange={setCashOutAmount}
          onNotesChange={handleNotesChange}
        />
      </div>
    </div>
  );
}
