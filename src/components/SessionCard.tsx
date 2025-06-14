
import React from 'react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import ProfitLossBadge from './poker/ProfitLossBadge';
import { PokerSession } from '@/types/poker';

interface SessionCardProps {
  session: PokerSession;
  onClick: () => void;
}

export default function SessionCard({ session, onClick }: SessionCardProps) {
  // Calculate derived values from database data
  const profit = session.cashOut !== undefined ? session.cashOut - session.buyIn : 0;
  
  const calculateDuration = () => {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const duration = calculateDuration();
  const formattedDate = format(new Date(session.startTime), 'MMM d, yyyy');
  const formattedTime = format(new Date(session.startTime), 'h:mm a');

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-poker-feltGreen"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-poker-black">{session.location}</h3>
          <p className="text-sm text-gray-500">{formattedDate} at {formattedTime}</p>
        </div>
        {session.isActive ? (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            Live
          </span>
        ) : (
          <ProfitLossBadge profit={profit} />
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Game:</span>
          <span className="ml-1 font-medium">{session.gameType}</span>
        </div>
        <div>
          <span className="text-gray-500">Format:</span>
          <span className="ml-1 font-medium">{session.format}</span>
        </div>
        <div>
          <span className="text-gray-500">Buy-in:</span>
          <span className="ml-1 font-medium">${session.buyIn.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="ml-1 font-medium">{duration}</span>
        </div>
        {session.format === 'Cash' && session.smallBlind !== undefined && session.bigBlind !== undefined && (
          <>
            <div className="col-span-2">
              <span className="text-gray-500">Blinds:</span>
              <span className="ml-1 font-medium">${session.smallBlind}/${session.bigBlind}</span>
            </div>
          </>
        )}
        {!session.isActive && session.cashOut !== undefined && (
          <div>
            <span className="text-gray-500">Cash Out:</span>
            <span className="ml-1 font-medium">${session.cashOut.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      {session.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 line-clamp-2">{session.notes}</p>
        </div>
      )}
    </div>
  );
}
