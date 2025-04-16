
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import TableManagementPanel from '@/components/poker/TableManagementPanel';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, updateSessionNotes, deleteSession, endSession } = useSessionContext();
  
  const session = sessions.find(s => s.id === id);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  
  useEffect(() => {
    if (session) {
      setSessionNotes(session.notes || '');
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
  
  // Calculate total profit/loss across all tables
  let totalProfit = 0;
  let totalBuyIn = 0;
  let totalCashOut = 0;
  let profitClass = '';
  
  session.tables.forEach(table => {
    totalBuyIn += table.buyIn || 0;
    if (table.cashOut !== undefined) {
      totalCashOut += table.cashOut;
      totalProfit += (table.cashOut - table.buyIn);
    }
  });
  
  profitClass = totalProfit >= 0 ? 'text-green-500' : 'text-poker-red';
  
  const handleSaveNotes = () => {
    updateSessionNotes(session.id, sessionNotes);
  };
  
  const handleEndSession = () => {
    endSession(session.id, sessionNotes);
    navigate('/');
  };
  
  const handleDelete = () => {
    deleteSession(session.id);
    setShowDeleteModal(false);
    navigate('/');
  };
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const formattedDate = format(new Date(session.startTime), 'MMM d, yyyy h:mm a');
  const formattedEndDate = session.endTime 
    ? format(new Date(session.endTime), 'MMM d, yyyy h:mm a')
    : null;
  
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
              {session.isActive && (
                <Button 
                  onClick={() => setShowEndSessionModal(true)}
                  className="text-sm py-1 px-3 bg-poker-gold hover:bg-poker-darkGold text-white rounded"
                >
                  End Session
                </Button>
              )}
              <Button 
                onClick={() => setShowDeleteModal(true)}
                className="text-sm py-1 px-3 border border-red-300 text-poker-red rounded"
              >
                Delete
              </Button>
            </div>
          </div>
        </header>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm text-gray-500">Started</span>
              <p className="font-medium">{formattedDate}</p>
            </div>
            
            {formattedEndDate && (
              <div>
                <span className="text-sm text-gray-500">Ended</span>
                <p className="font-medium">{formattedEndDate}</p>
              </div>
            )}
          </div>
          
          {!session.isActive && (
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Total Buy-in:</span>
                <span className="font-medium">${totalBuyIn.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Total Cash out:</span>
                <span className="font-medium">${totalCashOut.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Net Profit/Loss:</span>
                <span className={`font-bold ${profitClass}`}>
                  {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="session-notes" className="block text-sm font-medium mb-1">
              Session Notes
            </label>
            <Textarea
              id="session-notes"
              className="min-h-[100px] w-full"
              placeholder="Add notes about this session..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleSaveNotes} 
            size="sm" 
            variant="outline"
          >
            Save Notes
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <TableManagementPanel sessionId={session.id} />
          </CardContent>
        </Card>
      </div>
      
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
      
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">End Session</h2>
            <p className="mb-4">Are you sure you want to end this session? Any active tables will also be ended.</p>
            
            <div className="mb-6">
              <label htmlFor="end-session-notes" className="block text-sm font-medium mb-1">
                Final Notes (Optional)
              </label>
              <Textarea
                id="end-session-notes"
                placeholder="Add any final notes about this session..."
                className="min-h-[100px] w-full border border-gray-300 rounded-md"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleEndSession}
                className="flex-1 py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
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
  );
}
