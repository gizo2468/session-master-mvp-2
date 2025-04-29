
import { PokerSession, TableData } from '@/types/poker';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import TableCountBubble from './poker/TableCountBubble';
import { useLanguage } from '@/context/LanguageContext';

interface SessionCardProps {
  session: PokerSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
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
  if (session.tables && session.tables.length > 0) {
    // Always count ALL tables that match the original format (not just after-the-fact)
    tableCount = session.tables.filter(
      (table: TableData) => table.format === session.format
    ).length;
  }
  
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
        </div>
        {session.isActive ? (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            {t('active')}
          </span>
        ) : (
          <span className={`text-lg font-bold ${profitClass}`}>
            {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
          </span>
        )}
      </div>
      
      <div className="flex justify-between text-sm text-gray-600">
        <span>{session.gameType} • {session.format}</span>
        <span>
          {session.smallBlind}/{session.bigBlind}
        </span>
      </div>
    </div>
  );
}
