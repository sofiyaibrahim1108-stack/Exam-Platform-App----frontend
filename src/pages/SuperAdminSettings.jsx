import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Settings, Mail, Key, Shield, Info, Check, Clock, Laptop } from 'lucide-react';
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
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-xl w-64"></div>
        <div className="h-64 bg-gray-105 rounded-[24px] w-full"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General Configuration', icon: Settings },
    { id: 'smtp', label: 'SMTP Config', icon: Mail },
    { id: 'jwt', label: 'JWT Duration', icon: Key },
    { id: 'security', label: 'Security & Timeout', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header HERO */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)]">
        <h2 className="text-xl font-extrabold text-[#8B1538]">Global Platform Settings</h2>
        <p className="text-gray-500 text-xs mt-0.5 font-semibold">Configure SMTP email server settings, token expiries, and password complexity parameters.</p>
      </div>

      <form onSubmit={handleSubmit(onSaveSettings)} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar Tabs */}
        <div className="flex flex-col space-y-1 bg-white p-4 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.02)] h-fit lg:col-span-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                  isSelected
                    ? 'bg-[#8B1538] text-white shadow-md shadow-[#8B1538]/10'
                    : 'text-gray-500 hover:bg-[#8B1538]/5 hover:text-[#8B1538]'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab contents viewport */}
        <div className="bg-white p-8 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] lg:col-span-3 space-y-6">
          
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-[#8B1538] pb-2 border-b border-gray-100">General Platform Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Platform Name</label>
                  <input
                    {...register('platformName', { required: 'Platform name is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                  />
                  {errors.platformName && <span className="text-red-500 text-xs block font-mono mt-1">{errors.platformName.message}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">System Timezone</label>
                  <select
                    {...register('timezone')}
                    className="w-full input-underline py-2 focus:ring-0 text-base font-semibold text-gray-700 bg-white"
                  >
                    <option value="UTC">UTC (Universal Time Coordinate)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="IST">IST (Indian Standard Time)</option>
                    <option value="GMT">GMT (Greenwich Mean Time)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Support Email</label>
                  <input
                    {...register('supportEmail', { required: 'Support email is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="email"
                  />
                  {errors.supportEmail && <span className="text-red-500 text-xs block font-mono mt-1">{errors.supportEmail.message}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Support Phone</label>
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
              <h3 className="text-sm font-extrabold text-[#8B1538] pb-2 border-b border-gray-100">SMTP Mail Server Config</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Host Name</label>
                  <input
                    {...register('smtpHost')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">SMTP Port</label>
                  <input
                    {...register('smtpPort')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="number"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Username / Key</label>
                  <input
                    {...register('smtpUsername')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    placeholder="smtp-user-id"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Password</label>
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
              <h3 className="text-sm font-extrabold text-[#8B1538] pb-2 border-b border-gray-100">JWT Security Tokens Config</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Access Token Expiry</label>
                  <input
                    {...register('jwtAccessExpiry', { required: 'Expiry is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    placeholder="e.g. 15m"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Refresh Token Expiry</label>
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
              <h3 className="text-sm font-extrabold text-[#8B1538] pb-2 border-b border-gray-100">Security Constraints & Timings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session Timeout */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Session Timeout (Minutes)</label>
                  <input
                    {...register('sessionTimeout')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="number"
                    placeholder="30"
                  />
                </div>

                {/* Maintenance Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-150 h-fit">
                  <div>
                    <p className="font-bold text-xs text-gray-800">System Maintenance Mode</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Lock all dashboard actions except Super Admin.</p>
                  </div>
                  <input
                    {...register('maintenanceMode')}
                    type="checkbox"
                    className="w-4 h-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Password complexity metrics */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Complex Password Policies</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Minimum Characters Length</label>
                    <input
                      {...register('passwordPolicyMinLength')}
                      className="w-20 input-underline py-2 focus:ring-0 text-sm"
                      type="number"
                    />
                  </div>

                  <div className="space-y-3 font-semibold text-xs text-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input {...register('passwordPolicyUppercase')} type="checkbox" className="w-3.5 h-3.5 text-[#8B1538] border-gray-300 focus:ring-[#8B1538] rounded" />
                      Require Capital Uppercase letter (A-Z)
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input {...register('passwordPolicyLowercase')} type="checkbox" className="w-3.5 h-3.5 text-[#8B1538] border-gray-300 focus:ring-[#8B1538] rounded" />
                      Require Lowercase letter (a-z)
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input {...register('passwordPolicyNumbers')} type="checkbox" className="w-3.5 h-3.5 text-[#8B1538] border-gray-300 focus:ring-[#8B1538] rounded" />
                      Require Numerical number (0-9)
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input {...register('passwordPolicySpecial')} type="checkbox" className="w-3.5 h-3.5 text-[#8B1538] border-gray-300 focus:ring-[#8B1538] rounded" />
                      Require Special Character Symbol (@, #, $)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-100 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#8B1538] hover:bg-[#720F2B] text-white py-2 px-6 rounded-xl font-bold text-xs transition-all disabled:opacity-45 shadow-md shadow-[#8B1538]/10"
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
