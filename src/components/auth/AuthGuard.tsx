import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated and not on auth pages, redirect to login
  const isAuthPage = location.pathname.startsWith('/auth/');
  
  if (!isAuthenticated && !isAuthPage) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If authenticated and on auth pages, redirect to home
  if (isAuthenticated && isAuthPage) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;