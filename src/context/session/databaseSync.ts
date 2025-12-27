
import { PokerSession } from '@/types/poker';
import { saveSessionToDatabase } from '@/utils/database';
import { saveActiveSession, saveSessionSummaries } from './storage';

export const saveSessionsToSources = async (
  sessionsToSave: PokerSession[],
  userId: string | null,
  setShowStorageWarning: (show: boolean) => void,
  toast: any
) => {
  // Save to lightweight localStorage for offline access
  if (userId) {
    try {
      // Find and save active session (full object, stripped of images)
      const activeSession = sessionsToSave.find(s => s.isActive);
      saveActiveSession(activeSession || null, userId);
      
      // Save last 20 sessions as lightweight summaries (no hands, no tables)
      saveSessionSummaries(sessionsToSave, userId);
      
      console.log('💾 Saved active session + summaries to localStorage');
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
      toast({
        title: "Storage issue detected",
        description: "There was a problem saving your session data.",
        variant: "destructive"
      });
    }
  }

  // Save to database if user is logged in (full data still goes to cloud)
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
