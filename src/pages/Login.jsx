import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Quote,
  BrainCircuit,
  ShieldCheck,
  BarChart3,
  Lock,
  LockOpen,
  Search,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EASE = [0.16, 1, 0.3, 1];

const AUTH_THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .auth-page { font-family: 'Plus Jakarta Sans', sans-serif; }
  .auth-display { font-family: 'Bricolage Grotesque', sans-serif; }
  .auth-input-wrap {
    background: #FBEDF1;
    border: 1px solid transparent;
    border-radius: 14px;
    transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .auth-input-wrap:focus-within {
    background: #FFFFFF;
    border-color: #8B1E3F;
    box-shadow: 0 0 0 3px rgba(139,30,63,0.12), 0 2px 8px rgba(139,30,63,0.08);
  }
  .auth-input {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    font-size: 0.875rem;
    color: #1F1F1F;
  }
  .auth-input:focus { box-shadow: none !important; }
  .auth-input::placeholder { color: #C79AA6; }
  .auth-input:-webkit-autofill,
  .auth-input:-webkit-autofill:hover,
  .auth-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #1F1F1F;
    -webkit-box-shadow: 0 0 0 1000px transparent inset;
    box-shadow: 0 0 0 1000px transparent inset;
    transition: background-color 9999s ease-in-out 0s;
  }
  /* Override global "form input" !important rule from index.css by ID (higher specificity) */
  #auth-inst-input,
  #auth-employee-input,
  #auth-register-input,
  #auth-email-input,
  #auth-password-input {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    outline: none !important;
  }
  #auth-inst-input:focus,
  #auth-employee-input:focus,
  #auth-register-input:focus,
  #auth-email-input:focus,
  #auth-password-input:focus {
    border: none !important;
    box-shadow: none !important;
  }
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
  .auth-tab-wrap {
    background: rgba(249,245,242,0.9);
    border: 1px solid rgba(240,217,226,0.6);
    border-radius: 14px;
    padding: 4px;
    display: flex;
    position: relative;
  }
  .auth-tab-btn {
    flex: 1;
    position: relative;
    z-index: 1;
    padding: 8px 0;
    border: none;
    background: transparent;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 0.2s;
  }
  .auth-tab-btn.active { color: #fff; }
  .auth-tab-btn.inactive { color: #888; }
  .auth-tab-btn.inactive:hover { color: #8B1E3F; }
  .auth-tab-indicator {
    position: absolute;
    inset-block: 4px;
    border-radius: 10px;
    background: linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%);
    box-shadow: 0 4px 14px -2px rgba(139,30,63,0.35);
    z-index: 0;
  }
  .auth-role-btn {
    flex: 1;
    position: relative;
    z-index: 1;
    padding: 6px 0;
    border: 1px solid transparent;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .auth-role-btn.active {
    background: rgba(139,30,63,0.09);
    color: #8B1E3F;
    border-color: rgba(139,30,63,0.25);
  }
  .auth-role-btn.inactive { color: #888; background: transparent; }
  .auth-role-btn.inactive:hover { color: #8B1E3F; background: rgba(139,30,63,0.04); }
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

// Unsplash photo — focused student, laptop + headphones
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

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Tabs: 'academic' or 'admin'
  const [activeTab, setActiveTab] = useState('academic');
  // Sub-role for academic tab: 'Staff' or 'Student'
  const [academicRole, setAcademicRole] = useState('Staff');

  // Institution searchable dropdown state
  const [institutions, setInstitutions] = useState([]);
  const [selectedInst, setSelectedInst] = useState(null);
  const [searchInstText, setSearchInstText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      employeeId: '',
      registerNumber: '',
      password: '',
      rememberDevice: false,
    },
  });

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

  const selectInstitution = (inst) => {
    setSelectedInst(inst);
    setSearchInstText(inst.institutionName);
    setDropdownOpen(false);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading('Decrypting security keyphrase...');
    try {
      let user;
      if (activeTab === 'academic') {
        if (!selectedInst) {
          toast.error('Please select your institution.', { id: toastId });
          setSubmitting(false);
          return;
        }

        user = await login({
          institution: selectedInst._id,
          employeeId: academicRole === 'Staff' ? data.employeeId : undefined,
          registerNumber: academicRole === 'Student' ? data.registerNumber : undefined,
          password: data.password,
        });
      } else {
        // Admin tab
        user = await login(data.email, data.password);
      }

      toast.success(`Access granted. Welcome back, ${user.name}!`, { id: toastId });

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
      toast.error(error.response?.data?.message || error.message || 'Incorrect credentials. Access denied.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInstitutions = institutions.filter((inst) =>
    inst.institutionName.toLowerCase().includes(searchInstText.toLowerCase())
  );

  const featurePills = [
    { icon: BrainCircuit, text: 'AI question banks' },
    { icon: ShieldCheck, text: 'Non-invasive proctoring' },
    { icon: BarChart3, text: 'Instant analytics' },
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
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative z-10 flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.22)' }}>
              <Sparkles className="w-4.5 h-4.5" />
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
              Welcome back to <span className="italic" style={{ color: 'rgba(255,255,255,0.82)' }}>smarter</span> assessment.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 16px 48px -8px rgba(74,10,30,0.25)' }}
            >
              <Quote className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.30)' }} />
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
                <f.icon className="w-3.5 h-3.5" />
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
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="auth-display font-semibold" style={{ color: '#8B1E3F' }}>Examora AI</span>
            </div>
            <Link to="/" className="text-xs font-semibold flex items-center gap-1 transition-colors" style={{ color: '#888' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Home
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
                <ArrowLeft className="w-3.5 h-3.5" /> Portal Home
              </Link>
            </div>

            {/* Glass Card */}
            <div className="auth-card p-7 sm:p-9">

              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #B33A62 100%)', boxShadow: '0 8px 24px -4px rgba(139,30,63,0.38)' }}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="auth-display text-2xl font-semibold leading-tight" style={{ color: '#8B1E3F' }}>Welcome back</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>Sign in to your secure academic workstation.</p>
                </div>
              </div>

              {/* Tabs — Academic / Admin with sliding indicator */}
              <div className="auth-tab-wrap mb-6">
                <AnimatePresence initial={false}>
                  {activeTab === 'academic' && (
                    <motion.div
                      key="academic-indicator"
                      layoutId="login-tab-indicator"
                      className="auth-tab-indicator"
                      style={{ left: 4, right: '50%' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                  {activeTab === 'admin' && (
                    <motion.div
                      key="admin-indicator"
                      layoutId="login-tab-indicator"
                      className="auth-tab-indicator"
                      style={{ left: '50%', right: 4 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  id="login-tab-academic"
                  onClick={() => { setActiveTab('academic'); reset(); }}
                  className={`auth-tab-btn ${activeTab === 'academic' ? 'active' : 'inactive'}`}
                >
                  Academic Login
                </button>
                <button
                  type="button"
                  id="login-tab-admin"
                  onClick={() => { setActiveTab('admin'); reset(); }}
                  className={`auth-tab-btn ${activeTab === 'admin' ? 'active' : 'inactive'}`}
                >
                  Admin Portal
                </button>
              </div>

              <form data-scope="auth" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'academic' ? (
                    <motion.div
                      key="academic-tab"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-5"
                    >
                      {/* Institution search */}
                      <div className="relative" ref={dropdownRef}>
                        <label className="auth-label">Institution</label>
                        <div
                          className="auth-input-wrap flex items-center px-3.5 py-3 cursor-text"
                          onClick={() => setDropdownOpen(true)}
                        >
                          <Search className="w-4 h-4 shrink-0" style={{ color: '#C97A93' }} />
                          <input
                            id="auth-inst-input"
                            type="text"
                            placeholder="Type to search your college..."
                            value={searchInstText}
                            onChange={(e) => { setSearchInstText(e.target.value); setDropdownOpen(true); }}
                            className="auth-input ml-2.5"
                            style={{ color: '#1F1F1F' }}
                          />
                          {selectedInst && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#16a34a' }} />}
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

                      {/* Staff / Student toggle */}
                      <div className="auth-tab-wrap" style={{ position: 'relative' }}>
                        <AnimatePresence initial={false}>
                          {academicRole === 'Staff' && (
                            <motion.div
                              key="staff-indicator"
                              layoutId="role-indicator"
                              className="auth-tab-indicator"
                              style={{ left: 4, right: '50%' }}
                              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                            />
                          )}
                          {academicRole === 'Student' && (
                            <motion.div
                              key="student-indicator"
                              layoutId="role-indicator"
                              className="auth-tab-indicator"
                              style={{ left: '50%', right: 4 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                            />
                          )}
                        </AnimatePresence>
                        <button
                          type="button"
                          id="login-role-staff"
                          onClick={() => setAcademicRole('Staff')}
                          className={`auth-tab-btn ${academicRole === 'Staff' ? 'active' : 'inactive'}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        >
                          <Briefcase className="w-3.5 h-3.5" /> Faculty / Staff
                        </button>
                        <button
                          type="button"
                          id="login-role-student"
                          onClick={() => setAcademicRole('Student')}
                          className={`auth-tab-btn ${academicRole === 'Student' ? 'active' : 'inactive'}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        >
                          <GraduationCap className="w-3.5 h-3.5" /> Student
                        </button>
                      </div>

                      {/* Employee ID or Register Number */}
                      {academicRole === 'Staff' ? (
                        <div>
                          <label className="auth-label">Employee ID</label>
                          <div className="auth-input-wrap flex items-center px-3.5 py-3">
                            <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#C97A93' }} />
                            <input
                              id="auth-employee-input"
                              {...register('employeeId', { required: 'Employee ID is required.' })}
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
                          <label className="auth-label">Register Number</label>
                          <div className="auth-input-wrap flex items-center px-3.5 py-3">
                            <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#C97A93' }} />
                            <input
                              id="auth-register-input"
                              {...register('registerNumber', { required: 'Register number is required.' })}
                              className="auth-input ml-2.5"
                              placeholder="e.g. REG23331"
                              type="text"
                            />
                          </div>
                          {errors.registerNumber && (
                            <span className="text-[11px] mt-1 block px-0.5" style={{ color: '#ba1a1a' }}>{errors.registerNumber.message}</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="admin-tab"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <label className="auth-label">Institutional email address</label>
                      <div className="auth-input-wrap flex items-center px-3.5 py-3">
                        <Mail className="w-4 h-4 shrink-0" style={{ color: '#C97A93' }} />
                        <input
                          id="auth-email-input"
                          {...register('email', {
                            required: 'Email address is required.',
                            pattern: {
                              value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                              message: 'Please provide a valid email format.',
                            },
                          })}
                          className="auth-input ml-2.5"
                          placeholder="e.g. admin@university.edu"
                          type="email"
                        />
                      </div>
                      {errors.email && (
                        <span className="text-[11px] mt-1 block px-0.5" style={{ color: '#ba1a1a' }}>{errors.email.message}</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password */}
                <div>
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrap relative flex items-center px-3.5 py-3">
                    <Lock className="w-4 h-4 shrink-0" style={{ color: '#C97A93' }} />
                    <input
                      id="auth-password-input"
                      {...register('password', { required: 'Password is required.' })}
                      className="auth-input ml-2.5 pr-6"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                    />
                    <button
                      type="button"
                      id="login-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 transition-colors"
                      style={{ color: '#C79AA6' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[11px] mt-1 block px-0.5" style={{ color: '#ba1a1a' }}>{errors.password.message}</span>
                  )}
                </div>

                {/* Options row */}
                <div className="flex items-center justify-between text-xs px-0.5">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <input
                      {...register('rememberDevice')}
                      type="checkbox"
                      id="login-remember"
                      className="rounded h-4 w-4 cursor-pointer"
                      style={{ accentColor: '#8B1E3F' }}
                    />
                    <span className="font-medium transition-colors" style={{ color: '#888' }}>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="font-bold uppercase text-[11px] hover:underline" style={{ color: '#B33A62' }}>
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  id="login-submit"
                  disabled={submitting}
                  className="auth-btn-wine w-full py-3.5 flex justify-center items-center gap-2"
                >
                  {submitting ? 'Authenticating...' : 'Secure access'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>

              <div className="mt-7 pt-5 text-center" style={{ borderTop: '1px solid rgba(240,217,226,0.5)' }}>
                <p className="text-sm" style={{ color: '#888' }}>
                  New institution?{' '}
                  <Link to="/register" className="font-bold hover:underline" style={{ color: '#8B1E3F' }}>
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6 text-[10px] font-mono" style={{ color: 'rgba(139,30,63,0.45)' }}>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> 256-bit encryption
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: '#D4B8C0' }} />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SOC 2-aligned
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Login;