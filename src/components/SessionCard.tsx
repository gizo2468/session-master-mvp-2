
import { PokerSession } from '@/types/poker';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface SessionCardProps {
  session: PokerSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate();
  
  // Calculate profit/loss
  const isCompleted = !session.isActive && session.cashOut !== undefined;
  let profit = 0;
  let profitClass = '';
  
  if (isCompleted && session.cashOut !== undefined) {
    profit = session.cashOut - session.buyIn;
    profitClass = profit >= 0 ? 'text-green-500' : 'text-poker-red';
  }
  
  const timeAgo = formatDistanceToNow(new Date(session.startTime), { addSuffix: true });
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer"
      onClick={() => navigate(`/session/${session.id}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">{session.location}</h3>
          <p className="text-gray-500 text-sm">{timeAgo}</p>
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
        <span>
          {session.smallBlind}/{session.bigBlind}
        </span>
      </div>
    </div>
  );
}
