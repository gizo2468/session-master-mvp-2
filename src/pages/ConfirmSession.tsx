
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/Lucide';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import TournamentControlsCard from '@/components/poker/TournamentControlsCard';
import HandManagementPanel from '@/components/poker/HandManagementPanel';

export default function ConfirmSession() {
  const navigate = useNavigate();
  const { activeSession, endSession, updateSessionDuration, addRebuy, updateSession } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  
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
      title: t('session_ended'),
      description: t('session_ended_success'),
    });
    navigate('/');
  };
  
  const handleAddRebuy = (amount: number) => {
    if (!activeSession) return;
    
    addRebuy(activeSession.id, amount);
    toast({
      title: t('rebuy_added'),
      description: `$${amount.toFixed(2)} ${t('rebuy_added_description')}`,
    });
  };
  
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">{t('no_active_session')}</h1>
          <p className="text-gray-600 mb-6">{t('no_active_session_description')}</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
          >
            {t('return_to_home')}
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
              <Icon name="ArrowLeft" size={16} className="mr-1 icon-flip-rtl" />
              <span>{t('home')}</span>
            </Button>
            <h1 className="font-serif text-xl font-bold">{t('live_session')}</h1>
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
            onAddRebuy={handleAddRebuy}
          />
          
          {/* Hand Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <HandManagementPanel 
              sessionId={activeSession.id}
              hands={activeSession.hands || []}
            />
          </div>
        </div>
      </main>
      
      {/* End Session Sheet */}
      {showEndSessionSheet && (
        <Sheet open={showEndSessionSheet} onOpenChange={setShowEndSessionSheet}>
          <SheetContent side={isMobile ? "bottom" : "right"} className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{t('end_session')}</SheetTitle>
              <SheetDescription>
                {t('enter_cash_out_amount')}
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="mb-4">
                <label htmlFor="cashout" className="block text-sm font-medium mb-1">
                  {t('cash_out')}
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
                  <span className="text-sm">{t('profit_loss')}:</span>
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
              </div>
              
              <div className="mb-6">
                <label htmlFor="session-notes" className="block text-sm font-medium mb-1">
                  {t('session_notes')}
                </label>
                <Textarea
                  id="session-notes"
                  placeholder={t('session_notes_placeholder')}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={4}
                />
              </div>
              
              <SheetFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEndSessionSheet(false)}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  disabled={!cashOutAmount} 
                  onClick={handleEndSession}
                  className="bg-poker-feltGreen hover:bg-poker-green text-white"
                >
                  {t('end_session')}
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
