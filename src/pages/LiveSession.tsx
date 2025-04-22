import React, { useEffect, useState } from 'react';
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
import { TableData } from '@/types/poker';
import TableCard from '@/components/poker/TableCard';
import AddTableForm from '@/components/poker/AddTableForm';
import { format } from 'date-fns';

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
    addTableRebuy
  } = useSessionContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [showEndSessionSheet, setShowEndSessionSheet] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showAddTableForm, setShowAddTableForm] = useState(false);
  
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
  
  const handleEndTable = (tableId: string, cashOut: number, notes?: string) => {
    if (!session) return;
    
    try {
      endTable(session.id, tableId, cashOut, notes);
      toast({
        title: "Table Ended",
        description: "The table has been successfully ended."
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
          <SessionTimerCard 
            startTime={session.startTime}
            gameType={session.gameType}
            format={session.format}
            smallBlind={session.smallBlind}
            bigBlind={session.bigBlind}
            onEndSession={() => setShowEndSessionSheet(true)}
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
              <Button 
                onClick={() => setShowAddTableForm(true)}
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
                size="sm"
              >
                <Icon name="Plus" className="h-4 w-4 mr-2" /> 
                Add Table
              </Button>
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
                          onEndTable={handleEndTable}
                          onAddRebuy={handleAddTableRebuy}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {inactiveTables.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold mb-2">Completed Tables</h4>
                    <div className="space-y-3">
                      {inactiveTables.map((table) => (
                        <div key={table.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold">{table.name || table.location}</h3>
                              <p className="text-xs text-gray-500 font-semibold mt-0.5">{table.location}</p>
                              <p className="text-sm text-gray-600">{table.gameType} • {table.format}</p>
                            </div>
                            {table.cashOut !== undefined && (
                              <div className={`text-lg font-bold ${
                                table.cashOut >= table.buyIn ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {table.cashOut >= table.buyIn ? '+' : ''}
                                ${(table.cashOut - table.buyIn).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-sm mt-1">
                            <span className="text-gray-600 font-medium mr-1">Buy-In:</span>
                            <span className="font-semibold">
                              ${(table.initialBuyIn ?? table.buyIn).toFixed(2)}
                            </span>
                            {(() => {
                              const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
                              const addOnTotal = table.addOns ? table.addOns : 0;
                              const extra = rebuyTotal + addOnTotal;
                              return extra > 0 ? (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  (+${extra.toFixed(2)})
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex items-center text-sm mt-1">
                            <span className="text-gray-600 font-medium mr-1">Cash Out:</span>
                            <span className="font-semibold">
                              ${(table.cashOut !== undefined ? table.cashOut : 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(table.startTime), 'MMM d, h:mm a')}
                            {table.endTime && ` - ${format(new Date(table.endTime), 'h:mm a')}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <TournamentControlsCard 
            session={session}
            onAddRebuy={handleAddRebuy}
          />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <HandManagementPanel 
              sessionId={session.id}
              hands={session.hands || []}
            />
          </div>
        </div>
      </main>
      
      <AddTableForm
        open={showAddTableForm}
        onOpenChange={setShowAddTableForm}
        onAddTable={handleAddTable}
        fixedFormat={session.format === 'Cash' ? 'Cash' : session.format === 'Tournament' ? 'Tournament' : undefined}
      />
      
      {showEndSessionSheet && (
        <Sheet open={showEndSessionSheet} onOpenChange={setShowEndSessionSheet}>
          <SheetContent side={isMobile ? "bottom" : "right"} className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>End Session</SheetTitle>
              <SheetDescription>
                The Cash Out Amount is automatically calculated from all closed tables in this session.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="mb-4">
                <label htmlFor="cashout" className="block text-sm font-medium mb-1">
                  Cash Out Amount
                </label>
                <div className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 text-lg font-semibold select-text">
                  ${autoCashOutAmount.toFixed(2)}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Profit/Loss:</span>
                  <span className={`text-sm font-bold ${
                    autoCashOutAmount >= session.buyIn 
                      ? 'text-green-600' 
                      : autoCashOutAmount < session.buyIn
                        ? 'text-red-600' 
                        : 'text-gray-800'
                  }`}>
                    {`$${(autoCashOutAmount - session.buyIn).toFixed(2)}`}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      autoCashOutAmount >= session.buyIn 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs((autoCashOutAmount - session.buyIn) / session.buyIn * 100), 100)}%`
                    }}
                  />
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
                  disabled={false}
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
