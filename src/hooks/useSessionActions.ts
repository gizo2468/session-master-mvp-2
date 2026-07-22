
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { PokerSession, TableData } from '@/types/poker';

export const useSessionActions = (currentSession: PokerSession | null) => {
  const navigate = useNavigate();
  const { 
    endSession, 
    addRebuy,
    addTable,
    endTable,
    addTableRebuy,
    refreshSessionsFromDatabase,
    updateSessionDuration
  } = useSessionContext();
  const { toast } = useToast();

  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showAddTableForm, setShowAddTableForm] = useState(false);
  const [customSessionDuration, setCustomSessionDuration] = useState<number | null>(null);

  const autoCashOutAmount = currentSession?.tables?.reduce((acc, table) => {
    if (table.isActive === false && typeof table.cashOut === 'number') {
      return acc + table.cashOut;
    }
    return acc;
  }, 0) ?? 0;

  const handleEndSession = async () => {
    if (!currentSession) return;

    const hasActiveTables = currentSession.tables && currentSession.tables.some(table => table.isActive);
    
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
      // Note: Custom duration is now saved immediately when user clicks Save in the modal
      // No need to save it again here - this prevents double-writes
      
      await endSession(currentSession.id, autoCashOutAmount, sessionNotes);
      setShowEndSessionSheet(false);
      setCustomSessionDuration(null);
      
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

  const handleAddRebuy = (amount: number) => {
    if (!currentSession) return;
    
    try {
      addRebuy(currentSession.id, amount);
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
    if (!currentSession) return;
    
    try {
      addTable(currentSession.id, tableData);
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
    if (!currentSession) return;
    
    try {
      endTable(currentSession.id, tableId, cashOut, notes, bounty, multiDayInfo);
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
    if (!currentSession) return;
    
    try {
      addTableRebuy(currentSession.id, tableId, amount);
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

  const handleCustomDurationChange = async (durationSeconds: number) => {
    if (!currentSession) return;
    
    // Update local state for immediate UI feedback
    setCustomSessionDuration(durationSeconds);
    
    // Persist to database immediately when user clicks Save
    await updateSessionDuration(currentSession.id, durationSeconds);
    

  };

  return {
    showEndSessionSheet,
    setShowEndSessionSheet,
    sessionNotes,
    setSessionNotes,
    showAddTableForm,
    setShowAddTableForm,
    autoCashOutAmount,
    handleEndSession,
    handleAddRebuy,
    handleAddTable,
    handleEndTable,
    handleAddTableRebuy,
    handleCustomDurationChange
  };
};
