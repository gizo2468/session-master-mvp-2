
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { differenceInMinutes, differenceInHours, format } from 'date-fns';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionHeader from '@/components/session/SessionHeader';
import SessionEditForm from '@/components/session/SessionEditForm';
import SessionDetailsDisplay from '@/components/session/SessionDetailsDisplay';
import TablesList from '@/components/session/TablesList';
import SessionDeleteModal from '@/components/session/SessionDeleteModal';
import SessionEndModal from '@/components/session/SessionEndModal';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, updateSession, deleteSession, endSession } = useSessionContext();
  
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
  
  const isCompleted = !session.isActive && session.cashOut !== undefined;
  let profit = 0;
  let profitClass = '';
  
  if (isCompleted && session.cashOut !== undefined) {
    profit = session.cashOut - session.buyIn;
    profitClass = profit >= 0 ? 'text-green-500' : 'text-poker-red';
  }
  
  const calculateAdditionalBuyins = () => {
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
  };
  
  const additionalBuyins = calculateAdditionalBuyins();
  const initialBuyIn = session.initialBuyIn || (session.buyIn - additionalBuyins);
  
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
      notes: formData.notes
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotesChange = (notes: string) => {
    if (session) {
      const updatedSession = {
        ...session,
        notes
      };
      updateSession(updatedSession);
    }
  };
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const formattedDate = format(new Date(session.startTime), 'MMM d, yyyy h:mm a');
  const formattedEndDate = session.endTime 
    ? format(new Date(session.endTime), 'MMM d, yyyy h:mm a')
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <SessionHeader
          isEditing={isEditing}
          locationName={session.location}
          onBackClick={handleGoBack}
          onEditClick={() => setIsEditing(true)}
          onDeleteClick={() => setShowDeleteModal(true)}
        />
        
        {isEditing ? (
          <SessionEditForm
            formData={formData}
            handleChange={handleChange}
            handleSaveEdit={handleSaveEdit}
            setIsEditing={setIsEditing}
          />
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
            
            <SessionDetailsDisplay
              session={session}
              isCompleted={isCompleted}
              profit={profit}
              profitClass={profitClass}
              formattedDate={formattedDate}
              formattedEndDate={formattedEndDate}
              sessionDuration={sessionDuration}
              initialBuyIn={initialBuyIn}
              additionalBuyins={additionalBuyins}
              onEndSession={() => setShowEndSessionModal(true)}
            />
            
            {!session.isActive && Array.isArray(session.tables) && (
              <TablesList tables={session.tables} />
            )}
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <HandManagementPanel 
                sessionId={session.id} 
                hands={session.hands || []}
              />
            </div>
          </>
        )}
      </div>
      
      <SessionDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={handleDelete}
      />
      
      <SessionEndModal
        isOpen={showEndSessionModal}
        onClose={() => setShowEndSessionModal(false)}
        onConfirmEnd={handleEndSession}
        cashOutAmount={cashOutAmount}
        setCashOutAmount={setCashOutAmount}
        notes={session.notes || ''}
        onNotesChange={handleNotesChange}
      />
    </div>
  );
}
