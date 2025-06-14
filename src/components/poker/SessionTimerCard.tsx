
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  onAddTable?: () => void;
}

const SessionTimerCard: React.FC<SessionTimerCardProps> = ({
  startTime,
  gameType,
  format,
  smallBlind,
  bigBlind,
  onEndSession,
  onAddTable,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const { updateSessionDuration, activeSession } = useSessionContext();
  const updateCounterRef = useRef(0);
  
  // Use useCallback to memoize the updateDuration function
  const updateDuration = useCallback((newTime: number) => {
    if (typeof updateSessionDuration === 'function' && activeSession) {
      // Only update database every 30 seconds to reduce writes
      updateCounterRef.current++;
      if (updateCounterRef.current % 30 === 0) {
        updateSessionDuration(activeSession.id, newTime);
      }
    }
  }, [updateSessionDuration, activeSession]);
  
  useEffect(() => {
    if (!startTime) return;
    
    // Calculate elapsed time from start time and stored session duration
    const calculateInitialElapsedTime = () => {
      const storedDuration = activeSession?.sessionDuration || 0;
      
      // Convert startTime to timestamp - let JavaScript handle timezone conversion naturally
      const startTimeMs = new Date(startTime).getTime();
      const timeSinceStart = Math.floor((Date.now() - startTimeMs) / 1000);
      
      // Use the greater of stored duration or calculated time to handle refreshes properly
      // This ensures we don't go backwards in time
      return Math.max(storedDuration, timeSinceStart, 0);
    };
    
    // Set initial elapsed time using database as source of truth
    const initialElapsedTime = calculateInitialElapsedTime();
    setElapsedTime(initialElapsedTime);
    
    // Set up interval to increment locally every second
    const timer = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        // Update session duration in database periodically
        updateDuration(newTime);
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, updateDuration, activeSession?.sessionDuration]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Convert startTime for display - let JavaScript handle timezone conversion naturally
  const startTimeForDisplay = new Date(startTime);
  const formattedStartTime = dateFormat(startTimeForDisplay, 'h:mm a');
  const formattedDate = dateFormat(startTimeForDisplay, 'MMM d, yyyy');
  
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
  
  const handleAddTable = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Call the provided onAddTable handler
    if (typeof onAddTable === 'function') {
      onAddTable();
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
      
      <div className="flex justify-center gap-2">
        {onAddTable && (
          <Button
            onClick={handleAddTable}
            className="bg-poker-gold hover:bg-poker-darkGold text-white flex items-center gap-2"
          >
            <Icon name="Plus" size={16} /> Add Table
          </Button>
        )}
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
