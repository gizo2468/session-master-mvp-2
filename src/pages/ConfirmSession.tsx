
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
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import TableTimerDisplay from '@/components/poker/TableTimerDisplay';
import { Badge } from '@/components/ui/badge';
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
  const { activeSession, endSession, updateSessionDuration, addRebuy, updateSession } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Add states for rebuy confirmation dialog
  const [showRebuyConfirmDialog, setShowRebuyConfirmDialog] = useState(false);
  const [rebuyAmount, setRebuyAmount] = useState(0);
  
  useEffect(() => {
    if (!activeSession) {
      navigate('/');
      return;
    }
  }, [activeSession, navigate]);
  
  const handleEndSession = () => {
    if (!activeSession || !cashOutAmount) return;
    
    // End the session with cashout and notes
    endSession(activeSession.id, parseFloat(cashOutAmount), sessionNotes);
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
          
          {/* Hand Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <HandManagementPanel 
              sessionId={activeSession.id}
              hands={activeSession.hands || []}
            />
          </div>
          
          {/* Add TimerDisplay to tables if they exist */}
          {activeSession.tables && activeSession.tables.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-extrabold tracking-tight mb-4">Tables</h3>
              <div className="space-y-3">
                {activeSession.tables.map((table) => (
                  <div key={table.id} className="border border-gray-200 rounded-lg p-4">
                    {/* Improved header layout */}
                    <div className="text-center mb-2">
                      <h4 className="font-semibold">{table.location}</h4>
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                        <span>{table.gameType}</span>
                        <span>•</span> 
                        <span>{table.format}</span>
                      </div>
                      {table.format === 'Tournament' && table.tournamentTypes?.[0] && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-poker-gold/10 text-poker-gold text-xs rounded-full">
                          {table.tournamentTypes[0]}
                        </span>
                      )}
                    </div>
                    
                    {/* Redesigned Start, Duration row with better visual balance */}
                    <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 pb-4">
                      <div className="flex flex-1 justify-center items-center">
                        <div className="text-center">
                          <div className="text-gray-500 font-medium text-xs uppercase mb-1">Start</div>
                          <div className="font-medium">{new Date(table.startTime).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}</div>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex justify-center items-center border-x border-gray-100 px-4">
                        <div className="text-center">
                          <div className="text-gray-500 font-medium text-xs uppercase mb-1">Duration</div>
                          <TableTimerDisplay 
                            startTime={table.startTime}
                            endTime={table.endTime} 
                            isActive={table.isActive}
                            className="flex justify-center"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Styled Buy-in and Rebuy section */}
                    <div className="flex items-center gap-4 justify-center">
                      <div className="text-right">
                        <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
                        <span className="font-bold text-xl">
                          ${table.initialBuyIn?.toFixed(2) ?? table.buyIn.toFixed(2)}
                        </span>
                      </div>
                      {(() => {
                        const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
                        const addOnTotal = table.addOns ? table.addOns : 0;
                        const extra = rebuyTotal + addOnTotal;
                        return extra > 0 ? (
                          <div className="text-right">
                            <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REBUY</span>
                            <span className="font-bold text-xl text-amber-600">
                              +${extra.toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    {!table.isActive && table.cashOut !== undefined && (
                      <div className={table.cashOut > table.buyIn ? "text-green-600" : "text-red-600"}>
                        {table.cashOut > table.buyIn ? "+" : ""}${(table.cashOut - table.buyIn).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
      
      {/* End Session Sheet */}
      {showEndSessionSheet && (
        <Sheet open={showEndSessionSheet} onOpenChange={setShowEndSessionSheet}>
          <SheetContent side={isMobile ? "bottom" : "right"} className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>End Session</SheetTitle>
              <SheetDescription>
                Enter your cash out amount to complete your session.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="mb-4">
                <label htmlFor="cashout" className="block text-sm font-medium mb-1">
                  Cash Out Amount
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
              
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Notes (Optional)
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
