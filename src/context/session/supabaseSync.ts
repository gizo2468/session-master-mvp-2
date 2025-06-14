import { PokerSession } from '@/types/poker';
import { User } from '@/context/AuthContext';
import { saveSessionToDatabase } from '@/utils/database';

export const syncSessionToSupabase = async (session: PokerSession, user: User, toast: any) => {
  if (!user) {
    console.warn('No authenticated user - skipping Supabase sync');
    return;
  }
  
  try {
    console.log('🔄 Syncing session to Supabase for user:', user.id, 'Email:', user.email, 'Session:', session.id);
    
    const success = await saveSessionToDatabase(session);
    
    if (success) {
      console.log('✅ Session synced successfully for user:', user.id, 'email:', user.email);
      
      if (!session.isActive && session.endTime) {
        toast({
          title: "Session saved to cloud",
          description: "Your session has been backed up to your account.",
        });
      }
    } else {
      throw new Error('Failed to save session to database');
    }
  } catch (error) {
    console.error("Error syncing session to Supabase:", error);
    toast({
      title: "Cloud sync failed",
      description: "Unable to save session to cloud. Your data is still saved locally.",
      variant: "destructive"
    });
  }
};
