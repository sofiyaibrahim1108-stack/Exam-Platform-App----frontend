import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, PlayCircle, GraduationCap, Bell, User,
  HelpCircle, LogOut, School, Menu, Check, BellOff, AlertCircle,
  Settings, MessageSquare, ChevronRight, Zap, X, Sparkles, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { StudentProfileProvider, useStudentProfile } from '../contexts/StudentProfileContext';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ─── Navigation Structure ───────────────────────────────────────── */


/* ─── Breadcrumb helper ──────────────────────────────────────────── */
const getBreadcrumb = (pathname) =>
  pathname.split('/').filter(Boolean).map((p) =>
    p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')
  );

/* ─── Avatar ────────────────────────────────────────────────────── */
const Avatar = ({ photoUrl, name, size = 8, ring = true }) => {
  const initials = (name || 'S').charAt(0).toUpperCase();
  return (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-xs
        ${ring ? 'ring-2 ring-[#8B1E3F]/20' : ''}`}
      style={{ background: 'linear-gradient(135deg,#7A001F,#A11D42)' }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size <= 7 ? '11px' : '14px' }}>{initials}</span>
      )}
    </div>
  );
};

const SidebarContent = ({ location, onClose, user, onLogout, unreadCount }) => {
  const { photoUrl } = useStudentProfile();
  const [aiCenterExpanded, setAiCenterExpanded] = useState(
    location.pathname.startsWith('/student/ai-center')
  );

  useEffect(() => {
    if (location.pathname.startsWith('/student/ai-center')) {
      setAiCenterExpanded(true);
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-[rgba(122,0,31,0.08)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7A001F,#9D174D)' }}>
            <School size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-bold text-[#111111] leading-tight truncate">
              Oxford Global
            </h1>
            <p className="text-[10px] font-medium text-[#9CA3AF] mt-0.5">Student Portal</p>
          </div>
        </div>
        {/* AI badge */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#059669] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          AI Proctoring Active
          <span className="ml-auto text-[10px] text-[#9CA3AF] font-normal">Gemini 2.5</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3">
        <div className="space-y-0.5">
          {/* Dashboard */}
          <Link
            to="/student/dashboard"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname === '/student/dashboard'
                ? 'text-[#7A001F] font-semibold'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname === '/student/dashboard' && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname === '/student/dashboard'
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <LayoutDashboard size={13} />
            </span>
            <span className="relative z-10 flex-1">Dashboard</span>
          </Link>

          {/* Upcoming Exams */}
          <Link
            to="/student/upcoming"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname === '/student/upcoming'
                ? 'text-[#7A001F] font-semibold'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname === '/student/upcoming' && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname === '/student/upcoming'
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <Calendar size={13} />
            </span>
            <span className="relative z-10 flex-1">Upcoming Exams</span>
          </Link>

          {/* Live Exams */}
          <Link
            to="/student/live"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname === '/student/live'
                ? 'text-[#7A001F] font-semibold'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname === '/student/live' && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname === '/student/live'
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <PlayCircle size={13} />
            </span>
            <span className="relative z-10 flex-1">Live Exams</span>
          </Link>

          {/* Ask EduAI Link */}
          <Link
            to="/student/ai-center/tutor"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname.startsWith('/student/ai-center')
                ? 'text-[#7A001F] font-semibold bg-[rgba(122,0,31,0.05)]'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname.startsWith('/student/ai-center') && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname.startsWith('/student/ai-center')
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <Sparkles size={13} />
            </span>
            <span className="relative z-10 flex-1">Ask EduAI</span>
          </Link>

          {/* Results (Completed Exams) */}
          <Link
            to="/student/completed"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname === '/student/completed'
                ? 'text-[#7A001F] font-semibold'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname === '/student/completed' && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname === '/student/completed'
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <GraduationCap size={13} />
            </span>
            <span className="relative z-10 flex-1">Results</span>
          </Link>

          {/* Notifications */}
          <Link
            to="/student/notifications"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname === '/student/notifications'
                ? 'text-[#7A001F] font-semibold'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname === '/student/notifications' && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname === '/student/notifications'
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <Bell size={13} />
            </span>
            <span className="relative z-10 flex-1">Notifications</span>
            {unreadCount > 0 && (
              <span className="relative z-10 ml-auto bg-[#7A001F] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link
            to="/student/profile"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname === '/student/profile'
                ? 'text-[#7A001F] font-semibold'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname === '/student/profile' && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname === '/student/profile'
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <User size={13} />
            </span>
            <span className="relative z-10 flex-1">Profile</span>
          </Link>

          {/* Settings */}
          <Link
            to="/student/settings"
            onClick={onClose}
            className={`relative flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
              location.pathname === '/student/settings'
                ? 'text-[#7A001F] font-semibold'
                : 'text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)]'
            }`}
          >
            {location.pathname === '/student/settings' && (
              <motion.div
                layoutId="studentActiveNav"
                className="absolute inset-0 bg-[rgba(122,0,31,0.07)] rounded-[10px]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-[7px] transition-all duration-150 ${
              location.pathname === '/student/settings'
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)]'
            }`}>
              <Settings size={13} />
            </span>
            <span className="relative z-10 flex-1">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-[rgba(122,0,31,0.08)] space-y-0.5">
        <Link
          to="/student/support"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium text-[#6B7280] hover:text-[#7A001F] hover:bg-[rgba(122,0,31,0.05)] transition-all duration-150 group"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-[7px] text-[#9CA3AF] group-hover:text-[#7A001F] group-hover:bg-[rgba(122,0,31,0.08)] transition-all duration-150">
            <HelpCircle size={13} />
          </span>
          Help &amp; Support
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 group"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-[7px] text-red-400 group-hover:bg-red-100 transition-all duration-150">
            <LogOut size={13} />
          </span>
          Sign Out
        </button>

        {/* User card */}
        <div className="mt-2 flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.06)]">
          <Avatar photoUrl={photoUrl} name={user?.name} size={7} ring={false} />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[#111111] truncate">{user?.name || 'Student'}</p>
            <p className="text-[10px] text-[#9CA3AF] truncate font-medium">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Layout ────────────────────────────────────────────────── */
const StudentLayoutInner = () => {
  const { user, logout } = useAuth();
  const { photoUrl, refreshProfile } = useStudentProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /* Fetch profile photo once on mount */
  useEffect(() => {
    refreshProfile();
  }, []);

  /* Fetch notifications */
  const fetchNotifications = async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      if (nRes.data?.success) setNotifications(nRes.data.data || []);
      if (cRes.data?.success) setUnreadCount(cRes.data.data.unreadCount || 0);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 15000);
    return () => clearInterval(iv);
  }, []);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      toast.error('Could not mark as read.');
    }
  };

  const handleLogout = async () => {
    try {
      const res = await api.get('/exams/student/active-attempt');
      if (res.data?.success && res.data?.hasActiveExam) {
        toast.error('Cannot logout while an exam is in progress.', { duration: 5000 });
        return;
      }
    } catch {
      // proceed anyway
    }
    await logout();
    navigate('/login');
  };

  const breadcrumbs = getBreadcrumb(location.pathname);

  const sidebarProps = {
    location,
    onClose: () => setMobileOpen(false),
    user,
    onLogout: handleLogout,
    unreadCount,
  };

  return (
    <div className="bg-[#FFFDFC] text-[#1D1D1F] font-sans h-screen overflow-hidden flex relative">

      {/* ── Desktop Sidebar ───────────────────────────── */}
      <aside className="hidden lg:flex h-screen w-60 border-r border-[rgba(122,0,31,0.08)] bg-white flex-col z-30">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile Sidebar Drawer ─────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 h-full w-60 bg-white border-r border-[rgba(122,0,31,0.08)] z-50 flex flex-col"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={16} />
              </button>
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ──────────────────────────────── */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">

        {/* ── Top Navbar ──────────────────────────────── */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 lg:px-8 py-3.5 bg-white/90 backdrop-blur-md border-b border-[rgba(122,0,31,0.07)] shadow-[0_1px_8px_rgba(122,0,31,0.04)]">
          {/* Left — mobile hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-[8px] hover:bg-[rgba(122,0,31,0.05)] text-[#6B7280] transition-colors"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#9CA3AF]">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={b}>
                  {i > 0 && <ChevronRight size={12} className="opacity-40" />}
                  <span className={i === breadcrumbs.length - 1 ? 'text-[#7A001F] font-semibold' : ''}>
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right — status + notifications + profile */}
          <div className="flex items-center gap-3">
            {/* Session badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(122,0,31,0.05)] border border-[rgba(122,0,31,0.08)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-semibold text-[#7A001F] tracking-wide">Secured Session</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2 rounded-[8px] hover:bg-[rgba(122,0,31,0.05)] text-[#6B7280] hover:text-[#7A001F] transition-colors"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-[14px] h-[14px] bg-[#7A001F] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div onClick={() => setNotifOpen(false)} className="fixed inset-0 z-40" />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-[rgba(122,0,31,0.10)] shadow-[0_16px_40px_rgba(122,0,31,0.12)] overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-[rgba(122,0,31,0.08)] flex items-center justify-between bg-[rgba(122,0,31,0.03)]">
                        <div>
                          <p className="text-[12px] font-bold text-[#7A001F]">Notifications</p>
                          {unreadCount > 0 && (
                            <p className="text-[10px] text-[#9CA3AF] font-medium">{unreadCount} unread</p>
                          )}
                        </div>
                        <Link
                          to="/student/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="text-[10px] font-semibold text-[#7A001F] hover:underline"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-[rgba(122,0,31,0.05)]">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <BellOff size={22} className="text-gray-200 mx-auto mb-2" />
                            <p className="text-[12px] font-semibold text-[#9CA3AF]">All caught up!</p>
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n._id}
                              className={`px-4 py-3 flex gap-3 items-start cursor-pointer transition-colors hover:bg-[rgba(122,0,31,0.03)] ${
                                !n.read ? 'bg-[rgba(122,0,31,0.04)]' : ''
                              }`}
                              onClick={() => { if (n.link) { navigate(n.link); setNotifOpen(false); } }}
                            >
                              <AlertCircle size={13} className="text-[#7A001F] mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] leading-snug text-[#1D1D1F] ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                                  {n.title}
                                </p>
                                <p className="text-[10px] text-[#6B7280] mt-0.5 line-clamp-2">{n.message}</p>
                                <span className="text-[9px] text-[#9CA3AF] font-medium block mt-0.5">
                                  {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {!n.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(e, n._id)}
                                  className="p-1 rounded-full hover:bg-[rgba(122,0,31,0.08)] text-[#7A001F] shrink-0 transition-colors"
                                  title="Mark read"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2.5 pl-3 border-l border-[rgba(122,0,31,0.08)] hover:opacity-85 transition-opacity"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-[12px] font-semibold text-[#1D1D1F] leading-none">{user?.name || 'Student'}</p>
                  <p className="text-[9px] text-[#9CA3AF] font-medium mt-0.5 uppercase tracking-wider">Student</p>
                </div>
                <Avatar photoUrl={photoUrl} name={user?.name} size={8} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div onClick={() => setProfileOpen(false)} className="fixed inset-0 z-40" />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-[rgba(122,0,31,0.10)] shadow-[0_16px_40px_rgba(122,0,31,0.12)] overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-[rgba(122,0,31,0.08)] bg-[rgba(122,0,31,0.03)]">
                        <p className="text-[11px] font-semibold text-[#1D1D1F] truncate">{user?.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/student/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[rgba(122,0,31,0.05)] hover:text-[#7A001F] transition-colors font-medium"
                        >
                          <User size={14} /> My Profile
                        </Link>
                        <Link
                          to="/student/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[rgba(122,0,31,0.05)] hover:text-[#7A001F] transition-colors font-medium"
                        >
                          <Settings size={14} /> Settings
                        </Link>
                        <div className="border-t border-[rgba(122,0,31,0.08)] mt-1 pt-1">
                          <button
                            onClick={() => { setProfileOpen(false); handleLogout(); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors font-medium"
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-[#FFFDFC]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

/* ─── Wrap inner with context provider ───────────────────────────── */
const StudentLayout = () => (
  <StudentProfileProvider>
    <StudentLayoutInner />
  </StudentProfileProvider>
);

export default StudentLayout;
