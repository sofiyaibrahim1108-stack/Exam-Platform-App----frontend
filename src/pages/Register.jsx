import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Authentication.css';

const EASE = [0.16, 1, 0.3, 1];

// Real photography for the brand panel — Unsplash (free to use)
const IMG_MAIN =
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=80';

// Floating particles config
const PARTICLES = [
  { size: 3, top: '12%', left: '18%', duration: 7, delay: 0 },
  { size: 2, top: '28%', left: '75%', duration: 9, delay: 1.2 },
  { size: 4, top: '55%', left: '10%', duration: 8, delay: 0.5 },
  { size: 2, top: '70%', left: '60%', duration: 6.5, delay: 2 },
  { size: 3, top: '82%', left: '30%', duration: 10, delay: 1.5 },
  { size: 2, top: '40%', left: '88%', duration: 7.5, delay: 0.8 },
  { size: 3, top: '15%', left: '50%', duration: 8.5, delay: 3 },
  { size: 2, top: '90%', left: '80%', duration: 6, delay: 2.5 },
];

const Register = () => {
  const { registerStaff, registerStudent } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // 'Staff' or 'Student'

  // Institution searchable dropdown state
  const [institutions, setInstitutions] = useState([]);
  const [selectedInst, setSelectedInst] = useState(null);
  const [searchInstText, setSearchInstText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '#E0D0D4' });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      role: '',
      institutionCode: '',
      employeeId: '',
      rollNumber: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const watchPassword = watch('password');

  // Load institutions on mount
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await api.get('/auth/institutions');
        if (res.data && res.data.success) {
          setInstitutions(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load institutions', err);
      }
    };
    loadInstitutions();
  }, []);

  // Handle dropdown clicks outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Calculate password strength
  useEffect(() => {
    if (!watchPassword) {
      setPasswordStrength({ score: 0, label: '', color: '#E0D0D4' });
      return;
    }

    let score = 0;
    if (watchPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(watchPassword)) score += 1;
    if (/[0-9]/.test(watchPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(watchPassword)) score += 1;

    let label = 'Weak';
    let color = '#EF4444';
    if (score === 3) {
      label = 'Medium';
      color = '#F59E0B';
    } else if (score >= 4) {
      label = 'Strong';
      color = '#10B981';
    }

    setPasswordStrength({ score, label, color });
  }, [watchPassword]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue('role', role);
    trigger('role');
  };

  const selectInstitution = (inst) => {
    setSelectedInst(inst);
    setValue('institutionCode', inst.institutionCode);
    trigger('institutionCode');
    setSearchInstText(inst.institutionName);
    setDropdownOpen(false);
  };

  const onSubmit = async (data) => {
    if (!data.terms) {
      toast.error('You must accept the academic integrity policy to proceed.');
      return;
    }
    if (!selectedInst) {
      toast.error('Please select your institution.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Verifying master data and configuring credentials...');
    try {
      let user;
      if (selectedRole === 'Staff') {
        user = await registerStaff({
          institutionCode: selectedInst.institutionCode,
          employeeId: data.employeeId,
          password: data.password,
          confirmPassword: data.confirmPassword,
        });
      } else {
        user = await registerStudent({
          institutionCode: selectedInst.institutionCode,
          registerNumber: data.rollNumber, // Fallback to rollNumber for registerNumber since master is aligned
          password: data.password,
          confirmPassword: data.confirmPassword,
        });
      }

      toast.success(`Welcome aboard, ${user.name}! Profile initialized successfully.`, { id: toastId });

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
      toast.error(error.response?.data?.message || error.message || 'Verification failed. Please check your credentials.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInstitutions = institutions.filter((inst) =>
    inst.institutionName.toLowerCase().includes(searchInstText.toLowerCase())
  );

  const roleCards = [
    { key: 'Student', label: 'Student', hint: 'Take exams & view results', emoji: '🎓' },
    { key: 'Staff', label: 'Faculty / Staff', hint: 'Create & manage exams', emoji: '💼' },
  ];

  const featurePills = [
    { emoji: '✨', text: 'AI question banks' },
    { emoji: '🛡️', text: 'Non-invasive proctoring' },
    { emoji: '📊', text: 'Instant analytics' },
  ];

  return (
    <div
      className="auth-module-container min-h-screen w-full flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
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

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-full max-w-[460px] md:max-w-[900px] bg-white border border-gray-100 shadow-2xl rounded-[20px] overflow-hidden flex flex-col md:flex-row relative z-10"
        >
          {/* LEFT: Hero / brand panel */}
          <div className="hidden md:flex md:w-[42%] lg:w-[38%] relative flex-col justify-between p-8 overflow-hidden text-white bg-gradient-to-br from-[#8B1538] to-[#4A0010]">
            {/* Background photo with lower opacity multiply */}
            <img src={IMG_MAIN} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay" />

            {/* Floating particles */}
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/20 pointer-events-none"
                style={{ width: p.size, height: p.size, top: p.top, left: p.left }}
                animate={{ y: [0, -14, 0], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}

            {/* Logo */}
            <div className="relative z-10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 border border-white/20 backdrop-blur-md">
                <span style={{ fontSize: 13 }}>✨</span>
              </div>
              <span className="auth-display font-semibold text-base tracking-tight">Examora AI</span>
            </div>

            {/* Headline + testimonial */}
            <div className="relative z-10 my-auto py-6">
              <h1 className="auth-display text-xl lg:text-2xl font-bold leading-tight mb-4">
                Set up your institution in <span className="text-[#FBC02D] font-extrabold">minutes</span>, not months.
              </h1>

              <div className="rounded-xl p-4 bg-white/5 border border-white/10 backdrop-blur-md">
                <span style={{ fontSize: 24, lineHeight: 1, color: 'rgba(255,255,255,0.2)' }} className="block -mt-1 mb-1">“</span>
                <p className="text-xs leading-relaxed text-white/90">
                  Examora cut our grading turnaround from a week to under an hour, without sacrificing academic integrity.
                </p>
                <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-white/10">
                  <div className="w-6.5 h-6.5 rounded-full bg-white/10 text-[9px] font-bold flex items-center justify-center shrink-0">
                    MS
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold text-white">Mr. Balaganesh Krishnamoorthy</p>
                    <p className="text-[8px] text-white/50">Dean of Academics, VNR Institute</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature pills & footer */}
            <div className="space-y-4 relative z-10">
              <div className="flex flex-wrap gap-1.5">
                {featurePills.map((f) => (
                  <span
                    key={f.text}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium bg-white/5 border border-white/10 text-white/80"
                  >
                    <span style={{ fontSize: 10 }}>{f.emoji}</span>
                    {f.text}
                  </span>
                ))}
              </div>
              <p className="text-[9px] font-mono text-white/40">
                © 2026 Examora AI · Trusted by 500+ campuses
              </p>
            </div>
          </div>

          {/* RIGHT: Form panel */}
          <div className="w-full md:w-[58%] lg:w-[62%] p-8 sm:p-10 flex flex-col justify-center bg-white relative">
            <div className="absolute top-4 right-4 hidden md:block">
              <Link to="/" className="text-[11px] font-bold flex items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                ← Portal Home
              </Link>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #8B1538 0%, #6A0019 100%)' }}>
                <span style={{ fontSize: 20 }}>👤</span>
              </div>
              <div>
                <h1 className="auth-display text-xl font-bold text-gray-900 leading-none">Create account</h1>
                <p className="text-xs text-gray-500 mt-1">Set up secure access for your institution.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="auth-label">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  {roleCards.map((r) => {
                    const active = selectedRole === r.key;
                    return (
                      <motion.button
                        type="button"
                        key={r.key}
                        id={`register-role-${r.key.toLowerCase()}`}
                        onClick={() => handleRoleSelect(r.key)}
                        whileTap={{ scale: 0.98 }}
                        className="relative text-left rounded-xl p-3 border transition-all duration-200"
                        style={{
                          border: active ? '2px solid #8B1538' : '1px solid #E5E7EB',
                          background: active ? 'rgba(139,21,56,0.03)' : '#FDFDFD',
                          boxShadow: active ? '0 4px 12px rgba(139,21,56,0.06)' : 'none',
                        }}
                      >
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, #8B1538, #6A0019)' }}
                            >
                              <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <span style={{ fontSize: 18, display: 'block', marginBottom: 4 }}>{r.emoji}</span>
                        <p className="text-xs font-bold text-gray-900">{r.label}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{r.hint}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence>
                {selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Institution search */}
                    <div className="relative z-30" ref={dropdownRef}>
                      <label className="auth-label">Institution</label>
                      <div
                        className="auth-input-wrap cursor-text"
                        onClick={() => setDropdownOpen(true)}
                      >
                        <span className="text-gray-400 select-none text-base">🔍</span>
                        <input
                          type="text"
                          placeholder="Search your college..."
                          value={searchInstText}
                          onChange={(e) => { setSearchInstText(e.target.value); setDropdownOpen(true); }}
                          className="auth-input ml-2"
                        />
                        {selectedInst && <span className="text-green-600 shrink-0 text-base">✅</span>}
                      </div>
                      <AnimatePresence>
                        {dropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-[4.4rem] left-0 right-0 max-h-48 overflow-y-auto rounded-xl z-50 py-1 bg-white border border-gray-100 shadow-xl"
                          >
                            {filteredInstitutions.length === 0 ? (
                              <div className="p-3 text-center text-xs font-semibold text-gray-400">No institutions found.</div>
                            ) : (
                              filteredInstitutions.map((inst) => (
                                <div
                                  key={inst._id}
                                  onClick={() => selectInstitution(inst)}
                                  className="p-2.5 cursor-pointer flex items-center gap-2.5 text-xs transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                >
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                                    {inst.logo ? (
                                      <img src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/${inst.logo}`} alt="Logo" className="w-full h-full object-cover" />
                                    ) : ('🏛')}
                                  </div>
                                  <div className="truncate">
                                    <h4 className="font-bold text-[#8B1538] truncate">{inst.institutionName}</h4>
                                    <p className="text-[9px] text-gray-400 truncate">{inst.city}, {inst.state}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ID field: Employee ID for Staff, Roll/Register ID for Student */}
                    {selectedRole === 'Staff' ? (
                      <div>
                        <label className="auth-label">Employee ID</label>
                        <div className="auth-input-wrap">
                          <span className="text-gray-400 select-none text-base">🏷️</span>
                          <input
                            {...register('employeeId', { required: 'Employee ID is required for staff verification.' })}
                            className="auth-input ml-2"
                            placeholder="e.g. EMP-101"
                            type="text"
                          />
                        </div>
                        {errors.employeeId && (
                          <span className="text-[11px] mt-1 block px-0.5 text-red-600 font-semibold">{errors.employeeId.message}</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="auth-label">Register / Roll Number</label>
                        <div className="auth-input-wrap">
                          <span className="text-gray-400 select-none text-base">🏷️</span>
                          <input
                            {...register('rollNumber', { required: 'Roll number is required for verification.' })}
                            className="auth-input ml-2"
                            placeholder="e.g. 21CS05"
                            type="text"
                          />
                        </div>
                        {errors.rollNumber && (
                          <span className="text-[11px] mt-1 block px-0.5 text-red-600 font-semibold">{errors.rollNumber.message}</span>
                        )}
                      </div>
                    )}

                    {/* Password fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrap relative">
                          <span className="text-gray-400 select-none text-base">🔒</span>
                          <input
                            {...register('password', {
                              required: 'Password is required',
                              minLength: { value: 8, message: 'Must be at least 8 characters' },
                            })}
                            className="auth-input ml-2 pr-6"
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                          />
                          <button
                            type="button"
                            id="register-toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 text-gray-400 hover:text-gray-900 transition-colors"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <span style={{ fontSize: 13 }}>{showPassword ? '🙈' : '👁️'}</span>
                          </button>
                        </div>
                        {errors.password && (
                          <span className="text-[11px] mt-1 block px-0.5 text-red-600 font-semibold">{errors.password.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="auth-label">Confirm password</label>
                        <div className="auth-input-wrap relative">
                          <span className="text-gray-400 select-none text-base">🔒</span>
                          <input
                            {...register('confirmPassword', {
                              required: 'Please confirm password',
                              validate: (value) => value === watchPassword || 'Passwords do not match',
                            })}
                            className="auth-input ml-2 pr-6"
                            placeholder="••••••••"
                            type={showConfirmPassword ? 'text' : 'password'}
                          />
                          <button
                            type="button"
                            id="register-toggle-confirm-password"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 text-gray-400 hover:text-gray-900 transition-colors"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <span style={{ fontSize: 13 }}>{showConfirmPassword ? '🙈' : '👁️'}</span>
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <span className="text-[11px] mt-1 block px-0.5 text-red-600 font-semibold">{errors.confirmPassword.message}</span>
                        )}
                      </div>
                    </div>

                    {/* Strength meter */}
                    <AnimatePresence>
                      {watchPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1 px-0.5 overflow-hidden"
                        >
                          <div className="flex justify-between items-center text-[9px] font-mono">
                            <span className="text-gray-400 font-bold">Strength</span>
                            <span className="font-bold" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                          </div>
                          <div className="w-full rounded-full h-1.5 flex gap-0.5 overflow-hidden bg-gray-100">
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                  transformOrigin: 'left',
                                  flex: 1,
                                  height: '100%',
                                  borderRadius: 1,
                                  background: i <= passwordStrength.score
                                    ? passwordStrength.color
                                    : 'rgba(229, 231, 235, 0.5)',
                                  transition: 'background 0.3s',
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Terms */}
                    <div className="flex items-start gap-2 pt-1 select-none">
                      <input
                        {...register('terms', { required: true })}
                        type="checkbox"
                        id="register-terms"
                        className="mt-0.5 rounded h-4 w-4 cursor-pointer border-gray-300 text-[#8B1538]"
                        style={{ accentColor: '#8B1538' }}
                      />
                      <label htmlFor="register-terms" className="text-[10px] leading-snug cursor-pointer text-gray-500 font-medium">
                        I agree to the{' '}
                        <a href="#terms" className="font-bold text-[#8B1538] hover:underline">Terms &amp; Conditions</a> and{' '}
                        <a href="#policy" className="font-bold text-[#8B1538] hover:underline">Academic Integrity Policy</a>.
                      </label>
                    </div>

                    {/* Submit */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      id="register-submit"
                      disabled={submitting || !isValid || !selectedInst}
                      className="auth-btn-wine w-full py-3 flex justify-center items-center gap-2"
                    >
                      {submitting ? 'Creating account...' : 'Create account'}
                      <span className="text-xs">→</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-5 pt-4 text-center border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#8B1538] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center gap-3.5 mt-5 text-[9px] font-mono text-gray-400">
              <span className="flex items-center gap-1 shrink-0">🔒 256-bit encryption</span>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="flex items-center gap-1 shrink-0">✅ SOC 2-aligned</span>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default Register;