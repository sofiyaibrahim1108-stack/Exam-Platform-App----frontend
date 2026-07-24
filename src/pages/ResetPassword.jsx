import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EASE = [0.16, 1, 0.3, 1];

import './Authentication.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password', '');

  // Live password strength metrics
  const getPasswordStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score += 33;
    if (/[^A-Za-z0-9]/.test(val)) score += 34;
    if (/[A-Z]/.test(val)) score += 33;
    return score;
  };

  const strength = getPasswordStrength(watchPassword);

  const getStrengthMeta = (score) => {
    if (score < 34) return { label: 'Weak Password', color: '#EF4444' };
    if (score < 67) return { label: 'Fair Security', color: '#F59E0B' };
    return { label: 'Excellent Protection', color: '#10B981' };
  };

  const strengthMeta = getStrengthMeta(strength);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading('Synchronizing database nodes...');
    try {
      const user = await resetPassword(token, data.password, data.confirmPassword);
      toast.success('Password updated successfully. Access granted.', { id: toastId });

      // Role-based redirection after password reset authentication
      switch (user.role) {
        case 'Super Admin':
          navigate('/super-admin');
          break;
        case 'Admin':
          navigate('/admin');
          break;
        case 'Staff':
          navigate('/staff');
          break;
        case 'Student':
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      toast.error(error.message || 'Reset link is invalid or expired. Try again.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-module-container min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden"
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

        {/* Top App Bar */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #8B1538 0%, #6A0019 100%)' }}>
              <span style={{ fontSize: 13 }}>✨</span>
            </div>
            <span className="auth-display font-semibold text-lg" style={{ color: '#8B1538' }}>Examora AI</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold flex items-center gap-2 transition-colors hover:text-[#8B1538]"
            style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back to Login
          </button>
        </header>

        {/* Main Content Canvas */}
        <main className="z-10 w-full max-w-[480px] md:max-w-[900px] mt-12 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="w-full bg-white border border-gray-100 shadow-2xl rounded-[20px] overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Side: Visual/Branding Section */}
            <div className="hidden md:flex md:w-[42%] lg:w-[38%] bg-gradient-to-br from-[#8B1538] to-[#4A0010] p-8 flex-col justify-between text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full blur-[40px] bg-white/10" />
                <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full blur-[40px] bg-[#A11D42]/20" />
              </div>

              <div className="space-y-6 relative z-10">
                <div
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono bg-white/10 border border-white/20 text-white/90"
                >
                  System Security Phase 2
                </div>

                <h1 className="auth-display text-2xl font-bold leading-tight">
                  Secure Your <br />
                  <span className="text-[#FBC02D] font-extrabold">Academic Identity</span>
                </h1>

                <p className="text-xs leading-relaxed text-white/70">
                  Updating your credentials ensures the integrity of your exam portfolio. Examora AI uses military-grade encryption to protect your professional journey.
                </p>

                {/* Requirement checklist */}
                <div className="space-y-2.5 pt-2">
                  {[
                    { check: watchPassword.length >= 8, label: '8+ characters' },
                    { check: /[A-Z]/.test(watchPassword), label: 'Uppercase letter' },
                    { check: /[^A-Za-z0-9]/.test(watchPassword), label: 'Special character' },
                  ].map((req) => (
                    <div key={req.label} className="flex items-center gap-2.5">
                      <div
                        className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300"
                        style={{
                          background: req.check ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                          border: req.check ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.15)',
                          color: req.check ? '#10B981' : '#D1D5DB'
                        }}
                      >
                        {req.check ? '✓' : '○'}
                      </div>
                      <span className="text-xs font-medium" style={{ color: req.check ? '#10B981' : '#D1D5DB' }}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 relative z-10 pt-4 border-t border-white/10">
                <div className="auth-glass-mini p-3">
                  <span style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>🛡️</span>
                  <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-white/50">Status</div>
                  <div className="text-xs font-bold text-white">Encrypted</div>
                </div>
                <div className="auth-glass-mini p-3">
                  <span style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>🕒</span>
                  <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-white/50">Session</div>
                  <div className="text-xs font-bold text-white">Protected</div>
                </div>
              </div>
            </div>

            {/* Right Side: Reset Form Card */}
            <div className="w-full md:w-[58%] lg:w-[62%] p-8 sm:p-10 flex flex-col justify-center bg-white">
              {/* Heading */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-4 shadow-md shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #8B1538 0%, #6A0019 100%)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>🔒</span>
                </div>
                <h2 className="auth-display text-xl font-bold text-gray-900 mb-1">Reset Password</h2>
                <p className="text-xs text-gray-500">Enter your new secure credentials below.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password Field */}
                <div className="space-y-1">
                  <label className="auth-label" htmlFor="reset-password">New Password</label>
                  <div className="auth-input-wrap relative">
                    <span className="text-gray-400 select-none text-base">🔒</span>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
                      className="auth-input ml-2.5 pr-8"
                      id="reset-password"
                      placeholder="••••••••••••"
                      type={showPassword ? 'text' : 'password'}
                    />
                    <button
                      type="button"
                      id="reset-toggle-password"
                      className="absolute right-3"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span>{showPassword ? '🙈' : '👁️'}</span>
                    </button>
                  </div>

                  {/* Strength Indicator */}
                  <div className="pt-2 px-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: strengthMeta.color }}>
                        {strengthMeta.label}
                      </span>
                      <span className="font-mono text-[9px] font-bold" style={{ color: '#8B1538' }}>{strength}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                      <motion.div
                        animate={{ width: `${strength}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #8B1538, #B33A62)' }}
                      />
                    </div>
                  </div>

                  {errors.password && (
                    <span className="text-xs block px-1 mt-1 font-semibold text-red-600">{errors.password.message}</span>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1">
                  <label className="auth-label" htmlFor="reset-confirm-password">Confirm New Password</label>
                  <div className="auth-input-wrap relative">
                    <span className="text-gray-400 select-none text-base">🔒</span>
                    <input
                      {...register('confirmPassword', {
                        required: 'Confirm password is required',
                        validate: (value) => value === watchPassword || 'Passwords do not match',
                      })}
                      className="auth-input ml-2.5 pr-8"
                      id="reset-confirm-password"
                      placeholder="••••••••••••"
                      type={showConfirmPassword ? 'text' : 'password'}
                    />
                    <button
                      type="button"
                      id="reset-toggle-confirm-password"
                      className="absolute right-3"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <span>{showConfirmPassword ? '🙈' : '👁️'}</span>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-xs block px-1 mt-1 font-semibold text-red-600">{errors.confirmPassword.message}</span>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={submitting}
                    className="auth-btn-wine w-full py-3 flex items-center justify-center gap-2"
                    id="reset-submit"
                    type="submit"
                  >
                    <span>{submitting ? 'Updating...' : 'Update Password'}</span>
                    <span>🔐</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full py-2 font-mono text-[10px] uppercase tracking-widest font-bold transition-colors text-gray-500 hover:text-gray-900 bg-transparent border-none cursor-pointer"
                  >
                    Cancel Update
                  </button>
                </div>
              </form>

              {/* System notice widget */}
              <div className="mt-5 p-3 flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-100">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white shadow-sm border border-gray-100"
                >
                  <span style={{ fontSize: 14 }}>⚡</span>
                </div>
                <p className="text-[9px] font-mono leading-relaxed text-gray-500">
                  SYSTEM_NOTICE: Once updated, your credentials will synchronize across all Examora AI nodes immediately.
                </p>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 bg-transparent mt-auto z-10">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 px-6 w-full text-gray-400 font-mono text-[11px]">
            <div className="font-semibold uppercase tracking-wider" style={{ color: '#8B1538' }}>Examora AI</div>
            <div className="flex gap-3 items-center">
              <a className="hover:underline transition-colors hover:text-gray-600" href="#privacy">Privacy Policy</a>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <a className="hover:underline transition-colors hover:text-gray-600" href="#terms">Terms of Service</a>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <a className="hover:underline transition-colors hover:text-gray-600" href="#help">Help Center</a>
            </div>
            <div className="opacity-70 md:ml-auto">© 2026 Examora AI Systems. All rights reserved.</div>
          </div>
        </footer>
      </div>
  );
};

export default ResetPassword;
