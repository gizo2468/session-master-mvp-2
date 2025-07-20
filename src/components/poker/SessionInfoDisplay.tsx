
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
      
      <div className="flex justify-between py-2 border-b">
        <span className="text-gray-500">ITM:</span>
        <span className="font-medium">
          {(() => {
            const totalTables = session.tables?.length || 0;
            const itmTables = session.tables?.filter(table => (table.cashOut || 0) > 0).length || 0;
            return `${itmTables} / ${totalTables}`;
          })()}
        </span>
      </div>
      
      <div className="flex justify-between py-2 border-b">
        <span className="text-gray-500">Payout:</span>
        <span className="font-medium">
          ${totalCashout.toFixed(2)}
        </span>
      </div>
      
      {/* Overall Result Display */}
      <div className="flex justify-center py-2">
        <div className={`px-4 py-2 rounded-full text-lg font-bold ${profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
        </div>
      </div>
      
      {session.notes && (
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">Session Notes:</span>
          <span className="font-medium text-sm max-w-xs text-right">{session.notes}</span>
        </div>
      )}
      
      {/* Only show blinds for Cash game format */}
      {shouldShowBlinds && (
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">Blinds:</span>
          <span className="font-medium">${session.smallBlind || 0}/${session.bigBlind || 0}</span>
        </div>
      )}
      
      {isCompleted && (
        <div className="flex flex-col items-center py-2">
          <span className="text-gray-500 mb-2">Profit/Loss</span>
          <ProfitLossBadge profit={profit} size="lg" />
        </div>
      )}
    </div>
  );
};

export default SessionInfoDisplay;
