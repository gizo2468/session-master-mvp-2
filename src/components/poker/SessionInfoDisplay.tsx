
import React from 'react';
import { PokerSession } from '@/types/poker';
import ProfitLossBadge from './ProfitLossBadge';

interface SessionInfoDisplayProps {
  session: PokerSession;
  totalInitialBuyin: number;
  additionalBuyins: number;
  totalRebuys: number;
  totalCashout: number;
  profit: number;
  isCompleted: boolean;
}

const SessionInfoDisplay: React.FC<SessionInfoDisplayProps> = ({
  session,
  totalInitialBuyin,
  additionalBuyins,
  totalRebuys,
  totalCashout,
  profit,
  isCompleted
}) => {
  // Determine if blinds should be shown - strict check for Cash format only
  const shouldShowBlinds = session.format === 'Cash' && session.smallBlind !== undefined && session.bigBlind !== undefined;

  return (
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
  );
};

export default SessionInfoDisplay;
