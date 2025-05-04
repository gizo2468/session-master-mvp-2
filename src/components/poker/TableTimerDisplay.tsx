
import React, { useState, useEffect } from 'react';
import { format as dateFormat, differenceInSeconds } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';

interface TableTimerDisplayProps {
  startTime: Date;
  endTime?: Date;
  className?: string;
  isActive?: boolean;
}

const TableTimerDisplay: React.FC<TableTimerDisplayProps> = ({
  startTime,
  endTime,
  className = "",
  isActive = true
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!startTime) return;
    
    const now = new Date();
    const end = endTime || now;
    const initialElapsedTime = differenceInSeconds(end, new Date(startTime));
    setElapsedTime(initialElapsedTime);
    
    // Only run the interval if the timer is active (table not ended)
    let timer: number | undefined;
    if (isActive) {
      timer = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [startTime, endTime, isActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Badge variant={isActive ? "timeStarted" : "timeEnded"} className="px-2 py-1 font-mono font-medium flex items-center gap-1.5">
        <Icon name="Clock" className="h-3 w-3" />
        <span>{formatTime(elapsedTime)}</span>
      </Badge>
    </div>
  );
};

export default TableTimerDisplay;
