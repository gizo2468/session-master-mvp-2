import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { TableData } from '@/types/poker';
import TableCard from '@/components/poker/TableCard';
import AddTableForm from '@/components/poker/AddTableForm';
import EndSessionSheet from '@/components/poker/EndSessionSheet';
import RebuyConfirmationDialog from '@/components/poker/RebuyConfirmationDialog';
import EndTableDialog from '@/components/poker/EndTableDialog';
import CompletedTablesDisplay from '@/components/poker/CompletedTablesDisplay';
import EditTableForm from '@/components/poker/EditTableForm';

export default function LiveSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    sessions, 
    activeSession, 
    endSession, 
    updateSessionDuration, 
    addRebuy,
    addTable,
    endTable,
    addTableRebuy,
    updateTable,
    deleteTable
  } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showAddTableForm, setShowAddTableForm] = useState(false);
  
  // States for rebuy confirmation dialog
  const [showRebuyConfirmDialog, setShowRebuyConfirmDialog] = useState(false);
  const [pendingRebuyTableId, setPendingRebuyTableId] = useState<string | null>(null);
  const [pendingRebuyAmount, setPendingRebuyAmount] = useState(0);
  
  // States for end table dialog
  const [showEndTableDialog, setShowEndTableDialog] = useState(false);
  const [pendingEndTableId, setPendingEndTableId] = useState<string | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [tableNotes, setTableNotes] = useState('');
  
  // Add these missing states for bounty tournament fields
  const [bountyCount, setBountyCount] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [finalPosition, setFinalPosition] = useState('');
  
  // Add new states for multi-day tournament
  const [endReason, setEndReason] = useState<'eliminated' | 'day-ended' | null>(null);
  const [nextDayStart, setNextDayStart] = useState<Date | null>(null);
  const [chipsCarryover, setChipsCarryover] = useState('');
  
  // Add missing state for edit table functionality
  const [showEditTableDialog, setShowEditTableDialog] = useState(false);
  const [pendingEditTableId, setPendingEditTableId] = useState<string | null>(null);
  
  const session = id 
    ? sessions.find(s => s.id === id && s.isActive) 
    : activeSession;
  
  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    
    if (session && !session.isActive) {
      navigate(`/session/${session.id}`);
    }
  }, [session, navigate]);

  const autoCashOutAmount = session?.tables?.reduce((acc, table) => {
    if (table.isActive === false && typeof table.cashOut === 'number') {
      return acc + table.cashOut;
    }
    return acc;
  }, 0) ?? 0;

  const handleEndSession = () => {
    if (!session) return;

    const hasActiveTables = session.tables && session.tables.some(table => table.isActive);
    
    if (hasActiveTables) {
      toast({
        title: "Cannot End Session",
        description: "You must end all active tables before ending the session.",
        variant: "destructive"
      });
      setShowEndSessionSheet(false);
      return;
    }
    
    try {
      endSession(session.id, autoCashOutAmount, sessionNotes);
      setShowEndSessionSheet(false);
      
      toast({
        title: "Session Ended",
        description: "Your poker session has been successfully recorded."
      });
      navigate('/');
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error Ending Session",
        description: "There was a problem saving your session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleInitiateRebuy = (tableId: string, amount: number) => {
    setPendingRebuyTableId(tableId);
    setPendingRebuyAmount(amount);
    setShowRebuyConfirmDialog(true);
  };
  
  const handleConfirmRebuy = () => {
    if (!session || !pendingRebuyTableId) return;
    
    try {
      addTableRebuy(session.id, pendingRebuyTableId, pendingRebuyAmount);
      toast({
        title: "Rebuy Added",
        description: `$${pendingRebuyAmount.toFixed(2)} rebuy has been added to the table.`
      });
    } catch (error) {
      console.error("Error adding table rebuy:", error);
      toast({
        title: "Error Adding Rebuy",
        description: "There was a problem adding the rebuy. Please try again.",
        variant: "destructive"
      });
    }
    
    // Reset states
    setShowRebuyConfirmDialog(false);
    setPendingRebuyTableId(null);
    setPendingRebuyAmount(0);
  };
  
  const handleCancelRebuy = () => {
    setShowRebuyConfirmDialog(false);
    setPendingRebuyTableId(null);
    setPendingRebuyAmount(0);
  };
  
  const handleAddRebuy = (amount: number) => {
    if (!session) return;
    
    try {
      addRebuy(session.id, amount);
      toast({
        title: "Rebuy Added",
        description: `$${amount.toFixed(2)} rebuy has been added to your session.`
      });
    } catch (error) {
      console.error("Error adding rebuy:", error);
      toast({
        title: "Error Adding Rebuy",
        description: "There was a problem adding the rebuy. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddTable = (tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => {
    if (!session) return;
    
    try {
      addTable(session.id, tableData);
      toast({
        title: "Table Added",
        description: `${tableData.name} has been added to your session.`
      });
    } catch (error) {
      console.error("Error adding table:", error);
      toast({
        title: "Error Adding Table",
        description: "There was a problem adding the table. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Modified to initiate the end table process with dialog
  const handleInitiateEndTable = (tableId: string) => {
    setPendingEndTableId(tableId);
    setCashOutAmount('');
    setTableNotes('');
    setBountyCount('');
    setBountyAmount('');
    setFinalPosition('');
    setEndReason(null);
    setNextDayStart(null);
    setChipsCarryover('');
    setShowEndTableDialog(true);
  };
  
  // Modified to handle the final end table confirmation, now with multi-day support
  const handleConfirmEndTable = () => {
    if (!session || !pendingEndTableId) return;
    
    try {
      const multiDayInfo = endReason === 'day-ended' ? {
        nextDayStart: nextDayStart || undefined,
        chipsCarryover: chipsCarryover ? parseInt(chipsCarryover) : undefined,
        dayEndedWithoutElimination: true
      } : undefined;

      endTable(
        session.id, 
        pendingEndTableId, 
        endReason === 'day-ended' ? 0 : parseFloat(cashOutAmount), 
        tableNotes,
        {
          bountyCount: bountyCount ? parseInt(bountyCount) : undefined,
          bountyAmount: bountyAmount ? parseFloat(bountyAmount) : undefined,
          finalPosition: finalPosition ? parseInt(finalPosition) : undefined
        },
        multiDayInfo
      );
      toast({
        title: endReason === 'day-ended' ? "Day Ended" : "Table Ended",
        description: endReason === 'day-ended' 
          ? "Your tournament progress has been saved for the next day." 
          : "The table has been successfully ended."
      });
    } catch (error) {
      console.error("Error ending table:", error);
      toast({
        title: "Error Ending Table",
        description: "There was a problem ending the table. Please try again.",
        variant: "destructive"
      });
    }
    
    // Reset all states
    resetEndTableStates();
  };
  
  const resetEndTableStates = () => {
    setShowEndTableDialog(false);
    setPendingEndTableId(null);
    setCashOutAmount('');
    setTableNotes('');
    setBountyCount('');
    setBountyAmount('');
    setFinalPosition('');
    setEndReason(null);
    setNextDayStart(null);
    setChipsCarryover('');
  };
  
  const handleEndTable = (
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
  ) => {
    if (!session) return;
    
    try {
      endTable(session.id, tableId, cashOut, notes, bounty, multiDayInfo);
      toast({
        title: multiDayInfo?.dayEndedWithoutElimination ? "Day Ended" : "Table Ended",
        description: multiDayInfo?.dayEndedWithoutElimination 
          ? "Your tournament progress has been saved for the next day." 
          : "The table has been successfully ended."
      });
    } catch (error) {
      console.error("Error ending table:", error);
      toast({
        title: "Error Ending Table",
        description: "There was a problem ending the table. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddTableRebuy = (tableId: string, amount: number) => {
    if (!session) return;
    
    try {
      addTableRebuy(session.id, tableId, amount);
      toast({
        title: "Rebuy Added",
        description: `$${amount.toFixed(2)} rebuy has been added to the table.`
      });
    } catch (error) {
      console.error("Error adding table rebuy:", error);
      toast({
        title: "Error Adding Rebuy",
        description: "There was a problem adding the rebuy. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEditTable = (tableId: string) => {
    setPendingEditTableId(tableId);
    setShowEditTableDialog(true);
  };
  
  const handleSaveEditedTable = (updatedTable: TableData) => {
    if (!session) return;
    
    try {
      updateTable(session.id, updatedTable);
      toast({
        title: "Table Updated",
        description: "The table has been successfully updated."
      });
    } catch (error) {
      console.error("Error updating table:", error);
      toast({
        title: "Error Updating Table",
        description: "There was a problem updating the table. Please try again.",
        variant: "destructive"
      });
    }
    
    setShowEditTableDialog(false);
    setPendingEditTableId(null);
  };
  
  const handleCancelEditTable = () => {
    setShowEditTableDialog(false);
    setPendingEditTableId(null);
  };
  
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">No active session</h1>
          <p className="text-gray-600 mb-6">There is no active poker session at the moment.</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  const activeTables = session.tables?.filter(table => table.isActive) || [];
  const inactiveTables = session.tables?.filter(table => !table.isActive) || [];

  const pendingTable = pendingEndTableId 
    ? session.tables?.find(t => t.id === pendingEndTableId) 
    : null;

  const pendingEditTable = pendingEditTableId 
    ? session?.tables?.find(t => t.id === pendingEditTableId) 
    : null;

  // Map session format to AddTableForm format
  const getTableFormat = (sessionFormat: string): 'Cash' | 'Tournament' => {
    if (sessionFormat.includes('Tournament')) return 'Tournament';
    return 'Cash';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-md">
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-poker-feltGreen p-0"
            >
              <Icon name="ArrowLeft" size={16} className="mr-1" />
              <span>Home</span>
            </Button>
            <h1 className="text-xl font-bold">Live Session</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-4">
        <div className="container mx-auto max-w-md px-4 pb-8">
          <SessionTimerCard 
            startTime={session?.startTime}
            gameType={session?.gameType}
            format={session?.format}
            smallBlind={session?.smallBlind}
            bigBlind={session?.bigBlind}
            onEndSession={() => setShowEndSessionSheet(true)}
            onAddTable={() => setShowAddTableForm(true)}
          />
          
          <SessionDetailsCard 
            session={{
              ...session,
              location: session.tableName || session.location
            }}
          />
          
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
                          sessionId={session.id}
                          onEndTable={(tableId, cashOut, notes, bounty, multiDayInfo) => 
                            handleEndTable(tableId, cashOut, notes, bounty, multiDayInfo)
                          }
                          onAddRebuy={(tableId, amount) => handleAddTableRebuy(tableId, amount)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <CompletedTablesDisplay tables={inactiveTables} sessionId={session.id} />
              </div>
            )}
          </div>
        </div>
      </main>
      
      <EndSessionSheet
        open={showEndSessionSheet}
        onOpenChange={setShowEndSessionSheet}
        session={session}
        autoCashOutAmount={autoCashOutAmount}
        sessionNotes={sessionNotes}
        onSessionNotesChange={setSessionNotes}
        onEndSession={handleEndSession}
      />
      
      <RebuyConfirmationDialog
        open={showRebuyConfirmDialog}
        onOpenChange={setShowRebuyConfirmDialog}
        amount={pendingRebuyAmount}
        onConfirm={handleConfirmRebuy}
        onCancel={handleCancelRebuy}
      />
      
      <EndTableDialog
        open={showEndTableDialog}
        onOpenChange={setShowEndTableDialog}
        table={pendingTable}
        cashOutAmount={cashOutAmount}
        onCashOutAmountChange={setCashOutAmount}
        tableNotes={tableNotes}
        onTableNotesChange={setTableNotes}
        bountyCount={bountyCount}
        onBountyCountChange={setBountyCount}
        bountyAmount={bountyAmount}
        onBountyAmountChange={setBountyAmount}
        finalPosition={finalPosition}
        onFinalPositionChange={setFinalPosition}
        endReason={endReason}
        onEndReasonChange={setEndReason}
        nextDayStart={nextDayStart}
        onNextDayStartChange={setNextDayStart}
        chipsCarryover={chipsCarryover}
        onChipsCarryoverChange={setChipsCarryover}
        onConfirm={handleConfirmEndTable}
        onCancel={resetEndTableStates}
      />
      
      <AddTableForm
        open={showAddTableForm}
        onOpenChange={setShowAddTableForm}
        sessionFormat={getTableFormat(session.format)} // Convert session format to table format
        onAddTable={(tableData) => {
          handleAddTable(tableData);
        }}
      />
      
      {pendingEditTable && (
        <EditTableForm
          open={showEditTableDialog}
          onOpenChange={setShowEditTableDialog}
          table={pendingEditTable}
          onSave={handleSaveEditedTable}
          onDelete={(tableId) => {
            deleteTable(session!.id, tableId);
            toast({
              title: "Table Deleted",
              description: "The table has been successfully deleted."
            });
            setShowEditTableDialog(false);
            setPendingEditTableId(null);
          }}
        />
      )}
    </div>
  );
}
