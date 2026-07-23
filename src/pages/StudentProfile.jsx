import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, Heart, MapPin, Award, FileText, Upload, Settings,
  Bell, Lock, Shield, Clock, Smartphone, Globe, Eye, Download, X, Edit2,
  Sparkles, BookOpen, ShieldCheck, Check, Key, HelpCircle, CheckCircle2, ChevronRight,Trophy,Flame,Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useStudentProfile } from '../contexts/StudentProfileContext';

const StudentProfile = () => {
  const { user } = useAuth();
  const { updatePhoto } = useStudentProfile();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Personal detail state — starts empty; populated from the API
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [guardian, setGuardian] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Profile photo
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Personal info edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '', dob: '', gender: '', bloodGroup: '', address: '', guardian: '', emergencyPhone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Toggle settings
  const [notificationsSet, setNotificationsSet] = useState({
    email: true,
    sms: false,
    push: true,
    examReminder: true,
    resultPublished: true,
    assignmentReminder: false,
  });

  const [preferencesSet, setPreferencesSet] = useState({
    theme: 'Light',
    language: 'English (UK)',
    timezone: 'GMT +0 (London)',
    accessibility: 'Standard Text',
    fontSize: '14px',
  });

  // Password fields
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      if (response.data && response.data.success) {
        const data = response.data.data || null;
        setProfile(data);

        // Populate every personal-detail field from the real DB record
        if (data) {
          setPhone(data.phone || '');
          setDob(data.dob || '');
          setGender(data.gender || '');
          setBloodGroup(data.bloodGroup || '');
          setAddress(data.address || '');
          setGuardian(data.guardian || data.parentName || '');
          setEmergencyPhone(data.emergencyPhone || data.emergencyContact || '');
          // photo: the backend now returns a fully-qualified photoUrl
          if (data.photoUrl) setPhotoPreview(data.photoUrl);
        }
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    try {
      await api.patch('/profile/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm,
      });
      toast.success('Password updated successfully.');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update password.';
      toast.error(msg);
    }
  };

  const handleToggle = (key) => {
    setNotificationsSet(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Preferences updated successfully.');
  };

  // ---------- Photo Upload ----------
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    const formData = new FormData();
    // Backend multer expects the field name 'avatar'
    formData.append('avatar', file);

    api.post('/profile/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then((res) => {
        toast.success('Profile photo updated successfully.');
        // Use the fully-qualified URL returned by the server so the
        // image persists correctly after a page refresh.
        if (res?.data?.data?.photoUrl) {
          const serverUrl = res.data.data.photoUrl;
          setPhotoPreview(serverUrl);
          // Sync globally — updates Navbar avatar and Sidebar avatar instantly
          updatePhoto(serverUrl);
        }
      })
      .catch((err) => {
        console.error('PHOTO UPLOAD ERROR:', err);
        // Roll back the optimistic preview
        setPhotoPreview(null);
        toast.error('Upload failed. Please try again.');
      });

    // allow re-selecting the same file again later
    e.target.value = '';
  };

  // ---------- Personal Information Edit ----------
  const openEditModal = () => {
    setEditForm({
      phone,
      dob,
      gender,
      bloodGroup,
      address,
      guardian,
      emergencyPhone,
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!editForm.phone || !editForm.dob || !editForm.address) {
      toast.error('Please fill in phone, date of birth, and address.');
      return;
    }

    try {
      setSavingProfile(true);
      const response = await api.put('/profile', {
        phone: editForm.phone,
        dob: editForm.dob,
        gender: editForm.gender,
        bloodGroup: editForm.bloodGroup,
        address: editForm.address,
        guardian: editForm.guardian,
        emergencyPhone: editForm.emergencyPhone,
      });

      if (response.data && response.data.success) {
        // Sync state from the server's authoritative response
        const saved = response.data.data;
        setPhone(saved.phone || editForm.phone);
        setDob(saved.dob || editForm.dob);
        setGender(saved.gender || editForm.gender);
        setBloodGroup(saved.bloodGroup || editForm.bloodGroup);
        setAddress(saved.address || editForm.address);
        setGuardian(saved.guardian || saved.parentName || editForm.guardian);
        setEmergencyPhone(saved.emergencyPhone || editForm.emergencyPhone);
        // Keep the profile snapshot fresh
        setProfile(saved);

        toast.success('Profile updated successfully.');
        setShowEditModal(false);
      } else {
        toast.error('Could not save changes. Please try again.');
      }
    } catch (error) {
      console.log('PROFILE UPDATE ERROR:', error);
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-48 bg-white rounded-[24px] border border-[#EADFE3]"></div>
        <div className="h-64 bg-white rounded-[24px] border border-[#EADFE3]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-[#666666]">
        <p className="font-bold">No profile records found.</p>
      </div>
    );
  }

  const student = profile.studentDetails || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 bg-[#FCFCFD]">

      {/* SECTION 1: PROFILE HERO CARD */}
      <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FCEEF2] to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">

            {/* Circular Profile Photo & Completion Ring */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FFF7F8"
                  strokeWidth="2.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#6A0019"
                  strokeWidth="2.8"
                  strokeDasharray="85, 100"
                />
              </svg>
              <div className="w-[100px] h-[100px] rounded-full border-4 border-white overflow-hidden bg-[#FCEEF2] flex items-center justify-center text-[#6A0019] text-3xl font-black shadow-inner">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : 'S'
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-1 right-1 p-1.5 rounded-full bg-white border border-[#EADFE3] text-[#6A0019] shadow-md hover:bg-[#FFF7F8] active:scale-95 transition-all"
                title="Edit Photo"
              >
                <Edit2 size={12} />
              </button>
            </div>

            {/* Candidate Identity Meta */}
            <div className="text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-[#1A1A1A]">{profile.name}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider shadow-xs">
                  <ShieldCheck size={10} className="text-emerald-700" />
                  AI Verified Badge
                </span>
                <span className="inline-block px-2.5 py-0.5 bg-[#FFF7F8] text-[#6A0019] border border-[#EADFE3] rounded-full text-[9px] font-bold uppercase font-mono">
                  Good Standing
                </span>
              </div>

              <div className="text-xs font-semibold text-[#666666] space-y-1">
                <p className="font-mono">Roll Number: {student.rollNumber || 'ST-2026-0391'} • Reg Number: {student.regNumber || 'REG-2026-00382'}</p>
                <p>{student.course?.name || 'Computer Science Engineering'} • {student.department?.name || 'Department of Technology'}</p>
                <p className="font-mono text-[#6A0019] bg-[#FCEEF2] inline-block px-2.5 py-0.5 rounded-md border border-[#6A0019]/5">
                  Semester {student.semester?.semesterNumber || 'Semester 4'}
                </p>
              </div>
            </div>
          </div>

          {/* Call-to-action Action Center */}
          <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0 justify-center sm:justify-start">
            <button
              onClick={() => toast.success('Oxford Candidate ID ready for print download.')}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6A0019, #A11D42)' }}
            >
              <Download size={14} />
              Download ID Card
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="py-2.5 px-4 rounded-xl bg-white border border-[#6A0019] text-[#6A0019] text-xs font-bold hover:bg-[#FFF7F8] transition-colors shadow-xs active:scale-95 flex items-center justify-center gap-2"
            >
              <Settings size={14} />
              Account Settings
            </button>
          </div>

        </div>
      </div>

      {/* Tab Selector Links */}
      <div className="flex border-b border-[#EADFE3] gap-2 overflow-x-auto pb-px">
        {[
          { id: 'overview', name: 'Overview Profile', icon: User },
          { id: 'academic', name: 'Academic Records', icon: BookOpen },
          { id: 'documents', name: 'Identity & Docs', icon: FileText },
          { id: 'settings', name: 'Security & Preferences', icon: Settings },
        ].map(t => {
          const TabIcon = t.icon;
          const isAct = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
                isAct
                  ? 'border-[#6A0019] text-[#6A0019] bg-[#FFF7F8]/50'
                  : 'border-transparent text-[#666666] hover:text-[#6A0019] hover:bg-gray-50'
              }`}
            >
              <TabIcon size={14} />
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Tab content modules */}
      <div>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left side: Personal & Achievements */}
                <div className="lg:col-span-8 space-y-6">

                  {/* SECTION 2: PERSONAL INFORMATION */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h3 className="text-sm font-extrabold text-[#6A0019] flex items-center gap-2">
                        <User size={15} />
                        Personal Information
                      </h3>
                      <button
                        onClick={openEditModal}
                        className="p-1.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-[#EADFE3] text-[#6A0019] transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-[#666666]">
                      <div className="flex items-start gap-2.5">
                        <User size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Full Name</span>
                          <span className="text-[#1A1A1A] font-extrabold">{profile.name}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Mail size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Email Address</span>
                          <span className="text-[#1A1A1A] font-extrabold">{profile.email}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Phone size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Phone Number</span>
                          <span className="text-[#1A1A1A] font-extrabold">{phone}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Calendar size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Date of Birth</span>
                          <span className="text-[#1A1A1A] font-extrabold">{dob}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <User size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Gender</span>
                          <span className="text-[#1A1A1A] font-extrabold">{gender}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Heart size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Blood Group</span>
                          <span className="text-[#1A1A1A] font-extrabold">{bloodGroup}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 sm:col-span-2">
                        <MapPin size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Mailing Address</span>
                          <span className="text-[#1A1A1A] font-extrabold">{address}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <User size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Parent / Guardian</span>
                          <span className="text-[#1A1A1A] font-extrabold">{guardian}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Phone size={14} className="text-[#6A0019] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Emergency Contact</span>
                          <span className="text-[#1A1A1A] font-extrabold">{emergencyPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 10: ACHIEVEMENTS */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
                    <h3 className="text-sm font-extrabold text-[#6A0019] border-b border-gray-100 pb-3 flex items-center gap-2">
                      <Award size={15} />
                      Academic Credentials & Badges
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {[
                        { title: 'Top Performer', desc: 'Highest Exam Grade', date: 'Semester 3', icon: Trophy, color: 'text-yellow-600 bg-yellow-50' },
                        { title: 'Perfect Attendance', desc: '100% Class Attendance', date: 'Academic Yr 2025', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                        { title: 'Study Streak', desc: 'Active recall for 15 days', date: 'Active Badge', icon: Flame, color: 'text-[#6A0019] bg-[#FCEEF2]' },
                        { title: 'Rank Holder', desc: 'Top 5% CGPA Standing', date: 'Oxford Global Console', icon: Star, color: 'text-purple-600 bg-purple-50' },
                        { title: 'Certificates Earned', desc: 'Syllabus Verified', date: '6 Completed', icon: Shield, color: 'text-blue-600 bg-blue-50' },
                      ].map((badge, idx) => {
                        const BadgeIcon = badge.icon;
                        return (
                          <div key={idx} className="p-3.5 bg-white border border-[#EADFE3] rounded-2xl flex flex-col items-center text-center space-y-2 hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.color}`}>
                              <BadgeIcon size={18} />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-extrabold text-[#1A1A1A]">{badge.title}</h4>
                              <p className="text-[9px] text-[#666666] font-semibold">{badge.desc}</p>
                              <span className="text-[8px] font-mono text-gray-400 block mt-1">{badge.date}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Right side: AI insights & Recent Activity */}
                <div className="lg:col-span-4 space-y-6">

                  {/* SECTION 9: AI INSIGHTS */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] relative overflow-hidden space-y-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#6A0019]/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-extrabold text-[#1A1A1A] flex items-center gap-1.5">
                        <Sparkles size={13} className="text-yellow-500" />
                        Oxford AI Insights
                      </h4>
                      <span className="text-[9px] font-mono font-bold text-[#6A0019] bg-[#FCEEF2] px-1.5 py-0.5 rounded-full border border-[#EADFE3]">
                        Active IQ
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="p-3 bg-[#FFF7F8] border border-[#EADFE3] rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="text-[9px] text-[#666666] block font-bold">Exam Readiness Score</span>
                          <span className="font-mono text-[#6A0019] font-extrabold text-sm">86% Optimal</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#EADFE3] text-[#6A0019] font-bold">
                          A
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-[#666666] space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span>Strongest Subject:</span>
                          <span className="font-extrabold text-[#1A1A1A]">Cloud Computing</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Weakest Subject:</span>
                          <span className="font-extrabold text-[#6A0019]">Algorithms Analysis</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Daily Study Goal:</span>
                          <span className="font-mono text-[#1A1A1A]">2 Hours Active</span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#FCEEF2] border border-[#EADFE3]/60 rounded-xl text-[10px] text-[#6A0019] leading-relaxed italic font-semibold text-center">
                        "Intellectual growth should commence at birth and cease only at death." - Albert Einstein
                      </div>
                    </div>
                  </div>

                  {/* SECTION 11: RECENT ACTIVITY TIMELINE */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
                    <h4 className="text-xs font-extrabold text-[#1A1A1A] flex items-center gap-1.5">
                      <Clock size={13} className="text-[#6A0019]" />
                      Recent Workspace Logs
                    </h4>

                    <div className="relative pl-4 border-l border-[#EADFE3] space-y-4 text-xs">
                      {[
                        { event: 'Logged In Successfully', time: '10 mins ago', desc: 'Secure student console session opened.' },
                        { event: 'Profile Details Updated', time: '2 hours ago', desc: 'Emergency contact parameters updated.' },
                        { event: 'CSE-402 Exam Paper Submitted', time: '1 day ago', desc: 'Auto-evaluation score sheets released.' },
                        { event: 'Certificate Downloaded', time: '3 days ago', desc: 'Digital verification key generated.' },
                      ].map((item, idx) => (
                        <div key={idx} className="relative space-y-0.5">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#6A0019] border-2 border-white"></span>
                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold font-mono">
                            <span>{item.event}</span>
                            <span>{item.time}</span>
                          </div>
                          <p className="text-[11px] text-[#666666] font-semibold leading-tight">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'academic' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* SECTION 3: ACADEMIC INFORMATION */}
              <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
                <h3 className="text-sm font-extrabold text-[#6A0019] border-b border-gray-100 pb-3 flex items-center gap-2">
                  <BookOpen size={15} />
                  Oxford Academic Registration Mapping
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs font-bold text-[#666666]">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Institution</span>
                    <span className="text-[#1A1A1A] font-extrabold truncate block">{profile.institution?.institutionName || 'Oxford Global University'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Institution Code</span>
                    <span className="text-[#1A1A1A] font-extrabold font-mono block">{profile.institution?.institutionCode || 'OXF-GLOBAL'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Department</span>
                    <span className="text-[#1A1A1A] font-extrabold block">{student.department?.name || 'Department of Technology'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Course Code</span>
                    <span className="text-[#1A1A1A] font-extrabold block">{student.course?.code || 'BE-CSE-2026'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Course Name</span>
                    <span className="text-[#1A1A1A] font-extrabold block">{student.course?.name || 'Bachelor of Technology'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Active Semester</span>
                    <span className="text-[#1A1A1A] font-extrabold block">Semester {student.semester?.semesterNumber || '1'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Batch Year</span>
                    <span className="text-[#1A1A1A] font-extrabold font-mono block">Batch of 2024-2028</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Academic Advisor</span>
                    <span className="text-[#1A1A1A] font-extrabold block">Prof. Albus Dumbledore</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-400 block">Student Category</span>
                    <span className="text-[#1A1A1A] font-extrabold block">Regular (Full Time)</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: ACADEMIC STATISTICS */}
              <div className="space-y-4">
                <span className="text-[9px] font-mono font-bold text-[#666666] uppercase tracking-wider block">
                  Console Academic Statistics
                </span>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[
                    { label: 'Cumulative GPA', val: '3.84', desc: 'Top tier scale', color: 'border-t-purple-500' },
                    { label: 'Exams Attempted', val: '12 / 14', desc: 'Completed nodes', color: 'border-t-emerald-500' },
                    { label: 'Upcoming Tests', val: '2', desc: 'Pending papers', color: 'border-t-blue-500' },
                    { label: 'Average Score', val: '84.5%', desc: 'Passing score avg', color: 'border-t-orange-500' },
                    { label: 'Attendance Rate', val: '94%', desc: 'Lectures present', color: 'border-t-[#6A0019]' },
                    { label: 'Credits Earned', val: '88', desc: 'Syllabus credits', color: 'border-t-[#D85A7F]' },
                  ].map((stat, idx) => (
                    <div key={idx} className={`bg-white p-4 rounded-[24px] border border-[#EADFE3] ${stat.color} shadow-xs space-y-1 hover:shadow-md transition-shadow`}>
                      <span className="text-[9px] font-mono font-bold text-[#666666] uppercase block truncate">{stat.label}</span>
                      <span className="text-xl font-black text-[#1A1A1A] block">{stat.val}</span>
                      <span className="text-[8px] text-[#666666] block font-semibold">{stat.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* SECTION 5: DOCUMENTS UPLOADS */}
              <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#6A0019] flex items-center gap-2">
                    <FileText size={15} />
                    Verified Student Credentials & Documents
                  </h3>
                  <p className="text-[10px] text-[#666666] font-semibold mt-0.5">
                    View, download, or replace your digital candidate verification documents
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Student Identity Card', status: 'Verified', date: 'Issued: Sep 2024', size: '2.4 MB' },
                    { name: 'Examination Hall Ticket', status: 'Active (Sem 4)', date: 'Expires: Dec 2026', size: '1.8 MB' },
                    { name: 'Semester 3 Grade Certificate', status: 'Verified', date: 'Uploaded: Jan 2026', size: '3.1 MB' },
                    { name: 'Verification Resume / CV', status: 'Draft', date: 'Uploaded: Jul 2026', size: '840 KB' },
                    { name: 'Identity Proof (Passport/National ID)', status: 'Encrypted & Locked', date: 'Expires: Dec 2030', size: '4.2 MB' },
                  ].map((doc, idx) => (
                    <div key={idx} className="p-4 bg-[#FFF7F8] border border-[#EADFE3] rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-[#1A1A1A] truncate">{doc.name}</h4>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-[#666666] font-mono">
                          <span className="text-emerald-700 bg-emerald-50 px-1 rounded">{doc.status}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 block pt-0.5">{doc.date}</span>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => toast.success(`Viewing ${doc.name}`)}
                          className="p-2 rounded-xl bg-white border border-[#EADFE3] text-[#6A0019] hover:bg-[#FCEEF2] shadow-xs active:scale-90 transition-all"
                          title="View"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => toast.success(`Downloading ${doc.name}`)}
                          className="p-2 rounded-xl bg-[#6A0019] text-white hover:bg-[#6A0019]/90 shadow-xs active:scale-90 transition-all"
                          title="Download"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() => toast.success(`Replace prompt triggered for ${doc.name}`)}
                          className="p-2 rounded-xl bg-white border border-gray-300 text-gray-400 hover:text-[#6A0019] hover:bg-gray-50 shadow-xs active:scale-90 transition-all"
                          title="Replace File"
                        >
                          <Upload size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* Grid for settings and notifications toggles */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Account Settings & Preferences */}
                <div className="lg:col-span-8 space-y-6">

                  {/* SECTION 6: ACCOUNT SETTINGS */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-5">
                    <h3 className="text-sm font-extrabold text-[#6A0019] border-b border-gray-100 pb-3 flex items-center gap-2">
                      <Lock size={15} />
                      Security & Password Management
                    </h3>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Current Password</label>
                          <input
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                            className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">New Password</label>
                          <input
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                            className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none"
                            placeholder="Minimum 8 chars"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Confirm Password</label>
                          <input
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                            className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="py-2 px-5 rounded-xl text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all shadow-xs"
                          style={{ background: 'linear-gradient(135deg, #6A0019, #A11D42)' }}
                        >
                          Change Security Password
                        </button>
                      </div>
                    </form>

                    <div className="border-t border-gray-150/40 pt-4 space-y-3">
                      <h4 className="text-xs font-bold text-[#1A1A1A]">Login Device Logs</h4>
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-[#FFF7F8] border border-[#EADFE3] rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Smartphone size={16} className="text-[#6A0019]" />
                            <div>
                              <span className="font-extrabold text-[#1A1A1A] block">Apple iPhone 15 Pro</span>
                              <span className="text-[9px] font-mono font-bold text-[#666666]">Active Mobile Session • Oxford, UK</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-500/10">CURRENT DEVICE</span>
                        </div>
                        <div className="p-3 bg-white border border-[#EADFE3] rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Globe size={16} className="text-gray-400" />
                            <div>
                              <span className="font-extrabold text-[#1A1A1A] block">Google Chrome (macOS)</span>
                              <span className="text-[9px] font-mono font-bold text-[#666666]">Last Seen: 2 hours ago • IP: 192.168.1.12</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toast.success('Session terminated.')}
                            className="text-[9px] text-[#6A0019] hover:underline font-bold"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 12: PREFERENCES */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
                    <h3 className="text-sm font-extrabold text-[#6A0019] border-b border-gray-100 pb-3 flex items-center gap-2">
                      <Settings size={15} />
                      Student Preferences & Accessibility
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-[#666666]">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Console Theme</label>
                        <select
                          value={preferencesSet.theme}
                          onChange={(e) => {
                            setPreferencesSet(prev => ({ ...prev, theme: e.target.value }));
                            toast.success(`Theme set to ${e.target.value}`);
                          }}
                          className="w-full px-3 py-2 border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none bg-white text-xs"
                        >
                          <option>Light</option>
                          <option>Dark Mode</option>
                          <option>Oxford Sepia</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Language</label>
                        <select
                          value={preferencesSet.language}
                          onChange={(e) => {
                            setPreferencesSet(prev => ({ ...prev, language: e.target.value }));
                            toast.success(`Language set to ${e.target.value}`);
                          }}
                          className="w-full px-3 py-2 border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none bg-white text-xs"
                        >
                          <option>English (UK)</option>
                          <option>English (US)</option>
                          <option>Français</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Timezone</label>
                        <select
                          value={preferencesSet.timezone}
                          onChange={(e) => {
                            setPreferencesSet(prev => ({ ...prev, timezone: e.target.value }));
                            toast.success(`Timezone updated.`);
                          }}
                          className="w-full px-3 py-2 border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none bg-white text-xs"
                        >
                          <option>GMT +0 (London)</option>
                          <option>EST (New York)</option>
                          <option>IST (New Delhi)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right: Notifications settings */}
                <div className="lg:col-span-4 space-y-6">

                  {/* SECTION 7: NOTIFICATION SETTINGS */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-4">
                    <h3 className="text-sm font-extrabold text-[#6A0019] border-b border-gray-100 pb-3 flex items-center gap-2">
                      <Bell size={15} />
                      Alert Options
                    </h3>

                    <div className="space-y-4">
                      {[
                        { key: 'email', title: 'Email Alerts', desc: 'Receive scorecards via inbox' },
                        { key: 'sms', title: 'SMS Messages', desc: 'Critical system reminders' },
                        { key: 'push', title: 'Push Notifications', desc: 'Browser window updates' },
                        { key: 'examReminder', title: 'Exam Countdown', desc: 'Notify 2 hours prior to start' },
                        { key: 'resultPublished', title: 'Scores Released', desc: 'Instant result alerts' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-4 text-xs font-semibold">
                          <div>
                            <span className="font-extrabold text-[#1A1A1A] block leading-tight">{item.title}</span>
                            <span className="text-[9px] text-[#666666] leading-none block">{item.desc}</span>
                          </div>

                          {/* Toggle switch */}
                          <button
                            onClick={() => handleToggle(item.key)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 ${
                              notificationsSet[item.key] ? 'bg-[#6A0019]' : 'bg-gray-250'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 transform ${
                                notificationsSet[item.key] ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 8: SECURITY LOGS */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(106,0,25,0.06)] space-y-3.5">
                    <h4 className="text-xs font-extrabold text-[#1A1A1A] flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <Shield size={13} className="text-[#6A0019]" />
                      Session Integrity logs
                    </h4>

                    <div className="space-y-2 text-[10px] font-mono text-[#666666] font-bold">
                      <div className="flex justify-between">
                        <span>Last Login:</span>
                        <span className="text-[#1A1A1A]">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IP Address:</span>
                        <span className="text-[#1A1A1A]">192.168.10.84</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Browser Agent:</span>
                        <span className="text-[#1A1A1A] truncate max-w-[120px]">Chrome / macOS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Operating Sys:</span>
                        <span className="text-[#1A1A1A]">macOS Sonoma</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Two-Factor Auth:</span>
                        <span className="text-emerald-700">Enabled</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PERSONAL INFORMATION EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-[24px] border border-[#EADFE3] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#6A0019] flex items-center gap-2">
                  <Edit2 size={15} />
                  Edit Personal Information
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-[#6A0019] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => handleEditFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none"
                      placeholder="+44 20 7946 0958"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => handleEditFormChange('dob', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleEditFormChange('gender', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none bg-white"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Blood Group</label>
                    <select
                      value={editForm.bloodGroup}
                      onChange={(e) => handleEditFormChange('bloodGroup', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none bg-white"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Mailing Address</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => handleEditFormChange('address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none resize-none"
                      placeholder="Street, City, Postcode, Country"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Parent / Guardian</label>
                    <input
                      type="text"
                      value={editForm.guardian}
                      onChange={(e) => handleEditFormChange('guardian', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-gray-400 block font-bold">Emergency Contact</label>
                    <input
                      type="text"
                      value={editForm.emergencyPhone}
                      onChange={(e) => handleEditFormChange('emergencyPhone', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#EADFE3] rounded-xl focus:border-[#6A0019] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="py-2 px-4 rounded-xl bg-white border border-[#EADFE3] text-[#666666] text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="py-2 px-5 rounded-xl text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all shadow-xs disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #6A0019, #A11D42)' }}
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentProfile;