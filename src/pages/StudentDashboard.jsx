import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Calendar, Award, CheckCircle2, AlertCircle, RefreshCw, Eye, X, Play, Clock, User,
  ChevronRight, MessageSquare, Flame, Sparkles, BarChart3, Database, ShieldCheck, Star,
  TrendingUp, Activity, HelpCircle, FileText, ArrowRight, Lightbulb, Trophy, ListTodo,
  Zap, MailOpen, Mail, GraduationCap, Check, BookOpenCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Custom Dynamic Sparkline Component matching Oxford Wine theme
const Sparkline = ({ color = '#6A0019', data = [10, 15, 8, 12, 18, 14, 20] }) => {
  const points = data.map((val, idx) => `${idx * 8},${20 - (val / 25) * 16}`).join(' ');
  return (
    <svg className="w-12 h-6 stroke-current fill-none shrink-0" style={{ color }} viewBox="0 0 50 20">
      <polyline strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

// Oxford style SVG Illustration for Hero
const StudentDashboardIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-36 h-36 drop-shadow-md select-none pointer-events-none">
    <circle cx="100" cy="100" r="72" fill="#FCEEF2" />
    <motion.g
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
    >
      {/* Book base */}
      <path d="M60 115 L100 135 L140 115 M60 123 L100 143 L140 123" fill="none" stroke="#6A0019" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="50" y="80" width="100" height="40" rx="6" fill="#FFFFFF" stroke="#EADFE3" strokeWidth="2" />
      
      {/* Reading shape */}
      <path d="M70 100 Q100 85 130 100" fill="none" stroke="#A11D42" strokeWidth="2" strokeLinecap="round" />
      
      {/* Graduation Cap */}
      <path d="M100 35 L135 47 L100 59 L65 47 Z" fill="#6A0019" />
      <rect x="91" y="53" width="18" height="9" fill="#7A0E2F" />
      <path d="M125 50 L125 70 Q125 72 122 72" fill="none" stroke="#D85A7F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="122" cy="72" r="2.5" fill="#D85A7F" />
      
      {/* Light glow elements */}
      <circle cx="50" cy="50" r="3" fill="#D85A7F" />
      <circle cx="155" cy="85" r="4.5" fill="#6A0019" />
      <circle cx="145" cy="120" r="3.5" fill="#A11D42" />
    </motion.g>
  </svg>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scorecard Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  // Study timer state
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 mins pomodoro
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      toast.success("Study session completed! Take a short break.");
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(1500);
  };

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch student exams
      const examsRes = await api.get('/exams/student');
      if (examsRes.data && examsRes.data.success) {
        setExams(examsRes.data.data || []);
      }

      // Fetch student results
      const resultsRes = await api.get('/results?limit=100');
      if (resultsRes.data && resultsRes.data.success) {
        setResults(resultsRes.data.data.results || []);
      }

      // Fetch student notifications
      const alertsRes = await api.get('/notifications');
      if (alertsRes.data && alertsRes.data.success) {
        setNotifications(alertsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to retrieve student dashboard data.', error);
      toast.error('Could not load complete dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Categorize Exams
  const now = new Date();

  const upcomingExams = exams.filter((e) => now < new Date(e.startTime));
  const liveExams = exams.filter(
    (e) => now >= new Date(e.startTime) && now <= new Date(e.endTime)
  );
  const completedExams = exams.filter((e) => now > new Date(e.endTime));

  // Compute Published Results Metrics
  const publishedResults = results.filter((r) => r.published);
  const totalPublishedCount = publishedResults.length;

  const averageScore =
    totalPublishedCount > 0
      ? parseFloat(
          (
            publishedResults.reduce(
              (acc, curr) => acc + (curr.percentage || 0),
              0
            ) / totalPublishedCount
          ).toFixed(1)
        )
      : 0;

  const passedCount = publishedResults.filter((r) => r.status === 'Pass').length;
  const failedCount = publishedResults.filter((r) => r.status === 'Fail').length;

  const passPercentage =
    totalPublishedCount > 0
      ? parseFloat(((passedCount / totalPublishedCount) * 100).toFixed(1))
      : 0;

  // Calculate simulated GPA
  const simulatedGPA = totalPublishedCount > 0
    ? parseFloat((averageScore / 25).toFixed(2))
    : 0.0;

  // Performance Standing Calculation
  let performanceTier = 'Good Standing';
  if (averageScore >= 85) performanceTier = 'Distinction';
  else if (averageScore >= 75) performanceTier = 'First Class';
  else if (averageScore >= 60) performanceTier = 'Satisfactory';
  else if (totalPublishedCount > 0) performanceTier = 'Needs Focus';

  // Subject-wise performance calculation
  const subjectMap = {};
  publishedResults.forEach((r) => {
    const subName = r.subject?.name || 'General Subject';
    if (!subjectMap[subName]) {
      subjectMap[subName] = { totalPct: 0, count: 0, code: r.subject?.code || '' };
    }
    subjectMap[subName].totalPct += r.percentage || 0;
    subjectMap[subName].count += 1;
  });

  const subjectAverages = Object.keys(subjectMap).map((subName) => ({
    name: subName,
    code: subjectMap[subName].code,
    average: parseFloat(
      (subjectMap[subName].totalPct / subjectMap[subName].count).toFixed(1)
    ),
  }));

  subjectAverages.sort((a, b) => b.average - a.average);

  const strongestSubject = subjectAverages.length > 0 ? subjectAverages[0] : null;
  const weakestSubject =
    subjectAverages.length > 1 ? subjectAverages[subjectAverages.length - 1] : null;

  // Semester Completion Rate (Completed vs Total Enrolled Exams)
  const semesterCompletionPct =
    exams.length > 0
      ? parseFloat(((completedExams.length / exams.length) * 100).toFixed(0))
      : 0;

  // Timeline grouping for upcoming exams
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 86400000;
  const dayAfterTomorrowStart = tomorrowStart + 86400000;

  const todayExams = upcomingExams.filter((e) => {
    const t = new Date(e.startTime).getTime();
    return t >= todayStart && t < tomorrowStart;
  });

  const tomorrowExams = upcomingExams.filter((e) => {
    const t = new Date(e.startTime).getTime();
    return t >= tomorrowStart && t < dayAfterTomorrowStart;
  });

  const laterExams = upcomingExams.filter((e) => {
    const t = new Date(e.startTime).getTime();
    return t >= dayAfterTomorrowStart;
  });

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data && response.data.success) {
        const alertsRes = await api.get('/notifications');
        if (alertsRes.data && alertsRes.data.success) {
          setNotifications(alertsRes.data.data || []);
        }
      }
    } catch (error) {
      toast.error('Failed to mark alert as read.');
    }
  };

  const handleViewResultModal = async (resultObj) => {
    setModalOpen(true);
    setLoadingResult(true);
    try {
      const res = await api.get(`/results/${resultObj._id}`);
      if (res.data && res.data.success) {
        setActiveResult(res.data.data);
      } else {
        setActiveResult(resultObj);
      }
    } catch (error) {
      setActiveResult(resultObj);
    } finally {
      setLoadingResult(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-44 bg-white rounded-[32px] border border-[#EADFE3]"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-[24px] border border-[#EADFE3]"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-[24px] border border-[#EADFE3]"></div>
          <div className="h-96 bg-white rounded-[24px] border border-[#EADFE3]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-[#1A1A1A] pb-12 bg-[#FCFCFD]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* LEFT COLUMN: Main Dashboard Workspace (Takes 8 spaces) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 👋 Hero Welcome Banner */}
          <motion.div
            variants={itemVariants}
            className="p-6 lg:p-8 rounded-[32px] border border-[#EADFE3] relative overflow-hidden shadow-[0_15_40px_rgba(106,0,25,0.08)] bg-gradient-to-br from-[#FFF8F9] to-white"
          >
            <div className="absolute top-0 right-0 w-52 h-52 bg-gradient-to-br from-[#FCEEF2] to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#FCEEF2] text-[#6A0019] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#EADFE3]">
                    AI Student Portal
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase border border-emerald-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Enrolled Candidate
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF7F8] text-[#A11D42] text-[10px] font-mono font-bold uppercase border border-[#EADFE3]">
                    {user?.semester?.name || 'Semester 4'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#666666]">Welcome Back</span>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A1A1A] leading-tight">
                    {user?.name || 'Student Candidate'}
                  </h1>
                </div>

                <p className="text-xs text-[#666666] font-bold flex flex-wrap items-center gap-2">
                  <span className="text-[#1A1A1A]">{user?.course?.name || 'Computer Science Engineering'}</span>
                  <span>•</span>
                  <span>{user?.department?.name || 'Department of Technology'}</span>
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center">
                <StudentDashboardIllustration />
              </div>
            </div>
          </motion.div>

          {/* 📊 STAT CARDS (KEEP SAME POSITION) */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Upcoming Exams Card */}
            <div className="bg-white p-4.5 rounded-[24px] border border-[#EADFE3] border-t-4 border-t-blue-500 shadow-[0_12px_30px_rgba(106,0,25,0.08)] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_18px_45px_rgba(106,0,25,0.12)] flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider">Upcoming</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                  <Calendar size={13} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-2xl font-black text-[#1A1A1A] font-mono block">{upcomingExams.length}</span>
                  <span className="text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md font-mono font-bold block mt-0.5">Pending</span>
                </div>
                <Sparkline color="#3B82F6" data={[5, 10, 4, 8, 12, 6, upcomingExams.length]} />
              </div>
            </div>

            {/* Completed Exams Card */}
            <div className="bg-white p-4.5 rounded-[24px] border border-[#EADFE3] border-t-4 border-t-emerald-500 shadow-[0_12px_30px_rgba(106,0,25,0.08)] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_18px_45px_rgba(106,0,25,0.12)] flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider">Completed</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <BookOpenCheck size={13} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-2xl font-black text-[#1A1A1A] font-mono block">{completedExams.length}</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-mono font-bold block mt-0.5">Attempted</span>
                </div>
                <Sparkline color="#10B981" data={[8, 12, 15, 14, 18, 20, completedExams.length]} />
              </div>
            </div>

            {/* Average Marks Card */}
            <div className="bg-white p-4.5 rounded-[24px] border border-[#EADFE3] border-t-4 border-t-orange-500 shadow-[0_12px_30px_rgba(106,0,25,0.08)] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_18px_45px_rgba(106,0,25,0.12)] flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider">Avg Score</span>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-xs">
                  <TrendingUp size={13} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-2xl font-black text-[#1A1A1A] font-mono block">{averageScore}%</span>
                  <span className="text-[9px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md font-mono font-bold block mt-0.5">Passing</span>
                </div>
                <Sparkline color="#F59E0B" data={[65, 72, 70, 78, 84, 80, averageScore]} />
              </div>
            </div>

            {/* Current GPA Card */}
            <div className="bg-white p-4.5 rounded-[24px] border border-[#EADFE3] border-t-4 border-t-purple-500 shadow-[0_12px_30px_rgba(106,0,25,0.08)] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_18px_45px_rgba(106,0,25,0.12)] flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider">Standing</span>
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-xs">
                  <Award size={13} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-xl font-black text-[#1A1A1A] block">{performanceTier}</span>
                  <span className="text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md font-mono font-bold block mt-0.5 truncate max-w-[80px]">Top tier</span>
                </div>
                <Sparkline color="#8B5CF6" data={[2, 3, 2, 4, 3, 5, totalPublishedCount * 2]} />
              </div>
            </div>
          </motion.div>

          {/* ⚡ QUICK ACTION BUTTONS */}
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)]">
            <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider block mb-3.5">
              Quick Actions Portal
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => navigate('/student/live')}
                className="p-3 rounded-full bg-white border border-[#6A0019] text-[#6A0019] text-xs font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#6A0019] hover:text-white active:scale-95 shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#6A0019] animate-ping shrink-0" />
                Live Exams ({liveExams.length})
              </button>
              <button
                onClick={() => navigate('/student/upcoming')}
                className="p-3 rounded-full bg-white border border-[#6A0019] text-[#6A0019] text-xs font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#6A0019] hover:text-white active:scale-95 shadow-xs"
              >
                <Calendar size={13} />
                Upcoming ({upcomingExams.length})
              </button>
              <button
                onClick={() => navigate('/student/completed')}
                className="p-3 rounded-full bg-white border border-[#6A0019] text-[#6A0019] text-xs font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#6A0019] hover:text-white active:scale-95 shadow-xs"
              >
                <Award size={13} />
                Scorecards
              </button>
              <button
                onClick={() => navigate('/student/profile')}
                className="p-3 rounded-full bg-white border border-gray-300 text-[#666666] text-xs font-bold transition-all flex items-center justify-center gap-2 hover:bg-gray-150 active:scale-95 shadow-xs"
              >
                <User size={13} />
                My Profile
              </button>
            </div>
          </motion.div>

          {/* 📈 PERFORMANCE CARDS (LINE CHART & SUBJECTS) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Overall Score Trend Chart */}
            <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EADFE3]/60 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#6A0019] flex items-center gap-2">
                    <BarChart3 size={15} />
                    Performance Trend
                  </h3>
                  <p className="text-[10px] text-[#666666] font-semibold mt-0.5">
                    Percentage scores over recent published exams
                  </p>
                </div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 bg-[#FCEEF2] text-[#6A0019] rounded-full border border-[#EADFE3]">
                  {publishedResults.length} Evaluated
                </span>
              </div>

              {publishedResults.length === 0 ? (
                <div className="py-14 text-center text-[#666666] text-xs space-y-1">
                  <Activity size={24} className="text-gray-300 mx-auto" />
                  <p className="font-bold text-[#1A1A1A]">No performance curve</p>
                  <p className="text-[10px]">Complete examinations to chart progress.</p>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="h-44 w-full relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                      <defs>
                        <linearGradient id="performanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6A0019" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6A0019" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[0, 37.5, 75, 112.5, 150].map((y, i) => (
                        <line key={i} x1="0" y1={y} x2="400" y2={y} stroke="rgba(106,0,25,0.06)" strokeDasharray="4 4" strokeWidth="1" />
                      ))}

                      {/* Line & Dots */}
                      {(() => {
                        const items = publishedResults.slice(-6);
                        const step = items.length > 1 ? 400 / (items.length - 1) : 200;
                        const points = items.map((item, idx) => {
                          const x = items.length === 1 ? 200 : idx * step;
                          const y = 150 - ((item.percentage || 0) / 100) * 115 - 15;
                          return { x, y, pct: item.percentage || 0 };
                        });

                        const pathD = points.reduce((acc, p, idx) => {
                          return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                        }, '');

                        const areaD = `${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                        return (
                          <>
                            <path d={areaD} fill="url(#performanceGrad)" />
                            <path d={pathD} fill="none" stroke="#6A0019" strokeWidth="2.5" strokeLinecap="round" />
                            {points.map((p, i) => (
                              <g key={i}>
                                <circle cx={p.x} cy={p.y} r="4.5" fill="#6A0019" stroke="#FFFFFF" strokeWidth="2" />
                                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#6A0019" fontSize="9" fontWeight="800" fontFamily="monospace">
                                  {p.pct}%
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* 📚 SUBJECT BREAKDOWN */}
            <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EADFE3]/60 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#6A0019] flex items-center gap-2">
                    <Database size={15} />
                    Subject Breakdown
                  </h3>
                  <p className="text-[10px] text-[#666666] font-semibold mt-0.5">
                    Enrolled course average metrics
                  </p>
                </div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 bg-[#FCEEF2] text-[#6A0019] rounded-full border border-[#EADFE3]">
                  {subjectAverages.length} Subject Nodes
                </span>
              </div>

              {subjectAverages.length === 0 ? (
                <div className="py-14 text-center text-[#666666] text-xs space-y-1">
                  <Database size={24} className="text-gray-300 mx-auto" />
                  <p className="font-bold text-[#1A1A1A]">No course stats</p>
                  <p className="text-[10px]">Your subjects lists will load after published results.</p>
                </div>
              ) : (
                <div className="space-y-3.5 pt-1">
                  {subjectAverages.slice(0, 4).map((sub, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#1A1A1A] truncate max-w-[200px]" title={sub.name}>
                          {sub.name} {sub.code ? `(${sub.code})` : ''}
                        </span>
                        <span className="font-mono text-[#6A0019]">{sub.average}%</span>
                      </div>
                      <div className="w-full bg-[#FFF7F8] border border-[#EADFE3] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#6A0019] to-[#D85A7F]"
                          style={{ width: `${Math.min(sub.average, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Study Center Bento Grid */}
          <motion.div variants={itemVariants} className="space-y-3">
            <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider block">
              AI Study & Prep Center
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Tile 1: Weak Topics Focus */}
              <div className="bg-white p-4.5 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md hover:border-[#6A0019]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider">Suggested Focus</span>
                  <Sparkles size={14} className="text-amber-500" />
                </div>
                <h4 className="text-xs font-extrabold text-[#1A1A1A]">Focus Review Area</h4>
                <p className="text-[11px] text-[#666666] font-semibold leading-relaxed">
                  {weakestSubject ? `Extra revisions advised in ${weakestSubject.name} (${weakestSubject.average}%) ahead of tests.` : 'No critical areas flagged by system.'}
                </p>
              </div>

              {/* Tile 2: Strong Topics / Stats */}
              <div className="bg-white p-4.5 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md hover:border-[#6A0019]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider">Strongest Area</span>
                  <Trophy size={14} className="text-yellow-500" />
                </div>
                <h4 className="text-xs font-extrabold text-[#1A1A1A]">Strongest Subject</h4>
                <p className="text-[11px] text-[#666666] font-semibold leading-relaxed">
                  {strongestSubject ? `Highly skilled in ${strongestSubject.name} averaging ${strongestSubject.average}% overall.` : 'Establish initial course score sheets.'}
                </p>
              </div>

              {/* Tile 3: AI Recommendations */}
              <div className="bg-white p-4.5 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md hover:border-[#6A0019]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider">Smart Tip</span>
                  <Lightbulb size={14} className="text-[#6A0019]" />
                </div>
                <h4 className="text-xs font-extrabold text-[#1A1A1A]">Recommendation</h4>
                <p className="text-[11px] text-[#666666] font-semibold leading-relaxed">
                  Study session timers track syllabus goals. Try using the revision pomodoro timer widget.
                </p>
              </div>

            </div>
          </motion.div>

          {/* Upcoming Exam Timeline list */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#6A0019] flex items-center gap-2">
                  <Calendar size={15} />
                  Upcoming Examination Schedule
                </h3>
                <p className="text-[10px] text-[#666666] font-semibold mt-0.5">
                  Timeline schedule of upcoming assessments
                </p>
              </div>
              <button
                onClick={() => navigate('/student/upcoming')}
                className="text-xs font-bold text-[#6A0019] hover:underline flex items-center gap-1 active:scale-95"
              >
                Full Schedule
                <ChevronRight size={14} />
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="py-12 text-center text-[#666666] text-xs space-y-1">
                <Calendar size={24} className="text-gray-300 mx-auto" />
                <p className="font-bold text-[#1A1A1A]">No Pending Exams</p>
                <p className="text-[10px]">You are completely up-to-date with your schedule.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Today */}
                {todayExams.length > 0 && (
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 bg-[#FCEEF2] text-[#6A0019] rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border border-[#EADFE3]">
                      Today
                    </span>
                    {todayExams.map((exam) => (
                      <div
                        key={exam._id}
                        className="p-4 rounded-2xl border border-[#EADFE3] bg-[#FFF7F8] flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#6A0019] truncate">{exam.title}</h4>
                          <p className="text-[10px] text-[#666666] font-mono font-bold">
                            Subject: {exam.subject?.name} • Duration: {exam.durationMinutes} mins
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/student/exam-session/${exam._id}`)}
                          className="px-4 py-2 rounded-full bg-[#6A0019] text-white font-bold text-xs hover:bg-[#6A0019]/90 shrink-0 transition-all shadow-xs active:scale-95"
                        >
                          Enter Session
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tomorrow */}
                {tomorrowExams.length > 0 && (
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border border-amber-500/10">
                      Tomorrow
                    </span>
                    {tomorrowExams.map((exam) => (
                      <div
                        key={exam._id}
                        className="p-4 rounded-2xl border border-[#EADFE3] bg-white flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#1A1A1A] truncate">{exam.title}</h4>
                          <p className="text-[10px] text-[#666666] font-mono font-bold">
                            Subject: {exam.subject?.name} • Starts: {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          Tomorrow
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Later */}
                {laterExams.length > 0 && (
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 bg-gray-50 text-[#666666] rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border border-gray-200">
                      Upcoming Later
                    </span>
                    {laterExams.slice(0, 3).map((exam) => (
                      <div
                        key={exam._id}
                        className="p-4 rounded-2xl border border-[#EADFE3] bg-white flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#1A1A1A] truncate">{exam.title}</h4>
                          <p className="text-[10px] text-[#666666] font-mono font-bold">
                            Subject: {exam.subject?.name} • Date: {new Date(exam.startTime).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#666666]">
                          {new Date(exam.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Recent Results table */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#6A0019] flex items-center gap-2">
                  <Award size={15} />
                  Recent Scorecards Summary
                </h3>
                <p className="text-[10px] text-[#666666] font-semibold mt-0.5">
                  Published scores and evaluation statuses
                </p>
              </div>
              <button
                onClick={() => navigate('/student/completed')}
                className="text-xs font-bold text-[#6A0019] hover:underline flex items-center gap-1 active:scale-95"
              >
                All Results
                <ChevronRight size={14} />
              </button>
            </div>

            {results.length === 0 ? (
              <div className="py-12 text-center text-[#666666] text-xs space-y-1">
                <Award size={24} className="text-gray-300 mx-auto" />
                <p className="font-bold text-[#1A1A1A]">No Results Yet</p>
                <p className="text-[10px]">Your performance reports will be listed once published.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bold text-[#666666]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[9px] font-mono font-bold uppercase text-[#9CA3AF]">
                      <th className="py-3 px-3">Exam Title</th>
                      <th className="py-3 px-3">Subject</th>
                      <th className="py-3 px-3 text-center">Score</th>
                      <th className="py-3 px-3 text-center">Pct %</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150/30">
                    {results.slice(0, 5).map((res) => (
                      <tr key={res._id} className="hover:bg-[#FFF7F8] transition-colors">
                        <td className="py-3 px-3 font-extrabold text-[#1A1A1A] max-w-[150px] truncate">{res.exam?.title || 'Exam'}</td>
                        <td className="py-3 px-3 text-[#666666] max-w-[150px] truncate">{res.subject?.name || 'Subject'}</td>
                        <td className="py-3 px-3 text-center font-mono">{res.published ? `${res.marksObtained} / ${res.totalMarks}` : '—'}</td>
                        <td className="py-3 px-3 text-center font-mono text-[#6A0019]">{res.published ? `${res.percentage}%` : '—'}</td>
                        <td className="py-3 px-3 text-center">
                          {!res.published ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-500/20 text-[9px]">
                              Pending
                            </span>
                          ) : res.status === 'Pass' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-500/20 text-[9px]">
                              PASS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-500/20 text-[9px]">
                              FAIL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleViewResultModal(res)}
                            className="px-3 py-1.5 rounded-full bg-white border border-[#6A0019] text-[#6A0019] hover:bg-[#6A0019] hover:text-white hover:border-transparent text-[10px] transition-all font-bold shadow-xs active:scale-95"
                          >
                            Scorecard
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Sidebar Widgets (Takes 4 spaces - RIGHT PANEL LAYOUT) */}
        <div className="lg:col-span-4 space-y-6">

          {/* 👤 PROFILE CARD */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto rounded-full border-2 border-[#6A0019] flex items-center justify-center bg-[#FCEEF2] shadow-sm">
              <User size={36} className="text-[#6A0019]" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#6A0019] text-white flex items-center justify-center border border-white">
                <Star size={10} fill="white" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1A1A1A]">{user?.name || 'Student Candidate'}</h3>
              <p className="text-[10px] font-mono font-bold text-[#6A0019] uppercase tracking-wider mt-0.5">
                Roll Number: {user?.rollNumber || 'ST-2026-01'}
              </p>
            </div>

            <div className="p-3.5 bg-[#FFF7F8] border border-[#EADFE3] rounded-2xl text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[11px] font-bold text-[#666666]">
                <span className="flex items-center gap-1.5"><Award size={13} className="text-[#6A0019]" /> GPA Standing:</span>
                <span className="font-extrabold text-[#6A0019]">{simulatedGPA} / 4.0</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-[#666666]">
                <span className="flex items-center gap-1.5"><BookOpen size={13} className="text-[#6A0019]" /> Exam Completion:</span>
                <span className="font-mono text-[#1A1A1A] font-bold">{semesterCompletionPct}%</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-[#666666]">
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#6A0019]" /> Status:</span>
                <span className="text-emerald-700 font-bold">Good Standing</span>
              </div>
            </div>
          </motion.div>

          {/* ⏱ STUDY TIMER */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] text-center space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-left">
              <h4 className="text-xs font-extrabold text-[#1A1A1A] flex items-center gap-1.5">
                <Clock size={13} className="text-[#6A0019]" />
                Study Timer
              </h4>
              <span className="text-[9px] font-mono font-bold text-[#6A0019] bg-[#FCEEF2] px-1.5 py-0.5 rounded-full">
                POMODORO
              </span>
            </div>

            <div className="py-2">
              <span className="text-4xl font-black font-mono text-[#6A0019] tracking-tight block">
                {formatTimer()}
              </span>
              <span className="text-[10px] text-[#666666] font-bold block mt-1">
                {timerRunning ? 'Keep focused!' : 'Ready to study?'}
              </span>
            </div>

            <div className="flex justify-center gap-2">
              <button
                onClick={toggleTimer}
                className="py-2 px-5 rounded-full text-xs font-extrabold shadow-xs transition-all active:scale-95 text-white"
                style={{
                  background: 'linear-gradient(135deg, #6A0019, #A11D42)'
                }}
              >
                {timerRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={resetTimer}
                className="py-2 px-4 rounded-full bg-white border border-[#6A0019] text-[#6A0019] hover:bg-[#FFF7F8] text-xs font-bold transition-all active:scale-95"
              >
                Reset
              </button>
            </div>
          </motion.div>

          {/* 🔔 NOTIFICATION CARD (Recent Alerts Feed) */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4 flex flex-col justify-between h-[340px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-extrabold text-[#1A1A1A] flex items-center gap-1.5">
                <AlertCircle size={13} className="text-[#6A0019]" />
                Recent Alerts
              </h4>
              <span className="text-[9px] font-mono font-bold text-[#6A0019] bg-[#FCEEF2] px-1.5 py-0.5 rounded-full border border-[#EADFE3]">
                {notifications.filter((n) => !n.read).length} New
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {notifications.length === 0 ? (
                <p className="text-[11px] text-[#666666] font-bold text-center py-10">No recent notifications.</p>
              ) : (
                notifications.slice(0, 4).map((n) => (
                  <div
                    key={n._id}
                    className={`p-3 rounded-[18px] border text-left text-[11px] space-y-1 transition-all ${
                      !n.read 
                        ? 'bg-[#FCEEF2] border-[#EADFE3] shadow-xs' 
                        : 'bg-white border-[#EADFE3] shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-extrabold text-[#1A1A1A] truncate">{n.title}</span>
                      {!n.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, n._id)}
                          className="text-[9px] text-[#6A0019] font-bold hover:underline shrink-0"
                        >
                          Read
                        </button>
                      )}
                    </div>
                    <p className="text-[#666666] text-[10px] leading-snug line-clamp-2 font-semibold">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => navigate('/student/notifications')}
              className="w-full py-2.5 rounded-full border border-[#6A0019] hover:bg-[#6A0019] hover:text-white text-[#6A0019] font-bold text-xs transition-all text-center active:scale-95 shadow-xs"
            >
              All Notifications Center
            </button>
          </motion.div>

          {/* AI Tip of the Day */}
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6A0019]/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-1.5 text-[#6A0019]">
              <Lightbulb size={14} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider">AI Tip of the Day</span>
            </div>
            <h4 className="text-xs font-extrabold text-[#1A1A1A] leading-snug">Study Spacing Recommendation</h4>
            <p className="text-[11px] text-[#666666] font-semibold leading-relaxed">
              Review course slide notes and syllabus topics every 3 days. Active recall increases test outcomes by 24% according to score calculations.
            </p>
          </motion.div>

        </div>
      </motion.div>

      {/* SCORECARD MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white max-w-lg w-full rounded-[24px] border border-[#EADFE3] shadow-2xl p-6 space-y-6 overflow-hidden z-10"
            >
              {loadingResult ? (
                <div className="p-12 text-center space-y-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto"></div>
                  <div className="h-6 bg-gray-100 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto"></div>
                </div>
              ) : !activeResult ? (
                <div className="text-center p-8 space-y-3">
                  <AlertCircle size={48} className="text-amber-500 mx-auto" />
                  <h3 className="text-lg font-bold text-[#1A1A1A]">No scorecard records</h3>
                  <p className="text-xs text-[#666666] font-semibold">
                    The evaluation record for this exam attempt could not be retrieved.
                  </p>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="mt-4 px-6 py-2.5 rounded-full bg-[#6A0019] text-white text-xs font-bold"
                  >
                    Close Window
                  </button>
                </div>
              ) : !activeResult.published ? (
                <div className="text-center p-6 space-y-4">
                  <Clock size={48} className="text-amber-500 mx-auto animate-bounce" />
                  <h3 className="text-lg font-extrabold text-[#1A1A1A]">Result Pending</h3>
                  <p className="text-xs text-[#666666] font-semibold leading-relaxed px-4">
                    The auto-evaluation is completed, but your scorecard has not been published by administration yet. Marks are hidden until release.
                  </p>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full mt-4 py-3 rounded-full border border-gray-200 text-[#1D1D1F] hover:bg-gray-50 text-xs font-bold transition-all"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-[#666666]">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-500/10 rounded text-[9px] font-mono font-bold uppercase">
                        Scorecard Released
                      </span>
                      <h3 className="text-base font-extrabold text-[#1A1A1A] mt-1.5">
                        {activeResult.exam?.title}
                      </h3>
                      <p className="text-[10px] text-[#666666] font-mono font-bold mt-0.5">
                        Subject: {activeResult.exam?.subject?.name} ({activeResult.exam?.subject?.code})
                      </p>
                    </div>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center shadow-xs">
                      <span className="text-[8px] text-[#9CA3AF] uppercase block font-mono">
                        Score Obtained
                      </span>
                      <span className="block font-bold text-sm text-[#1A1A1A] font-mono mt-0.5">
                        {activeResult.marksObtained} / {activeResult.totalMarks}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center shadow-xs">
                      <span className="text-[8px] text-[#9CA3AF] uppercase block font-mono">
                        Percentage
                      </span>
                      <span className="block font-bold text-sm text-[#1A1A1A] font-mono mt-0.5">
                        {activeResult.percentage}%
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center shadow-xs">
                      <span className="text-[8px] text-[#9CA3AF] uppercase block font-mono">
                        Letter Grade
                      </span>
                      <span className="block font-extrabold text-sm text-[#1A1A1A] font-mono mt-0.5">
                        {activeResult.grade}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3 font-bold text-xs text-[#666666]">
                    <div className="flex justify-between items-center border-b border-gray-150/40 pb-2">
                      <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">Evaluation Stats</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          activeResult.status === 'Pass'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/10'
                            : 'bg-red-50 text-red-750 border border-red-500/10'
                        }`}
                      >
                        {activeResult.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 bg-emerald-50 border border-emerald-500/10 rounded-xl">
                        <span className="block font-mono font-bold text-emerald-700">
                          {activeResult.statsSummary?.correct || 0} Correct
                        </span>
                      </div>
                      <div className="p-2 bg-red-50 border border-red-500/10 rounded-xl">
                        <span className="block font-mono font-bold text-red-700">
                          {activeResult.statsSummary?.wrong || 0} Wrong
                        </span>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-xl border border-gray-200">
                        <span className="block font-mono font-bold text-gray-500">
                          {activeResult.statsSummary?.unanswered || 0} Skipped
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-[#9CA3AF] text-right leading-none space-y-0.5">
                    <p>Submission Time: {new Date(activeResult.attempt?.submissionTime || activeResult.createdAt).toLocaleString()}</p>
                    <p>Passing Threshold: {activeResult.passingMarks} Marks</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
