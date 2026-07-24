import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Camera, Save, Lock, Shield, User, Mail, Phone, Award, Building2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StaffProfile = () => {
  const { user: authUser, updateUser } = useAuth(); // 👈 pull updateUser from context
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
      console.log("PROFILE RESPONSE:", data);
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
        const updatedUser = response.data.data;

        setProfile(updatedUser);

        // 👇 THIS IS THE FIX: push the fresh data into AuthContext
        // so the navbar avatar/name and sidebar avatar/name update instantly
        if (typeof updateUser === 'function') {
          updateUser(updatedUser);
        }

        toast.success('Profile details updated successfully.', { id: toastId });
        setAvatarFile(null);
        fetchProfile();
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
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
      <div className="space-y-6 font-sans">
        <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] space-y-4 animate-pulse">
            <div className="h-24 bg-gray-100 rounded-full w-24 mx-auto"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-100 rounded"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] space-y-4 animate-pulse">
            <div className="h-6 bg-gray-100 rounded w-1/2"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Header card */}
      <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="text-xl font-extrabold text-[#1D1D1F] mb-1">Profile Management</h2>
        <p className="text-[#6B7280] text-xs">
          Manage your personal details, workspace credentials, contact numbers, and security keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-[24px] space-y-6 shadow-xs border border-[rgba(140,29,64,0.08)]"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-[#8C1D40]/10 overflow-hidden bg-[#FAF8F7] flex items-center justify-center text-[#8C1D40] font-black text-3xl uppercase">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0).toUpperCase() || 'F'
                )}
              </div>
              <label className="absolute inset-0 bg-black/45 backdrop-blur-xs rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center items-center text-white cursor-pointer select-none">
                <Camera size={20} />
                <span className="text-[9px] font-mono mt-0.5 font-bold">Upload</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-[#1D1D1F]">{profile?.name}</h3>
              <p className="text-xs text-[#6B7280] font-semibold mt-1">
                {profile?.staffDetails?.designation || 'Faculty Member'} — {profile?.staffDetails?.department?.name || 'Academic Department'}
              </p>
              {avatarFile && (
                <p className="text-[10px] font-mono text-[#C74B74] font-bold mt-2 animate-pulse">
                  Selected: {avatarFile.name} (Click Save below)
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div>
                <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Employee ID (Read-only)</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    value={profile?.staffDetails?.employeeId || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Name *</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={14} />
                  </div>
                  <input
                    {...registerProfile('name', { required: 'Name is required' })}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(140,29,64,0.12)] focus:border-[#8C1D40]/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C1D40]/5"
                    placeholder="e.g. Dr. John Doe"
                  />
                </div>
                {errorsProfile.name && <span className="text-red-500 text-[10px] font-mono mt-1 block">{errorsProfile.name.message}</span>}
              </div>

              {/* Email */}
              <div>
                <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Academic Email (Read-only)</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={14} />
                  </div>
                  <input
                    type="text"
                    value={profile?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Phone Number</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone size={14} />
                  </div>
                  <input
                    {...registerProfile('phone')}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(140,29,64,0.12)] focus:border-[#8C1D40]/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C1D40]/5"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Department (Read-only)</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building2 size={14} />
                  </div>
                  <input
                    type="text"
                    value={profile?.staffDetails?.department?.name || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Designation</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Award size={14} />
                  </div>
                  <input
                    {...registerProfile('designation')}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(140,29,64,0.12)] focus:border-[#8C1D40]/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C1D40]/5"
                    placeholder="e.g. Assistant Professor"
                  />
                </div>
              </div>

              {/* Qualification */}
              <div className="md:col-span-2">
                <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Qualifications</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Award size={14} />
                  </div>
                  <input
                    {...registerProfile('qualification')}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(140,29,64,0.12)] focus:border-[#8C1D40]/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C1D40]/5"
                    placeholder="e.g. Ph.D. in Computer Science & Engineering"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={updating}
                className="bg-gradient-to-r from-[#8C1D40] to-[#C74B74] hover:opacity-95 text-white py-2.5 px-6 rounded-xl font-bold active:scale-[0.98] transition-all flex items-center gap-2 shadow-md shadow-[#8C1D40]/10 disabled:opacity-50 text-xs"
              >
                <Save size={14} />
                Save Profile
              </button>
            </div>
          </form>
        </motion.div>

        {/* Change Password Block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[24px] space-y-6 shadow-xs border border-[rgba(140,29,64,0.08)] h-fit"
        >
          <div>
            <h3 className="text-sm font-extrabold text-[#1D1D1F] flex items-center gap-2">
              <Shield size={16} className="text-[#8C1D40]" />
              Security credentials
            </h3>
            <p className="text-[10px] text-[#6B7280] mt-1 font-semibold">Change password parameters regularly to retain security clearance.</p>
          </div>

          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
            {/* Current Password */}
            <div>
              <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Current Password *</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(140,29,64,0.12)] focus:border-[#8C1D40]/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C1D40]/5"
                  placeholder="••••••••"
                />
              </div>
              {errorsPassword.currentPassword && (
                <span className="text-red-500 text-[10px] font-mono mt-1 block">{errorsPassword.currentPassword.message}</span>
              )}
            </div>

            {/* New Password */}
            <div>
              <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">New Password *</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters long' },
                  })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(140,29,64,0.12)] focus:border-[#8C1D40]/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C1D40]/5"
                  placeholder="••••••••"
                />
              </div>
              {errorsPassword.newPassword && (
                <span className="text-red-500 text-[10px] font-mono mt-1 block">{errorsPassword.newPassword.message}</span>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <span className="block font-mono text-[9px] font-bold text-[#6B7280] mb-1.5 uppercase px-1">Confirm Password *</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) => value === watchPassword('newPassword') || 'Passwords do not match',
                  })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(140,29,64,0.12)] focus:border-[#8C1D40]/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C1D40]/5"
                  placeholder="••••••••"
                />
              </div>
              {errorsPassword.confirmPassword && (
                <span className="text-red-500 text-[10px] font-mono mt-1 block">{errorsPassword.confirmPassword.message}</span>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-[#8C1D40] to-[#C74B74] text-white py-2 px-4 rounded-xl text-xs font-bold hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Lock size={13} />
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