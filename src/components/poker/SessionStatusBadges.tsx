
import React from 'react';
import { format, differenceInMinutes, differenceInHours, addSeconds } from 'date-fns';
import SessionTimeBadge from './SessionTimeBadge';

interface SessionStatusBadgesProps {
  startTime: string;
  endTime?: string;
  sessionDuration?: number; // Custom duration in seconds (takes priority over calculation)
}

const SessionStatusBadges: React.FC<SessionStatusBadgesProps> = ({
  startTime,
  endTime,
  sessionDuration: customDuration
}) => {
  const startDate = new Date(startTime);
  const formattedDate = format(startDate, 'd MMM yyyy');
  const formattedTime = format(startDate, 'HH:mm');
  
  // Calculate display end time:
  // PRIORITY 1: If customDuration exists, derive end from startTime + duration
  // PRIORITY 2: Fall back to actual endTime from database
  const getDisplayEndTime = () => {
    if (customDuration && customDuration > 0) {
      // Calculate derived end time: startTime + sessionDuration (handles midnight crossing)
      return addSeconds(startDate, customDuration);
    }
    return endTime ? new Date(endTime) : null;
  };
  
  const displayEndTime = getDisplayEndTime();
  
  const formattedEndDate = displayEndTime 
    ? format(displayEndTime, 'd MMM yyyy')
    : null;
  const formattedEndTime = displayEndTime 
    ? format(displayEndTime, 'HH:mm')
    : null;

  const calculateDuration = () => {
    // PRIORITY 1: Use manually saved sessionDuration if available
    if (customDuration && customDuration > 0) {
      const hours = Math.floor(customDuration / 3600);
      const minutes = Math.floor((customDuration % 3600) / 60);
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    // PRIORITY 2: Fall back to timestamp calculation
    if (!endTime) return null;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  const sessionDuration = calculateDuration();

  return (
    <div className="flex flex-row flex-wrap gap-4 mb-6">
      <SessionTimeBadge
        title="Started"
        value={`${formattedDate}\n${formattedTime}`}
        variant="timeStarted"
        type="started"
      />
      
      {sessionDuration && (
        <SessionTimeBadge
          title="Duration"
          value={sessionDuration}
          variant="timeDuration"
          type="duration"
        />
      )}
      
      {formattedEndDate && formattedEndTime && (
        <SessionTimeBadge
          title="Ended"
          value={`${formattedEndDate}\n${formattedEndTime}`}
          variant="timeEnded"
          type="ended"
        />
      )}
    </div>
  );
};

export default SessionStatusBadges;
