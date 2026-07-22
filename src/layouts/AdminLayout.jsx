import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Expanded Sidebar collapsible dropdown states
  const [academicOpen, setAcademicOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    {
      name: 'Academic Management',
      icon: 'school',
      isDropdown: true,
      isOpen: academicOpen,
      setOpen: setAcademicOpen,
      subItems: [
        { name: 'Departments', path: '/admin/departments' },
        { name: 'Courses', path: '/admin/courses' },
        { name: 'Semesters', path: '/admin/semesters' },
        { name: 'Subjects', path: '/admin/subjects' },
        { name: 'Units', path: '/admin/units' },
        { name: 'Topics', path: '/admin/topics' },
      ],
    },
    {
      name: 'User Management',
      icon: 'group',
      isDropdown: true,
      isOpen: userOpen,
      setOpen: setUserOpen,
      subItems: [
        { name: 'Staff', path: '/admin/staff' },
        { name: 'Students', path: '/admin/students' },
        { name: 'Faculty Assignment', path: '/admin/faculty-assignment' },
      ],
    },
    {
      name: 'Question Bank',
      icon: 'database',
      isDropdown: true,
      isOpen: questionBankOpen,
      setOpen: setQuestionBankOpen,
      subItems: [
        { name: 'Pending Submissions', path: '/admin/questions/pending' },
        { name: 'Approved Questions', path: '/admin/questions/approved' },
        { name: 'Rejected Submissions', path: '/admin/questions/rejected' },
      ],
    },
    { name: 'AI Center', path: '/admin/auto_awesome', icon: 'auto_awesome' },
    { name: 'Exam Management', path: '/admin/exams', icon: 'assignment' },
    { name: 'Results', path: '/admin/results', icon: 'leaderboard' },
    { name: 'Analytics', path: '/admin/analytics', icon: 'monitoring' },
    { name: 'Reports', path: '/admin/reports', icon: 'analytics' },
    { name: 'Notifications', path: '/admin/notifications', icon: 'notifications' },
    { name: 'Activity Logs', path: '/admin/activity-logs', icon: 'history' },
    { name: 'Support Tickets', path: '/admin/support-tickets', icon: 'support_agent' },
    { name: 'AI Settings', path: '/admin/ai-settings', icon: 'settings_suggest' },
    { name: 'Profile', path: '/admin/profile', icon: 'person' },
    { name: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];

  // Breadcrumbs selector
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return ['Console', ...pathnames.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))];
  };

  // Modular nav item renderer to support nested collapsible routing structure
  const renderNavItem = (item, isMobile = false) => {
    const handleClose = () => {
      if (isMobile) setMobileSidebarOpen(false);
    };

    if (item.isDropdown) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => item.setOpen(!item.isOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all font-semibold"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </div>
            <span className={`material-symbols-outlined text-xs transition-transform duration-200 ${item.isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
          
          {item.isOpen && (
            <div className="pl-10 space-y-1 animate-in slide-in-from-top-1 duration-150">
              {item.subItems.map((sub) => {
                const isSubActive = location.pathname === sub.path;
                return (
                  <Link
                    key={sub.name}
                    to={sub.path}
                    onClick={handleClose}
                    className={`block px-4 py-2 rounded-lg text-xs transition-all font-semibold ${
                      isSubActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    {sub.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.name}
        to={item.path}
        onClick={handleClose}
        className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all ${
          isActive
            ? 'bg-primary text-white shadow-lg shadow-primary/10 translate-x-1 font-bold'
            : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary group'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] ${!isActive && 'group-hover:text-primary'}`}>
          {item.icon}
        </span>
        <span className="text-sm font-semibold">{item.name}</span>
      </Link>
    );
  };

  const institutionName = user?.institution?.institutionName || 'Oxford Global University';

  return (
    <div className="bg-background text-on-surface font-sans h-screen overflow-hidden flex relative">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex h-screen w-64 border-r border-primary/5 bg-surface-container-low/80 backdrop-blur-xl flex-col py-6 z-30 shadow-md">
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">account_balance</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm text-primary leading-tight truncate w-36">{institutionName}</h1>
              <p className="text-[9px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">Institution Admin</p>
            </div>
          </div>
        </div>

        {/* Scrollable nav items list */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
          {navItems.map((item) => renderNavItem(item, false))}
        </nav>

        <div className="px-4 pt-4 border-t border-outline-variant/30 mt-4">
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
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <div>
                  <h1 className="font-semibold text-sm text-primary leading-tight truncate w-36">{institutionName}</h1>
                  <p className="text-[9px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">Institution Admin</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {navItems.map((item) => renderNavItem(item, true))}
            </nav>

            <div className="pt-4 border-t border-outline-variant/30 mt-4">
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
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-12 py-3 bg-surface/70 backdrop-blur-md border-b border-primary/10">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Search Input */}
            <div className="hidden md:flex items-center bg-surface-container/60 rounded-xl px-3 py-1.5 border border-primary/5 shadow-sm max-w-xs w-full">
              <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
              <input
                type="text"
                placeholder="Search console..."
                className="bg-transparent border-none focus:ring-0 text-xs w-full placeholder:text-on-surface-variant/40 outline-none ml-2"
              />
            </div>
            
            {/* Institution Title & Academic Year Badge */}
            <div className="hidden sm:flex items-center gap-3 ml-4">
              <span className="font-bold text-primary text-sm tracking-wide">
                {institutionName}
              </span>
              <span className="px-2.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/10 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                AY 2026-2027
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Mobile Title View */}
            <div className="sm:hidden text-center mr-2">
              <span className="px-2 py-0.5 bg-secondary/15 text-secondary rounded-full text-[9px] font-mono font-bold">
                AY 2026-27
              </span>
            </div>

            <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
            </button>

            <div className="relative pl-6 border-l border-outline-variant/30 flex items-center gap-3">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 hover:opacity-85 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold leading-none">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Clearance Level
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center text-primary font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
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

    </div>
  );
};

export default AdminLayout;
