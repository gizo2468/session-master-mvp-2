
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/Lucide';
import { Card, CardContent } from '@/components/ui/card';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import TableManagementPanel from '@/components/poker/TableManagementPanel';

export default function ConfirmSession() {
  const navigate = useNavigate();
  const { activeSession, endSession, updateSessionNotes } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  
  useEffect(() => {
    if (!activeSession) {
      navigate('/');
      return;
    }
    
    if (activeSession?.notes) {
      setSessionNotes(activeSession.notes);
    }
  }, [activeSession, navigate]);
  
  const handleEndSession = () => {
    if (!activeSession) return;
    
    // End the session with notes
    endSession(activeSession.id, sessionNotes);
    setShowEndSessionSheet(false);
    
    toast({
      title: "Session Ended",
      description: "Your poker session has been successfully recorded."
    });
    navigate('/');
  };
  
  const handleUpdateNotes = () => {
    if (!activeSession) return;
    
    updateSessionNotes(activeSession.id, sessionNotes);
    toast({
      title: "Notes Updated",
      description: "Your session notes have been saved."
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
            startTime={activeSession.startTime}
            location={activeSession.location}
            onEndSession={() => setShowEndSessionSheet(true)}
          />
          
          {/* Session Notes */}
          <Card className="bg-white rounded-lg shadow-md mb-6">
            <CardContent className="p-4">
              <div className="mb-4">
                <label htmlFor="session-notes" className="block text-sm font-medium mb-1">
                  Session Notes
                </label>
                <Textarea
                  id="session-notes"
                  className="min-h-[80px] w-full"
                  placeholder="Add notes about this session..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleUpdateNotes} 
                size="sm" 
                variant="outline"
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
          
          {/* Table Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <TableManagementPanel sessionId={activeSession.id} />
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
                End your poker session. Any active tables will also be ended.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Session Notes
                </label>
                <Textarea
                  id="notes"
                  className="w-full min-h-[100px] border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                  placeholder="Add any final notes about this session..."
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
