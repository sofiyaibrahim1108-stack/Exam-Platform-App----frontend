import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, getAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recover active session on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Fetch user profile using the stored access token
        const meResponse = await api.get('/auth/me');
        setUser(meResponse.data.data.user);
      } catch (error) {
        // Local token is invalid or expired
        setAccessToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in user
   */
  const login = async (emailOrParams, password) => {
    try {
      const payload = typeof emailOrParams === 'object' ? emailOrParams : { email: emailOrParams, password };
      const response = await api.post('/auth/login', payload);
      const { user: loggedUser, accessToken } = response.data.data;
      
      setAccessToken(accessToken);
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Register user
   */
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: registeredUser, accessToken } = response.data.data;

      setAccessToken(accessToken);
      setUser(registeredUser);
      return registeredUser;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Proceed with local logout cleanup even if server invalidation fails
    } finally {
      setAccessToken('');
      setUser(null);
    }
  };

  /**
   * Trigger forgot password link dispatch
   */
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Reset user password
   */
  const resetPassword = async (token, password, confirmPassword) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { 
        password, 
        confirmPassword 
      });
      const { user: resetUser, accessToken } = response.data.data;
      
      setAccessToken(accessToken);
      setUser(resetUser);
      return resetUser;
    } catch (error) {
      throw error;
    }
  };

  const registerStaff = async (staffData) => {
    try {
      const response = await api.post('/auth/register/staff', staffData);
      const { user: registeredUser, accessToken } = response.data.data;

      setAccessToken(accessToken);
      setUser(registeredUser);
      return registeredUser;
    } catch (error) {
      throw error;
    }
  };

  const registerStudent = async (studentData) => {
    try {
      const response = await api.post('/auth/register/student', studentData);
      const { user: registeredUser, accessToken } = response.data.data;

      setAccessToken(accessToken);
      setUser(registeredUser);
      return registeredUser;
    } catch (error) {
      throw error;
    }
  };

  const contextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    registerStaff,
    registerStudent,
    logout,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
