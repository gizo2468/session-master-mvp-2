
import React, { useState, useEffect } from 'react';
import { format as dateFormat } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';

interface TableTimerDisplayProps {
  startTime: Date;
  startTimeUTC?: number; // Raw UTC timestamp for accurate calculations
  endTime?: Date;
  endTimeUTC?: number; // Raw UTC timestamp for accurate calculations
  className?: string;
  isActive?: boolean;
  tableDuration?: number; // Custom duration in seconds (if manually set)
}

const TableTimerDisplay: React.FC<TableTimerDisplayProps> = ({
  startTime,
  startTimeUTC,
  endTime,
  endTimeUTC,
  className = "",
  isActive = true,
  tableDuration
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!startTime) return;
    
    const calculateElapsedTime = () => {
      // PRIORITY 1: Use custom tableDuration if set
      if (tableDuration && tableDuration > 0) {
        return tableDuration;
      }
      
      // PRIORITY 2: Use raw UTC timestamps for accurate calculations without timezone shifts
      let startTimestamp: number;
      let endTimestamp: number;
      
      if (startTimeUTC) {
        // Use raw UTC timestamp for accurate calculation
        startTimestamp = startTimeUTC;
      } else {
        // Fallback to Date object method (less reliable across timezones)
        startTimestamp = startTime.getTime();
      }
      
      // If table ended, use endTime; otherwise use current time
      if (endTime) {
        if (endTimeUTC) {
          // Use raw UTC timestamp for accurate calculation
          endTimestamp = endTimeUTC;
        } else {
          // Fallback to Date object method
          endTimestamp = endTime.getTime();
        }
      } else {
        endTimestamp = Date.now(); // Current time in UTC
      }
      
      const elapsed = Math.floor((endTimestamp - startTimestamp) / 1000);
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
  }, [startTime, startTimeUTC, endTime, endTimeUTC, isActive, tableDuration]);

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
