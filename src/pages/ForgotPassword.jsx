import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EASE = [0.16, 1, 0.3, 1];

import './Authentication.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading('Locating database nodes...');
    try {
      await forgotPassword(data.email);
      toast.success('Security reset key generated and dispatched!', { id: toastId });
      setSuccess(true);
    } catch (error) {
      toast.error(error.message || 'Email registration not found. Request credentials.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-module-container min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at 10% 20%, rgba(139, 21, 56, 0.03) 0%, rgba(255, 255, 255, 1) 90%)' }}
    >
        {/* Subtle background blur auroras */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(139,21,56,0.06) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[90px] opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(106,0,25,0.04) 0%, transparent 75%)' }}
          />
        </div>

        {/* Top Navigation */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #8B1538 0%, #6A0019 100%)' }}>
              <span style={{ fontSize: 13 }}>✨</span>
            </div>
            <span className="auth-display font-semibold text-lg" style={{ color: '#8B1538' }}>Examora AI</span>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold flex items-center gap-1.5 transition-colors hover:text-[#8B1538]"
            style={{ color: '#6B7280' }}
          >
            ← Back to Login
          </Link>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-md z-10 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {/* White card with subtle shadow */}
            <div className="auth-card">

              {/* Icon + heading */}
              <div className="flex flex-col items-center text-center mb-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5"
                  style={{
                    background: 'linear-gradient(135deg, #8B1538 0%, #6A0019 100%)',
                    boxShadow: '0 8px 24px rgba(139,21,56,0.15)',
                  }}
                >
                  <span style={{ fontSize: 24 }}>🔑</span>
                </motion.div>

                <h1 className="auth-display text-2xl font-bold mb-2 text-gray-900">
                  {success ? 'Check your email' : 'Forgot password?'}
                </h1>
                <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
                  {success
                    ? 'We\'ve sent a secure reset link to your institutional email address.'
                    : 'Enter your institutional email and we\'ll dispatch a secure password reset link.'}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!success ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div>
                      <label className="auth-label" htmlFor="forgot-email">Institutional Email</label>
                      <div className="auth-input-wrap">
                        <span className="text-gray-400 select-none text-base">📧</span>
                        <input
                          {...register('email', {
                            required: 'Institutional email is required',
                            pattern: {
                              value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                              message: 'Please enter a valid email format',
                            },
                          })}
                          className="auth-input ml-2.5"
                          id="forgot-email"
                          placeholder="e.g. name@university.edu"
                          type="email"
                        />
                      </div>
                      {errors.email && (
                        <span className="text-xs block px-1 mt-1 font-semibold text-red-600">{errors.email.message}</span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={submitting}
                      className="auth-btn-wine w-full py-3 flex justify-center items-center gap-2"
                      id="forgot-submit"
                      type="submit"
                    >
                      {submitting ? 'Sending...' : 'Send Reset Link'}
                      <span className="text-xs">→</span>
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="space-y-4"
                  >
                    {/* Success state */}
                    <div className="rounded-xl p-5 flex items-start gap-4 bg-emerald-50/50 border border-emerald-100">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-800 text-lg">
                        ✅
                      </div>
                      <div>
                        <p className="font-bold text-sm text-emerald-800 mb-0.5">Reset link dispatched!</p>
                        <p className="text-xs leading-relaxed text-emerald-700">
                          Check your inbox and follow the link to set a new password. The link expires in 1 hour.
                        </p>
                      </div>
                    </div>

                    <button
                      className="auth-btn-success w-full py-3 flex justify-center items-center gap-2"
                      disabled
                    >
                      Reset Link Dispatched! ✓
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Back to Login */}
              <div className="mt-6 pt-5 text-center border-t border-gray-100">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline text-[#8B1538]"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-gray-400 font-mono">
              <span className="flex items-center gap-1">🔒 256-bit encryption</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <span className="flex items-center gap-1">🛡️ SOC 2-aligned</span>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="mt-12 pb-6 w-full flex flex-col md:flex-row justify-center items-center gap-3 px-6 z-10 text-[11px] text-gray-400 font-mono">
          <span>© 2026 Examora AI · All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:underline transition-colors hover:text-gray-600">Privacy Policy</a>
            <a href="#terms" className="hover:underline transition-colors hover:text-gray-600">Terms of Service</a>
            <a href="#help" className="hover:underline transition-colors hover:text-gray-600">Help Center</a>
          </div>
        </footer>
      </div>
  );
};
export default ForgotPassword;
