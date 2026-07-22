import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  .auth-btn-success {
    background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: default;
    opacity: 1;
  }
  .auth-card {
    background: rgba(255,252,250,0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(240,217,226,0.75);
    box-shadow: 0 24px 80px -12px rgba(139,30,63,0.14), 0 4px 20px -4px rgba(139,30,63,0.07);
    border-radius: 28px;
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

// Floating particles for background
const PARTICLES = [
  { size: 5, top: '8%', left: '12%', duration: 8, delay: 0, color: 'rgba(139,30,63,0.12)' },
  { size: 3, top: '22%', left: '82%', duration: 10, delay: 1.5, color: 'rgba(179,58,98,0.10)' },
  { size: 7, top: '60%', left: '6%', duration: 9, delay: 0.8, color: 'rgba(212,175,55,0.10)' },
  { size: 4, top: '75%', left: '70%', duration: 7, delay: 2, color: 'rgba(139,30,63,0.08)' },
  { size: 6, top: '88%', left: '40%', duration: 11, delay: 1, color: 'rgba(179,58,98,0.09)' },
  { size: 3, top: '35%', left: '90%', duration: 8.5, delay: 3, color: 'rgba(212,175,55,0.08)' },
  { size: 5, top: '15%', left: '55%', duration: 7.5, delay: 0.5, color: 'rgba(139,30,63,0.07)' },
  { size: 4, top: '50%', left: '25%', duration: 9.5, delay: 2.5, color: 'rgba(179,58,98,0.10)' },
];

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
    <>
      <style>{AUTH_THEME}</style>
      <div
        className="auth-page min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #FFFCFA 0%, #F9F5F2 60%, #FBF0F4 100%)' }}
      >
        {/* Floating background particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="auth-particle"
            style={{ width: p.size, height: p.size, top: p.top, left: p.left, background: p.color }}
            animate={{ y: [0, -16, 0], x: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Ambient wine aurora blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: 'rgba(139,30,63,0.09)' }}
          />
          <motion.div
            animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.1, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full blur-[110px]"
            style={{ background: 'rgba(212,175,55,0.09)' }}
          />
          <motion.div
            animate={{ opacity: [0.15, 0.28, 0.15], scale: [1, 1.06, 1] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[100px]"
            style={{ background: 'rgba(179,58,98,0.06)' }}
          />
        </div>

        {/* Top Navigation */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)' }}>
              <span style={{ fontSize: 14 }}>✨</span>
            </div>
            <span className="auth-display font-semibold text-lg" style={{ color: '#8B1E3F' }}>Examora AI</span>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
            style={{ color: '#888' }}
          >
            ← Back to Login
          </Link>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-md z-10 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* Glass Card */}
            <div className="auth-card p-8 sm:p-10">

              {/* Icon + heading */}
              <div className="flex flex-col items-center text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-5"
                  style={{
                    background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)',
                    boxShadow: '0 10px 32px -6px rgba(139,30,63,0.40)',
                  }}
                >
                  <span style={{ fontSize: 28 }}>🔑</span>
                </motion.div>

                <h1 className="auth-display text-2xl font-semibold mb-2" style={{ color: '#8B1E3F' }}>
                  {success ? 'Check your email' : 'Forgot password?'}
                </h1>
                <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#888' }}>
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
                    transition={{ duration: 0.3, ease: EASE }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div>
                      <label className="auth-label" htmlFor="forgot-email">Institutional Email</label>
                      <div className="auth-input-wrap flex items-center px-3.5 py-3">
                        <span style={{ fontSize: 16, color: '#B33A62' }}>📧</span>
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
                        <span className="text-xs block px-1 mt-1 font-mono" style={{ color: '#ba1a1a' }}>{errors.email.message}</span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={submitting}
                      className="auth-btn-wine w-full py-3.5 flex justify-center items-center gap-2"
                      id="forgot-submit"
                      type="submit"
                    >
                      {submitting ? 'Sending...' : 'Send Reset Link'}
                      <span>→</span>
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="space-y-4"
                  >
                    {/* Success state */}
                    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(21,128,61,0.07)', border: '1px solid rgba(21,128,61,0.18)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(21,128,61,0.12)' }}>
                        <span style={{ fontSize: 20 }}>✅</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1" style={{ color: '#15803d' }}>Reset link dispatched!</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#666' }}>
                          Check your inbox and follow the link to set a new password. The link expires in 1 hour.
                        </p>
                      </div>
                    </div>

                    <button
                      className="auth-btn-success w-full py-3.5 flex justify-center items-center gap-2"
                      disabled
                    >
                      Reset Link Dispatched! ✓
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Back to Login */}
              <div className="mt-7 pt-5 text-center" style={{ borderTop: '1px solid rgba(240,217,226,0.5)' }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                  style={{ color: '#8B1E3F' }}
                >
                  ← Back to Login
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-6 text-[10px] font-mono" style={{ color: 'rgba(139,30,63,0.45)' }}>
              <span className="flex items-center gap-1">🔒 256-bit encryption</span>
              <span className="w-1 h-1 rounded-full" style={{ background: '#D4B8C0' }} />
              <span className="flex items-center gap-1">🛡️ SOC 2-aligned</span>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="mt-12 pb-6 w-full flex flex-col md:flex-row justify-center items-center gap-3 px-6 z-10 text-[11px] font-mono" style={{ color: 'rgba(139,30,63,0.40)' }}>
          <span>© 2026 Examora AI · All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#privacy" className="hover:underline transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:underline transition-colors">Terms of Service</a>
            <a href="#help" className="hover:underline transition-colors">Help Center</a>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ForgotPassword;
