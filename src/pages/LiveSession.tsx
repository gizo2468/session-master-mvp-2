import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
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
  
  // States for rebuy confirmation dialog
  const [showRebuyConfirmDialog, setShowRebuyConfirmDialog] = useState(false);
  const [pendingRebuyTableId, setPendingRebuyTableId] = useState<string | null>(null);
  const [pendingRebuyAmount, setPendingRebuyAmount] = useState(0);
  
  // States for end table dialog
  const [showEndTableDialog, setShowEndTableDialog] = useState(false);
  const [pendingEndTableId, setPendingEndTableId] = useState<string | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [tableNotes, setTableNotes] = useState('');
  
  // Add these missing states for bounty tournament fields
  const [bountyCount, setBountyCount] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [finalPosition, setFinalPosition] = useState('');
  
  // Add new states for multi-day tournament
  const [endReason, setEndReason] = useState<'eliminated' | 'day-ended' | null>(null);
  const [nextDayStart, setNextDayStart] = useState<Date | null>(null);
  const [chipsCarryover, setChipsCarryover] = useState('');
  
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
  
  // Modified to initiate the end table process with dialog
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
  
  // Modified to handle the final end table confirmation, now with multi-day support
  const handleConfirmEndTable = () => {
    if (!session || !pendingEndTableId) return;
    
    try {
      const multiDayInfo = endReason === 'day-ended' ? {
        nextDayStart: nextDayStart || undefined,
        chipsCarryover: chipsCarryover ? parseInt(chipsCarryover) : undefined,
        dayEndedWithoutElimination: true
      } : undefined;

      // Modified: Make sure we're passing the bounty data but don't require finalPosition
      endTable(
        session.id, 
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
    
    // Reset all states
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
  
  const handleCancelEndTable = () => {
    // Reset all states
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
    if (!session) return;
    
    try {
      endTable(session.id, tableId, cashOut, notes, bounty, multiDayInfo);
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
  
  // Helper function to check if a table is a multi-day tournament
  const isMultiDayTournament = (table: TableData) => {
    return table.format === 'Tournament' && table.isMultiDay === true;
  };

  // Helper function to check if a table is a bounty tournament
  const isBountyTournament = (table: TableData) => {
    return table.format === 'Tournament' && 
      table.tournamentTypes?.some(type => 
        ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
      );
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
            startTime={session?.startTime}
            gameType={session?.gameType}
            format={session?.format}
            smallBlind={session?.smallBlind}
            bigBlind={session?.bigBlind}
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
                        <TableCard
                          key={table.id}
                          table={table}
                          sessionId={session.id}
                          onEndTable={(tableId, cashOut, notes, bounty, multiDayInfo) => 
                            handleEndTable(tableId, cashOut, notes, bounty, multiDayInfo)
                          }
                          onAddRebuy={(tableId, amount) => handleAddTableRebuy(tableId, amount)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {inactiveTables.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold mb-2">Completed Tables</h4>
                    <div className="space-y-4">
                      {inactiveTables.map((table) => (
                        <div 
                          key={table.id} 
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold">{table.name || table.location}</h3>
                              <p className="text-xs text-gray-500 font-semibold mt-0.5">{table.location}</p>
                              <p className="text-sm text-gray-600">{table.gameType} • {table.format}</p>
                              {table.isMultiDay && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-poker-feltGreen/10 text-poker-feltGreen rounded-full text-xs">
                                  Multi-Day
                                </span>
                              )}
                            </div>
                            {table.cashOut !== undefined && !table.dayEndedWithoutElimination && (
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
                          
                          {/* Styled Buy-in and Rebuy section with rebuy count */}
                          <div className="flex items-center gap-4 mb-4 justify-center">
                            <div className="text-right">
                              <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
                              <span className="font-bold text-xl">
                                ${(table.initialBuyIn ?? table.buyIn).toFixed(2)}
                              </span>
                            </div>
                            {(() => {
                              const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
                              const addOnTotal = table.addOns ? table.addOns : 0;
                              const extra = rebuyTotal + addOnTotal;
                              const rebuyCount = Math.floor(rebuyTotal / (table.initialBuyIn ?? table.buyIn));
                              return extra > 0 ? (
                                <div className="text-right">
                                  <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REBUY</span>
                                  <div>
                                    <span className="font-bold text-xl text-amber-600">
                                      +${extra.toFixed(2)}
                                    </span>
                                    {rebuyCount > 0 && (
                                      <span className="text-sm text-gray-500 ml-1">({rebuyCount})</span>
                                    )}
                                  </div>
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
                          
                          {/* Multi-day tournament continuation details */}
                          {table.dayEndedWithoutElimination && (
                            <div className="bg-poker-feltGreen/5 p-3 rounded-lg mb-4 border border-poker-feltGreen/20">
                              <h5 className="font-bold text-sm text-poker-feltGreen mb-2">Tournament Continuing</h5>
                              
                              {table.chipsCarryover && (
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="text-gray-600">Continuing with:</span>
                                  <span className="font-medium">{table.chipsCarryover.toLocaleString()} chips</span>
                                </div>
                              )}
                              
                              {table.nextDayStart && (
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="text-gray-600">Next Day:</span>
                                  <span className="font-medium">{format(new Date(table.nextDayStart), 'MMM d, h:mm a')}</span>
                                </div>
                              )}
                              
                              {/* We don't have explicit day tracking in the data model, 
                                 so we're showing a generic continuation message */}
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">Day completed, continuing</span>
                              </div>
                              
                              {table.notes && (
                                <div className="mt-2 pt-2 border-t border-poker-feltGreen/10">
                                  <p className="text-xs text-gray-600 italic">"{table.notes}"</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Repositioned Total Cash Out to be more prominent */}
                          <div className="flex flex-col items-center justify-center mt-4 mb-2">
                            <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">
                              {table.dayEndedWithoutElimination ? 'STATUS' : 'TOTAL PAYOUT'}
                            </span>
                            {table.dayEndedWithoutElimination ? (
                              <span className="font-bold text-xl text-poker-feltGreen">Continuing</span>
                            ) : (
                              <span className="font-bold text-xl text-poker-gold">
                                ${(() => {
                                  const isBountyTournament = table.tournamentTypes?.some(type => 
                                    ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
                                  );
                                  
                                  if (isBountyTournament && table.bountyAmount !== undefined) {
                                    return ((table.cashOut ?? 0) + table.bountyAmount).toFixed(2);
                                  }
                                  
                                  return (table.cashOut ?? 0).toFixed(2);
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* End Session Sheet */}
      <Sheet open={showEndSessionSheet} onOpenChange={setShowEndSessionSheet}>
        <SheetContent side="center" className="max-w-md max-h-[85vh] overflow-auto">
          <SheetHeader>
            <SheetTitle>End Session</SheetTitle>
            <SheetDescription>
              Confirm to end your current poker session.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Session Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Cash Out:</span>
                    <span className="font-bold">${autoCashOutAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Buy In:</span>
                    <span className="font-bold">${session?.buyIn.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profit/Loss:</span>
                    <span className={`font-bold ${
                      autoCashOutAmount > (session?.buyIn || 0) 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {autoCashOutAmount > (session?.buyIn || 0) ? '+' : ''}
                      ${(autoCashOutAmount - (session?.buyIn || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700">
                  Session Notes (Optional)
                </label>
                <Textarea
                  id="sessionNotes"
                  placeholder="Add any notes about this session..."
                  className="mt-1 w-full"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <SheetFooter className="sm:justify-start gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEndSessionSheet(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
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
      
      {/* End Table Dialog */}
      <Dialog open={showEndTableDialog} onOpenChange={setShowEndTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Table</DialogTitle>
            <DialogDescription>
              {pendingEndTableId && session?.tables?.find(t => t.id === pendingEndTableId)?.isMultiDay && 
               session?.tables?.find(t => t.id === pendingEndTableId)?.format === 'Tournament' && !endReason
                ? "Are you ending this multi-day tournament table because you were eliminated or because the day has ended?"
                : "Enter your cash out amount to complete this table."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {pendingEndTableId && session?.tables?.find(t => t.id === pendingEndTableId)?.isMultiDay &&
             session?.tables?.find(t => t.id === pendingEndTableId)?.format === 'Tournament' && !endReason && (
              <div className="flex flex-col gap-4 mb-6">
                <Button
                  variant="outline"
                  className="w-full py-6 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setEndReason('eliminated')}
                >
                  <Icon name="X" className="mr-2 h-5 w-5" /> Eliminated (Cash Out)
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => setEndReason('day-ended')}
                >
                  <Icon name="Calendar" className="mr-2 h-5 w-5" /> Day Ended (Continuing)
                </Button>
              </div>
            )}
            
            {(!pendingEndTableId || 
              !session?.tables?.find(t => t.id === pendingEndTableId)?.isMultiDay ||
              endReason === 'eliminated' ||
              session?.tables?.find(t => t.id === pendingEndTableId)?.format === 'Cash') && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="tableCashout" className="block text-sm font-medium mb-1">
                    Cash Out Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      id="tableCashout"
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

                {/* Always show the final position field for Tournament format but make it optional */}
                {pendingEndTableId && session?.tables?.find(t => t.id === pendingEndTableId)?.format === 'Tournament' && 
                 endReason !== 'day-ended' && (
                  <div>
                    <label htmlFor="finalPosition" className="block text-sm font-medium mb-1">
                      Final Position (Optional)
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
                )}

                {/* Fixed conditional rendering for bounty tournament fields */}
                {pendingEndTableId && 
                 session?.tables?.find(t => t.id === pendingEndTableId) && 
                 isBountyTournament(session.tables.find(t => t.id === pendingEndTableId)!) &&
                 endReason !== 'day-ended' && (
                  <>
                    <div>
                      <label htmlFor="bountyCount" className="block text-sm font-medium mb-1">
                        Players Eliminated (Optional)
                      </label>
                      <input
                        id="bountyCount"
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                        placeholder="Number of players eliminated"
                        value={bountyCount}
                        onChange={(e) => setBountyCount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bountyAmount" className="block text-sm font-medium mb-1">
                        Total Bounty Collected (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          id="bountyAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                          placeholder="0.00"
                          value={bountyAmount}
                          onChange={(e) => setBountyAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {endReason !== 'day-ended' && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Profit/Loss:</span>
                      <span className={`text-sm font-bold ${
                        cashOutAmount && pendingEndTableId && session?.tables?.find(t => t.id === pendingEndTableId)?.buyIn && 
                        parseFloat(cashOutAmount) >= (session.tables.find(t => t.id === pendingEndTableId)?.buyIn || 0)
                          ? 'text-green-600' 
                          : cashOutAmount 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                      }`}>
                        {cashOutAmount && pendingEndTableId && session?.tables?.find(t => t.id === pendingEndTableId)
                          ? `$${(parseFloat(cashOutAmount) - (session.tables.find(t => t.id === pendingEndTableId)?.buyIn || 0)).toFixed(2)}` 
                          : '$0.00'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      {cashOutAmount && pendingEndTableId && session?.tables?.find(t => t.id === pendingEndTableId) && (
                        <div 
                          className={`h-full ${
                            parseFloat(cashOutAmount) >= (session.tables.find(t => t.id === pendingEndTableId)?.buyIn || 0)
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ 
                            width: cashOutAmount 
                              ? `${Math.min(Math.abs((parseFloat(cashOutAmount) - (session.tables.find(t => t.id === pendingEndTableId)?.buyIn || 0)) / 
                                  (session.tables.find(t => t.id === pendingEndTableId)?.buyIn || 1) * 100), 100)}%` 
                              : '0%' 
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="tableNotes" className="block text-sm font-medium mb-1">
                    Notes (Optional)
                  </label>
                  <Textarea
                    id="tableNotes"
                    className="w-full min-h-[100px] border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    placeholder="Add any notes about this table..."
                    value={tableNotes}
                    onChange={(e) => setTableNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {endReason === 'day-ended' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="nextDayStart" className="block text-sm font-medium mb-1">
                    Next Day Start (Optional)
                  </label>
                  <input
                    id="nextDayStart"
                    type="datetime-local"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    value={nextDayStart ? nextDayStart.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setNextDayStart(e.target.value ? new Date(e.target.value) : null)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When does the next day of this tournament begin?
                  </p>
                </div>
                
                <div>
                  <label htmlFor="chipsCarryover" className="block text-sm font-medium mb-1">
                    Chips Carryover
                  </label>
                  <input
                    id="chipsCarryover"
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    placeholder="Enter chip count"
                    value={chipsCarryover}
                    onChange={(e) => setChipsCarryover(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many chips are you carrying over to the next day?
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEndTable}>
              Cancel
            </Button>
            <Button 
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
              onClick={handleConfirmEndTable}
              disabled={(endReason !== 'day-ended' && !cashOutAmount) || 
                        (endReason === 'day-ended' && !chipsCarryover)}
            >
              {endReason === 'day-ended' ? 'End Day' : 'End Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Table Dialog */}
      <AddTableForm
        open={showAddTableForm}
        onOpenChange={setShowAddTableForm}
        onAddTable={(tableData) => {
          handleAddTable(tableData);
        }}
      />
    </div>
  );
}
