
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { format } from 'date-fns';

interface SessionTimerCardProps {
  elapsedTime: number;
  startTime: Date;
  gameType: string;
  format: string;
  smallBlind: number;
  bigBlind: number;
  timerActive: boolean;
  onPauseResume: () => void;
  onEndSession: () => void;
}

const SessionTimerCard: React.FC<SessionTimerCardProps> = ({
  elapsedTime,
  startTime,
  gameType,
  format,
  smallBlind,
  bigBlind,
  timerActive,
  onPauseResume,
  onEndSession,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formattedStartTime = format(new Date(startTime), 'h:mm a');
  const formattedDate = format(new Date(startTime), 'MMM d, yyyy');
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
      <div className="mb-2 text-sm text-gray-500">Session Time</div>
      <div className="text-5xl font-mono font-bold mb-3">{formatTime(elapsedTime)}</div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-left">
          <div className="text-sm text-gray-500">Started</div>
          <div className="font-medium">{formattedStartTime}</div>
          <div className="text-xs text-gray-400">{formattedDate}</div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">Game</div>
          <div className="font-medium">{gameType}</div>
          <div className="text-xs text-gray-400">
            {format} - ${smallBlind}/${bigBlind}
          </div>
        </div>
      </div>
      
      <div className="flex justify-around">
        <Button
          onClick={onPauseResume}
          variant="outline"
          className="flex items-center gap-2"
        >
          {timerActive ? (
            <><Icon name="Pause" size={16} /> Pause</>
          ) : (
            <><Icon name="Play" size={16} /> Resume</>
          )}
        </Button>
        
        <Button
          onClick={onEndSession}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Icon name="CircleStop" size={16} /> End Session
        </Button>
      </div>
    </div>
  );
};

export default SessionTimerCard;
