
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
  // Debug logging
  console.log('SessionStatsDisplay props:', { tables, hands, totalBuyIns, totalPayout, loading });

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Only hide if ALL values are 0 or null/undefined
  const hasAnyData = tables > 0 || hands > 0 || totalBuyIns > 0 || totalPayout > 0;
  
  console.log('SessionStatsDisplay hasAnyData:', hasAnyData);
  
  if (!hasAnyData) {
    console.log('SessionStatsDisplay: No data to display, hiding component');
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="bg-gray-50 text-sm px-3 py-2 rounded-md flex items-center justify-between">
        <span className="text-yellow-600 font-medium">Tables: {tables}</span>
        <span className="text-gray-400">|</span>
        <span className="text-blue-600 font-medium">Hands: {hands}</span>
        <span className="text-gray-400">|</span>
        <span className="text-red-600 font-medium">Buy-ins: ${totalBuyIns.toFixed(0)}</span>
        <span className="text-gray-400">|</span>
        <span className="text-green-600 font-medium">Payout: ${totalPayout.toFixed(0)}</span>
      </div>
    </div>
  );
};

export default SessionStatsDisplay;
