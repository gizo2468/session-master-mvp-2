
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { PokerSession } from '@/types/PokerSession';
import { useToast } from '@/hooks/use-toast';

interface ActiveSessionsListProps {
  sessions: PokerSession[];
  onResume: (sessionId: string) => void;
}

export default function ActiveSessionsList({ sessions, onResume }: ActiveSessionsListProps) {
  const { toast } = useToast();
  
  const formatDuration = (startTime: Date) => {
    try {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return 'Unknown';
    }
  };

  // Filter and validate sessions
  const validSessions = sessions.filter(session => {
    return session && 
           session.id && 
           session.location && 
           session.startTime && 
           session.gameType && 
           session.format;
  });

  if (validSessions.length === 0) {
    return null;
  }

  const handleResume = async (sessionId: string) => {
    try {
      console.log('🔄 Resume button clicked for session:', sessionId);
      
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
      
      await onResume(sessionId);
    } catch (error) {
      console.error('❌ Error in resume handler:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Resume Failed",
        description: `Could not resume session: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full space-y-3">
      <h3 className="text-lg font-bold text-green-800 mb-3">
        Active Sessions ({validSessions.length})
      </h3>
      
      {validSessions.map((session) => (
        <div key={session.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h4 className="text-md font-bold text-green-800">{session.location || 'Unknown Location'}</h4>
              </div>
              <div className="flex items-center gap-4 text-sm text-green-600">
                <span>{session.gameType} • {session.format}</span>
                <span>Duration: {formatDuration(session.startTime)}</span>
              </div>
              {session.tables && session.tables.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {session.tables.filter(t => t && t.isActive).length} active tables
                </p>
              )}
            </div>
            <Button 
              onClick={() => handleResume(session.id)}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
              disabled={!session.id}
            >
              <Icon name="Play" size={16} className="mr-1" />
              Resume
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
