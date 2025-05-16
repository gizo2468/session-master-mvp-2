
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, sessionId } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [prevRoute, setPrevRoute] = useState<string | null>(null);
  const [prevSessionId, setPrevSessionId] = useState<string | null>(null);

  // Add a brief delay to ensure authentication state is properly checked
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [sessionId, isAuthenticated]);

  // Track route changes to avoid unnecessary rechecks
  useEffect(() => {
    if (location.pathname !== prevRoute) {
      console.log(`Route changed from ${prevRoute || 'initial'} to ${location.pathname}`);
      setPrevRoute(location.pathname);
    }
  }, [location.pathname, prevRoute]);

  // Track session ID changes to detect actual re-authentications
  useEffect(() => {
    if (sessionId !== prevSessionId) {
      console.log(`Session ID changed: ${prevSessionId || 'initial'} -> ${sessionId || 'null'}`);
      setPrevSessionId(sessionId);
    }
  }, [sessionId, prevSessionId]);

  // Combined loading state between auth provider and local checking
  const isResolving = isLoading || isChecking;

  if (isResolving) {
    // Show a loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-gold"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login from:", location.pathname);
    // Redirect to login page if not authenticated, preserving the intended destination
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  console.log("User authenticated, rendering protected content for:", location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute;
