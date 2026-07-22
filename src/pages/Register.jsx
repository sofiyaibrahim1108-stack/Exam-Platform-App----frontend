import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Real photography for the brand panel — Unsplash (free to use)
const IMG_MAIN =
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=80'; // focused student, laptop + headphones

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
  .auth-right-bg {
    background: linear-gradient(150deg, #FFFCFA 0%, #F9F5F2 60%, #FBF0F4 100%);
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
    background: rgba(255,255,255,0.45);
    pointer-events: none;
  }
  .auth-left-overlay {
    background: linear-gradient(175deg,
      rgba(110,23,50,0.82) 0%,
      rgba(139,30,63,0.74) 40%,
      rgba(74,10,30,0.91) 100%
    );
    mix-blend-mode: multiply;
  }
  .auth-left-fade {
    background: linear-gradient(to top,
      rgba(74,10,30,0.75) 0%,
      rgba(139,30,63,0.30) 50%,
      rgba(110,23,50,0.55) 100%
    );
  }
`;

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
    let color = '#ba1a1a';
    if (score === 3) {
      label = 'Medium';
      color = '#d97706';
    } else if (score >= 4) {
      label = 'Strong';
      color = '#16a34a';
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
          // rollNumber: data.rollNumber,
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
    <>
      <style>{AUTH_THEME}</style>
      <div className="auth-page min-h-screen w-full flex" style={{ background: '#FFFCFA' }}>

        {/* LEFT: Hero / brand panel */}
        <div className="hidden lg:flex w-[44%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden text-white">
          {/* Background photo */}
          <img src={IMG_MAIN} alt="" className="absolute inset-0 h-full w-full object-cover" />

          {/* Wine overlay — softer multiply */}
          <div className="absolute inset-0 auth-left-overlay" />

          {/* Soft top-to-bottom wine fade */}
          <div className="absolute inset-0 auth-left-fade" />

          {/* Floating particles */}
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="auth-particle"
              style={{ width: p.size, height: p.size, top: p.top, left: p.left }}
              animate={{ y: [0, -14, 0], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.1, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-32 -left-20 w-96 h-96 rounded-full blur-[110px]"
              style={{ background: 'rgba(179,58,98,0.28)' }}
            />
            <motion.div
              animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.12, 1] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-0 -right-16 w-80 h-80 rounded-full blur-[100px]"
              style={{ background: 'rgba(212,175,55,0.15)' }}
            />
            <motion.div
              animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.08, 1] }}
              transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[90px]"
              style={{ background: 'rgba(139,30,63,0.18)' }}
            />
            {/* Dot grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative z-10 flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.22)' }}>
              <span style={{ fontSize: 18 }}>✨</span>
            </div>
            <span className="auth-display font-semibold text-xl tracking-tight">Examora AI</span>
          </motion.div>

          {/* Headline + testimonial */}
          <div className="relative z-10 max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
              className="auth-display text-4xl xl:text-[2.75rem] leading-[1.12] font-semibold tracking-tight mb-8"
            >
              Set up your institution in{' '}
              <span className="italic" style={{ color: 'rgba(255,255,255,0.82)' }}>minutes</span>, not months.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 16px 48px -8px rgba(74,10,30,0.25)' }}
            >
              <span style={{ fontSize: 28, lineHeight: 1, color: 'rgba(255,255,255,0.28)' }}>"</span>
              <p className="auth-display text-base leading-relaxed -mt-2" style={{ color: 'rgba(255,255,255,0.90)' }}>
                Examora cut our grading turnaround from a week to under an hour, without sacrificing rigor.
              </p>
              <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: 'rgba(179,58,98,0.70)' }}>
                  MS
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold">Mr. Balaganesh Krishnamoorthy</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.52)' }}>Dean of Academics, VNR Institute</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
            className="relative z-10 flex flex-wrap gap-2"
          >
            {featurePills.map((f) => (
              <span
                key={f.text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.82)' }}
              >
                <span style={{ fontSize: 12 }}>{f.emoji}</span>
                {f.text}
              </span>
            ))}
          </motion.div>

          <p className="relative z-10 text-[11px] font-mono mt-10" style={{ color: 'rgba(255,255,255,0.38)' }}>
            © 2026 Examora AI · Trusted by 500+ institutions
          </p>
        </div>

        {/* RIGHT: Form panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 py-10 lg:p-12 relative auth-right-bg">
          {/* Mobile-only top bar */}
          <div className="lg:hidden w-full max-w-md flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)' }}>
                <span style={{ fontSize: 18 }}>🎓</span>
              </div>
              <span className="auth-display font-semibold" style={{ color: '#8B1E3F' }}>Examora AI</span>
            </div>
            <Link to="/" className="text-xs font-semibold flex items-center gap-1 transition-colors" style={{ color: '#888' }}>
              ← Home
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full max-w-md"
          >
            <div className="hidden lg:flex justify-end mb-4">
              <Link to="/" className="text-xs font-semibold flex items-center gap-1 transition-colors" style={{ color: '#888' }}>
                ← Portal Home
              </Link>
            </div>

            {/* Glass Card */}
            <div className="auth-card p-7 sm:p-9">

              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)', boxShadow: '0 8px 24px -4px rgba(139,30,63,0.38)' }}>
                  <span style={{ fontSize: 22 }}>👤</span>
                </div>
                <div>
                  <h1 className="auth-display text-2xl font-semibold leading-tight" style={{ color: '#8B1E3F' }}>Create account</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>Set up access for your institution.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                          whileTap={{ scale: 0.97 }}
                          className="relative text-left rounded-2xl p-4 transition-all duration-200"
                          style={{
                            border: active ? '2px solid #8B1E3F' : '2px solid #F0D9E2',
                            background: active ? 'rgba(139,30,63,0.06)' : 'rgba(255,252,250,0.6)',
                            boxShadow: active ? '0 4px 20px -4px rgba(139,30,63,0.18)' : 'none',
                          }}
                        >
                          <AnimatePresence>
                            {active && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #8B1E3F, #B33A62)' }}
                              >
                                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>
                              </motion.span>
                            )}
                          </AnimatePresence>
                          <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{r.emoji}</span>
                          <p className="text-sm font-bold" style={{ color: active ? '#8B1E3F' : '#1F1F1F' }}>{r.label}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#888' }}>{r.hint}</p>
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
                      transition={{ duration: 0.4, ease: EASE }}
                      className="space-y-5 overflow-hidden"
                    >
                      {/* Institution search */}
                      <div className="relative" ref={dropdownRef}>
                        <label className="auth-label">Institution</label>
                        <div
                          className="auth-input-wrap flex items-center px-3.5 py-3 cursor-text"
                          onClick={() => setDropdownOpen(true)}
                        >
                          <span style={{ fontSize: 16, color: '#B33A62' }}>🔍</span>
                          <input
                            type="text"
                            placeholder="Type to search your college..."
                            value={searchInstText}
                            onChange={(e) => { setSearchInstText(e.target.value); setDropdownOpen(true); }}
                            className="auth-input ml-2.5"
                          />
                          {selectedInst && <span style={{ fontSize: 16, color: '#16a34a' }}>✅</span>}
                        </div>
                        <AnimatePresence>
                          {dropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-[4.6rem] left-0 right-0 max-h-52 overflow-y-auto rounded-xl z-50 py-1"
                              style={{ background: '#FFFCFA', border: '1px solid #F0D9E2', boxShadow: '0 16px 48px -8px rgba(139,30,63,0.18)' }}
                            >
                              {filteredInstitutions.length === 0 ? (
                                <div className="p-4 text-center text-xs font-medium" style={{ color: '#888' }}>No institutions found.</div>
                              ) : (
                                filteredInstitutions.map((inst) => (
                                  <div
                                    key={inst._id}
                                    onClick={() => selectInstitution(inst)}
                                    className="p-3 cursor-pointer flex items-center gap-3 text-xs transition-colors"
                                    style={{ borderBottom: '1px solid rgba(240,217,226,0.4)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,30,63,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold shrink-0 overflow-hidden" style={{ background: 'rgba(139,30,63,0.06)', border: '1px solid rgba(139,30,63,0.12)' }}>
                                      {inst.logo ? (
                                        <img src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/${inst.logo}`} alt="Logo" className="w-full h-full object-cover" />
                                      ) : ('🏛')}
                                    </div>
                                    <div>
                                      <h4 className="font-bold" style={{ color: '#8B1E3F' }}>{inst.institutionName}</h4>
                                      <p className="text-[10px] mt-0.5" style={{ color: '#888' }}>{inst.city}, {inst.state} | Code: {inst.institutionCode}</p>
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
                          <div className="auth-input-wrap flex items-center px-3.5 py-3">
                            <span style={{ fontSize: 16, color: '#B33A62' }}>🏷️</span>
                            <input
                              {...register('employeeId', { required: 'Employee ID is required for staff verification.' })}
                              className="auth-input ml-2.5"
                              placeholder="e.g. EMP-101"
                              type="text"
                            />
                          </div>
                          {errors.employeeId && (
                            <span className="text-[11px] mt-1 block px-0.5" style={{ color: '#ba1a1a' }}>{errors.employeeId.message}</span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="auth-label">Register / Roll Number</label>
                          <div className="auth-input-wrap flex items-center px-3.5 py-3">
                            <span style={{ fontSize: 16, color: '#B33A62' }}>🏷️</span>
                            <input
                              {...register('rollNumber', { required: 'Roll number is required for verification.' })}
                              className="auth-input ml-2.5"
                              placeholder="e.g. 21CS05"
                              type="text"
                            />
                          </div>
                          {errors.rollNumber && (
                            <span className="text-[11px] mt-1 block px-0.5" style={{ color: '#ba1a1a' }}>{errors.rollNumber.message}</span>
                          )}
                        </div>
                      )}

                      {/* Password fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="auth-label">Password</label>
                          <div className="auth-input-wrap relative flex items-center px-3.5 py-3">
                            <span style={{ fontSize: 16, color: '#B33A62' }}>🔒</span>
                            <input
                              {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Must be at least 8 characters' },
                              })}
                              className="auth-input ml-2.5 pr-6"
                              placeholder="••••••••"
                              type={showPassword ? 'text' : 'password'}
                            />
                            <button
                              type="button"
                              id="register-toggle-password"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 transition-colors"
                              style={{ color: '#B0919A', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <span style={{ fontSize: 15 }}>{showPassword ? '🙈' : '👁️'}</span>
                            </button>
                          </div>
                          {errors.password && (
                            <span className="text-[11px] mt-1 block px-0.5" style={{ color: '#ba1a1a' }}>{errors.password.message}</span>
                          )}
                        </div>

                        <div>
                          <label className="auth-label">Confirm password</label>
                          <div className="auth-input-wrap relative flex items-center px-3.5 py-3">
                            <span style={{ fontSize: 16, color: '#B33A62' }}>🔒</span>
                            <input
                              {...register('confirmPassword', {
                                required: 'Please confirm password',
                                validate: (value) => value === watchPassword || 'Passwords do not match',
                              })}
                              className="auth-input ml-2.5 pr-6"
                              placeholder="••••••••"
                              type={showConfirmPassword ? 'text' : 'password'}
                            />
                            <button
                              type="button"
                              id="register-toggle-confirm-password"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 transition-colors"
                              style={{ color: '#B0919A', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <span style={{ fontSize: 15 }}>{showConfirmPassword ? '🙈' : '👁️'}</span>
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <span className="text-[11px] mt-1 block px-0.5" style={{ color: '#ba1a1a' }}>{errors.confirmPassword.message}</span>
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
                            className="space-y-1.5 px-0.5 overflow-hidden"
                          >
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span style={{ color: '#888' }}>Password strength</span>
                              <span className="font-bold" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                            </div>
                            <div className="w-full rounded-full h-1.5 flex gap-0.5 overflow-hidden" style={{ background: 'rgba(139,30,63,0.08)' }}>
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
                                    borderRadius: 2,
                                    background: i <= passwordStrength.score
                                      ? `linear-gradient(90deg, #8B1E3F, #B33A62)`
                                      : 'rgba(240,217,226,0.5)',
                                    transition: 'background 0.3s',
                                  }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Terms */}
                      <div className="flex items-start gap-2.5 select-none">
                        <input
                          {...register('terms', { required: true })}
                          type="checkbox"
                          id="register-terms"
                          className="mt-0.5 rounded h-4 w-4 cursor-pointer"
                          style={{ accentColor: '#8B1E3F' }}
                        />
                        <label htmlFor="register-terms" className="text-[11px] leading-snug cursor-pointer" style={{ color: '#888' }}>
                          I certify that all entries match my official credentials. I agree to the{' '}
                          <a href="#terms" className="font-bold hover:underline" style={{ color: '#B33A62' }}>Terms &amp; Conditions</a> and{' '}
                          <a href="#policy" className="font-bold hover:underline" style={{ color: '#B33A62' }}>Academic Integrity Policy</a>.
                        </label>
                      </div>

                      {/* Submit */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        id="register-submit"
                        disabled={submitting || !isValid || !selectedInst}
                        className="auth-btn-wine w-full py-3.5 flex justify-center items-center gap-2"
                      >
                        {submitting ? 'Creating account...' : 'Create account'}
                        <span>→</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              <div className="mt-7 pt-5 text-center" style={{ borderTop: '1px solid rgba(240,217,226,0.5)' }}>
                <p className="text-sm" style={{ color: '#888' }}>
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold hover:underline" style={{ color: '#8B1E3F' }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6 text-[10px] font-mono" style={{ color: 'rgba(139,30,63,0.45)' }}>
              <span className="flex items-center gap-1">🔒 256-bit encryption</span>
              <span className="w-1 h-1 rounded-full" style={{ background: '#D4B8C0' }} />
              <span className="flex items-center gap-1">✅ SOC 2-aligned</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Register;