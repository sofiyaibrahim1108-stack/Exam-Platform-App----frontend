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

import './Authentication.css';

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
                <Sparkles className="w-4 h-4 text-[#FBC02D]" />
              </div>
              <span className="auth-display font-semibold text-base tracking-tight">Examora AI</span>
            </div>

            {/* Headline + testimonial */}
            <div className="relative z-10 my-auto py-6">
              <h1 className="auth-display text-xl lg:text-2xl font-bold leading-tight mb-4">
                Welcome back to <span className="text-[#FBC02D] font-extrabold">smarter</span> assessment.
              </h1>

              <div className="rounded-xl p-4 bg-white/5 border border-white/10 backdrop-blur-md">
                <Quote className="w-5 h-5 text-white/30 mb-2" />
                <p className="text-xs leading-relaxed text-white/90">
                  Examora cut our grading turnaround from a week to under an hour, without sacrificing academic rigor.
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-medium bg-white/5 border border-white/10 text-white/80"
                  >
                    <f.icon className="w-2.5 h-2.5 text-[#FBC02D]" />
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
                <ArrowLeft className="w-3 h-3" /> Portal Home
              </Link>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #8B1538 0%, #6A0019 100%)' }}>
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="auth-display text-xl font-bold text-gray-900 leading-none">Welcome back</h1>
                <p className="text-xs text-gray-500 mt-1">Sign in to your secure academic workstation.</p>
              </div>
            </div>

            {/* Tabs — Academic / Admin with sliding indicator */}
            <div className="auth-tab-wrap mb-5">
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === 'academic' ? (
                  <motion.div
                    key="academic-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Institution search */}
                    <div className="relative z-30" ref={dropdownRef}>
                      <label className="auth-label">Institution</label>
                      <div
                        className="auth-input-wrap cursor-text"
                        onClick={() => setDropdownOpen(true)}
                      >
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search your college..."
                          value={searchInstText}
                          onChange={(e) => { setSearchInstText(e.target.value); setDropdownOpen(true); }}
                          className="auth-input ml-2"
                        />
                        {selectedInst && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
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
                        <div className="auth-input-wrap">
                          <BadgeCheck className="w-4 h-4 text-[#8B1538] shrink-0" />
                          <input
                            {...register('employeeId', { required: 'Employee ID is required.' })}
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
                        <label className="auth-label">Register Number</label>
                        <div className="auth-input-wrap">
                          <BadgeCheck className="w-4 h-4 text-[#8B1538] shrink-0" />
                          <input
                            {...register('registerNumber', { required: 'Register number is required.' })}
                            className="auth-input ml-2"
                            placeholder="e.g. REG23331"
                            type="text"
                          />
                        </div>
                        {errors.registerNumber && (
                          <span className="text-[11px] mt-1 block px-0.5 text-red-600 font-semibold">{errors.registerNumber.message}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="admin-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="auth-label">Institutional email address</label>
                    <div className="auth-input-wrap">
                      <Mail className="w-4 h-4 text-[#8B1538] shrink-0" />
                      <input
                        {...register('email', {
                          required: 'Email address is required.',
                          pattern: {
                            value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                            message: 'Please provide a valid email format.',
                          },
                        })}
                        className="auth-input ml-2"
                        placeholder="e.g. admin@university.edu"
                        type="email"
                      />
                    </div>
                    {errors.email && (
                      <span className="text-[11px] mt-1 block px-0.5 text-red-600 font-semibold">{errors.email.message}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password */}
              <div>
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap relative">
                  <Lock className="w-4 h-4 text-[#8B1538] shrink-0" />
                  <input
                    {...register('password', { required: 'Password is required.' })}
                    className="auth-input ml-2 pr-6"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    id="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-[11px] mt-1 block px-0.5 text-red-600 font-semibold">{errors.password.message}</span>
                )}
              </div>

              {/* Options row */}
              <div className="flex items-center justify-between text-xs px-0.5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    {...register('rememberDevice')}
                    type="checkbox"
                    id="login-remember"
                    className="rounded h-4 w-4 cursor-pointer border-gray-300 text-[#8B1538]"
                    style={{ accentColor: '#8B1538' }}
                  />
                  <span className="font-semibold text-gray-500 hover:text-gray-900 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="font-bold uppercase text-[10px] text-[#8B1538] hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                id="login-submit"
                disabled={submitting}
                className="auth-btn-wine w-full py-3 flex justify-center items-center gap-2"
              >
                {submitting ? 'Authenticating...' : 'Secure access'}
                <ArrowRight className="w-4 h-4 text-white" />
              </motion.button>
            </form>

            <div className="mt-5 pt-4 text-center border-t border-gray-100">
              <p className="text-xs text-gray-500">
                New institution?{' '}
                <Link to="/register" className="font-bold text-[#8B1538] hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center gap-3.5 mt-5 text-[9px] font-mono text-gray-400">
              <span className="flex items-center gap-1 shrink-0">
                <Lock className="w-2.5 h-2.5" /> 256-bit encryption
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" /> SOC 2-aligned
              </span>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default Login;