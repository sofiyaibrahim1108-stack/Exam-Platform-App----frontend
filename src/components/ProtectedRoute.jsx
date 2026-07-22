import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Route protector that redirects unauthenticated users to the login screen.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen bg-background flex flex-col justify-center items-center gap-md">
        <div class="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p class="font-label-caps text-label-caps text-primary tracking-widest animate-pulse">
          SECURING CONNECTION...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
