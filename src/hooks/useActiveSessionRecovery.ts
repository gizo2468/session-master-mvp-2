
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';

export const useActiveSessionRecovery = () => {
  const navigate = useNavigate();
  const { sessions } = useSessionContext();
  const [isLoading, setIsLoading] = useState(false);

  // Get active sessions from the context with validation
  const activeSessions = sessions.filter(session => {
    return session && 
           session.id && 
           session.isActive === true && 
           session.startTime && 
           session.gameType && 
           session.format;
  });
  
  const hasActiveSessions = activeSessions.length > 0;

  const resumeSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Resuming session:', sessionId);
      
      // Validate session ID
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID provided');
      }
      
      // Find the session to ensure it exists and is active
      const session = sessions.find(s => s && s.id === sessionId && s.isActive);
      
      if (!session) {
        console.error('❌ Session not found or not active:', sessionId);
        throw new Error('Session not found or no longer active');
      }

      // Validate session has required data
      if (!session.startTime || !session.gameType || !session.format) {
        console.error('❌ Session missing required data:', session);
        throw new Error('Session data is incomplete');
      }

      console.log('✅ Session found and validated, navigating to live session page');
      
      // Navigate with replace to avoid back button issues
      navigate(`/session/${sessionId}`, { replace: true });
      
    } catch (error) {
      console.error('❌ Failed to resume session:', error);
      
      // Show user-friendly error message based on error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // You could add a toast here if needed, but for now just log and re-throw
      throw new Error(`Failed to resume session: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeSessions,
    isLoading,
    resumeSession,
    hasActiveSessions
  };
};
