import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { SECURITY_CONFIG } from '../config/securityConfig';

export const useBrowserSecurity = ({
  examId,
  isStarted = false,
  maxViolations = SECURITY_CONFIG.MAX_VIOLATIONS,
  initialViolationCount = 0,
  onAutoSubmit = () => {},
}) => {
  const [violationCount, setViolationCount] = useState(initialViolationCount);
  const [modalState, setModalState] = useState({
    isOpen: false,
    violationType: '',
    description: '',
    isFullscreenExit: false,
  });

  const lastViolationTimeRef = useRef(0);
  const isSyncingRef = useRef(false);
  const modalStateRef = useRef(modalState);
  // NEW: once the exam session has effectively ended (auto-submitted / already
  // submitted / etc.), stop recording further violations entirely.
  const isTerminatedRef = useRef(false);

  // Keep modalStateRef synced to avoid stale closures
  useEffect(() => {
    modalStateRef.current = modalState;
  }, [modalState]);

  // Sync initial count when backend loads
  useEffect(() => {
    if (initialViolationCount > 0) {
      setViolationCount(initialViolationCount);
    }
  }, [initialViolationCount]);

  // Reset termination flag whenever a fresh exam session actually starts
  useEffect(() => {
    if (isStarted) {
      isTerminatedRef.current = false;
    }
  }, [isStarted]);

  // Request Fullscreen helper
  const enterFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  // Internal helper: fire onAutoSubmit exactly once, then lock everything down
  const terminateSession = useCallback(
    (showToast = true) => {
      if (isTerminatedRef.current) return;
      isTerminatedRef.current = true;

      // Close any open warning modal, session is over
      setModalState((prev) => ({ ...prev, isOpen: false }));

      if (showToast) {
        toast.error('Maximum security violations reached. Submitting examination automatically.', {
          duration: 8000,
        });
      }

      onAutoSubmit();
    },
    [onAutoSubmit]
  );

  // Primary violation handler with debounce & backend sync
  const triggerViolation = useCallback(
    async (type, description = '') => {
      if (
        !isStarted ||
        isSyncingRef.current ||
        modalStateRef.current.isOpen ||
        isTerminatedRef.current
      ) {
        return;
      }

      // Debounce rapid repeated triggers (1.5 seconds)
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1500) return;
      lastViolationTimeRef.current = now;

      isSyncingRef.current = true;

      try {
        const response = await api.post(`/exams/student/${examId}/violation`, {
          violationType: type,
          description,
        });

        if (response.data && response.data.success) {
          const { currentViolationCount, autoSubmitted, maxViolationsAllowed } = response.data.data;

          setViolationCount(currentViolationCount);

          const effectiveMax = maxViolationsAllowed || maxViolations;

          if (autoSubmitted || currentViolationCount >= effectiveMax) {
            // Limit reached — terminate immediately, don't show the "you have
            // N violations left" warning modal, go straight to auto-submit.
            terminateSession(true);
            return;
          }

          const isFsExit = type === 'Fullscreen Exit';
          setModalState({
            isOpen: true,
            violationType: type,
            description,
            isFullscreenExit: isFsExit,
          });
        }
      } catch (err) {
        const status = err?.response?.status;

        // Backend is telling us the attempt is no longer active (already
        // Auto-Submitted / Submitted / not found). This is a terminal state,
        // NOT a transient network failure — do not keep counting locally.
        if (status === 400 || status === 404) {
          terminateSession(false);
          return;
        }

        console.error('Failed to record violation on backend:', err);

        // Genuine network/connectivity failure only: fall back to a
        // client-side count so the student isn't stuck with zero feedback.
        setViolationCount((prev) => {
          const next = prev + 1;
          if (next >= maxViolations) {
            terminateSession(true);
          }
          return next;
        });
      } finally {
        isSyncingRef.current = false;
      }
    },
    [examId, isStarted, maxViolations, terminateSession]
  );

  const closeModal = useCallback(() => {
    const isFsExit = modalStateRef.current.isFullscreenExit;
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (isFsExit) {
      enterFullscreen();
    }
  }, [enterFullscreen]);

  // 1. FULLSCREEN MONITORING
  useEffect(() => {
    if (!isStarted) return;

    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isFs) {
        triggerViolation('Fullscreen Exit', 'Exited Fullscreen Mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isStarted, triggerViolation]);

  // 2. TAB SWITCH DETECTION (visibilitychange)
  useEffect(() => {
    if (!isStarted || !SECURITY_CONFIG.TAB_SWITCH_DETECTION) return;

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerViolation('Tab Switch', 'Switched browser tabs or minimized window');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStarted, triggerViolation]);

  // 3. WINDOW BLUR DETECTION
  useEffect(() => {
    if (!isStarted || !SECURITY_CONFIG.WINDOW_BLUR_DETECTION) return;

    const handleBlur = () => {
      triggerViolation('Focus Lost', 'Browser window lost focus');
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [isStarted, triggerViolation]);

  // 4. DISABLE BROWSER ACTIONS (Right-click, Copy, Paste, Cut, Select, Drag)
  useEffect(() => {
    if (!isStarted) return;

    const preventDefault = (e) => e.preventDefault();

    const handleContextMenu = (e) => {
      if (!SECURITY_CONFIG.ALLOW_RIGHT_CLICK) {
        e.preventDefault();
        triggerViolation('Context Menu', 'Right-click menu attempted');
      }
    };

    const handleCopy = (e) => {
      if (!SECURITY_CONFIG.ALLOW_COPY) {
        e.preventDefault();
        triggerViolation('Copy / Paste Attempt', 'Copy action attempted');
      }
    };

    const handlePaste = (e) => {
      if (!SECURITY_CONFIG.ALLOW_PASTE) {
        e.preventDefault();
        triggerViolation('Copy / Paste Attempt', 'Paste action attempted');
      }
    };

    const handleCut = (e) => {
      e.preventDefault();
      triggerViolation('Copy / Paste Attempt', 'Cut action attempted');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('selectstart', preventDefault);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
    };
  }, [isStarted, triggerViolation]);

  // 5. BLOCK SHORTCUT KEYS (F12, Ctrl+C/V/X/A/S/P/U, Ctrl+Shift+I/J/C)
  useEffect(() => {
    if (!isStarted) return;

    const handleKeyDown = (e) => {
      const key = e.key;
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // F12
      if (key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Restricted Key Press', 'F12 Developer Tools key pressed');
        return;
      }

      // Ctrl+Shift+I / J / C
      if (ctrlOrCmd && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Restricted Key Press', `Shortcut Ctrl+Shift+${key.toUpperCase()} pressed`);
        return;
      }

      // Ctrl+C, V, X, A, S, P, U
      if (ctrlOrCmd && ['c', 'v', 'x', 'a', 's', 'p', 'u'].includes(key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Restricted Key Press', `Shortcut Ctrl+${key.toUpperCase()} pressed`);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isStarted, triggerViolation]);

  // 6. DEVTOOLS DETECTION
  useEffect(() => {
    if (!isStarted || !SECURITY_CONFIG.DEVTOOLS_DETECTION) return;

    const threshold = 160;
    const interval = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > threshold || heightDiff > threshold) {
        triggerViolation('DevTools Opened', 'Browser Developer Tools detected open');
      }
    }, 2500);

    return () => {
      clearInterval(interval);
    };
  }, [isStarted, triggerViolation]);

  return {
    violationCount,
    modalState,
    closeModal,
    enterFullscreen,
    triggerViolation,
  };
};