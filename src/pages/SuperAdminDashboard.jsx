import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import {
  Building2, Users, ShieldAlert, Cpu, TrendingUp, Calendar,
  AlertCircle, Clock, BookOpen, Layers, PlusCircle, History,
  RefreshCw, Star, Terminal, ArrowRight, ShieldCheck, Activity,
  Server, HelpCircle,  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

// Custom lightweight counter animator for numbers
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);


  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end) || end === 0) {
      setDisplayValue(value);
      return;
    }
    const duration = 800; // ms
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audits/dashboard');
      if (response.data && response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard metrics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-44 bg-gray-150 rounded-[32px] w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-gray-150 rounded-[20px] w-full"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-150 rounded-[24px] w-full"></div>
          <div className="h-80 bg-gray-150 rounded-[24px] w-full"></div>
        </div>
      </div>
    );
  }

  const { counters, charts, recentActivities, recentLogins } = data;

  // Premium Burgundy/Gold/Emerald theme tones
  const COLORS = ['#10B981', '#8B1538', '#D97706'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 font-sans pb-10"
    >

      {/* 1. Header Hero Panel */}
      <motion.div
        variants={itemVariants}
        className="p-6 lg:p-8 rounded-[32px] relative overflow-hidden shadow-[0_15px_45px_rgba(139,21,56,0.12)] text-white"
        style={{
          background: 'linear-gradient(135deg, #4A0516 0%, #8B1538 60%, #A82352 100%)',
          border: '1px solid rgba(255,255,255,0.10)'
        }}
      >
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#8B1538]/30 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider border border-white/20 inline-block">
              Super Console Network
            </span>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-white/70 block">SYSTEM STATUS: ONLINE</span>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                Welcome back, {user?.name || 'Administrator'} 👋
              </h1>
            </div>
            <p className="text-xs text-white/80 font-bold max-w-lg leading-relaxed">
              Global Platform Controller. Monitor institution onboarding, administrative access clearances, audit log parameters, and global system health metrics.
            </p>
          </div>

          {/* Right side status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/10 backdrop-blur-md border border-white/5 p-4 rounded-2xl shrink-0 w-full lg:w-auto">
            <div className="text-center p-2.5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/50 block font-mono">Institutions</span>
              <span className="text-lg font-black font-mono block">{counters.totalInstitutions}</span>
            </div>
            <div className="text-center p-2.5 space-y-1 border-l border-white/10">
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/50 block font-mono">Campus Admins</span>
              <span className="text-lg font-black font-mono block">{counters.totalAdmins}</span>
            </div>
            <div className="text-center p-2.5 space-y-1 border-l border-white/10">
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/50 block font-mono">Nodes Active</span>
              <span className="text-lg font-black font-mono block text-emerald-300">{counters.activeInstitutions}</span>
            </div>
            <div className="text-center p-2.5 space-y-1 border-l border-white/10">
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/50 block font-mono">Health Node</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold block uppercase mt-1">Stable</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Operational Counters Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Institutions */}
        <div className="bg-white p-6 rounded-[20px] border border-gray-150 shadow-[0_8px_24px_rgba(139,21,56,0.04)] hover:translate-y-[-4px] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[140px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Total Campus Servers</span>
            <div className="w-9 h-9 rounded-full bg-[#8B1538]/5 text-[#8B1538] border border-[#8B1538]/10 flex items-center justify-center shadow-inner">
              <Building2 size={15} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 font-mono tracking-tight leading-none">
              <AnimatedNumber value={counters.totalInstitutions} />
            </h3>
            <span className="text-[10px] text-[#8B1538] bg-[#8B1538]/5 px-2 py-0.5 rounded-md font-bold inline-block mt-2 font-mono">
              {counters.activeInstitutions} Active Nodes
            </span>
          </div>
        </div>

        {/* Total Admins */}
        <div className="bg-white p-6 rounded-[20px] border border-gray-150 shadow-[0_8px_24px_rgba(139,21,56,0.04)] hover:translate-y-[-4px] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[140px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Platform Administrators</span>
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-inner">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 font-mono tracking-tight leading-none">
              <AnimatedNumber value={counters.totalAdmins} />
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold inline-block mt-2 font-mono">
              {counters.activeAdmins} Active Keys
            </span>
          </div>
        </div>

        {/* Active Campus Nodes */}
        <div className="bg-white p-6 rounded-[20px] border border-gray-150 shadow-[0_8px_24px_rgba(139,21,56,0.04)] hover:translate-y-[-4px] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[140px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Active Campus Nodes</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner">
              <Server size={15} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-emerald-600 font-mono tracking-tight leading-none">
              <AnimatedNumber value={counters.activeInstitutions} />
            </h3>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold inline-block mt-2 font-mono">
              ONLINE_NODES_STABLE
            </span>
          </div>
        </div>

        {/* Suspended Admins */}
        <div className="bg-white p-6 rounded-[20px] border border-gray-150 shadow-[0_8px_24px_rgba(139,21,56,0.04)] hover:translate-y-[-4px] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[140px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Suspended Admins</span>
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-inner">
              <ShieldAlert size={15} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-red-650 font-mono tracking-tight leading-none">
              <AnimatedNumber value={counters.suspendedAdmins} />
            </h3>
            <span className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-bold inline-block mt-2 font-mono">
              BLOCK_LISTED_ACCOUNTS
            </span>
          </div>
        </div>

      </motion.div>

      {/* 3. Quick Actions Panel */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] border border-[#F0D6DD]/60 shadow-[0_12px_30px_rgba(139,21,56,0.05)] space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="text-sm font-extrabold text-[#8B1538] flex items-center gap-2">
            <Terminal size={16} />
            Super Administrator Actions
          </h3>
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">Interactive Controller</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/super-admin/institutions?action=new"
            className="p-4 rounded-2xl border border-gray-150 hover:border-[#8B1538]/30 hover:bg-gray-50 flex items-center gap-3 transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#8B1538]/5 text-[#8B1538] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <PlusCircle size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Add Campus Node</p>
              <p className="text-[9px] text-gray-400 font-semibold">Onboard new servers</p>
            </div>
          </Link>
          <Link
            to="/super-admin/admins?action=new"
            className="p-4 rounded-2xl border border-gray-150 hover:border-[#8B1538]/30 hover:bg-gray-50 flex items-center gap-3 transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <PlusCircle size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Create Admin Key</p>
              <p className="text-[9px] text-gray-400 font-semibold">Grant admin clearance</p>
            </div>
          </Link>
          <Link
            to="/super-admin/audit-logs"
            className="p-4 rounded-2xl border border-gray-150 hover:border-[#8B1538]/30 hover:bg-gray-50 flex items-center gap-3 transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <History size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Audit Dashboard</p>
              <p className="text-[9px] text-gray-400 font-semibold">Track global transactions</p>
            </div>
          </Link>
          <Link
            to="/super-admin/settings"
            className="p-4 rounded-2xl border border-gray-150 hover:border-[#8B1538]/30 hover:bg-gray-50 flex items-center gap-3 transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Server size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Global Config</p>
              <p className="text-[9px] text-gray-400 font-semibold">Core network configuration</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* 4. Recharts Visual Analytics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Growth Curve Line Chart */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#EADFE3]/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#8B1538] flex items-center gap-2">
                <TrendingUp size={15} />
                Institution Onboarding Growth
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Cumulative growth curve of onboarded universities
              </p>
            </div>
            <span className="text-[9px] font-mono font-bold px-2.5 py-1 bg-[#FDF3F6] text-[#8B1538] rounded-full border border-[#F0D6DD]">
              AY {new Date().getFullYear()}-{(new Date().getFullYear() + 1).toString().slice(-2)}
            </span>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.growthTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B1538" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B1538" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EADFE3" />
                <XAxis dataKey="name" stroke="#8B1538" opacity={0.6} tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis stroke="#8B1538" opacity={0.6} tick={{ fontSize: 10, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.96)',
                    border: '1px solid rgba(139,21,56,0.12)',
                    borderRadius: '16px',
                    fontSize: '11px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                  }}
                />
                <Area type="monotone" dataKey="Institutions" stroke="#8B1538" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie ratio distribution active vs inactive */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#EADFE3]/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#8B1538] flex items-center gap-2">
                <Cpu size={15} />
                Clearance Ratio
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Status distribution of campus nodes
              </p>
            </div>
          </div>
          <div className="h-44 w-full text-xs flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.96)',
                    border: '1px solid rgba(139,21,56,0.12)',
                    borderRadius: '16px',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-[10px] font-mono font-bold text-gray-500 border-t border-gray-50 pt-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Active ({counters.activeInstitutions})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B1538]"></span>
              <span>Inactive ({counters.inactiveInstitutions})</span>
            </div>
          </div>
        </div>

        {/* Bar chart - admin distribution */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EADFE3]/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#8B1538] flex items-center gap-2">
                <BarChart3 size={15} />
                Admin Density
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Distribution of provisioned administrator roles per university code node
              </p>
            </div>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            {charts.adminDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 italic">No density mapping data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.adminDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EADFE3" />
                  <XAxis dataKey="name" stroke="#8B1538" opacity={0.6} tick={{ fontSize: 9, fontWeight: 600 }} />
                  <YAxis stroke="#8B1538" opacity={0.6} tick={{ fontSize: 9, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.96)',
                      border: '1px solid rgba(139,21,56,0.12)',
                      borderRadius: '16px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="admins" fill="#8B1538" radius={[6, 6, 0, 0]}>
                    {charts.adminDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8B1538' : '#D97706'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </motion.div>

      {/* 5. Logs tables - Activities and Logins */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Audit Activities */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EADFE3]/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#8B1538] flex items-center gap-2">
                <History size={15} />
                Recent Global Activities
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Audit trail of recent configuration edits across campus nodes
              </p>
            </div>
            <Link to="/super-admin/audit-logs" className="text-[10px] font-bold text-[#8B1538] hover:underline flex items-center gap-0.5">
              Logs Drawer <ArrowRight size={10} />
            </Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-gray-400 italic text-xs">No recent transaction logs.</div>
            ) : (
              recentActivities.map((log) => (
                <div key={log._id} className="flex gap-4 p-3 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-colors text-xs font-semibold">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 rounded text-[9px] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="w-0.5 flex-1 bg-gray-100 my-1"></span>
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-800 font-bold truncate">{log.user ? log.user.name : 'System Controller'}</span>
                      <span className="px-2 py-0.5 bg-[#FDF3F6] border border-[#8B1538]/10 text-[#8B1538] rounded text-[8px] font-mono tracking-wider uppercase font-bold shrink-0">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed truncate font-medium" title={log.details}>
                      {log.details}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Login History */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EADFE3]/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#8B1538] flex items-center gap-2">
                <Clock size={15} />
                Recent Login Events
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Security access history logs including IP addresses and clients
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-500/10 text-emerald-700 text-[9px] font-mono font-bold">
              Access Monitoring
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {recentLogins.length === 0 ? (
              <div className="py-12 text-center text-gray-400 italic text-xs">No login events captured.</div>
            ) : (
              recentLogins.map((log) => (
                <div key={log._id} className="flex gap-4 p-3 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-colors text-xs font-semibold">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 rounded text-[9px] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="w-0.5 flex-1 bg-gray-100 my-1"></span>
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-800 font-bold truncate">{log.user ? log.user.name : 'Unknown User'}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-500/10 text-emerald-700 rounded text-[8px] font-mono font-bold shrink-0">
                        {log.ipAddress || '127.0.0.1'}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono font-bold text-gray-400 truncate mt-0.5" title={log.userAgent}>
                      Client: {log.userAgent || 'Unknown client browser'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </motion.div>

    </motion.div>
  );
};

export default SuperAdminDashboard;
