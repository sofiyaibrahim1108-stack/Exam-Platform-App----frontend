import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminProfile = () => {
  const { user: authUser, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Forms setup
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: errorsProfile },
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword },
    watch,
  } = useForm();

  // Load profile details
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile');
      if (response.data && response.data.success) {
        setProfile(response.data.data);
        resetProfile({
          name: response.data.data.name,
          email: response.data.data.email,
          phone: response.data.data.phone || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [resetProfile]);

  // Form data constructor for file uploads (avatars)
  const createFormData = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'avatar') {
        if (data.avatar && data.avatar[0]) {
          formData.append('avatar', data.avatar[0]);
        }
      } else {
        formData.append(key, data[key] || '');
      }
    });
    return formData;
  };

  // UPDATE profile
  const onProfileSubmit = async (data) => {
    setSavingProfile(true);
    const toastId = toast.loading('Syncing profile...');
    try {
      const formData = createFormData(data);
      const response = await api.put('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile details updated successfully!', { id: toastId });
      setProfile(response.data.data);
      
      // Update global context so Navbar and Sidebar react immediately
      const updatedUser = {
        ...response.data.data,
        photoUrl: response.data.data.avatar ? `${backendUrl}/${response.data.data.avatar}` : null
      };
      updateUser(updatedUser);
    } catch (error) {
      toast.error(error.message || 'Profile update failed.', { id: toastId });
    } finally {
      setSavingProfile(false);
    }
  };

  // UPDATE password
  const onPasswordSubmit = async (data) => {
    setSavingPassword(true);
    const toastId = toast.loading('Modifying credentials keys...');
    try {
      await api.patch('/profile/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Credentials keys modified! Please log in again.', { id: toastId });
      resetPassword();
      // Force logout to re-authenticate with new password
      setTimeout(async () => {
        await logout();
      }, 1500);
    } catch (error) {
      toast.error(error.message || 'Password update failed.', { id: toastId });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-surface animate-pulse rounded-xl w-48"></div>
        <div className="h-64 bg-surface animate-pulse rounded-[24px] w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header HERO */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary">Account Profiles Workspace</h2>
        <p className="text-on-surface-variant text-sm mt-1">Manage credentials keys, phone lines, email identities, and profile seals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Profile Summary Card */}
        <div className="glass-panel p-8 rounded-[24px] border border-primary/5 flex flex-col items-center text-center space-y-6 lg:col-span-1 h-fit">
          {/* Avatar frame */}
          <div className="w-28 h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center text-primary text-4xl font-bold relative group">
            {profile.avatar ? (
              <img
                src={`${backendUrl}/${profile.avatar}`}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-primary leading-tight">{profile.name}</h3>
            <p className="text-xs text-on-surface-variant mt-1 font-mono">{profile.email}</p>
            <span className="inline-block mt-3 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-mono font-semibold uppercase tracking-wider">
              {profile.role}
            </span>
          </div>

          <div className="w-full border-t border-primary/5 pt-4 text-xs text-on-surface-variant text-left space-y-3 font-mono">
            <p>USER_ID: <span className="font-semibold text-on-surface">{profile._id}</span></p>
            <p>CLEARANCE: <span className="font-semibold text-on-surface">{profile.status?.toUpperCase() || 'ACTIVE'}</span></p>
            <p>JOINED: <span className="font-semibold text-on-surface">{new Date(profile.createdAt).toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* Right Side: Update details & password forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Form */}
          <div className="glass-panel p-8 rounded-[24px] border border-primary/5 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Edit Account Details</h3>
              <p className="text-on-surface-variant text-xs mt-1">Configure name, contact email lines, and profile avatars.</p>
            </div>

            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Full Name</label>
                  <input
                    {...registerProfile('name', { required: 'Name is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                  />
                  {errorsProfile.name && <span className="text-error text-xs font-mono mt-1">{errorsProfile.name.message}</span>}
                </div>

                {/* Email */}
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Email address</label>
                  <input
                    {...registerProfile('email', { required: 'Email is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="email"
                  />
                  {errorsProfile.email && <span className="text-error text-xs font-mono mt-1">{errorsProfile.email.message}</span>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone Number</label>
                  <input
                    {...registerProfile('phone')}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                  />
                </div>

                {/* Avatar upload */}
                <div className="col-span-2">
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-2 uppercase px-1">Change Profile Avatar</label>
                  <input
                    {...registerProfile('avatar')}
                    className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/5 file:text-primary hover:file:bg-primary/10 file:cursor-pointer"
                    type="file"
                    accept="image/*"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-primary/5">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-primary text-white py-3 px-8 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all text-sm shadow-md"
                >
                  {savingProfile ? 'Syncing...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-panel p-8 rounded-[24px] border border-primary/5 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Modify Password Keys</h3>
              <p className="text-on-surface-variant text-xs mt-1">Regenerate account access passwords. Log out will occur on success.</p>
            </div>

            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current password */}
                <div className="col-span-2">
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Current Password</label>
                  <input
                    {...registerPassword('currentPassword', { required: 'Current password is required' })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="password"
                    placeholder="••••••••"
                  />
                  {errorsPassword.currentPassword && <span className="text-error text-xs font-mono mt-1">{errorsPassword.currentPassword.message}</span>}
                </div>

                {/* New Password */}
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">New Password</label>
                  <input
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' }
                    })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="password"
                    placeholder="••••••••"
                  />
                  {errorsPassword.newPassword && <span className="text-error text-xs font-mono mt-1">{errorsPassword.newPassword.message}</span>}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Confirm New Password</label>
                  <input
                    {...registerPassword('confirmPassword', {
                      required: 'Confirm password is required',
                      validate: (val) => {
                        if (watch('newPassword') !== val) {
                          return 'Passwords do not match';
                        }
                      }
                    })}
                    className="w-full input-underline py-2 focus:ring-0 text-base"
                    type="password"
                    placeholder="••••••••"
                  />
                  {errorsPassword.confirmPassword && <span className="text-error text-xs font-mono mt-1">{errorsPassword.confirmPassword.message}</span>}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-primary/5">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="bg-primary text-white py-3 px-8 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all text-sm shadow-md"
                >
                  {savingPassword ? 'Modifying...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SuperAdminProfile;
