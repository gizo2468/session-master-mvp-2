
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
      // Convert startTime to timestamp (handle both Date objects and ISO strings)
      let startTimeUTC: number;
      if (startTime instanceof Date) {
        startTimeUTC = startTime.getTime();
      } else {
        // Handle string from database - ensure it's treated as UTC
        const timeString = String(startTime);
        const utcTimeString = timeString.includes('Z') ? timeString : timeString + 'Z';
        startTimeUTC = Date.parse(utcTimeString);
      }
      
      // If table ended, use endTime; otherwise use current time
      let endTimestamp: number;
      if (endTime) {
        if (endTime instanceof Date) {
          endTimestamp = endTime.getTime();
        } else {
          // Handle string from database
          const endTimeString = String(endTime);
          const utcEndTimeString = endTimeString.includes('Z') ? endTimeString : endTimeString + 'Z';
          endTimestamp = Date.parse(utcEndTimeString);
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
