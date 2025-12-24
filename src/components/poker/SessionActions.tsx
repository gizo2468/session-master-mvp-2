
import React from 'react';
import { PokerSession } from '@/types/poker';
import SessionTimerCard from './SessionTimerCard';

interface SessionActionsProps {
  session: PokerSession;
  isActive: boolean;
  onEndSession: () => void;
}

const SessionActions: React.FC<SessionActionsProps> = ({
  session,
  isActive,
  onEndSession
}) => {
  if (!isActive) return null;

  return (
    <>
      <SessionTimerCard
        startTime={session.startTime}
        gameType={session.gameType}
        format={session.format}
        smallBlind={session.smallBlind}
        bigBlind={session.bigBlind}
        sessionId={session.id}
        onEndSession={onEndSession}
      />
      
      <div className="mt-4">
        <button
          onClick={onEndSession}
          className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
        >
          End Session
        </button>
      </div>
    </>
  );
};

export default SessionActions;
