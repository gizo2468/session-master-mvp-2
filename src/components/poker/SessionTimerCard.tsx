
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { differenceInMinutes, format } from 'date-fns';

interface SessionTimerCardProps {
  startTime: Date;
  location: string;
  onEndSession: () => void;
}

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
};

const SessionTimerCard: React.FC<SessionTimerCardProps> = ({
  startTime,
  location,
  onEndSession
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  
  useEffect(() => {
    // Calculate initial elapsed time
    const initialElapsedMinutes = differenceInMinutes(
      new Date(),
      new Date(startTime)
    );
    
    setElapsedTime(initialElapsedMinutes);
    
    // Set up timer to update elapsed time
    const timer = setInterval(() => {
      if (isRunning) {
        setElapsedTime(prev => prev + 1);
      }
    }, 60000); // Update every minute
    
    return () => {
      clearInterval(timer);
    };
  }, [startTime, isRunning]);
  
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };
  
  // Format date and time
  const startTimeFormatted = format(new Date(startTime), "MMM d, yyyy h:mm a");
  
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <div className="bg-poker-feltGreen text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-medium text-lg">{location}</h2>
            <p className="text-xs opacity-80">Started {startTimeFormatted}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
            <p className="text-xs opacity-80">Session Duration</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTimer}
          className="text-poker-feltGreen border-poker-feltGreen"
        >
          {isRunning ? "Pause Timer" : "Resume Timer"}
        </Button>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={onEndSession}
        >
          End Session
        </Button>
      </CardContent>
    </Card>
  );
};

export default SessionTimerCard;
