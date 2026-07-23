import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Building2, BookOpen, Calendar, FileText, Layers, Tag,
  Users, UserCheck, GraduationCap, Database, ClipboardList, CheckCircle2, XCircle,
  Sparkles, ScrollText, BarChart3, FileBarChart, Bell, History, Headphones,
  Settings2, User, Settings, ChevronDown, ChevronRight,
  LogOut, HelpCircle, Search, Zap, Brain, Menu, X, Command,
  AlertCircle, TrendingUp, Shield,
} from 'lucide-react';

/* ─── Nav Structure ───────────────────────────────────────────────── */
const NAV = [
  {
    section: null,
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Academic Management',
    items: [
      { name: 'Students',    path: '/admin/students',    icon: GraduationCap },
      { name: 'Staff',       path: '/admin/staff',       icon: UserCheck },
      { name: 'Departments', path: '/admin/departments', icon: Building2 },
      { name: 'Courses',     path: '/admin/courses',     icon: BookOpen },
      { name: 'Semesters',   path: '/admin/semesters',   icon: Calendar },
      { name: 'Subjects',    path: '/admin/subjects',    icon: FileText },
    ],
  },
  {
    section: 'Exam Management',
    items: [
      {
        name: 'Question Bank',
        icon: Database,
        isGroup: true,
        key: 'qbank',
        children: [
          { name: 'Pending',  path: '/admin/questions/pending',  icon: ClipboardList },
          { name: 'Approved', path: '/admin/questions/approved', icon: CheckCircle2 },
          { name: 'Rejected', path: '/admin/questions/rejected', icon: XCircle },
        ],
      },
      { name: 'Exam Creation', path: '/admin/exams',   icon: ScrollText },
      { name: 'Exam Results',  path: '/admin/results', icon: TrendingUp },
    ],
  },
  {
    section: 'System Intelligence Hub',
    items: [
      { name: '🤖 AI Center', path: '/admin/ai-center', icon: Sparkles },
    ],
  },
  {
    section: 'System',
    items: [
      { name: 'Notifications',   path: '/admin/notifications',   icon: Bell },
      { name: 'Activity Logs',   path: '/admin/activity-logs',   icon: History },
      { name: 'Support',         path: '/admin/support-tickets', icon: Headphones },
      { name: 'Settings',        path: '/admin/settings',        icon: Settings },
    ],
  },
];

/* ─── Breadcrumb ──────────────────────────────────────────────────── */
const getBreadcrumb = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));
};

/* ─── Sidebar Nav Item ────────────────────────────────────────────── */
const NavItem = ({ item, location, openGroups, onToggle, onClose }) => {
  if (item.isGroup) {
    const isOpen = openGroups[item.key] ?? item.children.some(c => location.pathname === c.path);
    const hasActive = item.children.some(c => location.pathname === c.path);

    return (
      <div>
        <button
          onClick={() => onToggle(item.key)}
          className={`nav-item w-full ${hasActive ? 'text-wine font-semibold' : ''}`}
        >
          <span className="nav-item-icon">
            <item.icon size={14} />
          </span>
          <span className="flex-1 text-left text-[13px]">{item.name}</span>
          <motion.span
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronRight size={13} className="opacity-40" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="ml-[10px] pl-[18px] border-l border-[rgba(139,30,63,0.10)] mt-0.5 space-y-0.5 pb-1">
                {item.children.map(child => {
                  const active = location.pathname === child.path;
                  return (
                    <Link
                      key={child.name}
                      to={child.path}
                      onClick={onClose}
                      className={`flex items-center gap-2 px-3 py-[7px] rounded-[8px] text-[12.5px] font-medium transition-all duration-150 ${
                        active
                          ? 'bg-[#FDF0F4] text-[#8B1E3F] font-semibold'
                          : 'text-[#6B7280] hover:text-[#8B1E3F] hover:bg-[#FDF8FA]'
                      }`}
                    >
                      <child.icon size={12} className={active ? 'text-[#8B1E3F]' : 'opacity-50'} />
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const active = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      onClick={onClose}
      className={`nav-item ${active ? 'active' : ''}`}
    >
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-[#FDF0F4] rounded-[10px]"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
      <span className="relative z-10 nav-item-icon">
        <item.icon size={14} />
      </span>
      <span className="relative z-10 text-[13px]">{item.name}</span>
    </Link>
  );
};

/* ─── Sidebar Content ─────────────────────────────────────────────── */
const SidebarContent = ({ location, openGroups, onToggle, onClose, user, onLogout, institutionName }) => (
  <div className="flex flex-col h-full">

    {/* Logo */}
    <div className="px-4 pt-5 pb-4 border-b border-[rgba(139,30,63,0.07)]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[10px] bg-[#8B1E3F] flex items-center justify-center shadow-sm flex-shrink-0">
          <Brain size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[13px] font-bold text-[#111111] leading-tight truncate">{institutionName}</h1>
          <p className="text-[10px] font-medium text-[#9CA3AF] mt-0.5">Admin Portal</p>
        </div>
      </div>

      {/* AI status */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#059669] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse-soft" />
        AI Online
        <span className="ml-auto text-[10px] text-[#9CA3AF] font-normal">Gemini 2.5</span>
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
      {NAV.map((group, gi) => (
        <div key={gi}>
          {group.section && (
            <p className="section-label">{group.section}</p>
          )}
          <div className="space-y-0.5">
            {group.items.map(item => (
              <NavItem
                key={item.key || item.name}
                item={item}
                location={location}
                openGroups={openGroups}
                onToggle={onToggle}
                onClose={onClose}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Footer */}
    <div className="px-3 pb-4 pt-3 border-t border-[rgba(139,30,63,0.07)] space-y-0.5">
      <a href="#help" className="nav-item">
        <span className="nav-item-icon"><HelpCircle size={14} /></span>
        <span className="text-[13px]">Help & Support</span>
      </a>
      <button onClick={onLogout} className="nav-item text-red-400 hover:text-red-500 hover:bg-red-50 w-full">
        <span className="nav-item-icon text-red-400 group-hover:bg-red-50"><LogOut size={14} /></span>
        <span className="text-[13px]">Sign Out</span>
      </button>

      {/* User */}
      <div className="mt-2 flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] bg-[#F9FAFB] border border-[rgba(139,30,63,0.06)]">
        <div className="w-7 h-7 rounded-[8px] bg-[#8B1E3F] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
          {(user?.name || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#111111] truncate">{user?.name || 'Administrator'}</p>
          <p className="text-[10px] text-[#9CA3AF] truncate font-medium">{user?.email || ''}</p>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Layout ─────────────────────────────────────────────────── */
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const institutionName = user?.institution?.institutionName || 'Oxford Global University';
  const userName = user?.name || 'Administrator';
  const breadcrumbs = getBreadcrumb(location.pathname);

  const sidebarProps = {
    location,
    openGroups,
    onToggle: toggleGroup,
    onClose: null,
    user,
    onLogout: handleLogout,
    institutionName,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFFCFA' }}>

      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 sidebar z-20">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile Sidebar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 h-full w-[240px] z-50 sidebar"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors"
              >
                <X size={14} />
              </button>
              <SidebarContent {...sidebarProps} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Navbar ─────────────────────────────────────────────────── */}
        <header className="navbar sticky top-0 z-20 flex items-center gap-3 px-5 py-3 flex-shrink-0">

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-[8px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
          >
            <Menu size={16} />
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1 text-[12.5px] font-medium text-[#9CA3AF]">
            <span className="text-[#8B1E3F] font-semibold">Console</span>
            {breadcrumbs.slice(1).map((crumb, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={12} className="opacity-40" />
                <span className={i === breadcrumbs.slice(1).length - 1 ? 'text-[#111111] font-semibold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Search */}
          <div className="hidden md:flex search-bar flex-1 max-w-[260px] ml-2">
            <Search size={13} className="text-[#9CA3AF] flex-shrink-0" />
            <input placeholder="Search…" />
            <kbd className="ml-auto text-[10px] text-[#9CA3AF] font-medium bg-[#F3F4F6] px-1.5 py-0.5 rounded-[4px] font-mono hidden lg:block">⌘K</kbd>
          </div>

          <div className="flex-1" />

          {/* AY badge */}
          <span className="hidden sm:block text-[11px] font-semibold text-[#6B7280] bg-[#F3F4F6] px-2.5 py-1 rounded-[7px]">
            AY 2026–27
          </span>

          {/* AI status */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-[#059669]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse-soft" />
            AI Online
          </div>

          {/* Quick actions */}
          <div className="relative">
            <button
              onClick={() => { setQuickOpen(!quickOpen); setProfileOpen(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#6B7280] border border-[rgba(139,30,63,0.10)] hover:bg-[#FDF0F4] hover:text-[#8B1E3F] hover:border-[rgba(139,30,63,0.20)] transition-all duration-150"
            >
              <Zap size={14} />
            </button>
            <AnimatePresence>
              {quickOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setQuickOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-10 w-52 bg-white border border-[rgba(139,30,63,0.10)] rounded-[16px] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] z-50 py-1.5 overflow-hidden"
                  >
                    <p className="px-3 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Quick Access</p>
                    {[
                      { label: 'Create Exam',    path: '/admin/exams',       icon: ScrollText },
                      { label: 'Add Staff',      path: '/admin/staff',       icon: UserCheck },
                      { label: 'Import Students',path: '/admin/students',    icon: GraduationCap },
                      { label: 'AI Center',      path: '/admin/auto_awesome',icon: Sparkles },
                      { label: 'Reports',        path: '/admin/reports',     icon: FileBarChart },
                    ].map(a => (
                      <button
                        key={a.label}
                        onClick={() => { navigate(a.path); setQuickOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#374151] hover:bg-[#FDF8FA] hover:text-[#8B1E3F] transition-colors duration-100"
                      >
                        <a.icon size={13} className="text-[#8B1E3F] opacity-70" />
                        {a.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Notification */}
          <button className="relative w-8 h-8 flex items-center justify-center rounded-[8px] text-[#6B7280] border border-[rgba(139,30,63,0.10)] hover:bg-[#FDF0F4] hover:text-[#8B1E3F] transition-all duration-150">
            <Bell size={14} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#DC2626] rounded-full ring-[1.5px] ring-white" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setQuickOpen(false); }}
              className="flex items-center gap-2 pl-3 border-l border-[rgba(139,30,63,0.08)] hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <p className="text-[12.5px] font-semibold text-[#111111] leading-none">{userName}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-none">Admin</p>
              </div>
              <div className="w-8 h-8 rounded-[9px] bg-[#8B1E3F] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-11 w-56 bg-white border border-[rgba(139,30,63,0.10)] rounded-[16px] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[rgba(139,30,63,0.06)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[10px] bg-[#8B1E3F] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#111111] truncate">{userName}</p>
                          <p className="text-[11px] text-[#9CA3AF] truncate">{user?.email || ''}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      {[
                        { label: 'Profile',  path: '/admin/profile',   icon: User },
                        { label: 'Settings', path: '/admin/settings',  icon: Settings },
                      ].map(l => (
                        <Link
                          key={l.label}
                          to={l.path}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111111] transition-colors"
                        >
                          <l.icon size={13} className="text-[#9CA3AF]" />
                          {l.label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-[rgba(139,30,63,0.06)] py-1">
                      <button
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={13} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── Page Content ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
