
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

interface SessionTimerCardProps {
  startTime?: Date;
  gameType?: string;
  format?: string;
  smallBlind?: number;
  bigBlind?: number;
  onEndSession?: () => void;
  hideEndButton?: boolean;
}

const SessionTimerCard: React.FC<SessionTimerCardProps> = ({ 
  startTime, 
  gameType,
  format,
  smallBlind,
  bigBlind,
  onEndSession,
  hideEndButton = false
}) => {
  const [duration, setDuration] = useState<string>('00:00:00');
  
  useEffect(() => {
    if (!startTime) return;
    
    const calculateDuration = () => {
      const now = new Date();
      const diff = now.getTime() - new Date(startTime).getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    
    calculateDuration();
    const intervalId = setInterval(calculateDuration, 1000);
    
    return () => clearInterval(intervalId);
  }, [startTime]);
  
  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="text-poker-feltGreen">{duration}</span>
            </h2>
            <p className="text-sm text-gray-500">
              Session Time
            </p>
          </div>
          
          {!hideEndButton && onEndSession && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="ml-auto"
              onClick={onEndSession}
            >
              <Icon name="XCircle" size={16} className="mr-2" />
              End Session
            </Button>
          )}
        </div>
        
        {/* Display Game Type, Format, and Blinds if provided */}
        {(gameType || format || smallBlind || bigBlind) && (
          <div className="bg-gray-50 p-3 rounded-md text-sm mt-3">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {gameType && (
                <>
                  <span className="text-gray-500">Game:</span>
                  <span className="font-medium text-right">{gameType}</span>
                </>
              )}
              
              {format && (
                <>
                  <span className="text-gray-500">Format:</span>
                  <span className="font-medium text-right">{format}</span>
                </>
              )}
              
              {(smallBlind || bigBlind) && (
                <>
                  <span className="text-gray-500">Stakes:</span>
                  <span className="font-medium text-right">
                    {smallBlind && bigBlind 
                      ? `$${smallBlind} / $${bigBlind}`
                      : smallBlind 
                        ? `SB: $${smallBlind}`
                        : bigBlind 
                          ? `BB: $${bigBlind}`
                          : '-'
                    }
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionTimerCard;
