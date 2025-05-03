
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Timer } from 'lucide-react';

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
        return <Calendar className="w-4 h-4 mr-1 text-poker-black opacity-70" />;
      case 'duration':
        return <Timer className="w-4 h-4 mr-1 text-poker-black opacity-70" />;
      case 'ended':
        return <Clock className="w-4 h-4 mr-1 text-poker-black opacity-70" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      <Badge 
        variant={variant}
        className="flex flex-col items-center justify-center w-full p-0 overflow-hidden shadow-sm"
      >
        <div className="w-full py-2 px-3 font-bold text-center border-b border-gray-200 bg-opacity-50 text-sm">
          {title}
        </div>
        <div className="w-full p-3 flex items-center justify-center">
          <div className="flex items-center">
            {getBadgeIcon()}
            <span className="font-medium text-sm">{value}</span>
          </div>
        </div>
      </Badge>
    </div>
  );
};

export default SessionTimeBadge;
