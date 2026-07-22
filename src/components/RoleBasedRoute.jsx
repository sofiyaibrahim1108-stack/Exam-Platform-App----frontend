import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Route wrapper that restricts access based on user role.
 * Redirects unauthorized users to their respective home dashboard.
 */
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen bg-background flex flex-col justify-center items-center gap-md">
        <div class="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p class="font-label-caps text-label-caps text-primary tracking-widest animate-pulse">
          VERIFYING CLEARANCE...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their role-specific dashboard
    let redirectPath = '/login';
    switch (user.role) {
      case 'Super Admin':
        redirectPath = '/super-admin';
        break;
      case 'Admin':
        redirectPath = '/admin';
        break;
      case 'Staff':
        redirectPath = '/staff';
        break;
      case 'Student':
        redirectPath = '/student';
        break;
    }
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;
