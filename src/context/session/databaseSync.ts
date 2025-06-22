
import { PokerSession } from '@/types/poker';
import { saveSessionToDatabase } from '@/utils/database';
import { getUserStorageKey, MAX_STORED_SESSIONS } from './storage';

export const saveSessionsToSources = async (
  sessionsToSave: PokerSession[],
  userId: string | null,
  setShowStorageWarning: (show: boolean) => void,
  toast: any
) => {
  // Always save to localStorage for offline access
  if (userId) {
    try {
      const sortedSessions = [...sessionsToSave].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      let sessionsToStore = sortedSessions;
      
      if (sortedSessions.length > MAX_STORED_SESSIONS) {
        const activeSessions = sortedSessions.filter(s => s.isActive);
        const inactiveSessions = sortedSessions.filter(s => !s.isActive).slice(0, MAX_STORED_SESSIONS - activeSessions.length);
        sessionsToStore = [...activeSessions, ...inactiveSessions];
        
        if (sortedSessions.length !== sessionsToStore.length) {
          const wasDismissed = sessionStorage.getItem('storageWarningDismissed') === 'true';
          if (!wasDismissed) {
            setShowStorageWarning(true);
          }
        }
      }
      
      const storageKey = getUserStorageKey(userId);
      localStorage.setItem(storageKey, JSON.stringify(sessionsToStore));
      console.log('💾 Saved sessions to localStorage key:', storageKey, 'Count:', sessionsToStore.length);
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
      
      toast({
        title: "Storage issue detected",
        description: "There was a problem saving your sessions. Try clearing some old sessions to free up space.",
        variant: "destructive"
      });
    }
  }

  // Save to database if user is logged in
  if (userId) {
    for (const session of sessionsToSave) {
      try {
        await saveSessionToDatabase(session);
      } catch (error) {
        console.error('Failed to save session to database:', session.id, error);
      }
    }
  }
};
