
import React from 'react';
import { PokerSession } from '@/types/poker';
import { format } from 'date-fns';

interface SessionDetailsDisplayProps {
  session: PokerSession;
  isCompleted: boolean;
  profit: number;
  profitClass: string;
  formattedDate: string;
  formattedEndDate: string | null;
  sessionDuration: string | null;
  initialBuyIn: number;
  additionalBuyins: number;
  onEndSession: () => void;
}

const SessionDetailsDisplay: React.FC<SessionDetailsDisplayProps> = ({
  session,
  isCompleted,
  profit,
  profitClass,
  formattedDate,
  formattedEndDate,
  sessionDuration,
  initialBuyIn,
  additionalBuyins,
  onEndSession
}) => {
  return (
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
            ${initialBuyIn.toFixed(2)}
            {additionalBuyins > 0 && (
              <span className="text-gray-600"> (+${additionalBuyins.toFixed(2)})</span>
            )}
          </span>
        </div>
        
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">Re-Buys:</span>
          <span className="font-medium">{session.rebuys}</span>
        </div>
        
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">Blinds:</span>
          <span className="font-medium">${session.smallBlind || 0}/${session.bigBlind || 0}</span>
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
            
            {session.notes && (
              <div className="flex flex-col py-2 border-b">
                <span className="text-gray-500 mb-1">Session Notes:</span>
                <p className="text-sm bg-gray-50 p-3 rounded">{session.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {session.isActive && (
        <button
          onClick={onEndSession}
          className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
        >
          End Session
        </button>
      )}
    </div>
  );
};

export default SessionDetailsDisplay;
