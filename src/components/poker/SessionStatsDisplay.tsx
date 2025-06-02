
import React from 'react';

interface SessionStatsDisplayProps {
  tables: number;
  hands: number;
  totalBuyIns: number;
  totalPayout: number;
  loading?: boolean;
}

const SessionStatsDisplay: React.FC<SessionStatsDisplayProps> = ({
  tables,
  hands,
  totalBuyIns,
  totalPayout,
  loading = false
}) => {
  console.log('SessionStatsDisplay props:', { tables, hands, totalBuyIns, totalPayout, loading });

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="bg-gray-50 px-3 py-2 rounded-md">
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center">
            <span className="text-yellow-700 font-medium">Tables</span>
            <div className="text-gray-800 font-semibold">{tables}</div>
          </div>
          <div className="text-center">
            <span className="text-blue-700 font-medium">Hands</span>
            <div className="text-gray-800 font-semibold">{hands}</div>
          </div>
          <div className="text-center">
            <span className="text-red-700 font-medium">Buy-ins</span>
            <div className="text-gray-800 font-semibold">${totalBuyIns.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <span className="text-green-700 font-medium">Payout</span>
            <div className="text-gray-800 font-semibold">${totalPayout.toFixed(0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStatsDisplay;
