
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';

export const useActiveSessionRecovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, isLoading: isSessionsLoading } = useSessionContext();
  const [isLoading, setIsLoading] = useState(true);

  // Find ALL active sessions from the main session context
  const activeSessions = sessions.filter(session => session.isActive) || [];

  useEffect(() => {
    if (!isSessionsLoading) {
      setIsLoading(false);
    }
  }, [isSessionsLoading]);

  const resumeSession = (sessionId: string) => {
    const sessionToResume = activeSessions.find(session => session.id === sessionId);
    if (sessionToResume) {
      // Add safety check - verify session is still valid before navigating
      if (sessionToResume.isActive) {
        navigate(`/live-session/${sessionToResume.id}`);
      } else {
        console.warn('Attempted to resume inactive session:', sessionToResume.id);
        // Session is no longer active, don't navigate
      }
    }
  };

  return {
    activeSessions,
    isLoading,
    resumeSession,
    hasActiveSessions: activeSessions.length > 0
  };
};
