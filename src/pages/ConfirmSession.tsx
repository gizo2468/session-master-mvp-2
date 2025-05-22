
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/Lucide';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import TournamentControlsCard from '@/components/poker/TournamentControlsCard';
import TableTimerDisplay from '@/components/poker/TableTimerDisplay';
import { Badge } from '@/components/ui/badge';
import TableCard from '@/components/poker/TableCard';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';

export default function ConfirmSession() {
  const navigate = useNavigate();
  const { activeSession, endSession, updateSessionDuration, addRebuy, updateSession, endTable, addTableRebuy } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Add states for rebuy confirmation dialog
  const [showRebuyConfirmDialog, setShowRebuyConfirmDialog] = useState(false);
  const [rebuyAmount, setRebuyAmount] = useState(0);
  
  // Add states for bounty tournament fields in the end session form
  const [finalPosition, setFinalPosition] = useState('');
  const [playersEliminated, setPlayersEliminated] = useState('');
  const [bountyCollected, setBountyCollected] = useState('');
  
  useEffect(() => {
    if (!activeSession) {
      navigate('/');
      return;
    }
  }, [activeSession, navigate]);
  
  // Helper function to check if a session has any bounty tournament tables
  const hasAnyBountyTournaments = () => {
    if (!activeSession || !activeSession.tables) return false;
    
    return activeSession.tables.some(table => 
      table.format === 'Tournament' && 
      table.tournamentTypes?.some(type => 
        ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
      )
    );
  };
  
  const handleEndSession = () => {
    if (!activeSession || !cashOutAmount) return;
    
    // Prepare additional notes based on bounty data if applicable
    let completeNotes = sessionNotes || '';
    
    // If this is a bounty session and we have the data, append it to notes
    if (hasAnyBountyTournaments()) {
      const bountyInfo = [];
      
      if (finalPosition) {
        bountyInfo.push(`Final Position: ${finalPosition}`);
      }
      
      if (playersEliminated) {
        bountyInfo.push(`Players Eliminated: ${playersEliminated}`);
      }
      
      if (bountyCollected) {
        bountyInfo.push(`Total Bounty Collected: $${bountyCollected}`);
      }
      
      if (bountyInfo.length > 0) {
        const bountyNotes = `\n\nBounty Tournament Info:\n${bountyInfo.join('\n')}`;
        completeNotes += bountyNotes;
      }
    }
    
    // End the session with cashout and notes
    endSession(activeSession.id, parseFloat(cashOutAmount), completeNotes);
    setShowEndSessionSheet(false);
    
    toast({
      title: "Session Ended",
      description: "Your poker session has been successfully recorded."
    });
    navigate('/');
  };
  
  const handleInitiateRebuy = (amount: number) => {
    setRebuyAmount(amount);
    setShowRebuyConfirmDialog(true);
  };
  
  const handleConfirmRebuy = () => {
    if (!activeSession) return;
    
    addRebuy(activeSession.id, rebuyAmount);
    toast({
      title: "Rebuy Added",
      description: `$${rebuyAmount.toFixed(2)} rebuy has been added to your session.`
    });
    setShowRebuyConfirmDialog(false);
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
    if (!activeSession) return;
    
    try {
      endTable(activeSession.id, tableId, cashOut, notes, bounty, multiDayInfo);
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
    if (!activeSession) return;
    
    try {
      addTableRebuy(activeSession.id, tableId, amount);
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
  
  if (!activeSession) {
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
              <Icon name="arrow-left" size={16} className="mr-1" />
              <span>Home</span>
            </Button>
            <h1 className="text-xl font-bold">Live Session</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-4">
        <div className="container mx-auto max-w-md px-4 pb-8">
          {/* Session Timer */}
          <SessionTimerCard 
            startTime={activeSession.startTime}
            gameType={activeSession.gameType}
            format={activeSession.format}
            smallBlind={activeSession.smallBlind}
            bigBlind={activeSession.bigBlind}
            onEndSession={() => setShowEndSessionSheet(true)}
          />
          
          {/* Session Details */}
          <SessionDetailsCard session={activeSession} />
          
          {/* Controls for both Cash Game and Tournament */}
          <TournamentControlsCard 
            session={activeSession}
            onAddRebuy={handleInitiateRebuy}
          />
          
          {/* Remove global HandManagementPanel */}
          
          {/* Using TableCard component for all tables - pass sessionId to each table */}
          {activeSession.tables && activeSession.tables.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-extrabold tracking-tight mb-4">Tables</h3>
              <div className="space-y-3">
                {activeSession.tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onEndTable={handleEndTable}
                    onAddRebuy={handleAddTableRebuy}
                    sessionId={activeSession.id}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
              <h3 className="text-xl font-extrabold tracking-tight mb-2">No Tables</h3>
              <p className="text-gray-500">Add a table to track hands and results separately.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Rebuy Confirmation Dialog */}
      <Dialog open={showRebuyConfirmDialog} onOpenChange={setShowRebuyConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rebuy</DialogTitle>
            <DialogDescription>
              Are you sure you want to add a rebuy to this session?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRebuyConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
              onClick={handleConfirmRebuy}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* End Session Sheet - Updated to include bounty tournament fields when applicable */}
      {showEndSessionSheet && (
        <Sheet open={showEndSessionSheet} onOpenChange={setShowEndSessionSheet}>
          <SheetContent side="center" className="max-w-md max-h-[85vh] overflow-auto">
            <SheetHeader>
              <SheetTitle>End Session</SheetTitle>
              <SheetDescription>
                Enter your payout amount to complete your session.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="mb-4">
                <label htmlFor="cashout" className="block text-sm font-medium mb-1">
                  Regular Payout
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="cashout"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    placeholder="0.00"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Profit/Loss:</span>
                  <span className={`text-sm font-bold ${
                    cashOutAmount && parseFloat(cashOutAmount) >= activeSession.buyIn 
                      ? 'text-green-600' 
                      : cashOutAmount 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                  }`}>
                    {cashOutAmount 
                      ? `$${(parseFloat(cashOutAmount) - activeSession.buyIn).toFixed(2)}` 
                      : '$0.00'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  {cashOutAmount && (
                    <div 
                      className={`h-full ${
                        parseFloat(cashOutAmount) >= activeSession.buyIn 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ 
                        width: cashOutAmount 
                          ? `${Math.min(Math.abs((parseFloat(cashOutAmount) - activeSession.buyIn) / activeSession.buyIn * 100), 100)}%` 
                          : '0%' 
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Show bounty tournament specific fields if applicable */}
              {hasAnyBountyTournaments() && (
                <div className="space-y-4 mb-6 border-t border-b border-gray-100 py-4">
                  <h3 className="text-md font-medium">Bounty Tournament Details</h3>
                  
                  <div>
                    <label htmlFor="finalPosition" className="block text-sm font-medium mb-1">
                      Final Placement
                    </label>
                    <input
                      id="finalPosition"
                      type="number"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                      placeholder="Enter your final position (e.g. 3 for 3rd)"
                      value={finalPosition}
                      onChange={(e) => setFinalPosition(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="playersEliminated" className="block text-sm font-medium mb-1">
                      Players Eliminated
                    </label>
                    <input
                      id="playersEliminated"
                      type="number"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                      placeholder="Number of players knocked out"
                      value={playersEliminated}
                      onChange={(e) => setPlayersEliminated(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bountyCollected" className="block text-sm font-medium mb-1">
                      Bounty Payout
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        id="bountyCollected"
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                        placeholder="0.00"
                        value={bountyCollected}
                        onChange={(e) => setBountyCollected(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Session Notes (Optional)
                </label>
                <Textarea
                  id="notes"
                  className="w-full min-h-[100px] border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                  placeholder="Add any notes about this session..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEndSessionSheet(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEndSession}
                  disabled={!cashOutAmount}
                  className="flex-1 bg-poker-gold hover:bg-poker-darkGold text-white"
                >
                  End Session
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
