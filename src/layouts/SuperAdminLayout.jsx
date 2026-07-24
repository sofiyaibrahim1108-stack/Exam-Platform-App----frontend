import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, History, Settings, 
  Search, Bell, HelpCircle, LogOut, ChevronDown, User,
  Menu, X, Check, Trash2, Cpu, Sparkles, Star, Calendar, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications states
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data && res.data.success) {
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotificationsList = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications list:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (notificationsOpen) fetchNotificationsList();
    }, 30000);
    return () => clearInterval(interval);
  }, [notificationsOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchUnreadCount();
      fetchNotificationsList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchUnreadCount();
      fetchNotificationsList();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotifications = () => {
    if (!notificationsOpen) {
      fetchNotificationsList();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Institutions', path: '/super-admin/institutions', icon: <Building2 size={16} /> },
    { name: 'System Admins', path: '/super-admin/admins', icon: <Users size={16} /> },
    { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: <History size={16} /> },
    { name: 'Notifications', path: '/super-admin/notifications', icon: <Bell size={16} />, badge: true },
    { name: 'Settings', path: '/super-admin/settings', icon: <Settings size={16} /> },
  ];

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return ['Console', ...pathnames.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))];
  };

  return (
    <div className="bg-[#FFFDFC] text-[#1A1A1A] font-sans h-screen overflow-hidden flex relative">
      
      {/* 1. Sidebar Navigation - Desktop */}
      <aside className="hidden lg:flex h-screen w-64 border-r border-gray-150 bg-[#FAFAFB]/95 backdrop-blur-xl flex-col py-6 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Brand Header */}
        <div className="px-6 mb-8 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #4A0516 0%, #8B1538 100%)' }}>
              <Star size={18} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-[#8B1538] leading-tight">Oxford ERP</h1>
              <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mt-0.5">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-xs relative ${
                  isActive
                    ? 'text-white shadow-[0_8px_20px_rgba(139,21,56,0.15)]'
                    : 'text-gray-500 hover:bg-[#8B1538]/5 hover:text-[#8B1538] group'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #7A001F, #8B1538)' } : {}}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.name}</span>
                {item.badge && unreadCount > 0 && (
                  <span className="ml-auto bg-[#8B1538] text-white font-mono text-[9px] rounded-full px-1.5 py-0.5 font-bold border border-white/20">
                    {unreadCount}
                  </span>
                )}
                {isActive && !item.badge && (
                  <span className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Profile Card */}
        <div className="mt-auto px-4 shrink-0 mb-3">
          <div className="p-3 bg-white border border-gray-150 rounded-2xl flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-xl border border-[#8B1538]/20 flex items-center justify-center text-white text-xs font-bold relative overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg, #7A001F, #8B1538)' }}>
              {user?.avatar || user?.photoUrl ? (
                <img 
                  src={user.photoUrl || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/${user.avatar}`} 
                  alt={user?.name || 'Super Admin'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'S'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-800 truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mt-0.5">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="px-4 pt-4 border-t border-gray-100 shrink-0 space-y-1">
          <Link 
            className="flex items-center gap-3.5 px-4 py-2.5 text-gray-500 hover:text-[#8B1538] hover:bg-[#8B1538]/5 rounded-xl transition-all text-xs font-semibold" 
            to="/super-admin/help"
          >
            <HelpCircle size={15} />
            Help Center
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 text-red-655 hover:bg-red-50/50 rounded-xl transition-all text-xs font-bold"
          >
            <LogOut size={15} className="text-red-500" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* 2. Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            ></motion.div>

            {/* Drawer Menu */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative flex flex-col w-64 max-w-xs h-full bg-[#FAFAFB] border-r border-gray-150 p-6 z-50"
            >
              <div className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #4A0516 0%, #8B1538 100%)' }}>
                    <Star size={18} fill="white" />
                  </div>
                  <div>
                    <h1 className="font-extrabold text-sm text-[#8B1538] leading-tight">Oxford ERP</h1>
                    <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mt-0.5">Super Admin</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
                        isActive
                          ? 'text-white shadow-md'
                          : 'text-gray-500 hover:bg-[#8B1538]/5 hover:text-[#8B1538]'
                      }`}
                      style={isActive ? { background: 'linear-gradient(135deg, #7A001F, #8B1538)' } : {}}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                      {item.badge && unreadCount > 0 && (
                        <span className="ml-auto bg-[#8B1538] text-white font-mono text-[9px] rounded-full px-1.5 py-0.5 font-bold border border-white/20">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 text-red-600 font-bold text-xs"
                >
                  <LogOut size={15} />
                  Logout Session
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        
        {/* Top App Bar Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-12 py-3.5 bg-white/80 backdrop-blur-md border-b border-gray-150 shrink-0 shadow-[0_2px_18px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-4">
            
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
              {getBreadcrumbs().map((b, i) => (
                <React.Fragment key={b}>
                  {i > 0 && <span className="opacity-40">/</span>}
                  <span className={i === getBreadcrumbs().length - 1 ? 'text-[#8B1538]' : 'opacity-65'}>
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            
            {/* Mock Logs Search Field */}
            <div className="hidden md:flex relative w-60 shrink-0">
              <Search size={13} className="text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail logs..."
                className="w-full bg-gray-50 border border-gray-200 rounded-full pl-8.5 pr-4 py-1.5 text-[10px] font-semibold focus:outline-none focus:border-[#8B1538] focus:bg-white transition-colors"
              />
            </div>

            {/* Live nodes Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-mono font-bold text-emerald-800 tracking-wider uppercase">
                Nodes Stable
              </span>
            </div>

            {/* Academic Year Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#FDF3F6] border border-[#8B1538]/10 rounded-full text-[9px] font-mono font-bold text-[#8B1538]">
              <Calendar size={10} />
              <span>AY 2026-27</span>
            </div>

            {/* Notification Icon (Redirects directly to Alerts Page) */}
            <div className="relative">
              <Link
                to="/super-admin/notifications"
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#8B1538] text-white font-mono text-[9px] rounded-full flex items-center justify-center font-bold border border-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>

            {/* User Profile Info & Dropdown */}
            <div className="relative pl-4 border-l border-gray-150 flex items-center gap-3">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none text-gray-800">{user?.name || 'Super Admin'}</p>
                  <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mt-1">
                    System Core
                  </p>
                </div>
                
                {/* Initials bubble avatar */}
                <div className="w-9 h-9 rounded-full border border-[#8B1538]/20 flex items-center justify-center text-white text-xs font-bold shadow-xs relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7A001F, #8B1538)' }}>
                  {user?.avatar || user?.photoUrl ? (
                    <img 
                      src={user.photoUrl || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/${user.avatar}`} 
                      alt={user?.name || 'Super Admin'} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'S'
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                </div>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div
                      onClick={() => setProfileDropdownOpen(false)}
                      className="fixed inset-0 z-40"
                    ></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-11 w-48 bg-white rounded-xl border border-gray-150 shadow-xl py-1 z-50 text-xs font-bold"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">User ID</p>
                        <p className="text-[11px] text-gray-700 font-bold truncate mt-0.5 font-mono">{user?.email}</p>
                      </div>
                      <Link
                        to="/super-admin/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:bg-[#8B1538]/5 hover:text-[#8B1538] transition-colors"
                      >
                        <User size={13} />
                        My Profile
                      </Link>
                      <Link
                        to="/super-admin/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:bg-[#8B1538]/5 hover:text-[#8B1538] transition-colors"
                      >
                        <Settings size={13} />
                        Platform Settings
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50/50 transition-colors text-left border-t border-gray-100 font-bold"
                      >
                        <LogOut size={13} />
                        Close Session
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#FCFCFD]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default SuperAdminLayout;
