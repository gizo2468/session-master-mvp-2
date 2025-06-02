
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
  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-md flex items-center justify-between">
        <span className="text-yellow-400">Tables: {tables}</span>
        <span className="text-gray-300">|</span>
        <span className="text-blue-400">Hands: {hands}</span>
        <span className="text-gray-300">|</span>
        <span className="text-red-400">Buy-ins: ${totalBuyIns.toFixed(0)}</span>
        <span className="text-gray-300">|</span>
        <span className="text-green-400">Payout: ${totalPayout.toFixed(0)}</span>
      </div>
    </div>
  );
};

export default SessionStatsDisplay;
