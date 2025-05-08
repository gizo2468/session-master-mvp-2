
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { format as dateFormat } from 'date-fns';
import { useSessionContext } from '@/context/SessionContext';

interface SessionTimerCardProps {
  startTime: Date;
  gameType: string;
  format: string;
  smallBlind: number;
  bigBlind: number;
  onEndSession: () => void;
}

const SessionTimerCard: React.FC<SessionTimerCardProps> = ({
  startTime,
  gameType,
  format,
  smallBlind,
  bigBlind,
  onEndSession,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const { updateSessionDuration, activeSession } = useSessionContext();
  
  useEffect(() => {
    const initialElapsedTime = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
    setElapsedTime(initialElapsedTime);
    
    let timer: number | undefined;
    
    // Always run the timer (no conditional on timerActive)
    timer = window.setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        // Update session duration in context if updateSessionDuration is available
        // and activeSession exists
        if (typeof updateSessionDuration === 'function' && activeSession) {
          updateSessionDuration(activeSession.id, newTime);
        }
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [startTime, updateSessionDuration, activeSession]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formattedStartTime = dateFormat(new Date(startTime), 'h:mm a');
  const formattedDate = dateFormat(new Date(startTime), 'MMM d, yyyy');
  
  // IMPORTANT: Only show blinds for Cash format - strict check to ensure it's never shown for Tournament
  const shouldShowBlinds = format === 'Cash' && smallBlind !== undefined && bigBlind !== undefined;
  
  const handleEndSession = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Call the provided onEndSession handler
    if (typeof onEndSession === 'function') {
      onEndSession();
    }
  };
  
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
            {format}
            {shouldShowBlinds && (
              <> - ${smallBlind}/${bigBlind}</>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={handleEndSession}
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
