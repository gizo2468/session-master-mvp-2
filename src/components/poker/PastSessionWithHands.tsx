import React, { useState } from 'react';
import PastSessionForm from './PastSessionForm';
import HandManagementPanel from './HandManagementPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSessionContext } from '@/context/SessionContext';
import { PokerSession } from '@/types/poker';

interface PastSessionWithHandsProps {
  onClose: () => void;
}

const PastSessionWithHands: React.FC<PastSessionWithHandsProps> = ({ onClose }) => {
  const [step, setStep] = useState<'form' | 'hands'>('form');
  const [createdSession, setCreatedSession] = useState<PokerSession | null>(null);
  const { sessions } = useSessionContext();

  const handleSessionCreated = (sessionId?: string) => {
    if (sessionId) {
      // Find the session that was just created
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCreatedSession(session);
        setStep('hands');
      }
    }
  };

  const handleFormClose = () => {
    if (step === 'hands' && createdSession) {
      // If we're in the hands step, go back to the main page
      onClose();
    } else {
      // If we're in the form step, just close
      onClose();
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setCreatedSession(null);
  };

  if (step === 'form') {
    return (
      <PastSessionForm 
        onClose={handleFormClose} 
        onSessionCreated={handleSessionCreated}
      />
    );
  }

  if (step === 'hands' && createdSession) {
    return (
      <div className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto my-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToForm}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Hands to Past Session</h2>
                <p className="text-sm text-gray-500">
                  {createdSession.location} • {createdSession.format} • {createdSession.gameType}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Finish
            </Button>
          </div>
        </div>

        <div className="px-6 py-6">
          <HandManagementPanel
            sessionId={createdSession.id}
            hands={createdSession.hands || []}
            tables={createdSession.tables || []}
            tableFormat={createdSession.format as 'Cash' | 'Tournament'}
            sessionBuyIn={createdSession.buyIn}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default PastSessionWithHands;