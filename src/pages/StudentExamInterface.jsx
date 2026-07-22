import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { setExamSessionId } from '../services/api';
import { useBrowserSecurity } from '../hooks/useBrowserSecurity';
import ExamWarningModal from '../components/ExamWarningModal';
import TakeoverModal from '../components/TakeoverModal';
import { SECURITY_CONFIG } from '../config/securityConfig';

const StudentExamInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core Exam & Attempt States
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOptions, textAnswer, codingAnswer, markedForReview } }

  // Session & Takeover States
  const [takeoverData, setTakeoverData] = useState(null);
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);

  // Navigation & UI States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Guards against duplicate submit / auto-submit races
  const hasSubmittedRef = useRef(false);

  const {
    violationCount,
    modalState,
    closeModal,
    enterFullscreen,
  } = useBrowserSecurity({
    examId: id,
    isStarted,
    maxViolations: exam?.proctoringConfig?.maxViolationsAllowed || SECURITY_CONFIG.MAX_VIOLATIONS,
    initialViolationCount: attempt?.violationCount || 0,
    onAutoSubmit: () => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      setIsStarted(false); // stops all security listeners immediately
      setExamSessionId(null);
      toast.error('Maximum security violations reached. Exam auto-submitted.', {
        duration: 6000,
      });
      navigate('/student/dashboard');
    },
  });

  // Fetch initial details (locked questions page / instructions / auto-resume)
  const fetchExamConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/exams/student/${id}`);
      if (response.data && response.data.success) {
        const data = response.data.data;
        setExam(data);

        // Check if an active session is already running on another device
        if (data.activeSession && data.activeSession.alreadyRunning) {
          setTakeoverData(data.activeSession);
          setShowTakeoverModal(true);
        } else if (data.status === 'Live') {
          // Auto-resume / auto-enter live session without requiring instructions click on refresh
          await handleStartExam();
          return;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to retrieve exam details.');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExamConfig();
    }
  }, [id]);

  // History API trap for Browser Back button during active exam
  useEffect(() => {
    if (!isStarted) return;

    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      toast.error('Navigation is disabled during an active examination session.', {
        id: 'back-blocked',
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isStarted]);

  // 20-second Heartbeat timer while exam is running
  useEffect(() => {
    let interval = null;
    if (isStarted && id) {
      interval = setInterval(async () => {
        try {
          await api.post(`/exams/student/${id}/heartbeat`);
        } catch (error) {
          if (error?.response?.data?.code === 'SESSION_INVALIDATED' || error?.response?.status === 401) {
            clearInterval(interval);
            setIsStarted(false);
            setExamSessionId(null);
            toast.error('Your exam has been continued on another device.', { duration: 8000 });
            navigate('/student/dashboard');
          }
        }
      }, 20000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, id, navigate]);

  // Track visited question indices
  useEffect(() => {
    if (isStarted && questions.length > 0) {
      setVisited((prev) => {
        const next = new Set(prev);
        next.add(currentIdx);
        return next;
      });
    }
  }, [currentIdx, isStarted, questions]);

  // Start exam session
  const handleStartExam = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/exams/student/${id}/start`);
      if (response.data && response.data.success) {
        const data = response.data.data;

        // If exam is running on another device (within 60s), prompt takeover modal
        if (data.alreadyRunning) {
          setTakeoverData(data);
          setShowTakeoverModal(true);
          return;
        }

        const { sessionId, exam: examInfo, attempt: attemptInfo, questions: questionsList } = data;
        if (sessionId) {
          setExamSessionId(sessionId);
        }

        setExam(examInfo);
        setQuestions(questionsList);
        setAttempt(attemptInfo);

        // Populate local answers map
        const answersMap = {};
        attemptInfo.answers.forEach((ans) => {
          answersMap[ans.question] = {
            selectedOptions: ans.selectedOptions || [],
            textAnswer: ans.textAnswer || '',
            codingAnswer: ans.codingAnswer || '',
            markedForReview: ans.markedForReview || false,
          };
        });
        setAnswers(answersMap);

        // Calculate remaining duration
        const startTime = new Date(attemptInfo.startTime).getTime();
        const durationMs = examInfo.durationMinutes * 60 * 1000;
        const examEndTime = new Date(examInfo.endTime).getTime();
        const now = Date.now();

        const absoluteEndTime = Math.min(startTime + durationMs, examEndTime);
        const remainingSeconds = Math.max(Math.floor((absoluteEndTime - now) / 1000), 0);

        setTimeLeft(remainingSeconds);
        setIsStarted(true);

        // Request Fullscreen on Exam Start
        enterFullscreen();

        toast.success('Exam started! All answers will auto-save.');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to start the exam session.');
    } finally {
      setLoading(false);
    }
  };

  // Force Takeover Handler
  const handleConfirmTakeover = async () => {
    try {
      setTakeoverLoading(true);
      const response = await api.post(`/exams/student/${id}/takeover`);
      if (response.data && response.data.success) {
        const { sessionId, exam: examInfo, attempt: attemptInfo, questions: questionsList } = response.data.data;

        setExamSessionId(sessionId);
        setExam(examInfo);
        setQuestions(questionsList);
        setAttempt(attemptInfo);

        const answersMap = {};
        attemptInfo.answers.forEach((ans) => {
          answersMap[ans.question] = {
            selectedOptions: ans.selectedOptions || [],
            textAnswer: ans.textAnswer || '',
            codingAnswer: ans.codingAnswer || '',
            markedForReview: ans.markedForReview || false,
          };
        });
        setAnswers(answersMap);

        const startTime = new Date(attemptInfo.startTime).getTime();
        const durationMs = examInfo.durationMinutes * 60 * 1000;
        const examEndTime = new Date(examInfo.endTime).getTime();
        const now = Date.now();

        const absoluteEndTime = Math.min(startTime + durationMs, examEndTime);
        const remainingSeconds = Math.max(Math.floor((absoluteEndTime - now) / 1000), 0);

        setTimeLeft(remainingSeconds);
        setIsStarted(true);
        setShowTakeoverModal(false);

        enterFullscreen();
        toast.success('Session transferred successfully! Resumed exam on this device.');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to transfer exam session.');
    } finally {
      setTakeoverLoading(false);
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            toast.error('Time is up! Please submit your exam now.', { duration: 10000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, timeLeft]);

  // Format timer helper
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Helper to get active state of current question
  const currentQuestion = questions[currentIdx] || null;
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] || {
    selectedOptions: [],
    textAnswer: '',
    codingAnswer: '',
    markedForReview: false,
  } : null;

  // Auto-save wrapper targeting the backend API
  const saveAnswerToBackend = async (qId, answerState) => {
    try {
      await api.put(`/exams/student/${id}/answer`, {
        questionId: qId,
        ...answerState,
      });
    } catch (error) {
      if (error?.response?.data?.code === 'SESSION_INVALIDATED' || error?.response?.status === 401) {
        setIsStarted(false);
        setExamSessionId(null);
        toast.error('Your exam has been continued on another device.', { duration: 8000 });
        navigate('/student/dashboard');
        return;
      }
      console.error('Background auto-save failed:', error);
      toast.error('Auto-save sync failed. Check connection.');
    }
  };

  // User input change triggers auto-save immediately
  const handleOptionSelect = (optionId) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;

    let updatedOptions = [];
    if (currentQuestion.type === 'Multi-Select') {
      const isSelected = currentAnswer.selectedOptions.includes(optionId);
      if (isSelected) {
        updatedOptions = currentAnswer.selectedOptions.filter((o) => o !== optionId);
      } else {
        updatedOptions = [...currentAnswer.selectedOptions, optionId];
      }
    } else {
      // MCQ
      updatedOptions = [optionId];
    }

    const nextAnswer = {
      ...currentAnswer,
      selectedOptions: updatedOptions,
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: nextAnswer,
    }));

    // Auto-save in the background
    saveAnswerToBackend(qId, nextAnswer);
  };

  const handleTextAnswerChange = (e) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;

    const nextAnswer = {
      ...currentAnswer,
      textAnswer: e.target.value,
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: nextAnswer,
    }));

    saveAnswerToBackend(qId, nextAnswer);
  };

  const handleCodingAnswerChange = (e) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;

    const nextAnswer = {
      ...currentAnswer,
      codingAnswer: e.target.value,
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: nextAnswer,
    }));

    saveAnswerToBackend(qId, nextAnswer);
  };

  // Toggle Mark for Review
  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;

    const nextAnswer = {
      ...currentAnswer,
      markedForReview: !currentAnswer.markedForReview,
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: nextAnswer,
    }));

    saveAnswerToBackend(qId, nextAnswer);

    if (nextAnswer.markedForReview) {
      toast.success('Question marked for review.');
    } else {
      toast.success('Question unmarked.');
    }
  };

  // Clear Response
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;

    const nextAnswer = {
      ...currentAnswer,
      selectedOptions: [],
      textAnswer: '',
      codingAnswer: '',
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: nextAnswer,
    }));

    saveAnswerToBackend(qId, nextAnswer);
    toast.success('Response cleared.');
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSaveAndNext = () => {
    toast.success('Answer saved.');
    handleNext();
  };

  // Jump to specific index in palette
  const handleJumpToQuestion = (index) => {
    setCurrentIdx(index);
  };

  // Question status color evaluation helper
  const getQuestionStatusClass = (idx) => {
    const q = questions[idx];
    if (!q) return 'bg-surface-container-high text-on-surface-variant';

    const ans = answers[q._id];
    const isCurrent = currentIdx === idx;

    let baseClass = '';

    if (ans?.markedForReview) {
      baseClass = 'bg-purple-600 text-white hover:bg-purple-700';
    } else if (
      ans &&
      (ans.selectedOptions.length > 0 || ans.textAnswer.trim() !== '' || ans.codingAnswer.trim() !== '')
    ) {
      baseClass = 'bg-green-600 text-white hover:bg-green-700';
    } else if (visited.has(idx)) {
      baseClass = 'bg-red-500 text-white hover:bg-red-600';
    } else {
      baseClass = 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest';
    }

    if (isCurrent) {
      return `${baseClass} ring-4 ring-secondary border-white shadow-md scale-110`;
    }

    return baseClass;
  };

  // Statistics calculation for Submit Confirm
  const getSubmitStats = () => {
    let answered = 0;
    let marked = 0;

    questions.forEach((q) => {
      const ans = answers[q._id];
      if (ans?.markedForReview) {
        marked++;
      }
      if (
        ans &&
        (ans.selectedOptions.length > 0 || ans.textAnswer.trim() !== '' || ans.codingAnswer.trim() !== '')
      ) {
        answered++;
      }
    });

    const total = questions.length;
    const notAnswered = total - answered;

    return {
      total,
      answered,
      notAnswered,
      markedForReview: marked,
    };
  };

  // Submit API call (manual submit only — auto-submit path never calls this,
  // see onAutoSubmit above)
  const handleSubmitExam = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    try {
      setSubmitting(true);
      const response = await api.post(`/exams/student/${id}/submit`);
      if (response.data && response.data.success) {
        toast.success('Examination submitted successfully!');
        setIsStarted(false);
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Submission failed. Please try again.');
      // Allow retry on genuine failure
      hasSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="font-mono text-xs text-primary tracking-widest animate-pulse">
          LOADING SECURE WORKSPACE...
        </p>
      </div>
    );
  }

  // --- INSTRUCTIONS SCREEN ---
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background text-on-surface font-sans py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top Banner */}
          <div className="glass-panel p-8 rounded-[28px] border border-primary/10 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 bg-primary/15 border border-primary/20 rounded-md text-[10px] font-mono font-bold text-primary uppercase">
                Ready for Launch
              </span>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight mt-3">
                {exam?.title || 'Examination Session'}
              </h1>
              <p className="text-on-surface-variant text-sm font-semibold mt-1">
                Subject: {exam?.subject?.name} ({exam?.subject?.code})
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-high/40 py-2 px-4 rounded-xl border border-primary/5 shrink-0 self-start md:self-center">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
              Secured Session Gateway
            </div>
          </div>

          {/* Parameters Detail */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-[20px] bg-white border border-primary/5">
              <span className="text-[10px] text-on-surface-variant/60 uppercase font-mono block">Allocated Time</span>
              <span className="block font-bold text-lg text-primary font-mono mt-1">
                {exam?.durationMinutes} Minutes
              </span>
            </div>
            <div className="glass-card p-5 rounded-[20px] bg-white border border-primary/5">
              <span className="text-[10px] text-on-surface-variant/60 uppercase font-mono block">Total Questions</span>
              <span className="block font-bold text-lg text-primary font-mono mt-1">
                {exam?.questions?.length || 0} Questions
              </span>
            </div>
            <div className="glass-card p-5 rounded-[20px] bg-white border border-primary/5">
              <span className="text-[10px] text-on-surface-variant/60 uppercase font-mono block">Total Marks</span>
              <span className="block font-bold text-lg text-primary font-mono mt-1">
                {exam?.totalMarks} Marks
              </span>
            </div>
            <div className="glass-card p-5 rounded-[20px] bg-white border border-primary/5">
              <span className="text-[10px] text-on-surface-variant/60 uppercase font-mono block">Negative Marking</span>
              <span className="block font-bold text-lg text-red-700 font-mono mt-1">
                {exam?.negativeMarks > 0 ? `-${exam.negativeMarks} Marks` : 'None'}
              </span>
            </div>
          </div>

          {/* Rules & Guidelines Container */}
          <div className="glass-panel p-8 rounded-[28px] border border-primary/5 bg-white space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b border-primary/5 pb-3">
              <span className="material-symbols-outlined text-xl">rule</span>
              Candidate Guidelines & Regulations
            </h3>

            <div className="space-y-4 text-sm leading-relaxed text-on-surface-variant font-semibold">
              <div className="p-5 bg-primary/5 border border-primary/5 rounded-[20px] space-y-2">
                <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider block mb-1">
                  Security Regulations (Phase 1 Enforced)
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-red-800 font-semibold mb-3">
                  <li>Fullscreen mode is required throughout the examination.</li>
                  <li>Tab switching, window blurring, and exiting fullscreen trigger security warnings.</li>
                  <li>Copy, paste, right-click, text selection, and shortcut keys are strictly disabled.</li>
                  <li>Reaching the maximum allowed violations ({exam?.proctoringConfig?.maxViolationsAllowed || SECURITY_CONFIG.MAX_VIOLATIONS}) will automatically submit your exam.</li>
                </ul>
                <p className="whitespace-pre-wrap font-sans font-medium text-xs leading-normal">
                  {exam?.instructions ||
                    'Please make sure you have read all rules before starting.\n1. Keep a stable internet connection throughout the test.\n2. Do not leave the workspace session before completing the submission.\n3. Make sure to click "Save & Next" to explicitly mark answers for tracking.'}
                </p>
              </div>

              {exam?.rules && exam.rules.length > 0 && (
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-wider block">
                    Special Regulations
                  </span>
                  <ul className="list-disc list-inside space-y-1.5 text-xs font-medium">
                    {exam.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex-1 py-4 px-6 rounded-2xl border border-primary/15 text-primary bg-white hover:bg-primary/5 font-bold text-sm transition-all text-center flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              Cancel
            </button>
            <button
              onClick={handleStartExam}
              className="flex-1 py-4 px-6 rounded-2xl bg-primary text-white hover:bg-primary/95 font-bold text-sm transition-all text-center flex items-center justify-center gap-2 shadow-md shadow-primary/15"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- EXAM SCREEN WORKSPACE ---
  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col h-screen overflow-hidden select-none">

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-primary text-white shadow-md border-b border-primary-container">
        <div>
          <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
            {exam?.subject?.code} - {exam?.subject?.name}
          </span>
          <h2 className="text-base font-extrabold tracking-tight mt-1 truncate max-w-md">
            {exam?.title}
          </h2>
        </div>

        {/* SECURITY VIOLATION COUNTER & TIMER CONTAINER */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-xl font-mono text-xs font-bold text-red-100 shadow-inner">
            <span className="material-symbols-outlined text-base">gavel</span>
            <span>Violations:</span>
            <span className="text-white font-extrabold">
              {violationCount} / {exam?.proctoringConfig?.maxViolationsAllowed || SECURITY_CONFIG.MAX_VIOLATIONS}
            </span>
          </div>

          <div className="flex items-center gap-4 bg-white/10 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">schedule</span>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Time Remaining:</span>
            </div>
            <span
              className={`font-mono font-bold text-lg tracking-wider ${
                timeLeft < 300 ? 'text-red-400 animate-pulse font-extrabold' : 'text-secondary-container'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA (Left Panel Palette + Center Content) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* LEFT PANEL - QUESTION PALETTE */}
        <aside className="w-full md:w-[320px] bg-white border-b md:border-b-0 md:border-r border-primary/5 flex flex-col h-[200px] md:h-full overflow-hidden shrink-0">
          <div className="p-4 border-b border-primary/5 bg-surface-container-low/40 flex justify-between items-center">
            <h3 className="text-xs font-bold text-primary font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">apps</span>
              Question Palette
            </h3>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-mono text-[10px] font-bold">
              Q: {currentIdx + 1}/{questions.length}
            </span>
          </div>

          {/* Palette Grid Container */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => (
                <button
                  key={q._id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`w-11 h-11 rounded-xl border border-outline/10 text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer shadow-sm ${getQuestionStatusClass(
                    idx
                  )}`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          {/* Palette Legends */}
          <div className="p-4 bg-surface-container-low/40 border-t border-primary/5 text-[9px] font-bold text-on-surface-variant font-sans grid grid-cols-2 gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-green-600 shrink-0"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-red-500 shrink-0"></span>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-purple-600 shrink-0"></span>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-surface-container-high border border-outline/10 shrink-0"></span>
              <span>Not Answered (Unvisited)</span>
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT - MAIN QUESTION AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion._id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.18 }}
                className="space-y-6 max-w-4xl mx-auto w-full"
              >
                {/* Question Info Header */}
                <div className="flex justify-between items-start border-b border-primary/5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-lg">
                      Question {currentIdx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 py-0.5 bg-surface-container-high rounded-full border border-primary/5">
                      {currentQuestion.type}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-primary">
                    Marks: {currentQuestion.marks}
                  </span>
                </div>

                {/* Question Content */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-on-background leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.text}
                  </h3>

                  {currentQuestion.image && (
                    <div className="max-w-md bg-white border border-primary/5 rounded-[20px] p-2 overflow-hidden shadow-sm">
                      <img
                        src={`${api.defaults.baseURL.replace('/api/v1', '')}/${currentQuestion.image}`}
                        alt="Question Diagram"
                        className="w-full h-auto object-contain rounded-xl max-h-[300px]"
                      />
                    </div>
                  )}
                </div>

                {/* Question Option Selection / Inputs */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.type === 'Short Answer' || currentQuestion.type === 'Essay' ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Type your answer here
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Write your response details..."
                        value={currentAnswer?.textAnswer || ''}
                        onChange={handleTextAnswerChange}
                        className="w-full p-4 bg-white border border-outline-variant/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium leading-relaxed font-sans"
                      ></textarea>
                    </div>
                  ) : currentQuestion.type === 'Coding' ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Enter Code Block
                      </label>
                      <textarea
                        rows={10}
                        placeholder="// Enter your coding answer implementation details..."
                        value={currentAnswer?.codingAnswer || ''}
                        onChange={handleCodingAnswerChange}
                        className="w-full p-4 bg-neutral-900 border border-neutral-800 text-green-400 font-mono text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 leading-relaxed"
                      ></textarea>
                    </div>
                  ) : (
                    // MCQ and Multi-Select Cards Layout
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options.map((opt) => {
                        const isSelected = currentAnswer?.selectedOptions?.includes(opt.optionId);
                        return (
                          <motion.div
                            key={opt._id || opt.optionId}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleOptionSelect(opt.optionId)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-4 select-none ${
                              isSelected
                                ? 'bg-primary/5 border-primary/25 shadow-sm text-primary ring-1 ring-primary/20'
                                : 'bg-white border-outline-variant/30 hover:border-primary/20 text-on-surface'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg font-mono text-[11px] font-extrabold flex items-center justify-center border shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40'
                              }`}
                            >
                              {opt.optionId}
                            </span>
                            <span className="text-xs font-bold leading-normal pt-0.5">
                              {opt.optionText}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTTOM NAVIGATION ACTIONS */}
          <div className="border-t border-primary/5 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-4xl mx-auto w-full">
            {/* Left aligned helpers */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleToggleMarkForReview}
                className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  currentAnswer?.markedForReview
                    ? 'border-purple-600/30 text-purple-600 bg-purple-600/5'
                    : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high/40'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {currentAnswer?.markedForReview ? 'turned_in' : 'bookmark'}
                </span>
                {currentAnswer?.markedForReview ? 'Marked for Review' : 'Mark for Review'}
              </button>

              <button
                onClick={handleClearResponse}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-red-500/15 text-error hover:bg-error/5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">clear_all</span>
                Clear Response
              </button>
            </div>

            {/* Right/Center navigational controls */}
            <div className="flex gap-2.5 w-full sm:w-auto justify-end">
              <button
                disabled={currentIdx === 0}
                onClick={handlePrevious}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-outline-variant/60 text-on-surface hover:bg-surface-container-high/40 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                Previous
              </button>

              <button
                disabled={currentIdx === questions.length - 1}
                onClick={handleSaveAndNext}
                className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-secondary text-white font-bold text-xs hover:bg-secondary/95 transition-all flex items-center justify-center gap-1 disabled:opacity-35 disabled:pointer-events-none"
              >
                Save & Next
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-red-700 text-white font-extrabold text-xs hover:bg-red-800 transition-all flex items-center justify-center gap-1 shadow-md shadow-red-700/10"
              >
                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                Submit Exam
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* CONFIRMATION SUBMIT DIALOG MODAL */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowSubmitConfirm(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
          ></motion.div>

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white max-w-md w-full rounded-[28px] border border-primary/10 shadow-2xl p-6 space-y-6 overflow-hidden z-50"
          >
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-primary text-5xl mb-2">
                assignment_turned_in
              </span>
              <h3 className="text-lg font-bold text-primary">Confirm Exam Submission</h3>
              <p className="text-xs text-on-surface-variant font-semibold">
                Please review your activity summary log below before submitting the session.
              </p>
            </div>

            {/* Statistics details grid */}
            <div className="bg-surface-container-low border border-primary/5 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs font-semibold text-on-surface-variant">
              <div className="p-3 bg-white rounded-xl border border-primary/5">
                <span className="text-[9px] text-on-surface-variant/50 uppercase block font-mono">
                  Total Questions
                </span>
                <span className="block font-bold text-sm text-primary font-mono mt-0.5">
                  {getSubmitStats().total}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-primary/5">
                <span className="text-[9px] text-on-surface-variant/50 uppercase block font-mono">
                  Answered
                </span>
                <span className="block font-bold text-sm text-green-700 font-mono mt-0.5">
                  {getSubmitStats().answered}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-primary/5">
                <span className="text-[9px] text-on-surface-variant/50 uppercase block font-mono">
                  Not Answered
                </span>
                <span className="block font-bold text-sm text-red-600 font-mono mt-0.5">
                  {getSubmitStats().notAnswered}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-primary/5">
                <span className="text-[9px] text-on-surface-variant/50 uppercase block font-mono">
                  Marked for Review
                </span>
                <span className="block font-bold text-sm text-purple-700 font-mono mt-0.5">
                  {getSubmitStats().markedForReview}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-center text-red-700 font-semibold px-4">
              ⚠️ Warning: Once submitted, you cannot resume or change your answers.
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                disabled={submitting}
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 border border-outline-variant/60 rounded-xl hover:bg-surface-container-high/40 text-on-surface text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmitExam}
                className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    Submit Exam
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* EXAM SECURITY WARNING MODAL */}
      <ExamWarningModal
        isOpen={modalState.isOpen}
        violationType={modalState.violationType}
        description={modalState.description}
        currentViolations={violationCount}
        maxViolations={exam?.proctoringConfig?.maxViolationsAllowed || SECURITY_CONFIG.MAX_VIOLATIONS}
        onReturnFullscreen={closeModal}
        isFullscreenExit={modalState.isFullscreenExit}
      />

      {/* SINGLE ACTIVE SESSION TAKEOVER MODAL */}
      <TakeoverModal
        isOpen={showTakeoverModal}
        deviceInfo={takeoverData?.deviceInfo}
        browserInfo={takeoverData?.browserInfo}
        lastSeen={takeoverData?.lastSeen}
        onContinue={handleConfirmTakeover}
        onCancel={() => {
          setShowTakeoverModal(false);
          navigate('/student/dashboard');
        }}
        loading={takeoverLoading}
      />
    </div>
  );
};

export default StudentExamInterface;