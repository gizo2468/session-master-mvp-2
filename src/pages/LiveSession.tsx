import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { TableData } from '@/types/poker';
import TableCard from '@/components/poker/TableCard';
import AddTableForm from '@/components/poker/AddTableForm';
import { format } from 'date-fns';
import TableTimerDisplay from '@/components/poker/TableTimerDisplay';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

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
  
  // Add states for rebuy confirmation dialog
  const [showRebuyConfirmDialog, setShowRebuyConfirmDialog] = useState(false);
  const [pendingRebuyTableId, setPendingRebuyTableId] = useState<string | null>(null);
  const [pendingRebuyAmount, setPendingRebuyAmount] = useState(0);
  
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
  
  const handleInitiateRebuy = (tableId: string, amount: number) => {
    setPendingRebuyTableId(tableId);
    setPendingRebuyAmount(amount);
    setShowRebuyConfirmDialog(true);
  };
  
  const handleConfirmRebuy = () => {
    if (!session || !pendingRebuyTableId) return;
    
    try {
      addTableRebuy(session.id, pendingRebuyTableId, pendingRebuyAmount);
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
    
    // Reset states
    setShowRebuyConfirmDialog(false);
    setPendingRebuyTableId(null);
    setPendingRebuyAmount(0);
  };
  
  const handleCancelRebuy = () => {
    setShowRebuyConfirmDialog(false);
    setPendingRebuyTableId(null);
    setPendingRebuyAmount(0);
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
  
  const handleEndTable = (
    tableId: string, 
    cashOut: number, 
    notes?: string,
    bounty?: { bountyCount?: number, bountyAmount?: number }
  ) => {
    if (!session) return;
    
    try {
      endTable(session.id, tableId, cashOut, notes, bounty);
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
            <h1 className="text-xl font-bold">Live Session</h1>
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
                <Icon name="plus" className="h-4 w-4 mr-2" /> 
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
                        <div key={table.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-lg">{table.location}</h3>
                              <p className="text-sm text-gray-600">
                                {table.gameType} • {table.format}
                              </p>
                              {table.format === 'Tournament' && table.tournamentTypes?.[0] && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-poker-gold/10 text-poker-gold text-xs rounded-full">
                                  {table.tournamentTypes[0]}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Redesigned Start, Duration row with better visual balance */}
                          <div className="flex justify-center items-center my-4 text-sm border-b border-gray-100 pb-4">
                            <div className="flex flex-1 justify-center items-center">
                              <div className="text-center">
                                <div className="text-gray-500 font-medium text-xs uppercase mb-1">Start</div>
                                <div className="font-medium">{format(new Date(table.startTime), 'h:mm a')}</div>
                              </div>
                            </div>
                            
                            <div className="flex-1 flex justify-center items-center border-x border-gray-100 px-4">
                              <div className="text-center">
                                <div className="text-gray-500 font-medium text-xs uppercase mb-1">Duration</div>
                                <TableTimerDisplay 
                                  startTime={table.startTime}
                                  isActive={table.isActive}
                                  className="flex justify-center"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Styled Buy-in and Rebuy section */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-right">
                              <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
                              <span className="font-bold text-2xl">
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
                                  <span className="font-bold text-2xl text-amber-600">
                                    +${extra.toFixed(2)}
                                  </span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                          
                          {/* Table controls */}
                          <div className="mt-4 flex gap-2 justify-between">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleInitiateRebuy(table.id, table.format === 'Tournament' ? 
                                (table.tournamentBuyIn || table.initialBuyIn || table.buyIn) : 
                                0)}
                            >
                              <Icon name="plus" className="mr-1 h-4 w-4" /> Rebuy
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="flex-1"
                              onClick={() => handleEndTable(table.id, 0)}
                            >
                              <Icon name="x" className="mr-1 h-4 w-4" /> End Table
                            </Button>
                          </div>
                        </div>
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
                          
                          {/* Redesigned Start, Duration, End row with better visual balance */}
                          <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 pb-4">
                            <div className="flex flex-1 justify-center items-center">
                              <div className="text-center">
                                <div className="text-gray-500 font-medium text-xs uppercase mb-1">Start</div>
                                <div className="font-medium">{format(new Date(table.startTime), 'MMM d, h:mm a')}</div>
                              </div>
                            </div>
                            
                            {table.startTime && table.endTime && (
                              <div className="flex-1 flex justify-center items-center border-x border-gray-100 px-4">
                                <div className="text-center">
                                  <div className="text-gray-500 font-medium text-xs uppercase mb-1">Duration</div>
                                  <TableTimerDisplay 
                                    startTime={table.startTime} 
                                    endTime={table.endTime}
                                    isActive={false}
                                    className="flex justify-center"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {table.endTime && (
                              <div className="flex-1 flex justify-center items-center">
                                <div className="text-center">
                                  <div className="text-gray-500 font-medium text-xs uppercase mb-1">End</div>
                                  <div className="font-medium">{format(new Date(table.endTime), 'MMM d, h:mm a')}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Styled Buy-in and Rebuy section */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-right">
                              <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
                              <span className="font-bold text-2xl">
                                ${(table.initialBuyIn ?? table.buyIn).toFixed(2)}
                              </span>
                            </div>
                            {(() => {
                              const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
                              const addOnTotal = table.addOns ? table.addOns : 0;
                              const extra = rebuyTotal + addOnTotal;
                              return extra > 0 ? (
                                <div className="text-right">
                                  <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REBUY</span>
                                  <span className="font-bold text-2xl text-amber-600">
                                    +${extra.toFixed(2)}
                                  </span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                          
                          {/* Tournament-specific fields */}
                          <div className="text-xs space-y-1 mb-4">
                            {table.format === 'Tournament' && table.startingBB && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Starting BBs:</span>
                                <span className="font-medium">{table.startingBB}BB</span>
                              </div>
                            )}
                            
                            {table.tournamentTypes && table.tournamentTypes.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tournament Type:</span>
                                <span className="inline-flex px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                  {table.tournamentTypes[0]}
                                </span>
                              </div>
                            )}
                            
                            {table.format === 'Tournament' && 
                            table.tournamentTypes?.some(type => ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)) && 
                            table.bountyCount !== undefined && 
                            table.bountyCount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Players Eliminated:</span>
                                <span className="font-medium">{table.bountyCount}</span>
                              </div>
                            )}
                            
                            {table.format === 'Tournament' && 
                            table.tournamentTypes?.some(type => ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)) && 
                            table.bountyAmount !== undefined && 
                            table.bountyAmount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Bounty Collected:</span>
                                <span className="font-medium text-poker-gold">${table.bountyAmount.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Repositioned Total Cash Out to be more prominent */}
                          {table.cashOut !== undefined && (
                            <div className="flex flex-col items-center justify-center mt-4 mb-2">
                              <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">TOTAL CASH OUT</span>
                              <span className="font-bold text-2xl text-poker-gold">
                                ${(table.cashOut ?? 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <HandManagementPanel 
              sessionId={session.id}
              hands={session.hands || []}
            />
          </div>
        </div>
      </main>
      
      {/* Rebuy Confirmation Dialog */}
      <Dialog open={showRebuyConfirmDialog} onOpenChange={setShowRebuyConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rebuy</DialogTitle>
            <DialogDescription>
              Are you sure you want to add a rebuy to this table?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelRebuy}
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
