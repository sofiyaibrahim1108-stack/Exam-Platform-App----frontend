import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    { name: 'Dashboard', path: '/staff/dashboard', icon: 'dashboard' },
    { name: 'Profile', path: '/staff/profile', icon: 'person' },
    { name: 'Assigned Subjects', path: '/staff/assigned-subjects', icon: 'collections_bookmark' },
    { name: 'Question Generator', path: '/staff/questions', icon: 'psychology' },
    { name: 'Question Bank', path: '/staff/question-bank', icon: 'inventory_2' },
    { name: 'Exam Creation', path: '/staff/exams', icon: 'assignment_add' },
    { name: 'Exam Results', path: '/staff/results', icon: 'assessment' },
    { name: 'Notifications', path: '/staff/notifications', icon: 'notifications' },
    { name: 'Support Tickets', path: '/staff/support-tickets', icon: 'support_agent' },
  ];

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return ['Console', ...pathnames.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))];
  };

  return (
    <div className="bg-background text-on-surface font-sans h-screen overflow-hidden flex relative">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex h-screen w-64 border-r border-primary/5 bg-surface-container-low/80 backdrop-blur-xl flex-col py-6 z-30 shadow-md">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">account_balance</span>
            </div>
            <div>
              <h1 className="font-semibold text-base text-primary leading-tight truncate w-36">{institutionName}</h1>
              <p className="text-[9px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">Faculty Workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/10 translate-x-1'
                    : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary group'
                }`}
              >
                <span className={`material-symbols-outlined ${!isActive && 'group-hover:text-primary'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 pt-4 border-t border-outline-variant/30">
          <div className="space-y-1">
            <a className="flex items-center gap-4 px-4 py-2.5 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold" href="#help">
              <span className="material-symbols-outlined text-[20px]">help</span>
              Help Center
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-2.5 text-error hover:opacity-80 transition-opacity text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
          ></div>

          <aside className="relative flex flex-col w-64 max-w-xs h-full bg-surface-container-low border-r border-primary/5 p-6 z-50 animate-in slide-in-from-left duration-300">
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <div>
                  <h1 className="font-semibold text-base text-primary leading-tight truncate w-36">{institutionName}</h1>
                  <p className="text-[9px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">Faculty Workspace</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:bg-primary/5'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-outline-variant/30">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-2.5 text-error text-sm font-semibold"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        
        {/* Top App Bar Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-12 py-4 bg-surface/70 backdrop-blur-md border-b border-primary/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              {getBreadcrumbs().map((b, i) => (
                <React.Fragment key={b}>
                  {i > 0 && <span className="opacity-40">/</span>}
                  <span className={i === getBreadcrumbs().length - 1 ? 'text-primary' : 'opacity-65'}>
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-[10px] font-mono font-semibold text-on-surface-variant tracking-wider uppercase">
                Active Assessment Nodes
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                title="Open Notifications Sidebar"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="relative pl-6 border-l border-outline-variant/30 flex items-center gap-3">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 hover:opacity-85 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold leading-none">{user?.name || 'Faculty Member'}</p>
                  <p className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Clearance Level
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center text-primary font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-40"
                  ></div>
                  <div className="absolute right-0 top-12 w-48 bg-surface-container-lowest rounded-xl border border-primary/10 shadow-xl py-2 z-50 animate-in fade-in duration-200">
                    <div className="px-4 py-2 border-b border-primary/5">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-mono">User ID</p>
                      <p className="text-xs text-on-surface font-semibold truncate mt-0.5">{user?.email}</p>
                    </div>
                    <a
                      href="#profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 transition-colors font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">person</span>
                      My Profile
                    </a>
                    <a
                      href="#security"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 transition-colors font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">security</span>
                      Security Keys
                    </a>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-primary/5 transition-colors text-left font-semibold border-t border-primary/5"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
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
