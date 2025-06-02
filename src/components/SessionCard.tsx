import { PokerSession, TableData } from '@/types/poker';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import TableCountBubble from './poker/TableCountBubble';
import SessionStatsDisplay from './poker/SessionStatsDisplay';
import { useSessionStats } from '@/hooks/useSessionStats';

interface SessionCardProps {
  session: PokerSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate();
  
  console.log('SessionCard rendering for session:', session.id, session);
  
  const { stats, loading } = useSessionStats(session.id);
  
  console.log('SessionCard stats from hook:', stats, 'loading:', loading);
  
  // Calculate profit/loss
  const isCompleted = !session.isActive && session.cashOut !== undefined;
  let profit = 0;
  let profitClass = '';
  
  if (isCompleted && session.cashOut !== undefined) {
    profit = session.cashOut - session.buyIn;
    profitClass = profit >= 0 ? 'text-green-500' : 'text-poker-red';
  }
  
  const timeAgo = formatDistanceToNow(new Date(session.startTime), { addSuffix: true });
  
  const handleClick = () => {
    // Route to LiveSession for active sessions, or SessionDetail for completed ones
    if (session.isActive) {
      navigate(`/live-session/${session.id}`);
    } else {
      navigate(`/session/${session.id}`);
    }
  };

  // Table summary bubble logic (matching session format only)
  let tableCount = 0;
  let multiDayCount = 0;
  if (session.tables && session.tables.length > 0) {
    // Always count ALL tables that match the original format (not just after-the-fact)
    tableCount = session.tables.filter(
      (table: TableData) => table.format === session.format
    ).length;
    
    // Count multi-day tournaments
    multiDayCount = session.tables.filter(
      (table: TableData) => table.isMultiDay && table.dayEndedWithoutElimination
    ).length;
  }
  
  // IMPORTANT: Only show blinds for Cash format - strict check to ensure it's never shown for Tournament
  const shouldShowBlinds = session.format === 'Cash' && session.smallBlind !== undefined && session.bigBlind !== undefined;
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-extrabold text-lg tracking-tight flex items-center">
            {session.location}
            {tableCount > 0 && (session.format === "Cash" || session.format === "Tournament") && (
              <TableCountBubble
                format={session.format === "Cash" ? "Cash" : "Tournament"}
                count={tableCount}
              />
            )}
          </h3>
          <p className="text-gray-500 text-sm">{timeAgo}</p>
          
          {/* Show multi-day badge if there are continuing multi-day tournaments */}
          {multiDayCount > 0 && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
              {multiDayCount} Continuing Multi-Day {multiDayCount === 1 ? 'Tournament' : 'Tournaments'}
            </span>
          )}
        </div>
        {session.isActive ? (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            ACTIVE
          </span>
        ) : (
          <span className={`text-lg font-bold ${profitClass}`}>
            {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
          </span>
        )}
      </div>
      
      <div className="flex justify-between text-sm text-gray-600">
        <span>{session.gameType} • {session.format}</span>
        {shouldShowBlinds && (
          <span>
            {session.smallBlind}/{session.bigBlind}
          </span>
        )}
      </div>
      
      {/* Display important multi-day tournament data in SessionCard */}
      {multiDayCount > 0 && session.tables && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
          {session.tables.filter(table => table.isMultiDay && table.dayEndedWithoutElimination).map((table, index) => (
            <div key={table.id} className="mb-1 last:mb-0 bg-green-50 p-1 rounded">
              <div className="flex justify-between">
                <span className="text-gray-600">Next Day:</span>
                <span className="font-medium">
                  {table.nextDayStart ? new Date(table.nextDayStart).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              {table.chipsCarryover && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Chips:</span>
                  <span className="font-medium text-green-700">{table.chipsCarryover.toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Performance insights badges */}
      <SessionStatsDisplay
        tables={stats.tables}
        hands={stats.hands}
        totalBuyIns={stats.totalBuyIns}
        totalPayout={stats.totalPayout}
        loading={loading}
      />
    </div>
  );
}
