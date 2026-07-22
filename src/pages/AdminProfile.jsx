import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminProfile = () => {
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
        fetchProfile();
      }
    } catch (error) {
      toast.error('Failed to remove photo.', { id: removeToast });
    }
  };

  const getAvatarSrc = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    return `http://localhost:5000/${avatar}`;
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
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Administrator Profile</h2>
          <p className="text-on-surface-variant text-xs font-semibold">
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
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar & Upload controls */}
            <div className="flex flex-col items-center space-y-3 shrink-0">
              <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/5 flex items-center justify-center shadow-inner">
                {profile.avatar ? (
                  <img
                    src={getAvatarSrc(profile.avatar)}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-primary font-mono uppercase">
                    {profile.name?.charAt(0) || 'A'}
                  </span>
                )}
                <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-bold">
                  <span className="material-symbols-outlined text-xl">photo_camera</span>
                  Replace
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {profile.avatar && (
                  <>
                    <span className="text-on-surface-variant/30">•</span>
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
                  <h3 className="text-xl font-bold text-primary">{profile.name}</h3>
                  <p className="text-xs font-mono text-on-surface-variant font-semibold">
                    {profile.designation || 'Institution Admin'} | ID: {profile.employeeId || profile._id}
                  </p>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold font-mono uppercase">
                    {profile.role === 'Admin' ? 'Institution Admin' : profile.role}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 text-[10px] font-extrabold font-mono uppercase">
                    {profile.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold pt-1">
                <div>
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Email Address</span>
                  <span className="text-on-surface font-mono">{profile.email}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Phone Number</span>
                  <span className="text-on-surface font-mono">{profile.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Institution</span>
                  <span className="text-on-surface">
                    {profile.institution?.institutionName || 'Oxford Global University'} (
                    {profile.institution?.institutionCode || 'OGU'})
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Department</span>
                  <span className="text-on-surface">{profile.department?.name || 'All Academic Departments'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Last Login</span>
                  <span className="text-on-surface font-mono">
                    {profile.security?.lastLogin ? new Date(profile.security.lastLogin).toLocaleString() : 'Just now'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Account Created</span>
                  <span className="text-on-surface font-mono">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PROFILE STATISTICS */}
          {profile.stats && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-primary">Institution Quick Overview Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="p-3.5 glass-card bg-white rounded-[18px] border border-primary/5 shadow-sm text-center">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Depts</span>
                  <span className="font-extrabold text-xl text-primary font-mono block mt-1">{profile.stats.departmentsManaged}</span>
                </div>
                <div className="p-3.5 glass-card bg-white rounded-[18px] border border-primary/5 shadow-sm text-center">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Courses</span>
                  <span className="font-extrabold text-xl text-primary font-mono block mt-1">{profile.stats.courses}</span>
                </div>
                <div className="p-3.5 glass-card bg-white rounded-[18px] border border-primary/5 shadow-sm text-center">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Subjects</span>
                  <span className="font-extrabold text-xl text-primary font-mono block mt-1">{profile.stats.subjects}</span>
                </div>
                <div className="p-3.5 glass-card bg-white rounded-[18px] border border-primary/5 shadow-sm text-center">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Staff</span>
                  <span className="font-extrabold text-xl text-primary font-mono block mt-1">{profile.stats.staff}</span>
                </div>
                <div className="p-3.5 glass-card bg-white rounded-[18px] border border-primary/5 shadow-sm text-center">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Students</span>
                  <span className="font-extrabold text-xl text-primary font-mono block mt-1">{profile.stats.students}</span>
                </div>
                <div className="p-3.5 glass-card bg-white rounded-[18px] border border-primary/5 shadow-sm text-center">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Exams</span>
                  <span className="font-extrabold text-xl text-primary font-mono block mt-1">{profile.stats.examsConducted}</span>
                </div>
                <div className="p-3.5 glass-card bg-white rounded-[18px] border border-primary/5 shadow-sm text-center col-span-2 md:col-span-1">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Results</span>
                  <span className="font-extrabold text-xl text-green-700 font-mono block mt-1">{profile.stats.publishedResults}</span>
                </div>
              </div>
            </div>
          )}

          {/* EDIT PROFILE & CHANGE PASSWORD GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EDIT PROFILE FORM */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-primary border-b border-primary/5 pb-2">
                Edit Account Information
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Designation</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                {/* Read Only Fields */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant/50 uppercase">Email (Locked)</label>
                    <input
                      type="text"
                      disabled
                      value={profile.email}
                      className="p-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono cursor-not-allowed text-[11px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant/50 uppercase">ID (Locked)</label>
                    <input
                      type="text"
                      disabled
                      value={profile.employeeId || profile._id}
                      className="p-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono cursor-not-allowed text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* CHANGE PASSWORD FORM */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-primary border-b border-primary/5 pb-2">
                Change Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1 relative">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passForm.currentPassword}
                      onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                      required
                      className="w-full p-2.5 pr-10 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showCurrentPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 relative">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                      required
                      className="w-full p-2.5 pr-10 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showNewPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 relative">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                      required
                      className="w-full p-2.5 pr-10 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showConfirmPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Password Strength Validation Rules Checklist */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5 space-y-1 text-[10px] font-mono font-bold">
                  <span className="text-on-surface-variant block uppercase text-[9px] mb-1">Validation Checklist:</span>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={isMinLen ? 'text-green-700' : 'text-on-surface-variant/50'}>
                      {isMinLen ? '✓' : '○'} Min 8 Chars
                    </span>
                    <span className={hasUpper ? 'text-green-700' : 'text-on-surface-variant/50'}>
                      {hasUpper ? '✓' : '○'} Uppercase
                    </span>
                    <span className={hasLower ? 'text-green-700' : 'text-on-surface-variant/50'}>
                      {hasLower ? '✓' : '○'} Lowercase
                    </span>
                    <span className={hasNum ? 'text-green-700' : 'text-on-surface-variant/50'}>
                      {hasNum ? '✓' : '○'} Number
                    </span>
                    <span
                      className={`col-span-2 ${hasSpecial ? 'text-green-700' : 'text-on-surface-variant/50'
                        }`}
                    >
                      {hasSpecial ? '✓' : '○'} Special Symbol (!@#$)
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={savingPass}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">lock_reset</span>
                    {savingPass ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* PREFERENCES & SECURITY ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PROFILE PREFERENCES */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-primary border-b border-primary/5 pb-2">
                User Preferences
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Theme Mode</label>
                  <select
                    value={editForm.theme}
                    onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                    className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  >
                    <option value="Light">Light Theme</option>
                    <option value="Dark">Dark Mode</option>
                    <option value="System">System Default</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Display Language</label>
                  <select
                    value={editForm.language}
                    onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  >
                    <option value="English">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Time Zone</label>
                  <select
                    value={editForm.timeZone}
                    onChange={(e) => setEditForm({ ...editForm, timeZone: e.target.value })}
                    className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-mono"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="IST">IST (India Standard Time +5:30)</option>
                    <option value="EST">EST (Eastern Standard Time -5:00)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Notification Channel</label>
                  <select
                    value={editForm.notificationPreference}
                    onChange={(e) => setEditForm({ ...editForm, notificationPreference: e.target.value })}
                    className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
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
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-primary border-b border-primary/5 pb-2">
                Account Security Status
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Last Login Timestamp</span>
                  <span className="font-bold text-primary font-mono text-[11px] block mt-0.5">
                    {profile.security?.lastLogin ? new Date(profile.security.lastLogin).toLocaleString() : 'Active session'}
                  </span>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Last Password Change</span>
                  <span className="font-bold text-primary font-mono text-[11px] block mt-0.5">
                    {profile.security?.lastPasswordChanged ? new Date(profile.security.lastPasswordChanged).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Active Session State</span>
                  <span className="font-bold text-green-700 font-mono text-[11px] block mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    Active (Single Device)
                  </span>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">JWT Session Key</span>
                  <span className="font-bold text-indigo-700 font-mono text-[11px] block mt-0.5">
                    {profile.security?.jwtStatus || 'Valid Token'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY AUDIT LOG */}
          <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-primary border-b border-primary/5 pb-2">
              Recent Account Audit Logs
            </h3>

            <div className="space-y-2">
              {!profile.recentActivity || profile.recentActivity.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-4 text-center">No recent audit activity recorded.</p>
              ) : (
                profile.recentActivity.map((act) => (
                  <div key={act._id} className="p-3 bg-surface-container-low/60 rounded-xl border border-primary/5 flex items-center justify-between gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-base">history</span>
                      <div>
                        <p className="text-on-surface font-bold">{act.action}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono">{act.details}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-on-surface-variant/60 font-mono shrink-0">
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
