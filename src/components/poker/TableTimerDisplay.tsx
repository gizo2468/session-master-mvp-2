
import React, { useState, useEffect } from 'react';
import { format as dateFormat } from 'date-fns';
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
    
    const calculateElapsedTime = () => {
      // Fix: Properly handle UTC timestamps
      let startTimeUTC: number;
      if (typeof startTime === 'string') {
        // Ensure UTC if string
        const timeString = startTime.includes('Z') ? startTime : startTime + 'Z';
        startTimeUTC = Date.parse(timeString);
      } else {
        // Already a Date object
        startTimeUTC = startTime.getTime();
      }
      
      // If table ended, use endTime; otherwise use current time
      let endTimestamp: number;
      if (endTime) {
        if (typeof endTime === 'string') {
          const endTimeString = endTime.includes('Z') ? endTime : endTime + 'Z';
          endTimestamp = Date.parse(endTimeString);
        } else {
          endTimestamp = endTime.getTime();
        }
      } else {
        endTimestamp = Date.now(); // Current time is always UTC
      }
      
      const elapsed = Math.floor((endTimestamp - startTimeUTC) / 1000);
      return Math.max(0, elapsed); // Ensure non-negative time
    };
    
    // Set initial elapsed time
    const initialElapsedTime = calculateElapsedTime();
    setElapsedTime(initialElapsedTime);
    
    // Only run the interval if the timer is active (table not ended)
    let timer: number | undefined;
    if (isActive && !endTime) {
      timer = window.setInterval(() => {
        setElapsedTime(prev => prev + 1); // Increment locally for smooth display
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
