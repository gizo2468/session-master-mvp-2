
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

type BadgeVariant = 'timeStarted' | 'timeDuration' | 'timeEnded';

interface SessionTimeBadgeProps {
  title: string;
  value: string;
  variant: BadgeVariant;
  type: 'started' | 'duration' | 'ended';
}

const SessionTimeBadge: React.FC<SessionTimeBadgeProps> = ({ title, value, variant, type }) => {
  // Format the value string to display better
  const formatDisplayValue = () => {
    // Handle different types of values
    if (type === 'duration') {
      return (
        <div className="flex items-center justify-center w-full">
          <span className="font-bold text-xl">{value}</span>
        </div>
      );
    }
    
    // For dates, format them more consistently between started and ended badges
    const parts = value.split('\n');
    if (parts.length === 2) {
      // Extract date and time parts
      const datePart = parts[0];
      const timePart = parts[1];

      // For both started and ended badges, use the same layout
      return (
        <div className="flex flex-col items-center justify-center w-full text-center">
          <span className="block w-full text-center">{datePart}</span>
          <span className="block w-full text-center">{timePart}</span>
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
        {/* Title area with divider for all badge types */}
        <div className="w-full py-1.5 px-3 font-bold text-center border-b border-gray-200 bg-opacity-50 text-sm">
          {title}
        </div>
        {/* Content area with fixed min-height to ensure consistent height across all badges */}
        <div className="w-full flex items-center justify-center py-3 min-h-[4rem]">
          <div className="flex items-center justify-center w-full px-3">
            <div className={`font-medium ${type === 'duration' ? 'w-full text-center' : 'w-full text-center text-sm'}`}>
              {formatDisplayValue()}
            </div>
          </div>
        </div>
      </Badge>
    </div>
  );
};

export default SessionTimeBadge;
