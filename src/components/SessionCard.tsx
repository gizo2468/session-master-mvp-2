
import React from 'react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { Timer } from 'lucide-react';
import ProfitLossBadge from './poker/ProfitLossBadge';
import SessionStatsDisplay from './poker/SessionStatsDisplay';
import SessionActionButtons from './SessionActionButtons';
import { useSessionStats } from '@/hooks/useSessionStats';
import { PokerSession } from '@/types/poker';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

interface SessionCardProps {
  session: PokerSession;
  onClick: () => void;
  showActions?: boolean;
}

const SessionCard = ({ session, onClick, showActions = false }: SessionCardProps) => {
  const { stats, loading } = useSessionStats(session.id, session);
  
  // Memoize net profit calculation
  const netProfit = React.useMemo(() => stats.totalPayout - stats.totalBuyIns, [stats.totalPayout, stats.totalBuyIns]);
  
  const calculateDuration = () => {
    try {
      // PRIORITY 1: Use manually saved sessionDuration if available
      if (session.sessionDuration && session.sessionDuration > 0) {
        const hours = Math.floor(session.sessionDuration / 3600);
        const minutes = Math.floor((session.sessionDuration % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }
      
      // PRIORITY 2: Fall back to timestamp calculation
      const start = new Date(session.startTime);
      const end = session.endTime ? new Date(session.endTime) : new Date();
      
      // Validate dates
      if (isNaN(start.getTime())) {
        console.error('Invalid start time:', session.startTime);
        return '0m';
      }
      
      const hours = differenceInHours(end, start);
      const minutes = differenceInMinutes(end, start) % 60;
      
      if (hours < 0 || (hours === 0 && minutes < 0)) {
        console.error('CRITICAL: Still getting negative duration after schema fix:', {
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
      console.error('Error calculating duration:', error);
      return '0m';
    }
  };

  // Memoize duration calculation
  const duration = React.useMemo(() => calculateDuration(), [session.startTime, session.endTime, session.sessionDuration]);
  
  // Determine display format based on tables played
  const getDisplayFormat = () => {
    if (!session.tables || session.tables.length === 0) {
      return session.format || 'Unknown';
    }
    
    const formats = new Set(session.tables.map(table => table.format));
    const uniqueFormats = Array.from(formats);
    
    if (uniqueFormats.length === 1) {
      return uniqueFormats[0];
    } else if (uniqueFormats.includes('Tournament') && uniqueFormats.includes('Cash')) {
      return 'Tournament, Cash';
    } else {
      // If there are other combinations, join them with Tournament first if present
      const sortedFormats = uniqueFormats.sort((a, b) => {
        if (a === 'Tournament') return -1;
        if (b === 'Tournament') return 1;
        return a.localeCompare(b);
      });
      return sortedFormats.join(', ');
    }
  };

  // Memoize display format
  const displayFormat = React.useMemo(() => getDisplayFormat(), [session.tables]);
  
  // CRITICAL FIX: Format dates with proper timezone handling and error checking
  const getFormattedDate = () => {
    try {
      const startDate = new Date(session.startTime);
      if (isNaN(startDate.getTime())) {
        return 'Invalid Date';
      }
      return format(startDate, 'd MMM yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getFormattedTime = () => {
    try {
      const startDate = new Date(session.startTime);
      if (isNaN(startDate.getTime())) {
        return 'Invalid Time';
      }
      return format(startDate, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  };

  const formattedDate = React.useMemo(() => getFormattedDate(), [session.startTime]);
  const formattedTime = React.useMemo(() => getFormattedTime(), [session.startTime]);

  const handleCardClick = (e: React.MouseEvent) => {
    try {
      if ((e.target as HTMLElement).closest('.session-actions')) {
        return;
      }
      onClick();
    } catch (error) {
      console.error('Error handling card click:', error);
    }
  };

  // Ensure we have minimum required data to render the card
  if (!session || !session.id) {
    console.error('Invalid session data:', session);
    return (
      <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-4 mb-4">
        <div className="text-center text-gray-500 dark:text-muted-foreground">
          <p>Invalid session data</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-2xl font-bold text-gray-600 dark:text-[#F5F5F0]">{session.location || 'Unknown Location'}</h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">{formattedDate} at {formattedTime}</p>
        </div>
        {session.isActive ? (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            Live
          </span>
        ) : (
          <ProfitLossBadge profit={netProfit} currency={session.currency} />
        )}
      </div>
      
      <div className="pr-4">
        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
          <div className="text-center">
            <span className="text-gray-500 dark:text-muted-foreground">Game:</span>
            <span className="ml-1 font-medium">{session.gameType || 'Unknown'}</span>
          </div>
          <div className="text-center">
            <span className="text-gray-500 dark:text-muted-foreground">Format:</span>
            <span className="ml-1 font-medium">{displayFormat}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center text-sm mb-3">
          <span className="text-gray-500 dark:text-muted-foreground">Duration:</span>
          <span className="ml-1 font-medium">{duration}</span>
          <Timer size={14} className="ml-1 text-gray-500 dark:text-muted-foreground" />
        </div>
      </div>
      
      {session.format === 'Cash' && session.smallBlind !== undefined && session.bigBlind !== undefined && (
        <div className="text-center text-sm mb-3">
          <span className="text-gray-500 dark:text-muted-foreground">Blinds:</span>
          <span className="ml-1 font-medium">{getCurrencySymbol(session.currency)}{session.smallBlind}/{getCurrencySymbol(session.currency)}{session.bigBlind}</span>
        </div>
      )}
      
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
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-border">
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 line-clamp-2">{session.notes}</p>
        </div>
      )}
      
      {/* Action buttons for completed sessions */}
      {showActions && !session.isActive && (
        <div className="session-actions mt-3 pt-3 border-t border-gray-200 dark:border-border">
          <SessionActionButtons session={session} />
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(SessionCard, (prevProps, nextProps) => {
  return prevProps.session.id === nextProps.session.id &&
         prevProps.session.isActive === nextProps.session.isActive &&
         prevProps.showActions === nextProps.showActions;
});
