import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, User, BookOpen, Brain, Database, FileEdit, Award, Bell,
  MessageSquare, HelpCircle, LogOut, Menu, X, Shield, Key, Building2, Search, Wifi
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import StaffNotificationDrawer from '../components/StaffNotificationDrawer';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotificationsData = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data && response.data.success) {
        setNotifications(response.data.data || []);
      }
      const countRes = await api.get('/notifications/unread-count');
      if (countRes.data && countRes.data.success) {
        setUnreadCount(countRes.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to retrieve notifications.', error);
    }
  };

  useEffect(() => {
    setLoadingNotifications(true);
    fetchNotificationsData().finally(() => setLoadingNotifications(false));
    const interval = setInterval(fetchNotificationsData, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const institutionName = user?.institution?.institutionName || 'Oxford Global';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/staff/profile', icon: User },
    { name: 'Assigned Subjects', path: '/staff/assigned-subjects', icon: BookOpen },
    { name: 'Question Generator', path: '/staff/questions', icon: Brain },
    { name: 'Question Bank', path: '/staff/question-bank', icon: Database },
    { name: 'Exam Creation', path: '/staff/exams', icon: FileEdit },
    { name: 'Exam Results', path: '/staff/results', icon: Award },
    { name: 'Notifications', path: '/staff/notifications', icon: Bell },
    { name: 'Support Tickets', path: '/staff/support-tickets', icon: MessageSquare },
  ];

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return ['Console', ...pathnames.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))];
  };

  return (
    <div className="bg-[#FFFDFC] text-[#1D1D1F] font-sans h-screen overflow-hidden flex relative">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex h-screen w-64 border-r border-[rgba(140,29,64,0.08)] bg-white/80 backdrop-blur-md flex-col py-6 z-30 shadow-sm">
        <div className="px-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8C1D40] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#8C1D40]/10">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm text-[#1D1D1F] leading-tight truncate w-36">{institutionName}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-mono font-bold text-[#8C1D40] uppercase tracking-wider">AI Online</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <span className="block text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider px-3 mb-2">Navigation Workspace</span>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-xs font-semibold relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#8C1D40] to-[#C74B74] text-white shadow-md shadow-[#8C1D40]/15'
                    : 'text-[#6B7280] hover:bg-[#F8ECEF] hover:text-[#8C1D40]'
                }`}
              >
                {!isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#8C1D40] rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></span>
                )}
                <IconComponent
                  size={16}
                  className={`transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-[#6B7280] group-hover:text-[#8C1D40]'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 pt-4 border-t border-[rgba(140,29,64,0.08)] space-y-3">
          <div className="space-y-0.5">
            <a
              href="#help"
              className="flex items-center gap-3 px-3.5 py-2 text-[#6B7280] hover:text-[#8C1D40] hover:bg-[#F8ECEF] rounded-lg transition-colors text-xs font-semibold"
            >
              <HelpCircle size={15} />
              Help Center
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold text-left"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>

          {/* User Profile Mini Card */}
          <div className="p-3 bg-[#F8ECEF]/40 border border-[rgba(140,29,64,0.06)] rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#8C1D40]/10 border border-[#8C1D40]/20 flex items-center justify-center text-[#8C1D40] font-black text-xs uppercase shrink-0">
              {user?.name ? user.name.charAt(0) : 'F'}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#1D1D1F] truncate leading-none">{user?.name || 'Faculty Member'}</p>
              <p className="text-[9px] font-mono text-[#6B7280] uppercase tracking-wider mt-0.5 truncate">Academic Staff</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
          ></div>

          <aside className="relative flex flex-col w-64 max-w-xs h-full bg-white border-r border-[rgba(140,29,64,0.08)] p-6 z-50 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-[#8C1D40] rounded-xl flex items-center justify-center text-white">
                  <Building2 size={18} />
                </div>
                <div>
                  <h1 className="font-extrabold text-sm text-[#1D1D1F] leading-tight truncate w-32">{institutionName}</h1>
                  <span className="text-[9px] font-mono font-bold text-[#8C1D40] uppercase tracking-wider">Faculty Portal</span>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                      isActive
                        ? 'bg-gradient-to-r from-[#8C1D40] to-[#C74B74] text-white shadow-md'
                        : 'text-[#6B7280] hover:bg-[#F8ECEF]'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-[rgba(140,29,64,0.08)] space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-xs font-semibold text-left"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        
        {/* Top App Bar Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-12 py-3 bg-white/70 backdrop-blur-md border-b border-[rgba(140,29,64,0.08)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-[#6B7280] transition-colors"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6B7280]">
              {getBreadcrumbs().map((b, i) => (
                <React.Fragment key={b}>
                  {i > 0 && <span className="opacity-40">/</span>}
                  <span className={i === getBreadcrumbs().length - 1 ? 'text-[#8C1D40] font-bold' : 'opacity-65'}>
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C74B74] animate-pulse"></span>
              <span className="text-[9px] font-mono font-bold text-[#6B7280] tracking-wider uppercase">
                Active Assessment Nodes
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 text-[#6B7280] hover:bg-[#F8ECEF] rounded-full transition-colors"
                title="Open Notifications Sidebar"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="relative pl-6 border-l border-[rgba(140,29,64,0.08)] flex items-center gap-3">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 hover:opacity-85 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none text-[#1D1D1F]">{user?.name || 'Faculty Member'}</p>
                  <p className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider mt-0.5">
                    Clearance Level 2
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full border border-[rgba(140,29,64,0.12)] overflow-hidden bg-[#FAF8F7] flex items-center justify-center text-[#8C1D40] font-black text-xs uppercase shadow-inner">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-40"
                  ></div>
                  <div className="absolute right-0 top-11 w-48 bg-white rounded-xl border border-[rgba(140,29,64,0.08)] shadow-lg py-1.5 z-50 animate-in fade-in duration-200 text-xs font-semibold text-[#6B7280]">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">User ID</p>
                      <p className="text-xs text-[#1D1D1F] truncate mt-0.5 font-bold">{user?.email}</p>
                    </div>
                    <Link
                      to="/staff/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:bg-[#F8ECEF] transition-colors"
                    >
                      <User size={14} />
                      My Profile
                    </Link>
                    <Link
                      to="/staff/profile?tab=security"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:bg-[#F8ECEF] transition-colors"
                    >
                      <Shield size={14} />
                      Security Keys
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left font-bold border-t border-gray-100 mt-1"
                    >
                      <LogOut size={14} />
                      Close Session
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Staff Notification Drawer */}
      <StaffNotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefresh={fetchNotificationsData}
        loading={loadingNotifications}
      />
    </div>
  );
};

export default StaffLayout;
