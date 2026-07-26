import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { PokerSession } from '@/types/poker';
import { useToast } from '@/hooks/use-toast';
import { useSessionContext } from '@/context/SessionContext';
import { formatCurrency } from '@/utils/statisticsCalculator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ActiveSessionsListProps {
  sessions: PokerSession[];
  onResume: (sessionId: string) => void;
}

// Memoize individual session items
const ActiveSessionItem = React.memo(({ session, onResume, handleDeleteClick }: { session: PokerSession, onResume: (id: string) => Promise<void>, handleDeleteClick: (session: PokerSession) => void }) => {
  const formatDuration = (startTime: Date) => {
    try {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours >= 100) {
        return `${hours}h`;
      }
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return 'Unknown';
    }
  };

  return (
    <div key={session.id} className="bg-green-50 dark:bg-[hsl(145,12%,18%)] border border-green-200 dark:border-green-800/50 dark:shadow-[0_0px_12px_0_rgba(34,197,94,0.1)] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h4 className="text-md font-bold text-green-800 dark:text-green-300">{session.location || 'Unknown Location'}</h4>
          </div>
          {(() => {
            const tables = session.tables ?? [];
            const total = tables.length > 0
              ? tables.reduce((sum, t) => sum + (t.buyIn || 0) + (t.rebuyAmount || 0), 0)
              : (session.buyIn || 0) + (session.rebuyAmount || 0);
            const currency = session.currency || tables[0]?.currency || 'USD';
            return (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Total Buy-Ins: {formatCurrency(total, currency)}
              </div>
            );
          })()}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">{session.gameType || 'N/A'}</span>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <span className="text-gray-600 dark:text-gray-400">{session.format || 'N/A'}</span>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <Icon name="Clock" size={14} />
              <span className="whitespace-nowrap">{formatDuration(session.startTime)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => onResume(session.id)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Icon name="Play" size={16} className="mr-1" />
            Resume
          </Button>
          <Button 
            onClick={() => handleDeleteClick(session)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Icon name="Trash2" size={16} className="mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
});

ActiveSessionItem.displayName = 'ActiveSessionItem';

function ActiveSessionsList({ sessions, onResume }: ActiveSessionsListProps) {
  const { toast } = useToast();
  const { deleteSession } = useSessionContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<PokerSession | null>(null);
  
  // Memoize filtered valid sessions
  const validSessions = React.useMemo(() => {
    return sessions.filter(session => {
      return session && 
             session.id && 
             session.location && 
             session.startTime && 
             session.gameType && 
             session.format;
    });
  }, [sessions]);

  if (validSessions.length === 0) {
    return null;
  }

  const handleResume = async (sessionId: string) => {
    try {
      // Resume session
      
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
      
      await onResume(sessionId);
    } catch (error) {
      console.error('Error in resume handler:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Resume Failed",
        description: `Could not resume session: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (session: PokerSession) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    
    try {
      await deleteSession(sessionToDelete.id);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-primary mb-3">
        Active Sessions <span className="dark:text-primary/60 font-normal">({validSessions.length})</span>
      </h3>
      
      {validSessions.map((session) => (
        <ActiveSessionItem
          key={session.id}
          session={session}
          onResume={handleResume}
          handleDeleteClick={handleDeleteClick}
        />
      ))}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Active Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this active session? This action cannot be undone and will remove all session data including tables and hands.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(ActiveSessionsList);
