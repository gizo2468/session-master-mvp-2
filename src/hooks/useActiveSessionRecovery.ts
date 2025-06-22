
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { PokerSession } from '@/types/poker';

export const useActiveSessionRecovery = () => {
  const navigate = useNavigate();
  const { sessions } = useSessionContext();
  const [isLoading, setIsLoading] = useState(false);

  // Get active sessions from the context
  const activeSessions = sessions.filter(session => session.isActive);
  const hasActiveSessions = activeSessions.length > 0;

  const resumeSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Resuming session:', sessionId);
      
      // Find the session to ensure it exists and is active
      const session = sessions.find(s => s.id === sessionId && s.isActive);
      
      if (!session) {
        console.error('❌ Session not found or not active:', sessionId);
        throw new Error('Session not found or no longer active');
      }

      console.log('✅ Session found, navigating to live session page');
      navigate(`/session/${sessionId}`);
      
    } catch (error) {
      console.error('❌ Failed to resume session:', error);
      throw error;
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
