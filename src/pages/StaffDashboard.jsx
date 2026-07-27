import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area

} from 'recharts';
import {
  BookOpen, Edit3, Hourglass, CheckCircle2, XCircle, Calendar, Award,
  Sparkles, Database, FileText, ArrowRight, Brain, Cpu, History, BarChart3,
  TrendingUp, Activity, HelpCircle, FileEdit,Plus
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLORS = {
  Draft: '#C74B74',
  'Pending Approval': '#F59E0B',
  Approved: '#10B981',
  Rejected: '#EF4444',
  Published: '#8C1D40',
  Active: '#8C1D40',
  Completed: '#10B981',
  Cancelled: '#6B7280',
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedSubjects: 0,
    totalQuestionDrafts: 0,
    pendingQuestionApproval: 0,
    approvedQuestions: 0,
    rejectedQuestions: 0,
    examsCreated: 0,
    upcomingExams: 0,
    publishedResults: 0,
    charts: {
      questionStatusDistribution: [],
      subjectWiseQuestionCount: [],
      monthlyQuestionSubmission: [],
      examStatus: [],
    },
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/staff-subjects/dashboard-stats');
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve staff dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'question_draft':
        return Edit3;
      case 'question_approval':
        return CheckCircle2;
      case 'exam_created':
        return FileEdit;
      case 'notification':
        return Sparkles;
      default:
        return History;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'question_draft':
        return 'bg-pink-50 text-[#C74B74] border-[#C74B74]/20';
      case 'question_approval':
        return 'bg-emerald-50 text-emerald-600 border-emerald-500/20';
      case 'exam_created':
        return 'bg-[#F8ECEF] text-[#8C1D40] border-[#8C1D40]/20';
      case 'notification':
        return 'bg-amber-50 text-amber-600 border-amber-500/20';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 font-sans">
        <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] shadow-xs">
          <div className="h-8 bg-gray-100 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[rgba(140,29,64,0.08)] rounded-[20px] shadow-xs"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white border border-[rgba(140,29,64,0.08)] rounded-[24px] shadow-xs"></div>
          <div className="h-64 bg-white border border-[rgba(140,29,64,0.08)] rounded-[24px] shadow-xs"></div>
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Assigned Subjects', count: stats.assignedSubjects, icon: BookOpen, trend: '+1 New', accent: '#F2BFCF' },
    { title: 'Total Question Drafts', count: stats.totalQuestionDrafts, icon: Edit3, trend: 'Drafts', accent: '#FBBF24' },
    { title: 'Pending Approval', count: stats.pendingQuestionApproval, icon: Hourglass, trend: 'Awaiting', accent: '#FACC15' },
    { title: 'Approved Questions', count: stats.approvedQuestions, icon: CheckCircle2, trend: 'Live', accent: '#34D399' },
    { title: 'Rejected Questions', count: stats.rejectedQuestions, icon: XCircle, trend: 'Needs Edit', accent: '#F87171' },
    { title: 'Exams Created', count: stats.examsCreated, icon: FileText, trend: 'Assigned', accent: '#818CF8' },
    { title: 'Upcoming Exams', count: stats.upcomingExams, icon: Calendar, trend: 'Scheduled', accent: '#2DD4BF' },
    { title: 'Published Results', count: stats.publishedResults, icon: Award, trend: 'Completed', accent: '#60A5FA' },
  ];

  const quickActions = [
    { name: 'Generate AI Questions', desc: 'Create prompt questions using AI', icon: Brain, path: '/staff/questions', highlight: true },
    { name: 'Create Manual Questions', desc: 'Add MCQ, essay or coding questions', icon: Plus, path: '/staff/questions' },
    { name: 'Open Question Bank', desc: 'Browse approved question repository', icon: Database, path: '/staff/question-bank' },
    { name: 'Create Exam Assessment', desc: 'Schedule new assessments', icon: FileEdit, path: '/staff/exams' },
    { name: 'View Results Ledger', desc: 'Audit student performance', icon: Award, path: '/staff/results' },
  ];

  const isQuestionStatusEmpty =
    !stats.charts?.questionStatusDistribution ||
    stats.charts.questionStatusDistribution.every((d) => d.value === 0);

  const isSubjectWiseEmpty =
    !stats.charts?.subjectWiseQuestionCount ||
    stats.charts.subjectWiseQuestionCount.length === 0 ||
    stats.charts.subjectWiseQuestionCount.every((d) => d.count === 0);

  const isMonthlySubmissionEmpty =
    !stats.charts?.monthlyQuestionSubmission ||
    stats.charts.monthlyQuestionSubmission.every((d) => d.count === 0);

  const isExamStatusEmpty =
    !stats.charts?.examStatus ||
    stats.charts.examStatus.every((d) => d.count === 0);

  return (
    <div className="space-y-8 font-sans pb-10">

      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#8C1D40] via-[#A83259] to-[#C74B74] text-white rounded-[28px] p-6 lg:p-10 shadow-lg flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Abstract Background Blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-xl space-y-4 relative z-10 text-center md:text-left">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-white/20 inline-block">
            AI Faculty Workspace
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
            Welcome back,<br />
            {user?.name || 'Academic Faculty'} 👋
          </h2>
          <p className="text-white/80 text-xs max-w-md leading-relaxed">
            Create, manage and evaluate examinations using our advanced artificial intelligence engine. Generate syllabus-aligned questions in seconds.
          </p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
            <button
              onClick={() => navigate('/staff/questions')}
              className="px-5 py-2.5 bg-white text-[#8C1D40] hover:bg-white/95 transition-all text-xs font-bold rounded-xl shadow-md flex items-center gap-2 active:scale-95"
            >
              <Brain size={14} className="text-[#8C1D40]" />
              Generate Questions
            </button>
            <button
              onClick={() => navigate('/staff/question-bank')}
              className="px-5 py-2.5 bg-[#8C1D40]/30 hover:bg-[#8C1D40]/40 transition-all text-xs font-bold rounded-xl border border-white/20 flex items-center gap-2"
            >
              <Database size={14} />
              Question Bank
            </button>
          </div>
        </div>

        {/* AI Engine -> Questions Flow Visualization */}
        <div className="relative w-72 sm:w-80 h-56 shrink-0 flex items-center justify-center">

          {/* Ambient glow */}
          <div className="absolute w-64 h-52 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>

          <svg viewBox="0 0 340 220" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="streamGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F2BFCF" stopOpacity="0" />
                <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Neural cluster connecting lines */}
            <g stroke="rgba(255,255,255,0.35)" strokeWidth="1">
              <line x1="70" y1="55" x2="70" y2="108" />
              <line x1="35" y1="88" x2="70" y2="108" />
              <line x1="105" y1="88" x2="70" y2="108" />
              <line x1="25" y1="140" x2="70" y2="108" />
              <line x1="115" y1="140" x2="70" y2="108" />
              <line x1="70" y1="172" x2="70" y2="108" />
              <line x1="35" y1="88" x2="25" y2="140" />
              <line x1="105" y1="88" x2="115" y2="140" />
              <line x1="70" y1="55" x2="35" y2="88" />
              <line x1="70" y1="55" x2="105" y2="88" />
            </g>

            {/* Glow behind core node */}
            <circle cx="70" cy="108" r="34" fill="url(#coreGlow)" />

            {/* Cluster nodes */}
            {[
              [70, 55, 4],
              [35, 88, 4],
              [105, 88, 4],
              [25, 140, 4],
              [115, 140, 4],
              [70, 172, 4],
              [70, 108, 8],
            ].map(([cx, cy, r], i) => (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill={i === 6 ? '#FFFFFF' : '#F2BFCF'}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 + i * 0.3, ease: 'easeInOut' }}
              />
            ))}

            {/* Streaming particle lines toward cards */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 30 + i * 40;
              return (
                <motion.path
                  key={i}
                  d={`M78,108 C150,${108 + (y - 108) * 0.35} 200,${y} 248,${y}`}
                  stroke="url(#streamGrad)"
                  strokeWidth="1.5"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 1.1,
                    delay: i * 0.15,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    repeatDelay: 1.4,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}

            {/* Stacked question-type cards */}
            {[
              { y: 12, label: 'check' },
              { y: 52, label: 'edit' },
              { y: 92, label: 'grade' },
              { y: 132, label: 'flow' },
              { y: 172, label: 'list' },
            ].map((c, i) => (
              <motion.g
                key={i}
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 3 + i * 0.2, ease: 'easeInOut', delay: i * 0.15 }}
              >
                <rect
                  x="248"
                  y={c.y}
                  width="80"
                  height="34"
                  rx="9"
                  fill="rgba(255,255,255,0.14)"
                  stroke="rgba(255,255,255,0.32)"
                  strokeWidth="1"
                />
                <rect x="256" y={c.y + 8} width="18" height="18" rx="5" fill="rgba(255,255,255,0.92)" />
                {c.label === 'check' && (
                  <path d={`M261,${c.y + 17} l4,4 l7,-8`} stroke="#8C1D40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                )}
                {c.label === 'edit' && (
                  <path d={`M261,${c.y + 20} l9,-9 l3,3 l-9,9 z`} fill="#8C1D40" />
                )}
                {c.label === 'grade' && (
                  <text x="265" y={c.y + 20} fontFamily="monospace" fontWeight="800" fontSize="9" fill="#8C1D40">A+</text>
                )}
                {c.label === 'flow' && (
                  <path d={`M260,${c.y + 12} h8 M264,${c.y + 8} l4,4 l-4,4`} stroke="#8C1D40" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                )}
                {c.label === 'list' && (
                  <>
                    <rect x="260" y={c.y + 11} width="10" height="2" rx="1" fill="#8C1D40" />
                    <rect x="260" y={c.y + 15} width="10" height="2" rx="1" fill="#8C1D40" />
                    <rect x="260" y={c.y + 19} width="6" height="2" rx="1" fill="#8C1D40" />
                  </>
                )}
                <rect x="281" y={c.y + 10} width="38" height="4" rx="2" fill="rgba(255,255,255,0.55)" />
                <rect x="281" y={c.y + 18} width="26" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
              </motion.g>
            ))}
          </svg>

          {/* Floating badge chips */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.2 }}
            className="absolute top-2 left-1 bg-[#F8ECEF] border border-[#8C1D40]/20 text-[#8C1D40] text-[8px] font-bold px-2 py-1 rounded-full shadow-lg font-mono"
          >
            AI ENGINE
          </motion.div>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut', delay: 0.8 }}
            className="absolute bottom-2 right-1 bg-emerald-50 border border-emerald-500/15 text-emerald-700 text-[8px] font-bold px-2 py-1 rounded-full shadow-lg font-mono"
          >
            ✓ Synced
          </motion.div>
        </div>
      </div>

      {/* Dashboard Metrics Grid */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
  {cards.map((card, idx) => {
    const CardIcon = card.icon;
    return (
      <motion.div
        key={card.title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.04 }}
        className="bg-white py-3.5 px-4 rounded-[22px] flex items-center justify-between border border-[rgba(140,29,64,0.08)] shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#8C1D40]/25 transition-all duration-300 relative overflow-hidden group"
      >
        {/* Highlight Gradient Top Line */}
        <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#8C1D40]/40 opacity-0 group-hover:opacity-100 transition-opacity"></span>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[9px] text-[#6B7280] font-bold uppercase tracking-wider">
            <span>{card.title}</span>
          </div>
          <h3 className="text-[21px] font-black font-mono text-[#1D1D1F] leading-tight">{card.count}</h3>
          <span className="text-[9px] font-bold font-mono text-[#8C1D40] px-1.5 py-0.5 rounded-md bg-[#F8ECEF]">
            {card.trend}
          </span>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            background: `${card.accent}20`,
            borderColor: `${card.accent}40`,
            color: card.accent,
          }}
        >
          <CardIcon size={16} />
        </div>
      </motion.div>
    );
  })}
</div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Question Status Distribution */}
        <div className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-sm font-extrabold text-[#1D1D1F] flex items-center gap-2">
              <PieChart size={16} className="text-[#8C1D40]" />
              Question Status Distribution
            </h3>
            <span className="text-[10px] text-[#6B7280] font-mono">Current distribution</span>
          </div>

          {isQuestionStatusEmpty ? (
            <div className="h-64 flex flex-col items-center justify-center text-[#6B7280]/60">
              <Activity size={36} className="text-[#8C1D40] mb-2 animate-bounce" />
              <p className="text-xs font-semibold">No questions uploaded yet</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.charts.questionStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {stats.charts.questionStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      borderRadius: '16px',
                      border: '1px solid rgba(140,29,64,0.08)',
                      fontSize: '11px',
                      color: '#1D1D1F',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Subject-wise Question Count */}
        <div className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-sm font-extrabold text-[#1D1D1F] flex items-center gap-2">
              <BarChart3 size={16} className="text-[#8C1D40]" />
              Subject-wise Question Count
            </h3>
            <span className="text-[10px] text-[#6B7280] font-mono">Counts per course</span>
          </div>

          {isSubjectWiseEmpty ? (
            <div className="h-64 flex flex-col items-center justify-center text-[#6B7280]/60">
              <BarChart3 size={36} className="text-[#8C1D40] mb-2" />
              <p className="text-xs font-semibold">No questions assigned</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.subjectWiseQuestionCount} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="code" tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val, name, props) => [val, props.payload.subjectName || 'Count']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      borderRadius: '16px',
                      border: '1px solid rgba(140,29,64,0.08)',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" fill="#8C1D40" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Monthly Question Submission */}
        <div className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-sm font-extrabold text-[#1D1D1F] flex items-center gap-2">
              <TrendingUp size={16} className="text-[#8C1D40]" />
              Monthly Question Submission
            </h3>
            <span className="text-[10px] text-[#6B7280] font-mono">6 Month Activity</span>
          </div>

          {isMonthlySubmissionEmpty ? (
            <div className="h-64 flex flex-col items-center justify-center text-[#6B7280]/60">
              <TrendingUp size={36} className="text-[#8C1D40] mb-2" />
              <p className="text-xs font-semibold">No activity over past 6 months</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.charts.monthlyQuestionSubmission} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubmission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C74B74" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C74B74" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      borderRadius: '16px',
                      border: '1px solid rgba(140,29,64,0.08)',
                      fontSize: '11px',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#C74B74" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmission)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Exam Status Breakdown */}
        <div className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-sm font-extrabold text-[#1D1D1F] flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#8C1D40]" />
              Exam Status Breakdown
            </h3>
            <span className="text-[10px] text-[#6B7280] font-mono">Lifecycle stages</span>
          </div>

          {isExamStatusEmpty ? (
            <div className="h-64 flex flex-col items-center justify-center text-[#6B7280]/60">
              <Calendar size={36} className="text-[#8C1D40] mb-2" />
              <p className="text-xs font-semibold">No exams active or configured</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.examStatus} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="status" tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 600 }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      borderRadius: '16px',
                      border: '1px solid rgba(140,29,64,0.08)',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.charts.examStatus.map((entry, index) => (
                      <Cell key={`exam-cell-${index}`} fill={STATUS_COLORS[entry.status] || '#C74B74'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#1D1D1F] flex items-center gap-2">
            <Cpu size={16} className="text-[#8C1D40]" />
            Quick Launcher Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((act) => {
              const ActionIcon = act.icon;
              return (
                <div
                  key={act.name}
                  onClick={() => navigate(act.path)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group flex items-start gap-4 ${
                    act.highlight
                      ? 'bg-gradient-to-br from-[#8C1D40]/5 to-[#C74B74]/5 border-[#8C1D40]/25 hover:border-[#8C1D40]/40'
                      : 'bg-[#FFFDFC]/40 border-gray-100 hover:border-[#C74B74]/30 hover:bg-[#F8ECEF]/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                    act.highlight
                      ? 'bg-[#8C1D40]/10 border-[#8C1D40]/20 text-[#8C1D40]'
                      : 'bg-white border-gray-100 text-[#6B7280] group-hover:text-[#8C1D40] group-hover:bg-[#F8ECEF]'
                  }`}>
                    <ActionIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1">
                      {act.name}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0" />
                    </h4>
                    <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">{act.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activities Timeline */}
        <div className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-extrabold text-[#1D1D1F] flex items-center gap-2">
            <History size={16} className="text-[#8C1D40]" />
            Faculty Activity Trail
          </h3>

          {!stats.recentActivities || stats.recentActivities.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-8 text-[#6B7280]/55">
              <History size={32} className="text-[#C74B74] mb-1 animate-pulse" />
              <p className="text-[10px] font-semibold">No recent activity logs found</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-[220px]" style={{ scrollbarWidth: 'thin' }}>
              {stats.recentActivities.map((act) => {
                const ActivityIcon = getActivityIcon(act.type);
                return (
                  <div key={act.id} className="flex gap-3 text-[11px] items-start">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getActivityColor(act.type)}`}>
                      <ActivityIcon size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#8C1D40] block">
                        {act.category}
                      </span>
                      <p className="font-semibold text-[#1D1D1F] leading-tight mt-0.5">{act.message}</p>
                      <span className="text-[8px] font-mono text-[#6B7280] mt-0.5 block">
                        {new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;