
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';

export const useActiveSessionRecovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, isLoading: isSessionsLoading } = useSessionContext();
  const [isLoading, setIsLoading] = useState(true);

  // Find active session from the main session context instead of fetching separately
  const activeSession = sessions.find(session => session.isActive) || null;

  useEffect(() => {
    if (!isSessionsLoading) {
      setIsLoading(false);
    }
  }, [isSessionsLoading]);

  const resumeSession = () => {
    if (activeSession) {
      // Add safety check - verify session is still valid before navigating
      if (activeSession.isActive) {
        navigate(`/live-session/${activeSession.id}`);
      } else {
        console.warn('Attempted to resume inactive session:', activeSession.id);
        // Session is no longer active, don't navigate
      }
    }
  };

  return {
    activeSession,
    isLoading,
    resumeSession,
    hasActiveSession: !!activeSession && activeSession.isActive
  };
};
