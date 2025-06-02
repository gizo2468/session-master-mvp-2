
import React from 'react';
import { Badge } from '@/components/ui/badge';

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
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="grid grid-cols-2 gap-2">
        <Badge 
          className="bg-yellow-500 text-white hover:bg-yellow-600 px-3 py-1 text-xs font-medium rounded-full flex items-center justify-center"
        >
          Tables: {tables}
        </Badge>
        
        <Badge 
          className="bg-blue-500 text-white hover:bg-blue-600 px-3 py-1 text-xs font-medium rounded-full flex items-center justify-center"
        >
          Hands: {hands}
        </Badge>
        
        <Badge 
          className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 text-xs font-medium rounded-full flex items-center justify-center"
        >
          Buy-ins: ${totalBuyIns.toFixed(0)}
        </Badge>
        
        <Badge 
          className="bg-green-500 text-white hover:bg-green-600 px-3 py-1 text-xs font-medium rounded-full flex items-center justify-center"
        >
          Payout: ${totalPayout.toFixed(0)}
        </Badge>
      </div>
    </div>
  );
};

export default SessionStatsDisplay;
