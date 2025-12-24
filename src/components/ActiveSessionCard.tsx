
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { PokerSession } from '@/types/poker';

interface ActiveSessionCardProps {
  session: PokerSession;
  onResume: () => void;
}

export default function ActiveSessionCard({ session, onResume }: ActiveSessionCardProps) {
  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-bold text-green-800">Active Session</h3>
          </div>
          <p className="text-green-700 font-medium">{session.location}</p>
          <div className="flex items-center gap-4 text-sm text-green-600 mt-1">
            <span>{session.gameType} • {session.format}</span>
            <span>Duration: {formatDuration(session.startTime)}</span>
          </div>
          {session.tables && session.tables.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {session.tables.filter(t => t.isActive).length} active tables
            </p>
          )}
        </div>
        <Button 
          onClick={onResume}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Icon name="Play" size={16} className="mr-1" />
          Resume
        </Button>
      </div>
    </div>
  );
}
