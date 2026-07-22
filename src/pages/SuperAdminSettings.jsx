import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const SuperAdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Load current global settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        if (response.data && response.data.success) {
          // Pre-populate forms
          const settings = response.data.data;
          reset({
            platformName: settings.platformName,
            supportEmail: settings.supportEmail,
            supportPhone: settings.supportPhone || '',
            timezone: settings.timezone || 'UTC',
            smtpHost: settings.smtpHost || '',
            smtpPort: settings.smtpPort || 587,
            smtpUsername: settings.smtpUsername || '',
            smtpPassword: settings.smtpPassword || '',
            jwtAccessExpiry: settings.jwtAccessExpiry || '15m',
            jwtRefreshExpiry: settings.jwtRefreshExpiry || '7d',
            sessionTimeout: settings.sessionTimeout || 30,
            maintenanceMode: settings.maintenanceMode || false,
            // Nested policy parameters
            passwordPolicyMinLength: settings.passwordPolicy?.minLength || 8,
            passwordPolicyUppercase: settings.passwordPolicy?.requireUppercase ?? true,
            passwordPolicyLowercase: settings.passwordPolicy?.requireLowercase ?? true,
            passwordPolicyNumbers: settings.passwordPolicy?.requireNumbers ?? true,
            passwordPolicySpecial: settings.passwordPolicy?.requireSpecialChars ?? true,
          });
        }
      } catch (error) {
        toast.error('Failed to load global configurations.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  // SAVE settings Action
  const onSaveSettings = async (formData) => {
    setSaving(true);
    const toastId = toast.loading('Saving configurations...');
    try {
      // Re-map flat form fields back into nested passwordPolicy object
      const payload = {
        platformName: formData.platformName,
        supportEmail: formData.supportEmail,
        supportPhone: formData.supportPhone,
        timezone: formData.timezone,
        smtpHost: formData.smtpHost,
        smtpPort: Number(formData.smtpPort),
        smtpUsername: formData.smtpUsername,
        smtpPassword: formData.smtpPassword,
        jwtAccessExpiry: formData.jwtAccessExpiry,
        jwtRefreshExpiry: formData.jwtRefreshExpiry,
        sessionTimeout: Number(formData.sessionTimeout),
        maintenanceMode: formData.maintenanceMode,
        passwordPolicy: {
          minLength: Number(formData.passwordPolicyMinLength),
          requireUppercase: formData.passwordPolicyUppercase,
          requireLowercase: formData.passwordPolicyLowercase,
          requireNumbers: formData.passwordPolicyNumbers,
          requireSpecialChars: formData.passwordPolicySpecial,
        },
      };

      // Since settings update supports files, if we wanted to support upload we would use FormData.
      // But standard JSON updates are clean for properties.
      await api.put('/settings', payload);
      toast.success('Platform configurations saved successfully!', { id: toastId });
    } catch (error) {
      toast.error(error.message || 'Saving configuration profiles failed.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-surface animate-pulse rounded-xl w-64"></div>
        <div className="h-64 bg-surface animate-pulse rounded-[24px] w-full"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General Configuration', icon: 'settings' },
    { id: 'smtp', label: 'SMTP Config', icon: 'mail' },
    { id: 'jwt', label: 'JWT Duration', icon: 'key' },
    { id: 'security', label: 'Security & Timeout', icon: 'security' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header HERO */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary">Global Platform Settings</h2>
        <p className="text-on-surface-variant text-sm mt-1">Configure SMTP email server settings, token expiries, and password complexity parameters.</p>
      </div>

      <form onSubmit={handleSubmit(onSaveSettings)} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Tabs */}
        <div className="flex flex-col space-y-1 bg-surface-container-low/50 p-4 rounded-[24px] border border-primary/5 h-fit lg:col-span-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/10'
                  : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents viewport */}
        <div className="glass-panel p-8 rounded-[24px] border border-primary/5 lg:col-span-3 space-y-8">
          
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-primary pb-2 border-b border-primary/5">General Platform Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Platform Name</label>
                  <input
                    {...register('platformName', { required: 'Platform name is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                  />
                  {errors.platformName && <span className="text-error text-xs font-mono mt-1">{errors.platformName.message}</span>}
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">System Timezone</label>
                  <select
                    {...register('timezone')}
                    className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base outline-none cursor-pointer"
                  >
                    <option value="UTC">UTC (Universal Time Coordinate)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="IST">IST (Indian Standard Time)</option>
                    <option value="GMT">GMT (Greenwich Mean Time)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Support Email</label>
                  <input
                    {...register('supportEmail', { required: 'Support email is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="email"
                  />
                  {errors.supportEmail && <span className="text-error text-xs font-mono mt-1">{errors.supportEmail.message}</span>}
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Support Phone</label>
                  <input
                    {...register('supportPhone')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SMTP CONFIGURATION */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-primary pb-2 border-b border-primary/5">SMTP Mail Server Config</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Host Name</label>
                  <input
                    {...register('smtpHost')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">SMTP Port</label>
                  <input
                    {...register('smtpPort')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="number"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Username / Key</label>
                  <input
                    {...register('smtpUsername')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    placeholder="smtp-user-id"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Password</label>
                  <input
                    {...register('smtpPassword')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="password"
                    placeholder="••••••••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          {/* JWT EXPIRY DURATION */}
          {activeTab === 'jwt' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-primary pb-2 border-b border-primary/5">JWT Security Tokens Config</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Access Token Expiry</label>
                  <input
                    {...register('jwtAccessExpiry', { required: 'Expiry is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    placeholder="e.g. 15m"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Refresh Token Expiry</label>
                  <input
                    {...register('jwtRefreshExpiry', { required: 'Expiry is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    placeholder="e.g. 7d"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & TIMEOUT */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-primary pb-2 border-b border-primary/5">Security Constraints & Timings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session Timeout */}
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Session Timeout (Minutes)</label>
                  <input
                    {...register('sessionTimeout')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="number"
                    placeholder="30"
                  />
                </div>

                {/* Maintenance Toggle */}
                <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-primary/5 h-fit mt-3">
                  <div>
                    <p className="font-semibold text-sm text-primary">System Maintenance Mode</p>
                    <p className="text-[10px] text-on-surface-variant">Lock all dashboard actions except Super Admin.</p>
                  </div>
                  <input
                    {...register('maintenanceMode')}
                    type="checkbox"
                    className="w-4 h-4 text-primary focus:ring-primary border-primary/10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Password complexity metrics */}
              <div className="space-y-4 pt-4 border-t border-primary/5">
                <p className="font-mono text-[10px] font-semibold text-on-surface-variant uppercase px-1">Complex Password Policies</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Minimum Characters Length</label>
                    <input
                      {...register('passwordPolicyMinLength')}
                      className="w-20 input-underline py-2 focus:ring-0 text-sm"
                      type="number"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3 text-xs font-semibold text-on-surface cursor-pointer">
                      <input {...register('passwordPolicyUppercase')} type="checkbox" className="w-3.5 h-3.5 text-primary border-primary/10 rounded" />
                      Require Capital Uppercase letter (A-Z)
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-on-surface cursor-pointer">
                      <input {...register('passwordPolicyLowercase')} type="checkbox" className="w-3.5 h-3.5 text-primary border-primary/10 rounded" />
                      Require Lowercase letter (a-z)
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-on-surface cursor-pointer">
                      <input {...register('passwordPolicyNumbers')} type="checkbox" className="w-3.5 h-3.5 text-primary border-primary/10 rounded" />
                      Require Numerical number (0-9)
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-on-surface cursor-pointer">
                      <input {...register('passwordPolicySpecial')} type="checkbox" className="w-3.5 h-3.5 text-primary border-primary/10 rounded" />
                      Require Special Character Symbol (@, #, $)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex gap-4 justify-end pt-6 border-t border-primary/10 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white py-3.5 px-8 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all text-sm disabled:opacity-45 shadow-lg shadow-primary/10"
            >
              {saving ? 'Syncing...' : 'Save Configuration Settings'}
            </button>
          </div>

        </div>

      </form>
      
    </div>
  );
};

export default SuperAdminSettings;
