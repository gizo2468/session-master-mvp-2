
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
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Game:</span>
            <span className="font-semibold text-gray-900">{session.gameType}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Format:</span>
            <span className="font-semibold text-gray-900">{session.format}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Buy-in:</span>
            <span className="font-semibold text-gray-900">
              ${totalInitialBuyin.toFixed(2)}
              {additionalBuyins > 0 && (
                <span className="text-gray-600"> (+${additionalBuyins.toFixed(2)})</span>
              )}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Re-Buys:</span>
            <span className="font-semibold text-gray-900">{totalRebuys}</span>
          </div>
        
          {/* Only show blinds for Cash game format */}
          {shouldShowBlinds && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Blinds:</span>
              <span className="font-semibold text-gray-900">${session.smallBlind || 0}/${session.bigBlind || 0}</span>
            </div>
          )}
        </div>
      </div>
        
      {isCompleted && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Total Payout:</span>
              <span className="font-semibold text-gray-900">${totalCashout.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Profit/Loss:</span>
              <ProfitLossBadge profit={profit} size="lg" />
            </div>
          </div>
          
          {session.notes && (
            <div className="bg-white p-4 rounded-lg border">
              <span className="text-sm font-medium text-gray-600 mb-2 block">Session Notes:</span>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{session.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionInfoDisplay;
