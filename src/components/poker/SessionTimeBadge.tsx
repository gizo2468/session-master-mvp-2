
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type BadgeVariant = 'timeStarted' | 'timeDuration' | 'timeEnded';

interface SessionTimeBadgeProps {
  title: string;
  value: string;
  variant: BadgeVariant;
  type: 'started' | 'duration' | 'ended';
}

const SessionTimeBadge: React.FC<SessionTimeBadgeProps> = ({ title, value, variant, type }) => {
  // Only show icon for the duration badge as requested
  const getBadgeIcon = () => {
    if (type === 'duration') {
      return <Timer className="w-4 h-4 mr-2 flex-shrink-0" />;
    }
    return null;
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
        <div className="flex flex-col items-center justify-center w-full text-center">
          <span className="block w-full text-center">{parts[0]}</span>
          <span className="block w-full text-center">
            <span className="opacity-70 mx-1">•</span>
            {parts[1]}
          </span>
        </div>
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
        {/* Explicit border styling to ensure consistent appearance across all badges */}
        <div className="w-full py-1.5 px-3 font-bold text-center border-b border-gray-200 bg-opacity-50 text-sm">
          {title}
        </div>
        <div className="w-full flex items-center justify-center py-3">
          <div className="flex items-center justify-center w-full px-3">
            {getBadgeIcon()}
            <div className="font-medium text-sm w-full text-center">
              {formatDisplayValue()}
            </div>
          </div>
        </div>
      </Badge>
    </div>
  );
};

export default SessionTimeBadge;
