import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TakeoverModal = ({
  isOpen,
  deviceInfo,
  browserInfo,
  lastSeen,
  onContinue,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  const formattedLastSeen = lastSeen
    ? new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' (' +
      new Date(lastSeen).toLocaleDateString() +
      ')'
    : 'Just now';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel w-full max-w-lg bg-white rounded-[28px] p-6 space-y-6 shadow-2xl border border-amber-500/20 text-on-surface"
        >
          {/* Header */}
          <div className="flex items-center gap-3.5 border-b border-primary/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">devices_off</span>
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                Single Active Session Restriction
              </span>
              <h3 className="text-lg font-bold text-primary mt-0.5">Exam Active on Another Device</h3>
            </div>
          </div>

          {/* Device & Session Info */}
          <div className="space-y-4 text-xs">
            <p className="text-on-surface-variant font-medium leading-relaxed">
              Your examination session is currently active on another device or browser. To prevent multiple concurrent attempts, only one device can be active at a time.
            </p>

            <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/10 space-y-2 font-sans">
              <div className="flex justify-between items-center py-1 border-b border-primary/5">
                <span className="font-mono text-[10px] uppercase text-on-surface-variant/70 font-semibold">Active Device</span>
                <span className="font-bold text-primary">{deviceInfo || 'Other Device'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-primary/5">
                <span className="font-mono text-[10px] uppercase text-on-surface-variant/70 font-semibold">Browser / OS</span>
                <span className="font-medium text-on-surface max-w-[240px] truncate" title={browserInfo || ''}>
                  {browserInfo || 'Other Browser'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-mono text-[10px] uppercase text-on-surface-variant/70 font-semibold">Last Active</span>
                <span className="font-mono font-bold text-amber-700">{formattedLastSeen}</span>
              </div>
            </div>

            <p className="text-primary font-bold text-xs bg-primary/5 p-3.5 rounded-xl border border-primary/10 text-center">
              Do you want to transfer and continue the exam session on this device?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              disabled={loading}
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/60 hover:bg-surface-container-high text-on-surface font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={onContinue}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-white hover:bg-primary/95 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                  Transferring Session...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">phonelink_setup</span>
                  Continue Here
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TakeoverModal;
