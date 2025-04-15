
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Icon from '@/components/ui/Lucide';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import HandManagementPanel from '@/components/poker/HandManagementPanel';

export default function ConfirmSession() {
  const navigate = useNavigate();
  const { activeSession, endSession, pauseSession, resumeSession, updateSessionDuration, addRebuy, addAddon } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  
  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  const [showRebuySheet, setShowRebuySheet] = useState(false);
  
  const [cashOutAmount, setCashOutAmount] = useState('');
  
  const [rebuyAmount, setRebuyAmount] = useState('');
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (!activeSession) {
      navigate('/');
      return;
    }
    
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime % 60 === 0) {
            updateSessionDuration(activeSession.id, newTime / 60);
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, timerActive, navigate, updateSessionDuration]);
  
  const handlePauseResume = () => {
    if (!activeSession) return;
    
    if (timerActive) {
      pauseSession(activeSession.id);
      setTimerActive(false);
      toast({
        title: "Session Paused",
        description: "Your poker session has been paused."
      });
    } else {
      resumeSession(activeSession.id);
      setTimerActive(true);
      toast({
        title: "Session Resumed",
        description: "Your poker session has been resumed."
      });
    }
  };
  
  const handleEndSession = () => {
    if (!activeSession || !cashOutAmount) return;
    
    endSession(activeSession.id, parseFloat(cashOutAmount));
    setShowEndSessionSheet(false);
    toast({
      title: "Session Ended",
      description: "Your poker session has been successfully recorded."
    });
    navigate('/');
  };
  
  const handleAddRebuy = () => {
    if (!activeSession || !rebuyAmount) return;
    
    addRebuy(activeSession.id, parseFloat(rebuyAmount));
    setRebuyAmount('');
    setShowRebuySheet(false);
    toast({
      title: "Rebuy Added",
      description: `$${rebuyAmount} rebuy has been added to your session.`
    });
  };
  
  const handleAddAddon = () => {
    if (!activeSession || !rebuyAmount) return;
    
    addAddon(activeSession.id, parseFloat(rebuyAmount));
    setRebuyAmount('');
    setShowRebuySheet(false);
    toast({
      title: "Add-on Added",
      description: `$${rebuyAmount} add-on has been added to your session.`
    });
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
  
  const formattedStartTime = format(new Date(activeSession.startTime), 'h:mm a');
  const formattedDate = format(new Date(activeSession.startTime), 'MMM d, yyyy');
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="container mx-auto max-w-md">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => navigate('/')}
              className="text-poker-feltGreen flex items-center gap-1"
            >
              <Icon name="ArrowLeft" size={16} />
              <span>Home</span>
            </button>
            <h1 className="font-serif text-xl font-bold">Live Session</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container mx-auto max-w-md px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <div className="mb-2 text-sm text-gray-500">Session Time</div>
            <div className="text-5xl font-mono font-bold mb-3">{formatTime(elapsedTime)}</div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-left">
                <div className="text-sm text-gray-500">Started</div>
                <div className="font-medium">{formattedStartTime}</div>
                <div className="text-xs text-gray-400">{formattedDate}</div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">Game</div>
                <div className="font-medium">{activeSession.gameType}</div>
                <div className="text-xs text-gray-400">
                  {activeSession.format} - ${activeSession.smallBlind}/${activeSession.bigBlind}
                </div>
              </div>
            </div>
            
            <div className="flex justify-around">
              <Button
                onClick={handlePauseResume}
                variant="outline"
                className="flex items-center gap-2"
              >
                {timerActive ? (
                  <><Icon name="Pause" size={16} /> Pause</>
                ) : (
                  <><Icon name="Play" size={16} /> Resume</>
                )}
              </Button>
              
              <Button
                onClick={() => setShowEndSessionSheet(true)}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Icon name="CircleStop" size={16} /> End Session
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Session Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Location:</span>
                <span className="font-medium">{activeSession.location}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Buy-in:</span>
                <span className="font-medium">${activeSession.buyIn.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Blinds:</span>
                <span className="font-medium">${activeSession.smallBlind}/${activeSession.bigBlind}</span>
              </div>
              
              {activeSession.format === 'Tournament' && (
                <>
                  {(activeSession.rebuys && activeSession.rebuys > 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rebuys:</span>
                      <span className="font-medium">{activeSession.rebuys}</span>
                    </div>
                  )}
                  
                  {(activeSession.addOns && activeSession.addOns > 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Add-ons:</span>
                      <span className="font-medium">{activeSession.addOns}</span>
                    </div>
                  )}
                </>
              )}
              
              {activeSession.notes && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Notes:</span>
                  <p className="text-sm bg-gray-50 p-3 rounded">{activeSession.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          {activeSession.format === 'Tournament' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-medium mb-4">Tournament Controls</h2>
              
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => setShowRebuySheet(true)}
                  variant="outline"
                  className="w-full flex justify-center items-center gap-2"
                >
                  <Icon name="Plus" size={16} /> Add Rebuy/Add-on
                </Button>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <HandManagementPanel 
              sessionId={activeSession.id}
              hands={activeSession.hands || []}
            />
          </div>
        </div>
      </main>
      
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
      
      <Sheet open={showRebuySheet} onOpenChange={setShowRebuySheet}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Rebuy or Add-on</SheetTitle>
            <SheetDescription>
              Enter the amount for your rebuy or add-on.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <div className="mb-6">
              <label htmlFor="rebuyAmount" className="block text-sm font-medium mb-1">
                Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  id="rebuyAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                  placeholder="0.00"
                  value={rebuyAmount}
                  onChange={(e) => setRebuyAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleAddRebuy}
                disabled={!rebuyAmount}
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                Add Rebuy
              </Button>
              
              <Button
                onClick={handleAddAddon}
                disabled={!rebuyAmount}
                className="bg-poker-feltGreen hover:bg-poker-feltGreen/90 text-white"
              >
                Add Add-on
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowRebuySheet(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
