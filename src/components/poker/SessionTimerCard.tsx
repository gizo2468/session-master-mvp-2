
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PauseCircle, PlayCircle, Clock, StopCircle } from 'lucide-react';
import { format, differenceInSeconds, parseISO } from 'date-fns';
import { useSessionContext } from '@/context/SessionContext';

interface SessionTimerCardProps {
  startTime: Date;
  gameType?: string;
  format?: string;
  smallBlind?: number;
  bigBlind?: number;
  onEndSession: () => void;
}

const SessionTimerCard: React.FC<SessionTimerCardProps> = ({
  startTime,
  gameType,
  format,
  smallBlind,
  bigBlind,
  onEndSession
}) => {
  const [time, setTime] = useState<string>('00:00:00');
  const { pauseSession, resumeSession, activeSession, updateSessionDuration } = useSessionContext();
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      if (!isPaused) {
        const now = new Date();
        const seconds = differenceInSeconds(now, new Date(startTime));
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        setTime(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        );
        
        // Make sure activeSession exists before calling updateSessionDuration
        if (activeSession?.id) {
          // Use proper function call syntax
          if (typeof updateSessionDuration === 'function') {
            updateSessionDuration(activeSession.id, seconds);
          }
        }
      }
    };
    
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerId);
  }, [startTime, isPaused, activeSession, updateSessionDuration]);

  const handlePauseResume = () => {
    if (!activeSession?.id) return;
    
    setIsPaused(!isPaused);
    if (isPaused) {
      resumeSession(activeSession.id);
    } else {
      pauseSession(activeSession.id);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-poker-feltGreen to-poker-feltGreen/90 text-white">
        <div>
          <h2 className="text-2xl font-bold">{time}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm opacity-90">
              Started {format(new Date(startTime), 'MMM d, h:mm a')}
            </span>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <Button
            size="sm"
            onClick={handlePauseResume}
            className="bg-white text-poker-feltGreen hover:bg-gray-100"
          >
            {isPaused ? (
              <PlayCircle className="h-4 w-4 mr-2" />
            ) : (
              <PauseCircle className="h-4 w-4 mr-2" />
            )}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            size="sm"
            onClick={onEndSession}
            className="bg-red-500 hover:bg-red-600 text-white flex items-center"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            End Session
          </Button>
        </div>
      </div>
      <CardContent className="py-3">
        <div className="flex flex-wrap gap-2">
          {gameType && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              {gameType}
            </Badge>
          )}
          {format && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              {format}
            </Badge>
          )}
          {smallBlind !== undefined && bigBlind !== undefined && format === 'Cash' && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              ${smallBlind}/${bigBlind}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionTimerCard;
