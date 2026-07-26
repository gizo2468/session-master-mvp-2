
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useSessionLoader } from '@/hooks/useSessionLoader';
import { useToast } from '@/hooks/use-toast';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import TableDetailsCard from '@/components/poker/TableDetailsCard';
import { TablesPlayedSection } from '@/components/poker/TablesPlayedSection';
import { useIsMobile } from '@/hooks/use-mobile';
import { TableData, HandData } from '@/types/poker';
import SessionDetailHeader, { ShareWithCoachButton } from '@/components/poker/SessionDetailHeader';
import SessionStatusBadges from '@/components/poker/SessionStatusBadges';
import SessionInfoDisplay from '@/components/poker/SessionInfoDisplay';
import SessionActions from '@/components/poker/SessionActions';
import SessionModals from '@/components/poker/SessionModals';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateSession, deleteSession, endSession, addTable, deleteTable, addTableHand, updateTableHand, deleteTableHand } = useSessionContext();
  const { toast } = useToast();
  
  // Use the session loader hook to properly load sessions from database
  const { currentSession: session, isLoadingSession, loadingError } = useSessionLoader(sessionId);
  
  // Get openHandId from navigation state for deep linking
  const openHandId = (location.state as { openHandId?: string })?.openHandId;
  
  const isMobile = useIsMobile();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [showEditTable, setShowEditTable] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const swipeBackRef = useSwipeBack({ fallbackPath: '/history', screenName: 'SessionDetail' });
  
  // Show loading state while fetching session
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <h1 className="text-xl font-bold mb-2">Loading Session...</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Please wait while we fetch your session details.</p>
        </div>
      </div>
    );
  }
  
  // Show error state if loading failed
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Session</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4">{loadingError}</p>
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
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-8 max-w-md w-full text-center">
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
  const isCompleted = !session.isActive && (session.cashOut != null || session.currentStatus === 'ended');
  
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
    navigate('/', { replace: true });
  };
  
  const handleDelete = () => {
    if (!session) return;
    
    deleteSession(session.id);
    setShowDeleteModal(false);
    navigate('/', { replace: true });
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

  const handleAddTableButtonClick = () => {
    setShowTableSelection(false);
    setShowAddTable(true);
  };

  const handleAddTable = (tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => {
    if (!session) return;
    
    addTable(session.id, tableData);
    setShowAddTable(false);
    
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!session) return;
    
    try {
      await deleteTable(session.id, tableId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete table. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddHand = async (tableId: string, handData: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => {
    if (!session) return;
    
    try {
      await addTableHand(session.id, tableId, handData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add hand. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditHand = async (tableId: string, handData: HandData) => {
    if (!session) return;
    
    try {
      await updateTableHand(session.id, tableId, handData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hand. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHand = async (tableId: string, handId: string) => {
    if (!session) return;
    
    try {
      await deleteTableHand(session.id, tableId, handId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete hand. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div ref={swipeBackRef} className="min-h-screen content-safe">
      <div className="container mx-auto max-w-3xl px-4 pb-8">
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
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-6 mb-6">
          <SessionStatusBadges
            startTime={session.startTime.toISOString()}
            endTime={session.endTime?.toISOString()}
            sessionDuration={session.sessionDuration}
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

          {/* Share button with Edit/Delete buttons below */}
          <ShareWithCoachButton 
            sessionId={session.id}
            onEditClick={handleEditClick}
            onDeleteClick={() => setShowDeleteModal(true)}
            showActionButtons={true}
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
          <TablesPlayedSection 
            tables={session.tables} 
            sessionCurrency={session.currency} 
          />
        )}
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-6">
          <HandManagementPanel 
            sessionId={session.id} 
            hands={[
              ...(session.hands || []),
              ...(session.tables?.flatMap(table => table.hands || []) || [])
            ]}
            tables={session.tables}
            readOnly={!session.isActive}
            sessionBuyIn={session.buyIn}
            initialOpenHandId={openHandId}
          />
        </div>

        <SessionModals
          session={session}
          showDeleteModal={showDeleteModal}
          showEndSessionModal={showEndSessionModal}
          showTableSelection={showTableSelection}
          showEditTable={showEditTable}
          showAddTable={showAddTable}
          selectedTable={selectedTable}
          cashOutAmount={cashOutAmount}
          onDeleteModalClose={() => setShowDeleteModal(false)}
          onEndSessionModalClose={() => setShowEndSessionModal(false)}
          onTableSelectionClose={() => setShowTableSelection(false)}
          onEditTableClose={() => setShowEditTable(false)}
          onAddTableClose={() => setShowAddTable(false)}
          onTableSelect={handleTableSelect}
          onTableUpdate={handleTableUpdate}
          onAddTable={handleAddTable}
          onAddTableButtonClick={handleAddTableButtonClick}
          onDeleteTable={handleDeleteTable}
          onDelete={handleDelete}
          onEndSession={handleEndSession}
          onCashOutAmountChange={setCashOutAmount}
          onNotesChange={handleNotesChange}
          onAddHand={handleAddHand}
          onEditHand={handleEditHand}
          onDeleteHand={handleDeleteHand}
        />
      </div>
    </div>
  );
}
