
import React from 'react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import ProfitLossBadge from './poker/ProfitLossBadge';
import SessionStatsDisplay from './poker/SessionStatsDisplay';
import SessionActionButtons from './SessionActionButtons';
import { useSessionStats } from '@/hooks/useSessionStats';
import { PokerSession } from '@/types/poker';
import { calculateSessionProfit } from '@/utils/sessionCalculations';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

interface SessionCardProps {
  session: PokerSession;
  onClick: () => void;
  showActions?: boolean;
}

export default function SessionCard({ session, onClick, showActions = false }: SessionCardProps) {
  const { stats, loading } = useSessionStats(session.id, session);
  
  // FIXED: Calculate net profit correctly: Payout - Buy-ins
  // Calculate net profit using unified calculation logic
  const netProfit = calculateSessionProfit(session);
  
  const calculateDuration = () => {
    try {
      // CRITICAL FIX: With schema fix, both start and end times are now timezone-aware
      const start = new Date(session.startTime);
      const end = session.endTime ? new Date(session.endTime) : new Date();
      
      // Validate dates
      if (isNaN(start.getTime())) {
        console.error('❌ Invalid start time:', session.startTime);
        return '0m';
      }
      
      console.log('🕐 FIXED: Duration calculation with both timestamps timezone-aware:', {
        sessionId: session.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        startTimestamp: start.getTime(),
        endTimestamp: end.getTime()
      });
      
      const hours = differenceInHours(end, start);
      const minutes = differenceInMinutes(end, start) % 60;
      
      if (hours < 0 || (hours === 0 && minutes < 0)) {
        console.error('❌ CRITICAL: Still getting negative duration after schema fix:', {
          originalHours: hours,
          originalMinutes: minutes,
          sessionId: session.id,
          startTime: session.startTime,
          endTime: session.endTime
        });
        const absHours = Math.abs(hours);
        const absMinutes = Math.abs(minutes);
        return absHours > 0 ? `${absHours}h ${absMinutes}m` : `${absMinutes}m`;
      }
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      console.error('❌ Error calculating duration:', error);
      return '0m';
    }
  };

  const duration = calculateDuration();
  
  // CRITICAL FIX: Format dates with proper timezone handling and error checking
  const getFormattedDate = () => {
    try {
      const startDate = new Date(session.startTime);
      if (isNaN(startDate.getTime())) {
        return 'Invalid Date';
      }
      return format(startDate, 'MMM d, yyyy');
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getFormattedTime = () => {
    try {
      const startDate = new Date(session.startTime);
      if (isNaN(startDate.getTime())) {
        return 'Invalid Time';
      }
      return format(startDate, 'h:mm a');
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return 'Invalid Time';
    }
  };

  const formattedDate = getFormattedDate();
  const formattedTime = getFormattedTime();

  const handleCardClick = (e: React.MouseEvent) => {
    try {
      if ((e.target as HTMLElement).closest('.session-actions')) {
        return;
      }
      onClick();
    } catch (error) {
      console.error('❌ Error handling card click:', error);
    }
  };

  // Ensure we have minimum required data to render the card
  if (!session || !session.id) {
    console.error('❌ Invalid session data:', session);
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="text-center text-gray-500">
          <p>Invalid session data</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-primary">{session.location || 'Unknown Location'}</h3>
          <p className="text-sm text-gray-500">{formattedDate} at {formattedTime}</p>
        </div>
        {session.isActive ? (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            Live
          </span>
        ) : (
          <ProfitLossBadge profit={netProfit} currency={session.currency} />
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-500">Game:</span>
          <span className="ml-1 font-medium">{session.gameType || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-gray-500">Format:</span>
          <span className="ml-1 font-medium">{session.format || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="ml-1 font-medium">{duration}</span>
        </div>
        {session.format === 'Cash' && session.smallBlind !== undefined && session.bigBlind !== undefined && (
          <div>
            <span className="text-gray-500">Blinds:</span>
            <span className="ml-1 font-medium">{getCurrencySymbol(session.currency)}{session.smallBlind}/{getCurrencySymbol(session.currency)}{session.bigBlind}</span>
          </div>
        )}
      </div>
      
      {/* Session Statistics Display */}
      <SessionStatsDisplay 
        tables={stats.tables}
        hands={stats.hands}
        totalBuyIns={stats.totalBuyIns}
        totalPayout={stats.totalPayout}
        currency={session.currency}
        loading={loading}
      />
      
      {session.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 line-clamp-2">{session.notes}</p>
        </div>
      )}
      
      {/* Action buttons for completed sessions */}
      {showActions && !session.isActive && (
        <div className="session-actions mt-3 pt-3 border-t border-gray-200">
          <SessionActionButtons session={session} />
        </div>
      )}
    </div>
  );
}
