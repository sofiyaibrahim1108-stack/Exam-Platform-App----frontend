import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2, GraduationCap, HelpCircle, Bell, Shield, CloudLightning, Info, Save, Settings, Database, Trash2
} from 'lucide-react';
import api from '../services/api';

const TABS = [
  { id: 'institution', label: 'Institution Settings', icon: Building2 },
  { id: 'academic', label: 'Academic Settings', icon: GraduationCap },
  { id: 'examination', label: 'Examination Settings', icon: HelpCircle },
  { id: 'notification', label: 'Notification Settings', icon: Bell },
  { id: 'security', label: 'Security Settings', icon: Shield },
  { id: 'backup', label: 'Backup & Restore', icon: Database },
  { id: 'system-info', label: 'System Information', icon: Info },
];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('institution');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);

  // Consolidated Form State
  const [form, setForm] = useState({
    // Institution
    institutionName: '',
    logo: '',
    address: '',
    contactNumber: '',
    email: '',
    website: '',

    // Academic
    academicYear: '2025-2026',
    defaultSemester: 'Semester 1',
    gradingSystem: 'Percentage',
    passingPercentage: 40,
    defaultExamDuration: 60,

    // Examination
    defaultInstructions: '',
    defaultNegativeMarking: 0,
    autoSubmitOnExpiry: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    showResultImmediately: false,
    allowReattempt: false,
    maxAttempts: 1,

    // Notification
    emailNotifications: true,
    inAppNotifications: true,
    studentNotifications: true,
    staffNotifications: true,
    adminNotifications: true,

    // Security
    sessionTimeout: 30,
    passwordPolicyStrength: 'Medium',
    twoFactorAuth: false,
    loginAttemptLimit: 5,

    // Backup
    lastBackupTime: null,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings');
      if (response.data && response.data.success) {
        setForm((prev) => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      toast.error('Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    setInfoLoading(true);
    try {
      const response = await api.get('/settings/system-info');
      if (response.data && response.data.success) {
        setSystemInfo(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load system info:', error);
    } finally {
      setInfoLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'system-info') {
      fetchSystemInfo();
    }
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading('Saving platform settings...');

    try {
      const response = await api.put('/settings', form);
      if (response.data && response.data.success) {
        setForm((prev) => ({ ...prev, ...response.data.data }));
        toast.success(response.data.message || 'Settings saved successfully!', { id: saveToast });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save settings.', { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  // Download Backup Handler
  const handleDownloadBackup = async () => {
    const backupToast = toast.loading('Generating database backup JSON dump...');
    try {
      const response = await api.get('/settings/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `database_backup_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Database backup downloaded successfully!', { id: backupToast });
      fetchSettings(); // Refresh last backup time
    } catch (error) {
      toast.error('Failed to download backup.', { id: backupToast });
    }
  };

  // Restore Backup Handler
  const handleRestoreBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Are you sure you want to restore settings from "${file.name}"?`)) return;

    const restoreToast = toast.loading('Restoring database settings...');
    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      const response = await api.post('/settings/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Backup restored successfully!', { id: restoreToast });
        fetchSettings();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to restore backup file.', { id: restoreToast });
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner Header */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <Settings size={12} />
              Configuration Matrix
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">System Settings Console</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Configure global institution parameters, examination rules, security controls, and system diagnostics.
            </p>
          </div>
          {activeTab !== 'backup' && activeTab !== 'system-info' && (
            <button
              onClick={handleSaveSettings}
              disabled={saving || loading}
              className="btn-primary py-2.5 px-6 rounded-[12px] text-[12.5px] flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-white border border-[#E5E7EB] rounded-[14px] scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-[#8B1E3F] text-white shadow-sm'
                  : 'text-[#6B7280] hover:bg-[#FAF8F7] hover:text-[#111111]'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Form Container */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-10 bg-surface-container-high rounded-xl w-3/4"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-1/2"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
          </div>
        ) : (
          <div>
            {/* MODULE 1: Institution Settings */}
            {activeTab === 'institution' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                <h3 className="text-base font-bold text-primary border-b border-primary/5 pb-2">
                  Institution Information
                </h3>

                <div className="space-y-4 font-semibold text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      name="institutionName"
                      value={form.institutionName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Oxford Global University"
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Institution Logo URL
                    </label>
                    <input
                      type="text"
                      name="logo"
                      value={form.logo}
                      onChange={handleChange}
                      placeholder="https://example.com/logo.png or uploads/..."
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Campus Address
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Campus address details..."
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs resize-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="contactNumber"
                        value={form.contactNumber}
                        onChange={handleChange}
                        placeholder="+1 (555) 019-2834"
                        className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Official Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="admin@oxford.edu"
                        className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Official Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://oxford.edu"
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {saving ? 'Saving...' : 'Save Institution Settings'}
                  </button>
                </div>
              </form>
            )}

            {/* MODULE 2: Academic Settings */}
            {activeTab === 'academic' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                <h3 className="text-base font-bold text-primary border-b border-primary/5 pb-2">
                  Academic Configurations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Academic Year
                    </label>
                    <select
                      name="academicYear"
                      value={form.academicYear}
                      onChange={handleChange}
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Default Semester
                    </label>
                    <select
                      name="defaultSemester"
                      value={form.defaultSemester}
                      onChange={handleChange}
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Grading System
                    </label>
                    <select
                      name="gradingSystem"
                      value={form.gradingSystem}
                      onChange={handleChange}
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                    >
                      <option value="Percentage">Percentage System (%)</option>
                      <option value="Grade Points">10-Point GPA Scale</option>
                      <option value="Letter Grade">Letter Grade (O, A+, A, B, C, F)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Passing Percentage Threshold (%)
                    </label>
                    <input
                      type="number"
                      name="passingPercentage"
                      value={form.passingPercentage}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Default Exam Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      name="defaultExamDuration"
                      value={form.defaultExamDuration}
                      onChange={handleChange}
                      min={1}
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {saving ? 'Saving...' : 'Save Academic Settings'}
                  </button>
                </div>
              </form>
            )}

            {/* MODULE 3: Examination Settings */}
            {activeTab === 'examination' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                <h3 className="text-base font-bold text-primary border-b border-primary/5 pb-2">
                  Default Examination Rules
                </h3>

                <div className="space-y-4 font-semibold text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Default Exam Instructions
                    </label>
                    <textarea
                      name="defaultInstructions"
                      value={form.defaultInstructions}
                      onChange={handleChange}
                      rows={3}
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs resize-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Default Negative Marking (Per Wrong Answer)
                      </label>
                      <input
                        type="number"
                        name="defaultNegativeMarking"
                        value={form.defaultNegativeMarking}
                        onChange={handleChange}
                        step="0.25"
                        min={0}
                        className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Maximum Attempts Allowed
                      </label>
                      <input
                        type="number"
                        name="maxAttempts"
                        value={form.maxAttempts}
                        onChange={handleChange}
                        min={1}
                        className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Toggle Switches */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                      <div>
                        <span className="font-bold text-on-surface block">Auto Submit on Time Expiry</span>
                        <span className="text-[10px] text-on-surface-variant font-normal">Automatically finalize attempt when exam timer hits zero.</span>
                      </div>
                      <input
                        type="checkbox"
                        name="autoSubmitOnExpiry"
                        checked={form.autoSubmitOnExpiry}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                      <div>
                        <span className="font-bold text-on-surface block">Randomize Question Order</span>
                        <span className="text-[10px] text-on-surface-variant font-normal">Shuffle question order for each candidate attempt.</span>
                      </div>
                      <input
                        type="checkbox"
                        name="randomizeQuestions"
                        checked={form.randomizeQuestions}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                      <div>
                        <span className="font-bold text-on-surface block">Randomize Option Order</span>
                        <span className="text-[10px] text-on-surface-variant font-normal">Shuffle option choices (A, B, C, D) per question.</span>
                      </div>
                      <input
                        type="checkbox"
                        name="randomizeOptions"
                        checked={form.randomizeOptions}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                      <div>
                        <span className="font-bold text-on-surface block">Show Result Immediately</span>
                        <span className="text-[10px] text-on-surface-variant font-normal">Display auto-graded scorecard to student instantly upon submit.</span>
                      </div>
                      <input
                        type="checkbox"
                        name="showResultImmediately"
                        checked={form.showResultImmediately}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                      <div>
                        <span className="font-bold text-on-surface block">Allow Reattempts</span>
                        <span className="text-[10px] text-on-surface-variant font-normal">Permit candidates to re-attempt failed assessments.</span>
                      </div>
                      <input
                        type="checkbox"
                        name="allowReattempt"
                        checked={form.allowReattempt}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {saving ? 'Saving...' : 'Save Examination Settings'}
                  </button>
                </div>
              </form>
            )}

            {/* MODULE 4: Notification Settings */}
            {activeTab === 'notification' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                <h3 className="text-base font-bold text-primary border-b border-primary/5 pb-2">
                  Alert & Notification Preferences
                </h3>

                <div className="space-y-3 font-semibold text-xs">
                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                    <div>
                      <span className="font-bold text-on-surface block">Email Notifications</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">Send transactional emails for exam schedules and grade releases.</span>
                    </div>
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={form.emailNotifications}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                    <div>
                      <span className="font-bold text-on-surface block">In-App Notifications</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">Push live updates to the in-app notification center bell icon.</span>
                    </div>
                    <input
                      type="checkbox"
                      name="inAppNotifications"
                      checked={form.inAppNotifications}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                    <div>
                      <span className="font-bold text-on-surface block">Student Notifications</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">Enable automated alerts for student accounts.</span>
                    </div>
                    <input
                      type="checkbox"
                      name="studentNotifications"
                      checked={form.studentNotifications}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                    <div>
                      <span className="font-bold text-on-surface block">Staff Notifications</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">Enable question submission and approval alerts for faculty.</span>
                    </div>
                    <input
                      type="checkbox"
                      name="staffNotifications"
                      checked={form.staffNotifications}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer">
                    <div>
                      <span className="font-bold text-on-surface block">Admin Notifications</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">Receive system audit alerts and security log events.</span>
                    </div>
                    <input
                      type="checkbox"
                      name="adminNotifications"
                      checked={form.adminNotifications}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {saving ? 'Saving...' : 'Save Notification Preferences'}
                  </button>
                </div>
              </form>
            )}

            {/* MODULE 5: Security Settings */}
            {activeTab === 'security' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                <h3 className="text-base font-bold text-primary border-b border-primary/5 pb-2">
                  Platform Security & Session Rules
                </h3>

                <div className="space-y-4 font-semibold text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Session Timeout (Minutes)
                      </label>
                      <input
                        type="number"
                        name="sessionTimeout"
                        value={form.sessionTimeout}
                        onChange={handleChange}
                        min={1}
                        className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        Password Policy Strength
                      </label>
                      <select
                        name="passwordPolicyStrength"
                        value={form.passwordPolicyStrength}
                        onChange={handleChange}
                        className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                      >
                        <option value="Weak">Weak (Min 6 chars)</option>
                        <option value="Medium">Medium (Min 8 chars, numbers & letters)</option>
                        <option value="Strong">Strong (Min 10 chars, uppercase, special chars)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Max Failed Login Attempt Limit
                    </label>
                    <input
                      type="number"
                      name="loginAttemptLimit"
                      value={form.loginAttemptLimit}
                      onChange={handleChange}
                      min={1}
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono font-bold"
                    />
                  </div>

                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-primary/5 cursor-pointer mt-2">
                    <div>
                      <span className="font-bold text-on-surface block">Two-Factor Authentication (2FA)</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">Enforce 2FA OTP verification for admin and faculty logins.</span>
                    </div>
                    <input
                      type="checkbox"
                      name="twoFactorAuth"
                      checked={form.twoFactorAuth}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {saving ? 'Saving...' : 'Save Security Rules'}
                  </button>
                </div>
              </form>
            )}

            {/* MODULE 6: Backup & Restore */}
            {activeTab === 'backup' && (
              <div className="space-y-6 max-w-2xl">
                <h3 className="text-base font-bold text-primary border-b border-primary/5 pb-2">
                  Database Backup & System Recovery
                </h3>

                <div className="space-y-6">
                  {/* Download Card */}
                  <div className="p-5 bg-surface-container-low rounded-2xl border border-primary/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">download</span>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Download Full Database Backup</h4>
                        <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">
                          Export complete JSON payload containing users, exams, question banks, and evaluation logs.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-primary/5 text-xs font-semibold">
                      <span className="text-on-surface-variant font-mono text-[10px]">
                        Last Backup: {form.lastBackupTime ? new Date(form.lastBackupTime).toLocaleString() : 'Never'}
                      </span>
                      <button
                        onClick={handleDownloadBackup}
                        className="py-2.5 px-5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">cloud_download</span>
                        Download Backup JSON
                      </button>
                    </div>
                  </div>

                  {/* Restore Card */}
                  <div className="p-5 bg-surface-container-low rounded-2xl border border-primary/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-600 text-3xl">restore</span>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Restore Platform Backup</h4>
                        <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">
                          Upload a previously exported database backup JSON file to restore platform settings.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-primary/5">
                      <label className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl border border-amber-600/30 text-amber-700 bg-amber-50 hover:bg-amber-100/50 text-xs font-bold transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-base">upload_file</span>
                        Upload Backup File
                        <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 7: System Information */}
            {activeTab === 'system-info' && (
              <div className="space-y-6 max-w-2xl">
                <h3 className="text-base font-bold text-primary border-b border-primary/5 pb-2">
                  Live System Diagnostics
                </h3>

                {infoLoading || !systemInfo ? (
                  <div className="p-8 text-center space-y-3 animate-pulse">
                    <div className="h-6 bg-surface-container-high rounded w-1/2 mx-auto"></div>
                    <div className="h-4 bg-surface-container-high rounded w-1/3 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5 space-y-1">
                        <span className="text-[9px] font-mono uppercase text-on-surface-variant/60">Platform Version</span>
                        <span className="block font-extrabold text-lg text-primary font-mono">{systemInfo.platformVersion}</span>
                      </div>

                      <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5 space-y-1">
                        <span className="text-[9px] font-mono uppercase text-on-surface-variant/60">MongoDB Connection</span>
                        <span className="block font-bold text-sm text-green-700 font-mono flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                          {systemInfo.mongoDbStatus}
                        </span>
                      </div>

                      <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5 space-y-1">
                        <span className="text-[9px] font-mono uppercase text-on-surface-variant/60">Server Health</span>
                        <span className="block font-bold text-sm text-primary font-mono">{systemInfo.serverStatus}</span>
                      </div>

                      <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5 space-y-1">
                        <span className="text-[9px] font-mono uppercase text-on-surface-variant/60">Total Storage Used</span>
                        <span className="block font-extrabold text-lg text-indigo-700 font-mono">{systemInfo.totalStorageUsed}</span>
                      </div>
                    </div>

                    {systemInfo.dbStats && (
                      <div className="p-4 bg-white border border-primary/5 rounded-2xl space-y-2 text-xs font-mono font-semibold">
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold border-b border-primary/5 pb-1">
                          Database Storage Breakdown
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                          <div>
                            <span className="text-[8px] text-on-surface-variant/60 uppercase block">Collections</span>
                            <span className="font-bold text-sm text-primary">{systemInfo.dbStats.collections}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-on-surface-variant/60 uppercase block">Objects</span>
                            <span className="font-bold text-sm text-primary">{systemInfo.dbStats.objects}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-on-surface-variant/60 uppercase block">Avg Object Size</span>
                            <span className="font-bold text-sm text-primary">{systemInfo.dbStats.avgObjSize}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
