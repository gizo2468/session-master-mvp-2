
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSessionContext } from '@/context/SessionContext';

export const useRebuyActions = (sessionId: string | undefined) => {
  const { addTableRebuy } = useSessionContext();
  const { toast } = useToast();

  const [showRebuyConfirmDialog, setShowRebuyConfirmDialog] = useState(false);
  const [pendingRebuyTableId, setPendingRebuyTableId] = useState<string | null>(null);
  const [pendingRebuyAmount, setPendingRebuyAmount] = useState(0);

  const handleInitiateRebuy = (tableId: string, amount: number) => {
    setPendingRebuyTableId(tableId);
    setPendingRebuyAmount(amount);
    setShowRebuyConfirmDialog(true);
  };

  const handleConfirmRebuy = () => {
    if (!sessionId || !pendingRebuyTableId) return;
    
    try {
      addTableRebuy(sessionId, pendingRebuyTableId, pendingRebuyAmount);
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
    
    setShowRebuyConfirmDialog(false);
    setPendingRebuyTableId(null);
    setPendingRebuyAmount(0);
  };

  const handleCancelRebuy = () => {
    setShowRebuyConfirmDialog(false);
    setPendingRebuyTableId(null);
    setPendingRebuyAmount(0);
  };

  return {
    showRebuyConfirmDialog,
    setShowRebuyConfirmDialog,
    pendingRebuyAmount,
    handleInitiateRebuy,
    handleConfirmRebuy,
    handleCancelRebuy
  };
};
