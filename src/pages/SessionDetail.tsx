import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import { Button } from '@/components/ui/button';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, updateSession, deleteSession, endSession, pauseSession, resumeSession } = useSessionContext();
  
  const session = sessions.find(s => s.id === id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  
  const [formData, setFormData] = useState({
    location: '',
    buyIn: '0',
    smallBlind: '0',
    bigBlind: '0',
    gameType: 'NLH',
    format: 'Cash'
  });
  
  useEffect(() => {
    if (session) {
      setFormData({
        location: session.location || '',
        buyIn: session.buyIn !== undefined ? session.buyIn.toString() : '0',
        smallBlind: session.smallBlind !== undefined ? session.smallBlind.toString() : '0',
        bigBlind: session.bigBlind !== undefined ? session.bigBlind.toString() : '0',
        gameType: session.gameType || 'NLH',
        format: session.format || 'Cash'
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
  
  const isCompleted = !session.isActive && session.cashOut !== undefined;
  let profit = 0;
  let profitClass = '';
  
  if (isCompleted && session.cashOut !== undefined) {
    profit = session.cashOut - session.buyIn;
    profitClass = profit >= 0 ? 'text-green-500' : 'text-poker-red';
  }
  
  const handleSaveEdit = () => {
    if (!session) return;
    
    const updatedSession = {
      ...session,
      location: formData.location,
      buyIn: parseFloat(formData.buyIn),
      smallBlind: parseFloat(formData.smallBlind),
      bigBlind: parseFloat(formData.bigBlind),
      gameType: formData.gameType as 'NLH' | 'PLO',
      format: formData.format as 'Cash' | 'Tournament',
    };
    
    updateSession(updatedSession);
    setIsEditing(false);
  };
  
  const handleEndSession = () => {
    if (!session || !cashOutAmount) return;
    
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const formattedDate = format(new Date(session.startTime), 'MMM d, yyyy h:mm a');
  const formattedEndDate = session.endTime 
    ? format(new Date(session.endTime), 'MMM d, yyyy h:mm a')
    : null;
    
  // Calculate session duration
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
              {isEditing ? "Edit Session" : session.location}
            </h1>
            {!isEditing && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm py-1 px-3 border border-gray-300 rounded"
                >
                  Edit
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="text-sm py-1 px-3 border border-red-300 text-poker-red rounded"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </header>
        
        {isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Game Type</label>
              <select
                name="gameType"
                value={formData.gameType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="NLH">No Limit Hold'em</option>
                <option value="PLO">Pot Limit Omaha</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Format</label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="Cash">Cash Game</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="buyin">
                Buy-in Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  id="buyin"
                  name="buyIn"
                  type="number"
                  value={formData.buyIn}
                  onChange={handleChange}
                  className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="smallBlind">
                  Small Blind
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="smallBlind"
                    name="smallBlind"
                    type="number"
                    value={formData.smallBlind}
                    onChange={handleChange}
                    className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="bigBlind">
                  Big Blind
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="bigBlind"
                    name="bigBlind"
                    type="number"
                    value={formData.bigBlind}
                    onChange={handleChange}
                    className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
              >
                Save Changes
              </button>
              
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
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
            
            {!isEditing && (
              <SessionDetailsCard session={session} />
            )}
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-sm text-gray-500">Started</span>
                  <p className="font-medium">{formattedDate}</p>
                </div>
                
                {sessionDuration && (
                  <div className="text-center">
                    <span className="text-sm text-gray-500">Duration</span>
                    <p className="font-medium">{sessionDuration}</p>
                  </div>
                )}
                
                {formattedEndDate && (
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Ended</span>
                    <p className="font-medium">{formattedEndDate}</p>
                  </div>
                )}
              </div>
              
              {isCompleted && session.cashOut !== undefined && (
                <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Cash out:</span>
                    <span className="font-medium">${session.cashOut.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Profit/Loss:</span>
                    <span className={`font-bold ${profitClass}`}>
                      {profit > 0 ? '+' : ''}{profit.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              
              {session.isActive && (
                <button
                  onClick={() => setShowEndSessionModal(true)}
                  className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md mt-4"
                >
                  End Session
                </button>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <HandManagementPanel 
                sessionId={session.id} 
                hands={session.hands || []}
              />
            </div>
          </>
        )}
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
  );
}
