
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSessionContext } from '@/context/SessionContext';
import { PokerSession } from '@/types/poker';

export const useEndTableActions = (currentSession: PokerSession | null) => {
  const { endTable } = useSessionContext();
  const { toast } = useToast();

  const [showEndTableDialog, setShowEndTableDialog] = useState(false);
  const [pendingEndTableId, setPendingEndTableId] = useState<string | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [tableNotes, setTableNotes] = useState('');
  const [bountyCount, setBountyCount] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [finalPosition, setFinalPosition] = useState('');
  const [endReason, setEndReason] = useState<'eliminated' | 'day-ended' | null>(null);
  const [nextDayStart, setNextDayStart] = useState<Date | null>(null);
  const [chipsCarryover, setChipsCarryover] = useState('');

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

  const handleConfirmEndTable = () => {
    if (!currentSession || !pendingEndTableId) return;
    
    try {
      const multiDayInfo = endReason === 'day-ended' ? {
        nextDayStart: nextDayStart || undefined,
        chipsCarryover: chipsCarryover ? parseInt(chipsCarryover) : undefined,
        dayEndedWithoutElimination: true
      } : undefined;

      endTable(
        currentSession.id, 
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

  const pendingTable = pendingEndTableId 
    ? currentSession?.tables?.find(t => t.id === pendingEndTableId) 
    : null;

  return {
    showEndTableDialog,
    setShowEndTableDialog,
    pendingTable,
    cashOutAmount,
    setCashOutAmount,
    tableNotes,
    setTableNotes,
    bountyCount,
    setBountyCount,
    bountyAmount,
    setBountyAmount,
    finalPosition,
    setFinalPosition,
    endReason,
    setEndReason,
    nextDayStart,
    setNextDayStart,
    chipsCarryover,
    setChipsCarryover,
    handleInitiateEndTable,
    handleConfirmEndTable,
    resetEndTableStates
  };
};
