import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
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
    // Poll unread count every 30 seconds
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
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: 'dashboard' },
    { name: 'Institutions', path: '/super-admin/institutions', icon: 'domain' },
    { name: 'System Admins', path: '/super-admin/admins', icon: 'manage_accounts' },
    { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: 'history' },
    { name: 'Settings', path: '/super-admin/settings', icon: 'settings' },
  ];

  // Helper to build breadcrumb segments
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return ['Console', ...pathnames.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))];
  };

  return (
    <div className="bg-background text-on-surface font-sans h-screen overflow-hidden flex relative">
      
      {/* 1. Sidebar Navigation - Desktop (Visible on lg screens and up) */}
      <aside className="hidden lg:flex h-screen w-64 border-r border-primary/5 bg-surface-container-low/80 backdrop-blur-xl flex-col py-6 z-30 shadow-md">
        {/* Brand Header */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">account_balance</span>
            </div>
            <div>
              <h1 className="font-semibold text-lg text-primary leading-tight">Oxford Global</h1>
              <p className="text-[10px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Sidebar Links */}
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

        {/* Bottom Panel */}
        <div className="mt-auto px-4 pt-4 border-t border-outline-variant/30">
          <div className="space-y-1">
            <Link className="flex items-center gap-4 px-4 py-2.5 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold" to="/super-admin/help">
              <span className="material-symbols-outlined text-[20px]">help</span>
              Help Center
            </Link>
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

      {/* 2. Mobile Sidebar Drawer (Slides in on mobile viewports) */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
          ></div>

          {/* Drawer Menu */}
          <aside className="relative flex flex-col w-64 max-w-xs h-full bg-surface-container-low border-r border-primary/5 p-6 z-50 animate-in slide-in-from-left duration-300">
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <div>
                  <h1 className="font-semibold text-lg text-primary leading-tight">Oxford Global</h1>
                  <p className="text-[10px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">Super Admin</p>
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

      {/* 3. Main Workspace Area */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        
        {/* Top App Bar Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-12 py-4 bg-surface/70 backdrop-blur-md border-b border-primary/10">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Breadcrumb Navigation */}
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
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-[10px] font-mono font-semibold text-on-surface-variant tracking-wider uppercase">
                Live: Global Nodes
              </span>
            </div>

            {/* Notification Icon & Dropdown */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors flex items-center"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white font-mono text-[9px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-40"
                  ></div>
                  <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest rounded-2xl border border-primary/10 shadow-2xl py-3 z-50 animate-in fade-in duration-200">
                    <div className="px-4 py-2 border-b border-primary/5 flex justify-between items-center">
                      <p className="font-bold text-sm text-primary">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-mono font-semibold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                          {unreadCount} Unread
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-primary/5">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-on-surface-variant">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n._id} className={`p-4 hover:bg-primary/5 transition-colors space-y-1.5 relative group ${!n.read ? 'bg-primary/5' : ''}`}>
                            <div className="flex justify-between items-start gap-3">
                              <p className={`text-xs font-semibold leading-tight ${!n.read ? 'text-primary' : 'text-on-surface'}`}>{n.title}</p>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!n.read && (
                                  <button onClick={() => handleMarkAsRead(n._id)} className="p-0.5 text-secondary hover:brightness-110 flex items-center" title="Mark as read">
                                    <span className="material-symbols-outlined text-sm">done</span>
                                  </button>
                                )}
                                <button onClick={() => handleDeleteNotification(n._id)} className="p-0.5 text-error hover:brightness-110 flex items-center" title="Delete">
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-on-surface-variant leading-normal">{n.message}</p>
                            <p className="text-[9px] text-on-surface-variant/70 font-mono">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Info & Dropdown */}
            <div className="relative pl-6 border-l border-outline-variant/30 flex items-center gap-3">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 hover:opacity-85 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold leading-none">{user?.name || 'Super Admin'}</p>
                  <p className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Clearance Level
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center text-primary font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </button>

              {/* Profile Dropdown Card */}
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
                    <Link
                      to="/super-admin/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 transition-colors font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">person</span>
                      My Profile
                    </Link>
                    <Link
                      to="/super-admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 transition-colors font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">settings</span>
                      Platform Settings
                    </Link>
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

    </div>
  );
};

export default SuperAdminLayout;
