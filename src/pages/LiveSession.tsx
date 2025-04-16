
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import TournamentControlsCard from '@/components/poker/TournamentControlsCard';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';

export default function LiveSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, activeSession, endSession, updateSessionDuration, addRebuy } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [showEndSessionSheet, setShowEndSessionSheet] = React.useState(false);
  const [cashOutAmount, setCashOutAmount] = React.useState('');
  const [sessionNotes, setSessionNotes] = React.useState('');
  
  // Determine which session to display - either by ID param or active session
  const session = id 
    ? sessions.find(s => s.id === id && s.isActive) 
    : activeSession;
  
  useEffect(() => {
    // If no valid active session, redirect to home
    if (!session) {
      navigate('/');
      return;
    }
    
    // If the session exists but isn't active, redirect to session detail page
    if (session && !session.isActive) {
      navigate(`/session/${session.id}`);
    }
  }, [session, navigate]);
  
  const handleEndSession = () => {
    if (!session || !cashOutAmount) return;
    
    // End the session with cashout and notes
    endSession(session.id, parseFloat(cashOutAmount), sessionNotes);
    setShowEndSessionSheet(false);
    
    toast({
      title: "Session Ended",
      description: "Your poker session has been successfully recorded."
    });
    navigate('/');
  };
  
  const handleAddRebuy = (amount: number) => {
    if (!session) return;
    
    addRebuy(session.id, amount);
    toast({
      title: "Rebuy Added",
      description: `$${amount.toFixed(2)} rebuy has been added to your session.`
    });
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
            <h1 className="font-serif text-xl font-bold">Live Session</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-4">
        <div className="container mx-auto max-w-md px-4 pb-8">
          {/* Session Timer */}
          <SessionTimerCard 
            startTime={session.startTime}
            gameType={session.gameType}
            format={session.format}
            smallBlind={session.smallBlind}
            bigBlind={session.bigBlind}
            onEndSession={() => setShowEndSessionSheet(true)}
          />
          
          {/* Session Details */}
          <SessionDetailsCard session={session} />
          
          {/* Controls for both Cash Game and Tournament */}
          <TournamentControlsCard 
            session={session}
            onAddRebuy={handleAddRebuy}
          />
          
          {/* Hand Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <HandManagementPanel 
              sessionId={session.id}
              hands={session.hands || []}
            />
          </div>
        </div>
      </main>
      
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
                    cashOutAmount && parseFloat(cashOutAmount) >= session.buyIn 
                      ? 'text-green-600' 
                      : cashOutAmount 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                  }`}>
                    {cashOutAmount 
                      ? `$${(parseFloat(cashOutAmount) - session.buyIn).toFixed(2)}` 
                      : '$0.00'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  {cashOutAmount && (
                    <div 
                      className={`h-full ${
                        parseFloat(cashOutAmount) >= session.buyIn 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ 
                        width: cashOutAmount 
                          ? `${Math.min(Math.abs((parseFloat(cashOutAmount) - session.buyIn) / session.buyIn * 100), 100)}%` 
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
