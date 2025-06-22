import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import TableDetailsCard from '@/components/poker/TableDetailsCard';
import SessionTimeBadge from '@/components/poker/SessionTimeBadge';
import TableSelectionModal from '@/components/poker/TableSelectionModal';
import EditTableForm from '@/components/poker/EditTableForm';
import ProfitLossBadge from '@/components/poker/ProfitLossBadge';
import { useIsMobile } from '@/hooks/use-mobile';
import { TableData } from '@/types/poker';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, updateSession, deleteSession, endSession, pauseSession, resumeSession } = useSessionContext();
  
  // FIXED: Find session regardless of active status
  const session = sessions.find(s => s.id === id);
  const isMobile = useIsMobile();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [showEditTable, setShowEditTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  
  const [formData, setFormData] = useState({
    location: '',
    buyIn: '0',
    smallBlind: '0',
    bigBlind: '0',
    gameType: 'NLH',
    format: 'Cash',
    notes: ''
  });
  
  useEffect(() => {
    if (session) {
      setFormData({
        location: session.location || '',
        buyIn: session.buyIn !== undefined ? session.buyIn.toString() : '0',
        smallBlind: session.smallBlind !== undefined ? session.smallBlind.toString() : '0',
        bigBlind: session.bigBlind !== undefined ? session.bigBlind.toString() : '0',
        gameType: session.gameType || 'NLH',
        format: session.format || 'Cash',
        notes: session.notes || ''
      });
    }
  }, [session]);
  
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <button
            onClick={() => navigate('/')}
            className="py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  // FIXED: Check for completion using both isActive and cashOut
  const isCompleted = !session.isActive && session.cashOut !== undefined;
  
  // Calculate total initial buy-ins across all tables
  const calculateTotalInitialBuyin = () => {
    if (!session.tables || session.tables.length === 0) {
      return session.initialBuyIn || session.buyIn;
    }
    
    let totalInitialBuyin = 0;
    session.tables.forEach((table) => {
      totalInitialBuyin += table.initialBuyIn || 0;
    });
    
    return totalInitialBuyin;
  };
  
  // Calculate additional buy-ins (rebuys, add-ons)
  const calculateAdditionalBuyins = () => {
    if (!session.tables || session.tables.length === 0) {
      if (session.initialBuyIn) {
        return session.buyIn - session.initialBuyIn;
      }
      
      let additional = 0;
      
      if (session.rebuys && session.rebuys > 0) {
        additional += ((session.rebuys || 0) * (session.tournamentBuyIn || session.buyIn / session.rebuys));
      }
      
      if (session.addOns && session.addOns > 0) {
        additional += ((session.addOns || 0) * (session.tournamentBuyIn || session.buyIn / session.addOns));
      }
      
      return additional;
    }
    
    // Calculate from tables
    let totalBuyin = 0, totalInitialBuyin = 0;
    session.tables.forEach((table) => {
      totalBuyin += table.buyIn || 0;
      totalInitialBuyin += table.initialBuyIn || 0;
    });
    
    return totalBuyin - totalInitialBuyin;
  };
  
  // Calculate total rebuy count across all tables
  const calculateTotalRebuys = () => {
    if (!session.tables || session.tables.length === 0) {
      return session.rebuys || 0;
    }
    
    let totalRebuys = 0;
    session.tables.forEach((table) => {
      totalRebuys += table.rebuys || 0;
    });
    
    return totalRebuys;
  };
  
  // Calculate total cashout - using ONLY cashOut, do NOT include bounties
  const calculateTotalCashout = () => {
    if (!session.tables || session.tables.length === 0) {
      return session.cashOut || 0;
    }
    
    let totalCashout = 0;
    session.tables.forEach((table) => {
      // Add only regular cashout - do NOT add bounty earnings
      totalCashout += (table.cashOut || 0);
    });
    
    console.log('Session tables:', session.tables);
    console.log('Calculated total cashout:', totalCashout);
    
    return totalCashout;
  };
  
  // Calculate total profit/loss from all tables (using the corrected total cashout)
  const calculateTotalProfitLoss = () => {
    if (!session.tables || session.tables.length === 0) {
      return (session.cashOut || 0) - session.buyIn;
    }
    
    const totalCashout = calculateTotalCashout();
    let totalBuyin = 0;
    
    session.tables.forEach((table) => {
      totalBuyin += table.buyIn || 0;
    });
    
    return totalCashout - totalBuyin;
  };
  
  const totalInitialBuyin = calculateTotalInitialBuyin();
  const additionalBuyins = calculateAdditionalBuyins();
  const totalRebuys = calculateTotalRebuys();
  const totalCashout = calculateTotalCashout();
  const profit = calculateTotalProfitLoss();
  const profitClass = profit >= 0 ? 'text-green-500' : 'text-poker-red';
  
  const handleEditClick = () => {
    if (session.tables && session.tables.length > 0) {
      setShowTableSelection(true);
    } else {
      // If no tables, show a message
      alert('No tables found in this session to edit.');
    }
  };

  const handleTableSelect = (table: TableData) => {
    setSelectedTable(table);
    setShowTableSelection(false);
    setShowEditTable(true);
  };

  const handleTableUpdate = (updatedTable: TableData) => {
    if (!session || !session.tables) return;
    
    const updatedTables = session.tables.map(table => 
      table.id === updatedTable.id ? updatedTable : table
    );
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    updateSession(updatedSession);
  };
  
  // FIXED: Only allow ending active sessions
  const handleEndSession = () => {
    if (!session || !cashOutAmount || !session.isActive) return;
    
    endSession(session.id, parseFloat(cashOutAmount));
    setShowEndSessionModal(false);
    navigate('/');
  };
  
  const handleDelete = () => {
    if (!session) return;
    
    deleteSession(session.id);
    setShowDeleteModal(false);
    navigate('/');
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const formattedDate = format(new Date(session.startTime), 'MMM d, yyyy');
  const formattedTime = format(new Date(session.startTime), 'h:mm a');
  
  const formattedEndDate = session.endTime 
    ? format(new Date(session.endTime), 'MMM d, yyyy')
    : null;
  const formattedEndTime = session.endTime 
    ? format(new Date(session.endTime), 'h:mm a')
    : null;
    
  const calculateDuration = () => {
    if (!session.endTime) return null;
    
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  const sessionDuration = session.endTime ? calculateDuration() : null;
  
  // Determine if blinds should be shown - strict check for Cash format only
  const shouldShowBlinds = session.format === 'Cash' && session.smallBlind !== undefined && session.bigBlind !== undefined;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={handleGoBack} 
            variant="ghost" 
            className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
          >
            ← Back
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-serif font-bold">
              {session.location}
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={handleEditClick}
                className="text-sm py-1 px-3 border border-gray-300 rounded"
              >
                Edit Tables
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="text-sm py-1 px-3 border border-red-300 text-poker-red rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </header>
        
        {/* FIXED: Only show timer for active sessions */}
        {session.isActive && (
          <SessionTimerCard
            startTime={session.startTime}
            gameType={session.gameType}
            format={session.format}
            smallBlind={session.smallBlind}
            bigBlind={session.bigBlind}
            onEndSession={() => setShowEndSessionModal(true)}
          />
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-row flex-wrap gap-4 mb-6">
            <SessionTimeBadge
              title="Started"
              value={`${formattedDate}\n${formattedTime}`}
              variant="timeStarted"
              type="started"
            />
            
            {sessionDuration && (
              <SessionTimeBadge
                title="Duration"
                value={sessionDuration}
                variant="timeDuration"
                type="duration"
              />
            )}
            
            {formattedEndDate && formattedEndTime && (
              <SessionTimeBadge
                title="Ended"
                value={`${formattedEndDate}\n${formattedEndTime}`}
                variant="timeEnded"
                type="ended"
              />
            )}
          </div>
          
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Game:</span>
              <span className="font-medium">{session.gameType}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Format:</span>
              <span className="font-medium">{session.format}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Buy-in:</span>
              <span className="font-medium">
                ${totalInitialBuyin.toFixed(2)}
                {additionalBuyins > 0 && (
                  <span className="text-gray-600"> (+${additionalBuyins.toFixed(2)})</span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Re-Buys:</span>
              <span className="font-medium">{totalRebuys}</span>
            </div>
            
            {/* Only show blinds for Cash game format */}
            {shouldShowBlinds && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Blinds:</span>
                <span className="font-medium">${session.smallBlind || 0}/${session.bigBlind || 0}</span>
              </div>
            )}
            
            {isCompleted && (
              <>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Total Payout:</span>
                  <span className="font-medium">${totalCashout.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col items-center py-2">
                  <span className="text-gray-500 mb-2">Profit/Loss</span>
                  <ProfitLossBadge profit={profit} size="lg" />
                </div>
                
                {session.notes && (
                  <div className="flex flex-col py-2 border-b">
                    <span className="text-gray-500 mb-1">Session Notes:</span>
                    <p className="text-sm bg-gray-50 p-3 rounded">{session.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* FIXED: Only show end session button for active sessions */}
          {session.isActive && (
            <button
              onClick={() => setShowEndSessionModal(true)}
              className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
            >
              End Session
            </button>
          )}
        </div>
        
        {!session.isActive && Array.isArray(session.tables) && session.tables.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">Tables Played</h2>
            {session.tables.map(table => {
              return (
                <TableDetailsCard key={table.id} table={table} />
              );
            })}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <HandManagementPanel 
            sessionId={session.id} 
            hands={session.hands || []}
          />
        </div>

        {/* Table Selection Modal */}
        <TableSelectionModal
          open={showTableSelection}
          onOpenChange={setShowTableSelection}
          tables={session.tables || []}
          onSelectTable={handleTableSelect}
        />

        {/* Edit Table Modal */}
        {selectedTable && (
          <EditTableForm
            open={showEditTable}
            onOpenChange={setShowEditTable}
            table={selectedTable}
            onSave={handleTableUpdate}
          />
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Delete Session</h2>
              <p className="mb-6">Are you sure you want to delete this session? This action cannot be undone.</p>
              
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-4 bg-poker-red hover:bg-red-700 text-white font-bold rounded-md"
                >
                  Delete
                </button>
                
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* FIXED: Only show end session modal for active sessions */}
        {showEndSessionModal && session.isActive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">End Session</h2>
              <p className="mb-4">Please enter your cash out amount:</p>
              
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="notes">Session Notes</label>
                <textarea
                  id="notes"
                  placeholder="How did your session go? Note any significant hands, reads, or things to improve..."
                  className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                  value={session.notes || ''}
                  onChange={(e) => {
                    if (session) {
                      const updatedSession = {
                        ...session,
                        notes: e.target.value
                      };
                      updateSession(updatedSession);
                    }
                  }}
                ></textarea>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleEndSession}
                  className="flex-1 py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
                  disabled={!cashOutAmount}
                >
                  End Session
                </button>
                
                <button
                  onClick={() => setShowEndSessionModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
