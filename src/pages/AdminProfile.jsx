import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Shield, Camera, Lock, Eye, EyeOff, Save, Trash2, Key, Info, Terminal, Settings
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminProfile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Form
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    designation: '',
    theme: 'Light',
    language: 'English',
    timeZone: 'UTC',
    notificationPreference: 'Both',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Form
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile');
      if (response.data && response.data.success) {
        const u = response.data.data;
        setProfile(u);
        setEditForm({
          name: u.name || '',
          phone: u.phone || '',
          designation: u.designation || 'Institution Admin',
          theme: u.preferences?.theme || 'Light',
          language: u.preferences?.language || 'English',
          timeZone: u.preferences?.timeZone || 'UTC',
          notificationPreference: u.preferences?.notificationPreference || 'Both',
        });
      }
    } catch (error) {
      toast.error('Failed to load admin profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Profile Details & Preferences
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const saveToast = toast.loading('Updating profile details...');

    try {
      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        designation: editForm.designation,
        preferences: {
          theme: editForm.theme,
          language: editForm.language,
          timeZone: editForm.timeZone,
          notificationPreference: editForm.notificationPreference,
        },
      };

      const response = await api.put('/profile', payload);
      if (response.data && response.data.success) {
        toast.success('Profile details updated successfully!', { id: saveToast });
        if (typeof updateUser === 'function') {
          updateUser(response.data.data);
        }
        fetchProfile();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.', { id: saveToast });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    // Client Password Validation
    const { newPassword } = passForm;
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter (a-z).');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number (0-9).');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      toast.error('Password must contain at least one special character (!@#$%^&*...).');
      return;
    }

    setSavingPass(true);
    const passToast = toast.loading('Updating account password...');

    try {
      const response = await api.put('/profile/change-password', passForm);
      if (response.data && response.data.success) {
        toast.success('Password updated successfully!', { id: passToast });
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to change password.', { id: passToast });
    } finally {
      setSavingPass(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const photoToast = toast.loading('Uploading profile photo...');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        toast.success('Profile photo uploaded successfully!', { id: photoToast });
        if (typeof updateUser === 'function') {
          updateUser(response.data.data);
        }
        fetchProfile();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload photo.', { id: photoToast });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove Photo Handler
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    const removeToast = toast.loading('Removing profile photo...');
    try {
      const response = await api.delete('/profile/photo');
      if (response.data && response.data.success) {
        toast.success('Profile photo removed.', { id: removeToast });
        if (typeof updateUser === 'function') {
          updateUser({ avatar: '', profileImage: '', photoUrl: '' });
        }
        fetchProfile();
      }
    } catch (error) {
      toast.error('Failed to remove photo.', { id: removeToast });
    }
  };

  const getAvatarSrc = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:5000';
    return `${baseUrl}/${avatar}`;
  };

  // Password rules validation check helpers
  const pass = passForm.newPassword;
  const isMinLen = pass.length >= 8;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNum = /[0-9]/.test(pass);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
            <User size={12} />
            Identity Management
          </div>
          <h2 className="text-2xl font-black text-[#111111] leading-none">Administrator Profile</h2>
          <p className="text-[13px] text-[#6B7280] mt-1.5">
            Manage your personal administrative credentials, institution preferences, security keys, and audit logs.
          </p>
        </div>
      </div>

      {loading || !profile ? (
        <div className="p-12 space-y-4 animate-pulse">
          <div className="h-28 bg-surface-container-high rounded-[20px]"></div>
          <div className="h-64 bg-surface-container-high rounded-[24px]"></div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* PROFILE OVERVIEW CARD */}
          <div className="card-flat p-6 bg-white flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar & Upload controls */}
            <div className="flex flex-col items-center space-y-3 shrink-0">
              <div className="relative group w-24 h-24 rounded-full overflow-hidden border border-primary/10 bg-[#FAF8F7] flex items-center justify-center shadow-inner">
                {profile.avatar ? (
                  <img
                    src={getAvatarSrc(profile.avatar)}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-[#8B1E3F] font-mono uppercase">
                    {profile.name?.charAt(0) || 'A'}
                  </span>
                )}
                <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-bold">
                  <Camera size={16} className="mb-1" />
                  Replace
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-[#8B1E3F] hover:underline cursor-pointer">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {profile.avatar && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button
                      onClick={handleRemovePhoto}
                      className="text-[10px] font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Main Info Overview */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-primary/5 pb-3">
                <div>
                  <h3 className="text-xl font-black text-[#111111]">{profile.name}</h3>
                  <p className="text-xs font-mono text-[#6B7280] font-semibold">
                    {profile.designation || 'Institution Admin'} | ID: {profile.employeeId || profile._id}
                  </p>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <span className="badge badge-wine uppercase">
                    {profile.role === 'Admin' ? 'Institution Admin' : profile.role}
                  </span>
                  <span className="badge badge-green uppercase">
                    {profile.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold pt-1">
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block mb-0.5">Email Address</span>
                  <span className="text-[#111111] font-mono">{profile.email}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block mb-0.5">Phone Number</span>
                  <span className="text-[#111111] font-mono">{profile.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block mb-0.5">Institution</span>
                  <span className="text-[#111111]">
                    {profile.institution?.institutionName || 'Oxford Global University'} (
                    {profile.institution?.institutionCode || 'OGU'})
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block mb-0.5">Department</span>
                  <span className="text-[#111111]">{profile.department?.name || 'All Academic Departments'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block mb-0.5">Last Login</span>
                  <span className="text-[#111111] font-mono">
                    {profile.security?.lastLogin ? new Date(profile.security.lastLogin).toLocaleString() : 'Just now'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block mb-0.5">Account Created</span>
                  <span className="text-[#111111] font-mono">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PROFILE STATISTICS */}
          {profile.stats && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono font-bold uppercase text-[#9CA3AF]">Institution Quick Overview Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="stat-card p-3.5 text-center bg-white">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block font-bold">Depts</span>
                  <span className="font-black text-xl text-[#8B1E3F] font-mono block mt-1">{profile.stats.departmentsManaged}</span>
                </div>
                <div className="stat-card p-3.5 text-center bg-white">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block font-bold">Courses</span>
                  <span className="font-black text-xl text-[#8B1E3F] font-mono block mt-1">{profile.stats.courses}</span>
                </div>
                <div className="stat-card p-3.5 text-center bg-white">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block font-bold">Subjects</span>
                  <span className="font-black text-xl text-[#8B1E3F] font-mono block mt-1">{profile.stats.subjects}</span>
                </div>
                <div className="stat-card p-3.5 text-center bg-white">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block font-bold">Staff</span>
                  <span className="font-black text-xl text-[#8B1E3F] font-mono block mt-1">{profile.stats.staff}</span>
                </div>
                <div className="stat-card p-3.5 text-center bg-white">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block font-bold">Students</span>
                  <span className="font-black text-xl text-[#8B1E3F] font-mono block mt-1">{profile.stats.students}</span>
                </div>
                <div className="stat-card p-3.5 text-center bg-white">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block font-bold">Exams</span>
                  <span className="font-black text-xl text-[#8B1E3F] font-mono block mt-1">{profile.stats.examsConducted}</span>
                </div>
                <div className="stat-card p-3.5 text-center col-span-2 md:col-span-1 bg-white">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block font-bold">Results</span>
                  <span className="font-black text-xl text-emerald-700 font-mono block mt-1">{profile.stats.publishedResults}</span>
                </div>
              </div>
            </div>
          )}

          {/* EDIT PROFILE & CHANGE PASSWORD GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EDIT PROFILE FORM */}
            <div className="card-flat p-5 bg-white space-y-4">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                <Settings size={14} className="text-[#8B1E3F]" />
                <h3 className="text-xs font-mono font-bold uppercase text-[#111111]">
                  Edit Account Information
                </h3>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold font-sans">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Full Name</span>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="p-2.5 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs text-[#111111]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Phone Number</span>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="p-2.5 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs font-mono text-[#111111]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Designation</span>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="p-2.5 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs text-[#111111]"
                  />
                </div>

                {/* Read Only Fields */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Email (Locked)</span>
                    <input
                      type="text"
                      disabled
                      value={profile.email}
                      className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 font-mono cursor-not-allowed text-[11px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">ID (Locked)</span>
                    <input
                      type="text"
                      disabled
                      value={profile.employeeId || profile._id}
                      className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 font-mono cursor-not-allowed text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary w-full py-2.5 rounded-[12px] text-[12.5px] flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} />
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* CHANGE PASSWORD FORM */}
            <div className="card-flat p-5 bg-white space-y-4">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                <Lock size={14} className="text-[#8B1E3F]" />
                <h3 className="text-xs font-mono font-bold uppercase text-[#111111]">
                  Change Password
                </h3>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold font-sans">
                <div className="flex flex-col gap-1 relative">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Current Password</span>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passForm.currentPassword}
                      onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                      required
                      className="w-full p-2.5 pr-10 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs font-mono text-[#111111]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#8B1E3F]"
                    >
                      {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 relative">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">New Password</span>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                      required
                      className="w-full p-2.5 pr-10 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs font-mono text-[#111111]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#8B1E3F]"
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 relative">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Confirm New Password</span>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                      required
                      className="w-full p-2.5 pr-10 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs font-mono text-[#111111]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#8B1E3F]"
                    >
                      {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Validation Rules Checklist */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-[10px] font-mono font-bold">
                  <span className="text-[#9CA3AF] block uppercase text-[9px] mb-1">Validation Checklist:</span>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={isMinLen ? 'text-green-700' : 'text-gray-300'}>
                      {isMinLen ? '✓' : '○'} Min 8 Chars
                    </span>
                    <span className={hasUpper ? 'text-green-700' : 'text-gray-300'}>
                      {hasUpper ? '✓' : '○'} Uppercase
                    </span>
                    <span className={hasLower ? 'text-green-700' : 'text-gray-300'}>
                      {hasLower ? '✓' : '○'} Lowercase
                    </span>
                    <span className={hasNum ? 'text-green-700' : 'text-gray-300'}>
                      {hasNum ? '✓' : '○'} Number
                    </span>
                    <span
                      className={`col-span-2 ${hasSpecial ? 'text-green-700' : 'text-gray-300'}`}
                    >
                      {hasSpecial ? '✓' : '○'} Special Symbol (!@#$)
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={savingPass}
                    className="btn-primary w-full py-2.5 rounded-[12px] text-[12.5px] flex items-center justify-center gap-1.5"
                  >
                    <Key size={14} />
                    {savingPass ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* PREFERENCES & SECURITY ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PROFILE PREFERENCES */}
            <div className="card-flat p-5 bg-white space-y-4">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                <Settings size={14} className="text-[#8B1E3F]" />
                <h3 className="text-xs font-mono font-bold uppercase text-[#111111]">
                  User Preferences
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold font-sans">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Theme Mode</span>
                  <select
                    value={editForm.theme}
                    onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                    className="select"
                  >
                    <option value="Light">Light Theme</option>
                    <option value="Dark">Dark Mode</option>
                    <option value="System">System Default</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Display Language</span>
                  <select
                    value={editForm.language}
                    onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    className="select"
                  >
                    <option value="English">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Time Zone</span>
                  <select
                    value={editForm.timeZone}
                    onChange={(e) => setEditForm({ ...editForm, timeZone: e.target.value })}
                    className="select font-mono"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="IST">IST (India Standard Time +5:30)</option>
                    <option value="EST">EST (Eastern Standard Time -5:00)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Notification Channel</span>
                  <select
                    value={editForm.notificationPreference}
                    onChange={(e) => setEditForm({ ...editForm, notificationPreference: e.target.value })}
                    className="select"
                  >
                    <option value="Both">Both (Email & In-App)</option>
                    <option value="Email">Email Only</option>
                    <option value="In-App">In-App Alerts Only</option>
                    <option value="None">Mute All</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACCOUNT SECURITY CARD */}
            <div className="card-flat p-5 bg-white space-y-4">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                <Shield size={14} className="text-[#8B1E3F]" />
                <h3 className="text-xs font-mono font-bold uppercase text-[#111111]">
                  Account Security Status
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold font-sans">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block">Last Login Timestamp</span>
                  <span className="font-bold text-[#8B1E3F] font-mono text-[11px] block mt-0.5">
                    {profile.security?.lastLogin ? new Date(profile.security.lastLogin).toLocaleString() : 'Active session'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block">Last Password Change</span>
                  <span className="font-bold text-[#8B1E3F] font-mono text-[11px] block mt-0.5">
                    {profile.security?.lastPasswordChanged ? new Date(profile.security.lastPasswordChanged).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block">Active Session State</span>
                  <span className="font-bold text-green-700 font-mono text-[11px] block mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    Active (Single Device)
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block">JWT Session Key</span>
                  <span className="font-bold text-indigo-700 font-mono text-[11px] block mt-0.5">
                    {profile.security?.jwtStatus || 'Valid Token'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY AUDIT LOG */}
          <div className="card-flat p-5 bg-white space-y-4">
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              <Terminal size={14} className="text-[#8B1E3F]" />
              <h3 className="text-xs font-mono font-bold uppercase text-[#111111]">
                Recent Account Audit Logs
              </h3>
            </div>

            <div className="space-y-2">
              {!profile.recentActivity || profile.recentActivity.length === 0 ? (
                <p className="text-xs text-[#6B7280] p-4 text-center">No recent audit activity recorded.</p>
              ) : (
                profile.recentActivity.map((act) => (
                  <div key={act._id} className="p-3 bg-[#FAF8F7]/50 rounded-xl border border-primary/5 flex items-center justify-between gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-2.5">
                      <Terminal size={12} className="text-[#8B1E3F]" />
                      <div>
                        <p className="text-[#111111] font-bold">{act.action}</p>
                        <p className="text-[10px] text-[#6B7280] font-mono">{act.details}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-[#6B7280] font-mono shrink-0">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
