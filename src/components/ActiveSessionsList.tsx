import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { PokerSession } from '@/types/poker';
import { useToast } from '@/hooks/use-toast';
import { useSessionContext } from '@/context/SessionContext';
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
    <div key={session.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h4 className="text-md font-bold text-green-800">{session.location || 'Unknown Location'}</h4>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <Icon name="MapPin" size={14} />
              <span>{session.location || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="Clock" size={14} />
              <span>{formatDuration(session.startTime)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">{session.gameType || 'N/A'}</span>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">{session.format || 'N/A'}</span>
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
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      toast({
        title: "Session Deleted",
        description: "The active session has been successfully deleted.",
        variant: "default"
      });
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
      <h3 className="text-lg font-bold text-green-800 mb-3">
        Active Sessions ({validSessions.length})
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
