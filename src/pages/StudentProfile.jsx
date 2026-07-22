import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data && response.data.success) {
        setProfile(response.data.data || null);
      }
    } catch (error) {
  console.log("PROFILE ERROR:", error);
  toast.error("Failed to retrieve profile details");
} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-surface-container-high rounded-[24px]"></div>
        <div className="h-64 bg-surface-container-high rounded-[24px]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-on-surface-variant">
        <p className="font-bold">No profile records found.</p>
      </div>
    );
  }

  const student = profile.studentDetails || {};

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Header Banner */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-full border-4 border-primary/10 overflow-hidden bg-primary/5 flex items-center justify-center text-primary font-black text-3xl">
          {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-bold text-primary">{profile.name}</h2>
          <p className="text-xs text-on-surface-variant font-mono font-semibold">
            Roll Number: {student.rollNumber || 'N/A'}
          </p>
          <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/15 rounded-full text-[9px] font-bold uppercase font-mono">
            Candidate Role
          </span>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-primary border-b border-primary/5 pb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">manage_accounts</span>
          Account Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-on-surface-variant">
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Registered Email</span>
            <span className="block font-bold text-on-surface truncate">{profile.email}</span>
          </div>
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Username</span>
            <span className="block font-bold text-on-surface">{profile.username || 'N/A'}</span>
          </div>
          <div className="pt-2 border-t border-primary/5 sm:border-t-0 sm:pt-0">
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Institution</span>
            <span className="block font-bold text-on-surface truncate">
              {profile.institution?.institutionName || 'Oxford Global'}
            </span>
          </div>
          <div className="pt-2 border-t border-primary/5 sm:border-t-0 sm:pt-0">
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Institution Code</span>
            <span className="block font-bold text-on-surface font-mono">
              {profile.institution?.institutionCode || 'OXF-GLOBAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Academic Context Map Card */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-primary border-b border-primary/5 pb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">school</span>
          Academic Mapping
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-on-surface-variant">
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Department</span>
            <span className="block font-bold text-on-surface">
              {student.department?.name || 'Computer Science Engineering'}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Course Enrolled</span>
            <span className="block font-bold text-on-surface">
              {student.course?.name || 'Bachelor of Engineering'}
            </span>
          </div>
          <div className="pt-3 border-t border-primary/5">
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Active Semester</span>
            <span className="block font-bold text-primary">
              Semester {student.semester?.semesterNumber || '1'}
            </span>
          </div>
          <div className="pt-3 border-t border-primary/5">
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Registration ID</span>
            <span className="block font-bold text-on-surface font-mono">
              {student.regNumber || 'REG-2026-00382'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
