import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Globe, Shield, Smartphone, AlertTriangle,
  Eye, EyeOff, Check, ChevronRight, Moon, Sun, Palette
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ── Section wrapper ─────────────────────────────────────────────── */
const Section = ({ icon: Icon, title, subtitle, children }) => (
  <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] overflow-hidden">
    <div className="px-6 py-4 border-b border-[rgba(122,0,31,0.07)] flex items-center gap-3">
      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,rgba(122,0,31,0.10),rgba(157,23,77,0.10))' }}>
        <Icon size={15} className="text-[#7A001F]" />
      </div>
      <div>
        <h2 className="text-[14px] font-bold text-[#1D1D1F]">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#9CA3AF]">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ── Toggle Row ──────────────────────────────────────────────────── */
const ToggleRow = ({ label, sub, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-[rgba(122,0,31,0.05)] last:border-0">
    <div>
      <p className="text-[13px] font-medium text-[#1D1D1F]">{label}</p>
      {sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-[#7A001F]' : 'bg-[#E5E7EB]'}`}
    >
      <motion.span
        layout
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      />
    </button>
  </div>
);

/* ── Password field ──────────────────────────────────────────────── */
const PwField = ({ label, value, onChange, show, toggleShow }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 pr-10 rounded-[12px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.10)] focus:outline-none focus:border-[rgba(122,0,31,0.30)] focus:ring-2 focus:ring-[rgba(122,0,31,0.08)] text-[13px] text-[#1D1D1F] transition-all"
        placeholder="••••••••"
      />
      <button onClick={toggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  </div>
);

/* ── Main Page ────────────────────────────────────────────────────── */
const StudentSettings = () => {
  const { user } = useAuth();

  // Password state
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications:  true,
    examReminders:       true,
    resultAlerts:        true,
    systemAnnouncements: false,
    pushNotifications:   false,
  });

  // Theme / appearance
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en-GB');

  // Privacy
  const [privacy, setPrivacy] = useState({
    showProfileToOthers: true,
    allowDataAnalysis:   true,
  });

  // Danger zone confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pw.current || !pw.new || !pw.confirm) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (pw.new !== pw.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pw.new.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await api.patch('/profile/change-password', {
        currentPassword: pw.current,
        newPassword:     pw.new,
        confirmPassword: pw.confirm,
      });
      toast.success('Password updated successfully.');
      setPw({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setSavingPw(false);
    }
  };

  const saveNotifPrefs = () => {
    toast.success('Notification preferences saved.');
  };

  const saveAppearance = () => {
    toast.success('Appearance preferences saved.');
  };

  const TABS = [
    { id: 'security',      label: 'Security',       icon: Lock },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
    { id: 'appearance',    label: 'Appearance',      icon: Palette },
    { id: 'privacy',       label: 'Privacy',         icon: Shield },
    { id: 'danger',        label: 'Danger Zone',     icon: AlertTriangle },
  ];

  const [activeTab, setActiveTab] = useState('security');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-6">
        <h1 className="text-xl font-bold text-[#1D1D1F]">Settings</h1>
        <p className="text-[12px] text-[#6B7280] mt-1">
          Manage your account security, preferences, and privacy settings.
        </p>
      </div>

      {/* Account Info (read-only) */}
      <Section icon={User} title="Account" subtitle="Your registered account details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name',     val: user?.name     || '—' },
            { label: 'Email Address', val: user?.email    || '—' },
            { label: 'Role',          val: user?.role     || 'Student' },
            { label: 'Institution',   val: user?.institution?.institutionName || '—' },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-[12px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{label}</p>
              <p className="text-[13px] font-semibold text-[#1D1D1F] mt-0.5 truncate">{val}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#9CA3AF] mt-4">
          To update your name, email, or other profile fields, visit the <a href="/student/profile" className="text-[#7A001F] underline">Profile page</a>.
        </p>
      </Section>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold whitespace-nowrap transition-all ${
              activeTab === id
                ? 'bg-[#7A001F] text-white shadow-sm'
                : 'bg-white text-[#6B7280] border border-[rgba(122,0,31,0.09)] hover:bg-[rgba(122,0,31,0.05)] hover:text-[#7A001F]'
            } ${id === 'danger' ? (activeTab === id ? '' : 'text-red-500 border-red-100 hover:bg-red-50') : ''}`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* Security / Change Password */}
          {activeTab === 'security' && (
            <Section icon={Lock} title="Change Password" subtitle="Choose a strong, unique password">
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <PwField label="Current Password" value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  show={showPw.current}
                  toggleShow={() => setShowPw((s) => ({ ...s, current: !s.current }))} />
                <PwField label="New Password" value={pw.new}
                  onChange={(e) => setPw((p) => ({ ...p, new: e.target.value }))}
                  show={showPw.new}
                  toggleShow={() => setShowPw((s) => ({ ...s, new: !s.new }))} />
                <PwField label="Confirm New Password" value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  show={showPw.confirm}
                  toggleShow={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))} />
                <button type="submit" disabled={savingPw}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold text-white transition-all disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#7A001F,#9D174D)' }}>
                  {savingPw ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><Check size={14} /> Update Password</>
                  )}
                </button>
              </form>

              {/* Security info */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Smartphone, label: 'Active Session', val: '1 device' },
                  { icon: Shield,     label: 'Last Login',     val: user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Today' },
                ].map(({ icon: I, label, val }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)]">
                    <I size={15} className="text-[#9CA3AF]" />
                    <div>
                      <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">{label}</p>
                      <p className="text-[12px] font-semibold text-[#1D1D1F]">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Section icon={Bell} title="Notification Preferences" subtitle="Choose how you receive alerts">
              <div className="space-y-0 divide-y divide-[rgba(122,0,31,0.05)]">
                <ToggleRow label="Email Notifications" sub="Receive alerts to your registered email"
                  checked={notifPrefs.emailNotifications}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, emailNotifications: v }))} />
                <ToggleRow label="Exam Reminders" sub="Get reminded 30 minutes before an exam"
                  checked={notifPrefs.examReminders}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, examReminders: v }))} />
                <ToggleRow label="Result Alerts" sub="Notified when exam results are published"
                  checked={notifPrefs.resultAlerts}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, resultAlerts: v }))} />
                <ToggleRow label="System Announcements" sub="Platform updates and announcements"
                  checked={notifPrefs.systemAnnouncements}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, systemAnnouncements: v }))} />
                <ToggleRow label="Push Notifications" sub="Browser push alerts (when supported)"
                  checked={notifPrefs.pushNotifications}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, pushNotifications: v }))} />
              </div>
              <button onClick={saveNotifPrefs}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#7A001F,#9D174D)' }}>
                <Check size={14} /> Save Preferences
              </button>
            </Section>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <Section icon={Palette} title="Appearance" subtitle="Customize the look of your portal">
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Theme</p>
                  <div className="flex gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark',  label: 'Dark',  icon: Moon },
                    ].map(({ id, label, icon: Icon }) => (
                      <button key={id} onClick={() => setTheme(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold transition-all border ${
                          theme === id
                            ? 'bg-[#7A001F] text-white border-[#7A001F]'
                            : 'bg-[#F9FAFB] text-[#6B7280] border-[rgba(122,0,31,0.08)] hover:bg-[rgba(122,0,31,0.04)]'
                        }`}>
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Language</p>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="px-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none text-[#1D1D1F] appearance-none">
                    <option value="en-GB">English (UK)</option>
                    <option value="en-US">English (US)</option>
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                <button onClick={saveAppearance}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#7A001F,#9D174D)' }}>
                  <Check size={14} /> Save Appearance
                </button>
              </div>
            </Section>
          )}

          {/* Privacy */}
          {activeTab === 'privacy' && (
            <Section icon={Shield} title="Privacy" subtitle="Control your data and visibility">
              <ToggleRow label="Show Profile to Other Students" sub="Your name visible on leaderboards"
                checked={privacy.showProfileToOthers}
                onChange={(v) => setPrivacy((p) => ({ ...p, showProfileToOthers: v }))} />
              <ToggleRow label="Allow Academic Data Analysis" sub="Help improve platform recommendations"
                checked={privacy.allowDataAnalysis}
                onChange={(v) => setPrivacy((p) => ({ ...p, allowDataAnalysis: v }))} />
              <button onClick={() => toast.success('Privacy settings saved.')}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#7A001F,#9D174D)' }}>
                <Check size={14} /> Save Privacy Settings
              </button>
            </Section>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div className="bg-white rounded-[20px] border border-red-100 shadow-[0_4px_24px_rgba(220,38,38,0.05)] overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-[9px] bg-red-50 border border-red-200 flex items-center justify-center">
                  <AlertTriangle size={15} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[#1D1D1F]">Danger Zone</h2>
                  <p className="text-[11px] text-[#9CA3AF]">Irreversible actions — proceed with caution</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-[14px] bg-red-50 border border-red-100">
                  <div>
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">Delete Account</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <AnimatePresence>
                  {showDeleteConfirm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-[14px] border border-red-200 bg-white space-y-3">
                        <p className="text-[12px] font-semibold text-red-700">
                          This action is permanent. Contact your institution administrator to delete your account.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => { toast.error('Please contact your institution admin.'); setShowDeleteConfirm(false); }}
                            className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                            Understood
                          </button>
                          <button onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] hover:bg-[rgba(122,0,31,0.04)] transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StudentSettings;
