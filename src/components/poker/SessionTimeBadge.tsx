
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Timer } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type BadgeVariant = 'timeStarted' | 'timeDuration' | 'timeEnded';

interface SessionTimeBadgeProps {
  title: string;
  value: string;
  variant: BadgeVariant;
  type: 'started' | 'duration' | 'ended';
}

const SessionTimeBadge: React.FC<SessionTimeBadgeProps> = ({ title, value, variant, type }) => {
  const getBadgeIcon = () => {
    switch (type) {
      case 'started':
        return <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />;
      case 'duration':
        return <Timer className="w-4 h-4 mr-2 flex-shrink-0" />;
      case 'ended':
        return <Clock className="w-4 h-4 mr-2 flex-shrink-0" />;
      default:
        return null;
    }
  };

  // Format the value string to display better
  const formatDisplayValue = () => {
    // Handle different types of values
    if (type === 'duration') {
      return value; // Duration is already compact
    }
    
    // For dates, format them more cleanly
    const parts = value.split('\n');
    if (parts.length === 2) {
      return (
        <span className="text-center">
          {parts[0]}
          <span className="mx-1 opacity-70">•</span>
          {parts[1]}
        </span>
      );
    }
    
    return value;
  };

  return (
    <div className="flex-1 min-w-0">
      <Badge 
        variant={variant}
        className="flex flex-col items-center justify-center w-full p-0 overflow-hidden shadow-sm h-full"
      >
        <div className="w-full py-1.5 px-3 font-bold text-center border-b border-gray-200 bg-opacity-50 text-sm">
          {title}
        </div>
        <div className="w-full py-2.5 px-3 flex items-center justify-center">
          <div className="flex items-center justify-center w-full">
            {getBadgeIcon()}
            <span className="font-medium text-sm">{formatDisplayValue()}</span>
          </div>
        </div>
      </Badge>
    </div>
  );
};

export default SessionTimeBadge;
