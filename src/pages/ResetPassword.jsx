import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EASE = [0.16, 1, 0.3, 1];

const AUTH_THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .auth-page { font-family: 'Plus Jakarta Sans', sans-serif; }
  .auth-display { font-family: 'Bricolage Grotesque', sans-serif; }
  .auth-input-wrap {
    background: rgba(255,252,250,0.7);
    border: 1px solid #F0D9E2;
    border-radius: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-input-wrap:focus-within {
    border-color: #8B1E3F;
    box-shadow: 0 0 0 3px rgba(139,30,63,0.10), 0 2px 8px rgba(139,30,63,0.08);
  }
  .auth-input {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    font-size: 0.875rem;
    color: #1F1F1F;
  }
  .auth-input::placeholder { color: #B0919A; }
  .auth-btn-wine {
    background: linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: box-shadow 0.25s, transform 0.2s;
  }
  .auth-btn-wine:hover:not(:disabled) {
    box-shadow: 0 8px 32px -6px rgba(139,30,63,0.45);
    transform: translateY(-1px);
  }
  .auth-btn-wine:active:not(:disabled) { transform: translateY(0); }
  .auth-btn-wine:disabled { opacity: 0.55; cursor: not-allowed; }
  .auth-card {
    background: rgba(255,252,250,0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(240,217,226,0.75);
    box-shadow: 0 24px 80px -12px rgba(139,30,63,0.14), 0 4px 20px -4px rgba(139,30,63,0.07);
    border-radius: 28px;
  }
  .auth-glass-mini {
    background: rgba(255,252,250,0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(240,217,226,0.65);
    border-radius: 20px;
  }
  .auth-label {
    display: block;
    font-size: 10.5px;
    font-weight: 700;
    color: rgba(139,30,63,0.65);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 6px;
    padding-left: 2px;
  }
  .auth-particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
`;

const PARTICLES = [
  { size: 5, top: '8%', left: '12%', duration: 8, delay: 0, color: 'rgba(139,30,63,0.10)' },
  { size: 3, top: '22%', left: '82%', duration: 10, delay: 1.5, color: 'rgba(179,58,98,0.08)' },
  { size: 7, top: '60%', left: '6%', duration: 9, delay: 0.8, color: 'rgba(212,175,55,0.09)' },
  { size: 4, top: '75%', left: '70%', duration: 7, delay: 2, color: 'rgba(139,30,63,0.07)' },
  { size: 6, top: '88%', left: '40%', duration: 11, delay: 1, color: 'rgba(179,58,98,0.08)' },
  { size: 3, top: '35%', left: '90%', duration: 8.5, delay: 3, color: 'rgba(212,175,55,0.07)' },
];

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
    if (score < 34) return { label: 'Weak Password', color: '#ba1a1a' };
    if (score < 67) return { label: 'Fair Security', color: '#d97706' };
    return { label: 'Excellent Protection', color: '#16a34a' };
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
    <>
      <style>{AUTH_THEME}</style>
      <div
        className="auth-page min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(150deg, #FFFCFA 0%, #F9F5F2 60%, #FBF0F4 100%)' }}
      >
        {/* Floating background particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="auth-particle"
              style={{ width: p.size, height: p.size, top: p.top, left: p.left, background: p.color }}
              animate={{ y: [0, -16, 0], x: [0, 5, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
          {/* Ambient aurora blobs */}
          <motion.div
            animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[130px]"
            style={{ background: 'rgba(139,30,63,0.09)' }}
          />
          <motion.div
            animate={{ opacity: [0.25, 0.42, 0.25], scale: [1, 1.1, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full blur-[120px]"
            style={{ background: 'rgba(212,175,55,0.08)' }}
          />
        </div>

        {/* Top App Bar */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)' }}>
              <span style={{ fontSize: 14 }}>✨</span>
            </div>
            <span className="auth-display font-semibold text-lg" style={{ color: '#8B1E3F' }}>Examora AI</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold flex items-center gap-2 transition-colors"
            style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back to Login
          </button>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-grow pt-24 pb-12 flex items-center justify-center relative z-10 overflow-hidden">
          <div className="w-full max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

              {/* Left Side: Visual/Branding Section */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="lg:col-span-5 hidden lg:block"
              >
                <div className="space-y-7">
                  {/* Badge */}
                  <div
                    className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider font-mono"
                    style={{ background: 'rgba(139,30,63,0.08)', border: '1px solid rgba(139,30,63,0.18)', color: '#8B1E3F' }}
                  >
                    System Security Phase 2
                  </div>

                  <h1 className="auth-display text-4xl font-semibold leading-tight" style={{ color: '#1F1F1F' }}>
                    Secure Your <br />
                    <span style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      Academic Identity
                    </span>
                  </h1>

                  <p className="text-base leading-relaxed max-w-md" style={{ color: '#666' }}>
                    Updating your credentials ensures the integrity of your exam portfolio. Examora AI uses military-grade encryption to protect your professional journey.
                  </p>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="auth-glass-mini p-5">
                      <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🛡️</span>
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B1E3F' }}>Status</div>
                      <div className="text-sm font-bold" style={{ color: '#1F1F1F' }}>Encrypted</div>
                    </div>
                    <div className="auth-glass-mini p-5">
                      <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🕒</span>
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B1E3F' }}>Last Reset</div>
                      <div className="text-sm font-bold" style={{ color: '#1F1F1F' }}>182 Days Ago</div>
                    </div>
                  </div>

                  {/* Requirement checklist */}
                  <div className="space-y-3">
                    {[
                      { check: watchPassword.length >= 8, label: '8+ characters' },
                      { check: /[A-Z]/.test(watchPassword), label: 'Uppercase letter' },
                      { check: /[^A-Za-z0-9]/.test(watchPassword), label: 'Special character' },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all duration-300"
                          style={{
                            background: req.check ? 'rgba(21,128,61,0.12)' : 'rgba(139,30,63,0.06)',
                            border: req.check ? '1px solid rgba(21,128,61,0.30)' : '1px solid rgba(139,30,63,0.15)',
                          }}
                        >
                          {req.check ? '✓' : '○'}
                        </div>
                        <span className="text-xs" style={{ color: req.check ? '#15803d' : '#888' }}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right Side: Reset Form Card */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="lg:col-span-7 flex justify-center"
              >
                <div className="w-full max-w-lg">
                  <div className="auth-card p-8 md:p-12">

                    {/* Icon + heading */}
                    <div className="flex flex-col items-center text-center mb-8">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-5"
                        style={{
                          background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)',
                          boxShadow: '0 10px 32px -6px rgba(139,30,63,0.40)',
                        }}
                      >
                        <span style={{ fontSize: 28 }}>🔒</span>
                      </motion.div>
                      <h2 className="auth-display text-2xl font-semibold mb-2" style={{ color: '#8B1E3F' }}>Reset Password</h2>
                      <p className="text-sm" style={{ color: '#888' }}>Enter your new secure credentials below.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* New Password Field */}
                      <div className="space-y-1">
                        <label className="auth-label" htmlFor="reset-password">New Password</label>
                        <div className="auth-input-wrap relative flex items-center px-3.5 py-3">
                          <span style={{ fontSize: 16, color: '#B33A62' }}>🔒</span>
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
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#B0919A' }}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? '🙈' : '👁️'}
                          </button>
                        </div>

                        {/* Strength Indicator */}
                        <div className="pt-2 px-0.5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ color: strengthMeta.color }}>
                              {strengthMeta.label}
                            </span>
                            <span className="font-mono text-[9px] font-semibold" style={{ color: '#B33A62' }}>{strength}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(139,30,63,0.08)' }}>
                            <motion.div
                              animate={{ width: `${strength}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ background: 'linear-gradient(90deg, #8B1E3F, #B33A62)' }}
                            />
                          </div>
                          <div className="flex gap-5 mt-3">
                            {[
                              { check: watchPassword.length >= 8, label: '8+ Char' },
                              { check: /[^A-Za-z0-9]/.test(watchPassword), label: 'Symbol' },
                              { check: /[A-Z]/.test(watchPassword), label: 'Upper Case' },
                            ].map((r) => (
                              <div key={r.label} className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full transition-colors duration-200"
                                  style={{ background: r.check ? '#B33A62' : 'rgba(139,30,63,0.15)' }}
                                />
                                <span className="text-[10px] font-mono" style={{ color: '#888' }}>{r.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {errors.password && (
                          <span className="text-xs block px-1 mt-1 font-mono" style={{ color: '#ba1a1a' }}>{errors.password.message}</span>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-1">
                        <label className="auth-label" htmlFor="reset-confirm-password">Confirm New Password</label>
                        <div className="auth-input-wrap relative flex items-center px-3.5 py-3">
                          <span style={{ fontSize: 16, color: '#B33A62' }}>🔒</span>
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
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#B0919A' }}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <span className="text-xs block px-1 mt-1 font-mono" style={{ color: '#ba1a1a' }}>{errors.confirmPassword.message}</span>
                        )}
                      </div>

                      <div className="pt-2 space-y-3">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={submitting}
                          className="auth-btn-wine w-full py-3.5 flex items-center justify-center gap-2"
                          id="reset-submit"
                          type="submit"
                        >
                          <span>{submitting ? 'Updating...' : 'Update Password'}</span>
                          <span>🔐</span>
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => navigate('/login')}
                          className="w-full py-2 font-mono text-xs uppercase tracking-widest font-semibold transition-colors"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B33A62' }}
                        >
                          Cancel Update
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* System notice widget */}
                  <div className="mt-5 px-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(139,30,63,0.07)', border: '1px solid rgba(139,30,63,0.12)' }}
                    >
                      <span style={{ fontSize: 18 }}>⚡</span>
                    </div>
                    <p className="text-[10px] font-mono leading-relaxed" style={{ color: '#888' }}>
                      SYSTEM_NOTICE: Once updated, your new credentials will be synchronized across all Examora AI nodes immediately.
                    </p>
                  </div>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 mt-5 text-[10px] font-mono" style={{ color: 'rgba(139,30,63,0.45)' }}>
                    <span className="flex items-center gap-1">🔒 256-bit encryption</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: '#D4B8C0' }} />
                    <span className="flex items-center gap-1">✅ SOC 2-aligned</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 bg-transparent mt-auto z-10">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 px-6 w-full" style={{ color: 'rgba(139,30,63,0.40)' }}>
            <div className="font-mono text-xs font-semibold uppercase" style={{ color: '#8B1E3F' }}>Examora AI</div>
            <div className="font-mono text-xs flex gap-4 items-center">
              <a className="hover:underline transition-colors" href="#privacy">Privacy Policy</a>
              <span className="w-1 h-1 rounded-full" style={{ background: '#D4B8C0' }} />
              <a className="hover:underline transition-colors" href="#terms">Terms of Service</a>
              <span className="w-1 h-1 rounded-full" style={{ background: '#D4B8C0' }} />
              <a className="hover:underline transition-colors" href="#help">Help Center</a>
            </div>
            <div className="opacity-60 text-xs md:ml-auto">© 2026 Examora AI University Systems. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ResetPassword;
