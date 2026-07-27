import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Building2, BookOpen, FileText, UserCheck, GraduationCap, ScrollText,
  Database, Zap, Calendar, AlertCircle, Sparkles, TrendingUp,
  Activity, Brain, ArrowRight, CheckCircle2, Clock, BarChart3,
  Users, ChevronRight, Bell, Star, Settings,
} from 'lucide-react';

/* ─── Color palette ───────────────────────────────────────────────── */
const WINE  = '#8B1E3F';
const WINE2 = '#A62E52';
const WINE3 = '#C04B73';
const WINE4 = '#E08BAA';
const WINE_DARK  = '#952449'; // wine — used ONLY for the hero banner now
const WINE_DARK2 = '#B84E71'; // lighter wine for hero gradient
const WINE_TINT  = '#FDF0F4'; // very light tint for card backgrounds
const CHART = [WINE, WINE2, WINE3, WINE4, '#F2BFCF'];

/* ─── Animated counter ────────────────────────────────────────────── */
const Counter = ({ to, comma = false }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const n = parseFloat(String(to).replace(/,/g, ''));
    let start = 0;
    const step = n / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= n) { setVal(n); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 1200 / 60);
    return () => clearInterval(t);
  }, [inView, to]);

  return <span ref={ref}>{comma ? val.toLocaleString() : val}</span>;
};

/* ─── Network pulse decoration (hero background) ──────────────────
   Static hub-and-spoke layout — nothing rotates. Small pulses travel
   from the hub out to each node, and the hub has a soft breathing
   ring, like a live system quietly pushing data outward. */
const NetworkPulse = () => {
  const shouldReduceMotion = useReducedMotion();
  const hub = { x: 150, y: 95 };
  const nodes = [
    { x: 55,  y: 35  },
    { x: 240, y: 45  },
    { x: 40,  y: 150 },
    { x: 220, y: 155 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg className="absolute -right-4 -top-8" width="300" height="220" viewBox="0 0 300 220">
        {/* connector lines */}
        {nodes.map((n, i) => (
          <line key={`l-${i}`} x1={hub.x} y1={hub.y} x2={n.x} y2={n.y}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        ))}

        {/* outer nodes */}
        {nodes.map((n, i) => (
          <circle key={`n-${i}`} cx={n.x} cy={n.y} r="3" fill="rgba(255,255,255,0.45)" />
        ))}

        {/* pulses travelling from hub to each node */}
        {!shouldReduceMotion && nodes.map((n, i) => (
          <motion.circle
            key={`p-${i}`}
            r="2.5"
            fill="#fff"
            animate={{
              cx: [hub.x, n.x],
              cy: [hub.y, n.y],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 1.4,
              delay: i * 0.55,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* hub — soft breathing ring + solid center */}
        <motion.circle
          cx={hub.x} cy={hub.y} r="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"
          style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}
          animate={shouldReduceMotion ? {} : { scale: [1, 1.9], opacity: [0.6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
        <circle cx={hub.x} cy={hub.y} r="5" fill="#fff" />
      </svg>
    </div>
  );
};

/* ─── Custom recharts tooltip ─────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[rgba(139,30,63,0.10)] rounded-[12px] px-3 py-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] text-[12px]">
      <p className="font-semibold text-[#111111] mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[#6B7280]">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-[#111111]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Fade-in stagger variants ────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Shared chart axis style ─────────────────────────────────────── */
const AX = { stroke: '#D1D5DB', fontSize: 11, tickLine: false };
const GRID = { strokeDasharray: '4 4', vertical: false, stroke: '#F3F4F6' };

/* ═══════════════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = user?.name || 'Administrator';

  /* ── Chart data (unchanged from original) ───────────────────────── */
  const perfData = [
    { name: 'Sem 1', avg: 74, top: 92 },
    { name: 'Sem 2', avg: 78, top: 95 },
    { name: 'Sem 3', avg: 81, top: 94 },
    { name: 'Sem 4', avg: 80, top: 97 },
    { name: 'Sem 5', avg: 86, top: 99 },
  ];
  const deptData = [
    { name: 'CS',  students: 340, pass: 94 },
    { name: 'EE',  students: 280, pass: 89 },
    { name: 'ME',  students: 210, pass: 84 },
    { name: 'CE',  students: 180, pass: 81 },
    { name: 'BT',  students: 230, pass: 91 },
  ];
  const monthData = [
    { name: 'Jan', n: 12 }, { name: 'Feb', n: 18 }, { name: 'Mar', n: 32 },
    { name: 'Apr', n: 45 }, { name: 'May', n: 26 }, { name: 'Jun', n: 52 },
  ];
  const donutData = [{ name: 'Pass', v: 84 }, { name: 'Fail', v: 16 }];
  const aiData = [
    { name: 'CS', q: 480 }, { name: 'EE', q: 260 }, { name: 'ME', q: 140 },
    { name: 'CE', q: 95 },  { name: 'BT', q: 320 },
  ];
  const growthData = [
    { name: 'Jan', t: 4200 }, { name: 'Feb', t: 5050 }, { name: 'Mar', t: 6100 },
    { name: 'Apr', t: 7200 }, { name: 'May', t: 7850 }, { name: 'Jun', t: 8450 },
  ];

  /* ── Stat cards ─────────────────────────────────────────────────── */
  const stats = [
    { label: 'Departments',    val: 8,     comma: false, icon: Building2,    sub: '+1 this term',         accent: WINE },
    { label: 'Courses',        val: 24,    comma: false, icon: BookOpen,     sub: 'Active this semester', accent: WINE },
    { label: 'Subjects',       val: 142,   comma: false, icon: FileText,     sub: '+12 new',              accent: WINE },
    { label: 'Staff',          val: 56,    comma: false, icon: UserCheck,    sub: '2 pending approval',   accent: WINE },
    { label: 'Students',       val: 1240,  comma: true,  icon: GraduationCap,sub: '+142 registered',      accent: WINE },
    { label: 'Exams',          val: 48,    comma: false, icon: ScrollText,   sub: '12 scheduled',         accent: WINE },
    { label: 'Question Bank',  val: 8450,  comma: true,  icon: Database,     sub: '+850 AI generated',    accent: WINE },
    { label: 'Live Now',       val: 3,     comma: false, icon: Zap,          sub: 'Proctoring active',    accent: '#10B981', live: true },
    { label: 'Upcoming',       val: 12,    comma: false, icon: Calendar,     sub: 'Next exam tomorrow',   accent: '#D97706' },
    { label: 'Pending Review', val: 4,     comma: false, icon: AlertCircle,  sub: 'Needs attention',      accent: '#DC2626', alert: true },
  ];

  /* ── Quick actions ──────────────────────────────────────────────── */
  const actions = [
    { label: 'Create Dept',    path: '/admin/departments', icon: Building2    },
    { label: 'Add Course',     path: '/admin/courses',     icon: BookOpen     },
    { label: 'Add Subject',    path: '/admin/subjects',    icon: FileText     },
    { label: 'Add Staff',      path: '/admin/staff',       icon: UserCheck    },
    { label: 'Import Students',path: '/admin/students',    icon: GraduationCap},
    { label: 'AI Questions',   path: '/admin/ai-center',   icon: Sparkles     },
    { label: 'Create Exam',    path: '/admin/exams',       icon: ScrollText   },
    { label: 'View Reports',   path: '/admin/reports',     icon: BarChart3    },
  ];

  const go = (label, path) => { toast.success(`Opening ${label}…`); navigate(path); };

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="page space-y-8">

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="p-8 rounded-[24px] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${WINE_DARK} 0%, ${WINE_DARK2} 100%)`,
          boxShadow: '0 12px 32px -8px rgba(149,36,73,0.35)',
        }}
      >
        {/* Subtle dot bg */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Network pulse decoration */}
        <NetworkPulse />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-[7px] mb-3" style={{ background: '#FFFFFF', color: WINE_DARK }}>
              <Brain size={11} />
              Admin Console
            </div>
            <h1 className="text-[2.25rem] font-black text-white leading-[1.1] tracking-tight">
              Welcome back, <span style={{ color: '#FFD166' }}>{name}</span>
            </h1>
            <p className="mt-2 text-[14.5px] text-white/70 max-w-lg leading-relaxed">
              Manage your institution with AI-powered examination analytics.
            </p>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Live Exams',   value: '3',    color: '#6EE7B7', bg: 'rgba(16,185,129,0.14)', border: 'rgba(110,231,183,0.35)', dot: true },
              { label: 'Active Now',   value: '847',  color: '#F2BFCF', bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.18)' },
              { label: 'Pending',      value: '4',    color: '#FCA5A5', bg: 'rgba(248,113,113,0.14)', border: 'rgba(252,165,165,0.35)' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="flex flex-col items-start px-4 py-2.5 rounded-[14px] border"
                style={{ background: s.bg, borderColor: s.border }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {s.dot && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse-soft" />}
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.color, opacity: 0.85 }}>
                    {s.label}
                  </span>
                </div>
                <span className="text-[20px] font-black font-['Inter'] leading-none" style={{ color: s.color }}>
                  {s.value}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══ STATS ═════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">
          Institutional Overview
        </h2>
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-[18px] py-3 px-3.5 bg-white border border-[rgba(139,30,63,0.08)]"
                style={{
                  boxShadow: '0 4px 14px -6px rgba(17,17,17,0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center"
                    style={{ background: `${s.accent}14`, color: s.accent }}
                  >
                    <Icon size={14} />
                  </div>
                  {s.live && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#059669] bg-[rgba(16,185,129,0.12)] px-1.5 py-0.5 rounded-[5px]">
                      <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse-soft" />
                      LIVE
                    </span>
                  )}
                  {s.alert && (
                    <span className="text-[9px] font-bold text-[#DC2626] bg-[rgba(220,38,38,0.10)] px-1.5 py-0.5 rounded-[5px]">
                      !!
                    </span>
                  )}
                  {!s.live && !s.alert && s.accent === WINE && (
                    <TrendingUp size={11} className="text-[#059669] opacity-70" />
                  )}
                </div>

                <p className="text-[23px] font-black leading-none mb-0.5" style={{ color: '#111111', letterSpacing: '-0.02em' }}>
                  <Counter to={s.val} comma={s.comma} />
                </p>
                <p className="text-[11.5px] font-semibold text-[#374151] mb-0">{s.label}</p>
                <p className="text-[10px] text-[#9CA3AF] truncate">{s.sub}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ══ CHARTS ════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">
          Analytics & Performance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* 1 — Student performance area */}
          {[
            {
              title: 'Student Performance',
              sub: 'Avg vs. top scores by semester',
              icon: TrendingUp,
              chart: (
                <AreaChart data={perfData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={WINE}  stopOpacity={0.15}/>
                      <stop offset="100%" stopColor={WINE}  stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={WINE3} stopOpacity={0.12}/>
                      <stop offset="100%" stopColor={WINE3} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="name" {...AX} />
                  <YAxis {...AX} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="avg" name="Average" stroke={WINE}  fill="url(#ga)" strokeWidth={2} dot={{ r: 3, fill: WINE, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="top" name="Top Score" stroke={WINE3} fill="url(#gb)" strokeWidth={2} dot={{ r: 3, fill: WINE3, strokeWidth: 0 }} />
                </AreaChart>
              ),
            },
            {
              title: 'Department Overview',
              sub: 'Students enrolled & pass rate',
              icon: Building2,
              chart: (
                <BarChart data={deptData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="name" {...AX} />
                  <YAxis {...AX} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="students" name="Students" fill={WINE}  radius={[5,5,0,0]} maxBarSize={22} />
                  <Bar dataKey="pass"     name="Pass %"   fill={WINE3} radius={[5,5,0,0]} maxBarSize={22} />
                </BarChart>
              ),
            },
            {
              title: 'Monthly Exam Volume',
              sub: 'Assessments conducted per month',
              icon: ScrollText,
              chart: (
                <LineChart data={monthData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="name" {...AX} />
                  <YAxis {...AX} />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="n" name="Exams" stroke={WINE} strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', stroke: WINE, strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: WINE }} />
                </LineChart>
              ),
            },
            {
              title: 'Pass / Fail Ratio',
              sub: 'Last 100 examinations',
              icon: CheckCircle2,
              isDonut: true,
            },
            {
              title: 'AI Question Generation',
              sub: 'Questions generated per department',
              icon: Sparkles,
              chart: (
                <BarChart data={aiData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="name" {...AX} />
                  <YAxis {...AX} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="q" name="AI Questions" radius={[5,5,0,0]} maxBarSize={28}>
                    {aiData.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                  </Bar>
                </BarChart>
              ),
            },
            {
              title: 'Question Bank Growth',
              sub: 'Validated questions over 6 months',
              icon: Database,
              chart: (
                <AreaChart data={growthData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={WINE} stopOpacity={0.15}/>
                      <stop offset="100%" stopColor={WINE} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="name" {...AX} />
                  <YAxis {...AX} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="t" name="Questions" stroke={WINE} fill="url(#gg)" strokeWidth={2.5}
                    dot={{ r: 3, fill: WINE, strokeWidth: 0 }} />
                </AreaChart>
              ),
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="card-flat rounded-[20px] p-6"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-[14px] font-bold text-[#111111]">{c.title}</h3>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">{c.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-[9px] bg-[#FDF0F4] flex items-center justify-center text-[#8B1E3F]">
                  <c.icon size={14} />
                </div>
              </div>

              {c.isDonut ? (
                <div className="h-52 flex items-center gap-6">
                  <div className="relative w-[160px] flex-shrink-0 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                          paddingAngle={3} dataKey="v">
                          <Cell fill={WINE} />
                          <Cell fill="#F2BFCF" />
                        </Pie>
                        <Tooltip content={<ChartTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[22px] font-black text-[#8B1E3F] leading-none">84%</p>
                      <p className="text-[10px] text-[#9CA3AF] font-medium mt-0.5">pass rate</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    {[
                      { label: 'Passed', pct: '84%', color: WINE, bg: '#FDF0F4' },
                      { label: 'Failed', pct: '16%', color: '#9CA3AF', bg: '#F9FAFB' },
                    ].map(d => (
                      <div key={d.label} className="p-3 rounded-[12px] border border-[rgba(139,30,63,0.07)]" style={{ background: d.bg }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: d.color }}>{d.label}</p>
                        <p className="text-[20px] font-black leading-none" style={{ color: d.color }}>{d.pct}</p>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">of candidates</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    {c.chart}
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══ WIDGETS ═══════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">
          Control Center
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-flat rounded-[20px] p-6"
          >
            <h3 className="text-[14px] font-bold text-[#111111] mb-1">Quick Actions</h3>
            <p className="text-[12px] text-[#9CA3AF] mb-5">Direct shortcuts to key features</p>
            <div className="grid grid-cols-2 gap-2">
              {actions.map(a => {
                const Icon = a.icon;
                return (
                  <motion.button
                    key={a.label}
                    onClick={() => go(a.label, a.path)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-[12px] bg-[#FAFAFA] border border-[rgba(139,30,63,0.07)] hover:bg-[#FDF0F4] hover:border-[rgba(139,30,63,0.15)] transition-all duration-150 group"
                  >
                    <div className="w-8 h-8 rounded-[9px] bg-white border border-[rgba(139,30,63,0.10)] flex items-center justify-center text-[#8B1E3F] shadow-sm group-hover:bg-[#8B1E3F] group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_2px_8px_rgba(139,30,63,0.25)] transition-all duration-150">
                      <Icon size={14} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#374151] text-center leading-tight group-hover:text-[#8B1E3F] transition-colors">{a.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Upcoming exams */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-flat rounded-[20px] p-6"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-bold text-[#111111]">Upcoming Exams</h3>
              <button onClick={() => navigate('/admin/exams')} className="flex items-center gap-1 text-[11px] font-semibold text-[#8B1E3F] hover:opacity-75 transition-opacity">
                All <ChevronRight size={11} />
              </button>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mb-5">Scheduled assessments queue</p>
            <div className="space-y-2.5">
              {[
                { title: 'Distributed Systems Final', code: 'CSE-402', date: 'Jul 18, 10:00 AM', label: 'Live Soon',  labelClass: 'badge-green' },
                { title: 'Microprocessors Lab',       code: 'EE-304',  date: 'Jul 20, 02:00 PM', label: '3 days',    labelClass: 'badge-amber' },
                { title: 'AI & ML Quiz',              code: 'CSE-512', date: 'Jul 22, 11:30 AM', label: '5 days',    labelClass: 'badge-wine'  },
              ].map((e, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between p-3 rounded-[12px] bg-[#FAFAFA] border border-[rgba(139,30,63,0.06)] hover:border-[rgba(139,30,63,0.12)] transition-all duration-150"
                >
                  <div className="min-w-0 mr-3">
                    <p className="text-[12.5px] font-semibold text-[#111111] truncate">{e.title}</p>
                    <p className="text-[10.5px] text-[#9CA3AF] mt-0.5 font-medium">{e.code} · {e.date}</p>
                  </div>
                  <span className={`badge ${e.labelClass} flex-shrink-0`}>{e.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Today's schedule */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-flat rounded-[20px] p-6"
          >
            <h3 className="text-[14px] font-bold text-[#111111] mb-1">Today's Schedule</h3>
            <p className="text-[12px] text-[#9CA3AF] mb-5">Academic calendar for today</p>
            <div className="space-y-2">
              {[
                { time: '09:00 – 10:30', title: 'CSE Proctoring Active', type: 'Proctoring', dot: '#10B981' },
                { time: '11:00 – 12:00', title: 'Syllabi Revision Panel', type: 'Meeting',   dot: WINE     },
                { time: '14:00 – 16:00', title: 'AI Question Validation', type: 'Sync',      dot: WINE2    },
                { time: '16:30',         title: 'System DB Backup',       type: 'Scheduled', dot: '#9CA3AF'},
              ].map((s, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-[#FAFAFA] border border-[rgba(139,30,63,0.06)]"
                  style={{ borderLeft: `3px solid ${s.dot}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{s.time}</p>
                    <p className="text-[12.5px] font-semibold text-[#111111] truncate mt-0.5">{s.title}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[5px] flex-shrink-0"
                    style={{ background: `${s.dot}15`, color: s.dot }}>
                    {s.type}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-flat rounded-[20px] p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-[7px] bg-[#8B1E3F] flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <h3 className="text-[14px] font-bold text-[#111111]">AI Insights</h3>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mb-5">Gemini real-time diagnostics</p>
            <div className="space-y-3">
              <div className="p-3.5 rounded-[12px] bg-[#FDF0F4] border border-[rgba(139,30,63,0.10)]">
                <div className="flex items-start gap-2">
                  <Brain size={13} className="text-[#8B1E3F] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-[#8B1E3F] mb-0.5">Question Bank Diversity</p>
                    <p className="text-[11.5px] text-[#6B7280] leading-relaxed">
                      CS-101 shows lower diversity in hard sections. Generate 15 more algorithmic questions.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#ECFDF5] border border-[#A7F3D0]">
                <div className="flex items-start gap-2">
                  <TrendingUp size={13} className="text-[#059669] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-[#059669] mb-0.5">AI Efficiency +24%</p>
                    <p className="text-[11.5px] text-[#6B7280] leading-relaxed">
                      Syllabus parsing speed improved after the latest model validation update.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-flat rounded-[20px] p-6"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-bold text-[#111111]">Recent Activity</h3>
              <button onClick={() => navigate('/admin/activity-logs')} className="flex items-center gap-1 text-[11px] font-semibold text-[#8B1E3F] hover:opacity-75 transition-opacity">
                All <ChevronRight size={11} />
              </button>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mb-5">System action log</p>
            <div className="space-y-3">
              {[
                { text: 'Dr. Harris created 50 AI questions for CSE-302', t: '10m ago', icon: Sparkles,     c: WINE },
                { text: 'Registrar imported 120 students for Semester 1', t: '1h ago',  icon: GraduationCap, c: WINE2 },
                { text: 'Exam paper validated for Computer Networks',      t: '3h ago',  icon: CheckCircle2,  c: '#059669' },
                { text: 'System settings updated: Camera mode enabled',   t: '5h ago',  icon: Settings,      c: '#9CA3AF' },
              ].map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-[rgba(139,30,63,0.05)] last:border-0 last:pb-0">
                    <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${a.c}12`, color: a.c }}>
                      <Icon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] text-[#374151] font-medium leading-snug">{a.text}</p>
                    </div>
                    <span className="text-[10.5px] text-[#9CA3AF] font-medium flex-shrink-0 mt-0.5">{a.t}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-flat rounded-[20px] p-6"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-bold text-[#111111]">Notifications</h3>
              <button onClick={() => navigate('/admin/notifications')} className="flex items-center gap-1 text-[11px] font-semibold text-[#8B1E3F] hover:opacity-75 transition-opacity">
                All <ChevronRight size={11} />
              </button>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mb-5">Important alerts & flags</p>
            <div className="space-y-2.5">
              {/* Alert */}
              <motion.div whileHover={{ x: 2 }}
                className="flex items-center justify-between p-3 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-[8px] bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] flex-shrink-0">
                    <AlertCircle size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#DC2626]">4 staff accounts need approval</p>
                    <p className="text-[10.5px] text-[#EF4444]/70 font-medium">Manual review required</p>
                  </div>
                </div>
                <button onClick={() => navigate('/admin/staff')}
                  className="flex-shrink-0 text-[11px] font-bold text-[#DC2626] bg-[#FEE2E2] hover:bg-[#FECACA] px-2.5 py-1 rounded-[7px] transition-colors ml-2">
                  Review
                </button>
              </motion.div>

              <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-[#FFFBEB] border border-[#FDE68A]">
                <div className="w-7 h-7 rounded-[8px] bg-[#FEF3C7] flex items-center justify-center text-[#D97706] flex-shrink-0">
                  <Clock size={13} />
                </div>
                <p className="text-[12px] font-semibold text-[#D97706]">CSE-304 review deadline is today</p>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)]">
                <div className="w-7 h-7 rounded-[8px] bg-[#FAD9E3] flex items-center justify-center text-[#8B1E3F] flex-shrink-0">
                  <Star size={13} />
                </div>
                <p className="text-[12px] font-semibold text-[#8B1E3F]">Production bundle validated ✓</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;