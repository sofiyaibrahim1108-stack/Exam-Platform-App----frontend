import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StaffProfile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Form hooks
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setValueProfile,
    formState: { errors: errorsProfile },
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword },
    watch: watchPassword,
  } = useForm();

  // Load profile
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile');
      console.log("PROFILE RESPONSE:", response);
      if (response.data && response.data.success) {
        const u = response.data.data;
        setProfile(u);
        setAvatarPreview(u.avatar ? `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/${u.avatar}` : '');

        // Prepopulate forms
        setValueProfile('name', u.name || '');
        setValueProfile('phone', u.phone || '');
        setValueProfile('designation', u.staffDetails?.designation || '');
        setValueProfile('qualification', u.staffDetails?.qualification || '');
      }
    } catch (error) {
  console.log("PROFILE ERROR:", error);
  toast.error(error.message || "Failed to retrieve profile details.");
} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update profile handler
  const onProfileSubmit = async (data) => {
    setUpdating(true);
    const toastId = toast.loading('Updating profile details...');
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone);
      formData.append('designation', data.designation);
      formData.append('qualification', data.qualification);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await api.put('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        setProfile(response.data.data);
        // Sync context user
        // if (login) {
        //   login(response.data.data);
        // }
        toast.success('Profile details updated successfully.', { id: toastId });
        setAvatarFile(null);
        fetchProfile();
      }
    }catch (error) {
  console.log(error);
  toast.error(error.response?.data?.message || error.message);
}finally {
      setUpdating(false);
    }
  };

  // Avatar file input handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Password change handler
  const onPasswordSubmit = async (data) => {
    const toastId = toast.loading('Changing account password...');
    try {
      await api.patch('/profile/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully!', { id: toastId });
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password update failed.', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-[24px] animate-pulse">
          <div className="h-8 bg-surface-container-high rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-[24px] space-y-4 animate-pulse">
            <div className="h-24 bg-surface-container-high rounded-full w-24 mx-auto"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-surface-container-high rounded"></div>
              <div className="h-10 bg-surface-container-high rounded"></div>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-[24px] space-y-4 animate-pulse">
            <div className="h-6 bg-surface-container-high rounded w-1/2"></div>
            <div className="h-10 bg-surface-container-high rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="glass-panel p-6 rounded-[24px]">
        <h2 className="text-2xl font-bold text-primary mb-1">Profile Management</h2>
        <p className="text-on-surface-variant text-xs">
          Manage your personal details, workspace credentials, contact numbers, and security keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6 rounded-[24px] space-y-6 shadow-sm border border-primary/5"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-primary/5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-primary/10 overflow-hidden bg-primary/5 flex items-center justify-center text-primary font-bold text-3xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0).toUpperCase() || 'F'
                )}
              </div>
              <label className="absolute inset-0 bg-black/45 backdrop-blur-xs rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center items-center text-white cursor-pointer select-none">
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                <span className="text-[9px] font-mono mt-0.5">Upload</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">{profile?.name}</h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {profile?.staffDetails?.designation || 'Faculty Member'} — {profile?.staffDetails?.department?.name || 'Academic Department'}
              </p>
              {avatarFile && (
                <p className="text-[10px] font-mono text-secondary font-bold mt-2 animate-pulse">
                  Selected: {avatarFile.name} (Save to apply changes)
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div>
                <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Employee ID (Read-only)</label>
                <input
                  type="text"
                  value={profile?.staffDetails?.employeeId || ''}
                  disabled
                  className="w-full input-underline py-2 focus:ring-0 text-sm bg-transparent border-b border-outline-variant text-on-surface/50 font-mono cursor-not-allowed"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Name *</label>
                <input
                  {...registerProfile('name', { required: 'Name is required' })}
                  className="w-full input-underline py-2 focus:ring-0 text-sm"
                  placeholder="e.g. Dr. John Doe"
                />
                {errorsProfile.name && <span className="text-error text-xs block font-mono mt-1">{errorsProfile.name.message}</span>}
              </div>

              {/* Email */}
              <div>
                <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Academic Email (Read-only)</label>
                <input
                  type="text"
                  value={profile?.email || ''}
                  disabled
                  className="w-full input-underline py-2 focus:ring-0 text-sm bg-transparent border-b border-outline-variant text-on-surface/50 font-mono cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone Number</label>
                <input
                  {...registerProfile('phone')}
                  className="w-full input-underline py-2 focus:ring-0 text-sm"
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department (Read-only)</label>
                <input
                  type="text"
                  value={profile?.staffDetails?.department?.name || ''}
                  disabled
                  className="w-full input-underline py-2 focus:ring-0 text-sm bg-transparent border-b border-outline-variant text-on-surface/50 cursor-not-allowed"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Designation</label>
                <input
                  {...registerProfile('designation')}
                  className="w-full input-underline py-2 focus:ring-0 text-sm"
                  placeholder="e.g. Assistant Professor"
                />
              </div>

              {/* Qualification */}
              <div className="md:col-span-2">
                <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Qualifications</label>
                <input
                  {...registerProfile('qualification')}
                  className="w-full input-underline py-2 focus:ring-0 text-sm"
                  placeholder="e.g. Ph.D. in Computer Science & Engineering"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-primary/5">
              <button
                type="submit"
                disabled={updating}
                className="bg-primary text-white py-2.5 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-50 text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>

        {/* Change Password Block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-[24px] space-y-6 shadow-sm border border-primary/5 h-fit"
        >
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">security</span>
              Security & Credentials
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-1">Change password parameters regularly to retain security clearance.</p>
          </div>

          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Current Password *</label>
              <input
                type="password"
                {...registerPassword('currentPassword', { required: 'Current password is required' })}
                className="w-full input-underline py-2 focus:ring-0 text-sm"
                placeholder="••••••••"
              />
              {errorsPassword.currentPassword && (
                <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsPassword.currentPassword.message}</span>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">New Password *</label>
              <input
                type="password"
                {...registerPassword('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters long' },
                })}
                className="w-full input-underline py-2 focus:ring-0 text-sm"
                placeholder="••••••••"
              />
              {errorsPassword.newPassword && (
                <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsPassword.newPassword.message}</span>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Confirm Password *</label>
              <input
                type="password"
                {...registerPassword('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (value) => value === watchPassword('newPassword') || 'Passwords do not match',
                })}
                className="w-full input-underline py-2 focus:ring-0 text-sm"
                placeholder="••••••••"
              />
              {errorsPassword.confirmPassword && (
                <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsPassword.confirmPassword.message}</span>
              )}
            </div>

            <div className="pt-4 border-t border-primary/5 flex justify-end">
              <button
                type="submit"
                className="bg-primary text-white py-2 px-4 rounded-xl text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                Change Password
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default StaffProfile;
