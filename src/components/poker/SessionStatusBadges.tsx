
import React from 'react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import SessionTimeBadge from './SessionTimeBadge';

interface SessionStatusBadgesProps {
  startTime: string;
  endTime?: string;
}

const SessionStatusBadges: React.FC<SessionStatusBadgesProps> = ({
  startTime,
  endTime
}) => {
  const formattedDate = format(new Date(startTime), 'd MMM yyyy');
  const formattedTime = format(new Date(startTime), 'HH:mm');
  
  const formattedEndDate = endTime 
    ? format(new Date(endTime), 'd MMM yyyy')
    : null;
  const formattedEndTime = endTime 
    ? format(new Date(endTime), 'HH:mm')
    : null;
    
  const calculateDuration = () => {
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
  
  const sessionDuration = endTime ? calculateDuration() : null;

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
