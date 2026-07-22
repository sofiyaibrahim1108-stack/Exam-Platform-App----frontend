import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ExamLockGuard = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [hasActiveExam, setHasActiveExam] = useState(false);
  const [activeExamId, setActiveExamId] = useState(null);

  const checkActiveAttempt = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'Student') {
      setChecking(false);
      return;
    }

    try {
      const response = await api.get('/exams/student/active-attempt');
      if (response.data && response.data.success && response.data.hasActiveExam) {
        setHasActiveExam(true);
        setActiveExamId(response.data.examId);
      } else {
        setHasActiveExam(false);
        setActiveExamId(null);
      }
    } catch (error) {
      console.error('Failed to verify active exam attempt:', error);
    } finally {
      setChecking(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    checkActiveAttempt();
  }, [location.pathname, checkActiveAttempt]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="font-mono text-xs text-primary tracking-widest animate-pulse">
          VERIFYING SECURITY LOCK...
        </p>
      </div>
    );
  }

  // Target route format
  const currentExamSessionPath = activeExamId ? `/student/exam-session/${activeExamId}` : '';

  if (hasActiveExam && activeExamId && location.pathname !== currentExamSessionPath) {
    return <Navigate to={currentExamSessionPath} replace />;
  }

  return <Outlet />;
};

export default ExamLockGuard;
