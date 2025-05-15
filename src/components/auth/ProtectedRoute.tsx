
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const location = useLocation();
  
  // For debugging
  useEffect(() => {
    console.log("ProtectedRoute render - Auth state:", {
      isAuthenticated,
      isInitialized,
      isLoading,
      path: location.pathname
    });
  }, [isAuthenticated, isInitialized, isLoading, location.pathname]);
  
  // If auth is still initializing or loading, show loading
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-gold"></div>
      </div>
    );
  }

  // If user is not authenticated after initialization, redirect to login
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login from:", location.pathname);
    // Store the current location they were trying to access
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
