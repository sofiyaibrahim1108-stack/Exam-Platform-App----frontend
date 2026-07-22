import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ExamWarningModal = ({
  isOpen,
  violationType,
  description,
  currentViolations,
  maxViolations,
  onReturnFullscreen,
  isFullscreenExit,
}) => {
  if (!isOpen) return null;

  const remaining = Math.max(maxViolations - currentViolations, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel w-full max-w-md bg-white rounded-[28px] p-6 space-y-5 shadow-2xl border border-red-500/20 text-on-surface"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">gavel</span>
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                Security Violation Warning
              </span>
              <h3 className="text-lg font-bold text-primary mt-0.5">Exam Security Alert</h3>
            </div>
          </div>

          {/* Violation Details */}
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 block">
                Violation Type
              </span>
              <p className="text-sm font-extrabold text-red-900">{violationType || 'Browser Security Event'}</p>
              {description && <p className="text-xs text-red-700 mt-1">{description}</p>}
            </div>

            {/* Violation Counter Summary */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5">
                <span className="text-[9px] font-mono uppercase text-on-surface-variant/70 block">Recorded</span>
                <span className="font-mono font-extrabold text-lg text-red-600">{currentViolations}</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5">
                <span className="text-[9px] font-mono uppercase text-on-surface-variant/70 block">Max Allowed</span>
                <span className="font-mono font-extrabold text-lg text-primary">{maxViolations}</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5">
                <span className="text-[9px] font-mono uppercase text-on-surface-variant/70 block">Remaining</span>
                <span className="font-mono font-extrabold text-lg text-amber-600">{remaining}</span>
              </div>
            </div>

            <p className="text-on-surface-variant text-[11px] leading-normal font-medium bg-primary/5 p-3 rounded-xl border border-primary/10">
              {remaining > 0 ? (
                <>
                  <strong className="text-primary">Important:</strong> Further security violations will result in automatic submission of your examination session.
                </>
              ) : (
                <strong className="text-red-700">
                  Maximum violations reached. Your examination session will now be submitted.
                </strong>
              )}
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={onReturnFullscreen}
              className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-base">
                {isFullscreenExit ? 'fullscreen' : 'check_circle'}
              </span>
              {isFullscreenExit ? 'Return to Fullscreen' : 'I Understand & Resume Exam'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExamWarningModal;
