import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Plus, Eye, Edit, Trash2, Key, X, Building2, User,
  Mail, Phone, MapPin, Info, Lock, Unlock, Calendar, EyeOff
} from 'lucide-react';
import api from '../services/api';

const SuperAdminAdmins = () => {
  // Main states
  const [admins, setAdmins] = useState([]);
  const [institutions, setInstitutions] = useState([]); // Populate selection lists
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filters parameters
  const [search, setSearch] = useState('');
  const [instFilter, setInstFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Panels visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);

  // Password visibility controls
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus context states
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [tempPasswordCreated, setTempPasswordCreated] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Forms hooks
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    watch: watchAdd,
    formState: { errors: errorsAdd },
  } = useForm();

  const passwordValue = watchAdd ? watchAdd('password', '') : '';

  // Password strength checker helper
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '', barColor: '', width: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { score, label: 'Weak', color: 'text-red-600 bg-red-50 border border-red-100', barColor: 'bg-red-500', width: 'w-1/3' };
    } else if (score <= 4) {
      return { score, label: 'Medium', color: 'text-amber-600 bg-amber-50 border border-amber-100', barColor: 'bg-amber-500', width: 'w-2/3' };
    } else {
      return { score, label: 'Strong', color: 'text-emerald-600 bg-emerald-50 border border-emerald-100', barColor: 'bg-emerald-500', width: 'w-full' };
    }
  };

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm();

  // Load admins list
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admins', {
        params: {
          search,
          institution: instFilter,
          status: statusFilter,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setAdmins(response.data.data.results);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to retrieve admins list.');
    } finally {
      setLoading(false);
    }
  };

  // Load institutions for selectors dropdowns
  const fetchInstitutions = async () => {
    try {
      const response = await api.get('/institutions', { params: { limit: 100 } });
      if (response.data && response.data.success) {
        setInstitutions(response.data.data.results);
      }
    } catch (error) {
      console.error('Failed to populate institutions selector dropdowns:', error);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [search, instFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  // CREATE Action
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering admin...');
    try {
      const response = await api.post('/admins', data);
      toast.success('Admin registered successfully!', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      fetchAdmins();
      
      // Store temporary credential details to display to super admin
      if (response.data && response.data.data && response.data.data.tempPassword) {
        setSelectedAdmin(response.data.data.admin);
        setTempPasswordCreated(response.data.data.tempPassword);
        setCredentialModalOpen(true);
      }
    } catch (error) {
      toast.error(error.message || 'Onboarding registration failed.', { id: toastId });
    }
  };

  // Open EDIT Modal populated with active values
  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setValueEdit('name', admin.name);
    setValueEdit('email', admin.email);
    setValueEdit('phone', admin.phone || '');
    setValueEdit('designation', admin.designation || '');
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing administrator details...');
    try {
      await api.put(`/admins/${selectedAdmin._id}`, data);
      toast.success('Admin details updated successfully!', { id: toastId });
      setEditModalOpen(false);
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Modification failed.', { id: toastId });
    }
  };

  // SOFT DELETE / ARCHIVE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Archiving administrator...');
    try {
      await api.delete(`/admins/${selectedAdmin._id}`);
      toast.success('Admin clearance archived.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Deactivation failed.', { id: toastId });
    }
  };

  // STATUS CLEARANCE TOGGLE Action
  const handleStatusToggle = async (admin) => {
    const toastId = toast.loading('Modifying active clearance status...');
    try {
      await api.patch(`/admins/${admin._id}/status`);
      toast.success(`Clearance standing modified!`, { id: toastId });
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Status standing toggle failed.', { id: toastId });
    }
  };

  // MANUAL PASSWORD RESET Action
  const handleResetPassword = async (admin) => {
    const toastId = toast.loading('Requesting credentials reset...');
    try {
      const response = await api.post(`/admins/${admin._id}/reset-password`);
      toast.success('Temporary password generated successfully!', { id: toastId });
      
      if (response.data && response.data.data && response.data.data.tempPassword) {
        setSelectedAdmin(admin);
        setTempPasswordCreated(response.data.data.tempPassword);
        setCredentialModalOpen(true);
      }
    } catch (error) {
      toast.error(error.message || 'Reset password request failed.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header section */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#8B1538]">System Admin Management</h2>
          <p className="text-gray-500 text-xs mt-0.5 font-semibold">Manage, register, reset, and monitor administrative keys across campus nodes.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#8B1538] hover:bg-[#720F2B] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#8B1538]/10"
        >
          <Plus size={15} />
          Register System Admin
        </button>
      </div>

      {/* Search & Filter toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="lg:col-span-2 flex items-center bg-white border border-gray-150 rounded-xl px-4 py-2 shadow-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search admins by name, email, or designation..."
            className="bg-transparent border-none focus:ring-0 text-xs font-semibold w-full placeholder:text-gray-400 outline-none ml-2 text-gray-800"
            type="text"
          />
        </div>

        {/* Institution Filter */}
        <div className="bg-white border border-gray-150 rounded-xl px-4 py-2 shadow-xs">
          <select
            value={instFilter}
            onChange={(e) => {
              setInstFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-xs font-semibold text-gray-600 focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Institutions</option>
            {institutions.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.institutionName} ({inst.institutionCode})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="bg-white border border-gray-150 rounded-xl px-4 py-2 shadow-xs">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-xs font-semibold text-gray-600 focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Clearances</option>
            <option value="Active">Active Clearance</option>
            <option value="Suspended">Suspended Clearance</option>
          </select>
        </div>
      </div>

      {/* Main Content Card Wrapper */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)]">
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="h-8 bg-gray-100 animate-pulse rounded-lg w-full"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-gray-55 animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <User size={40} className="text-gray-300" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-800">No Administrators Found</h3>
              <p className="text-gray-500 text-xs max-w-sm font-semibold">No administrator profiles match your active search or filters criteria.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 pb-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-3">Avatar</th>
                  <th className="py-4 px-3">Name & Email</th>
                  <th className="py-4 px-3">Onboarded Node</th>
                  <th className="py-4 px-3">Designation</th>
                  <th className="py-4 px-3 text-center">Clearance</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Avatar Column */}
                    <td className="py-4 px-3">
                      <div className="w-9 h-9 rounded-full border border-gray-150 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                        {admin.avatar ? (
                          <img
                            src={`${backendUrl}/${admin.avatar}`}
                            alt={admin.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={15} className="text-[#8B1538]" />
                        )}
                      </div>
                    </td>

                    {/* Name & Email Column */}
                    <td className="py-4 px-3">
                      <p className="font-bold text-gray-850">{admin.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono lowercase">{admin.email}</p>
                    </td>

                    {/* Onboarded Node Column */}
                    <td className="py-4 px-3">
                      {admin.institution ? (
                        <div>
                          <p className="text-gray-800">{admin.institution.institutionName}</p>
                          <p className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{admin.institution.institutionCode}</p>
                        </div>
                      ) : (
                        <span className="text-red-500 font-mono text-[9px] tracking-wide font-bold uppercase">Orphan Node</span>
                      )}
                    </td>

                    {/* Designation Column */}
                    <td className="py-4 px-3">
                      <span className="text-gray-500 font-semibold">{admin.designation || 'System Admin'}</span>
                    </td>

                    {/* Clearance Column */}
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => handleStatusToggle(admin)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          admin.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                        } transition-transform`}
                      >
                        <span className={`w-1 h-1 rounded-full ${admin.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {admin.status}
                      </button>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        
                        <button
                          onClick={() => handleEditClick(admin)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg hover:bg-[#FDF3F6] text-[#8B1538] transition-colors"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleResetPassword(admin)}
                          title="Reset Password Keys"
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        >
                          <Key size={14} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setDeleteDialogOpen(true);
                          }}
                          title="Archive Administrator"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4">
              <span className="text-xs text-gray-400 font-mono font-bold">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none text-gray-600"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  className="px-3 py-1.5 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none text-gray-600"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================
          ADD MODAL
      ======================================================== */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white max-w-xl w-full rounded-[24px] border border-gray-150 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#8B1538]">Register System Administrator</h3>
                  <p className="text-gray-500 text-xs mt-0.5 font-semibold">Provision access credentials mapped to an academic institution.</p>
                </div>
                <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                    <input
                      {...registerAdd('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Dr. Arthur Pendragon"
                    />
                    {errorsAdd.name && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Email address</label>
                    <input
                      {...registerAdd('email', { required: 'Email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. arthur@lumina.edu"
                      type="email"
                    />
                    {errorsAdd.email && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.email.message}</span>}
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Target Institution</label>
                    <select
                      {...registerAdd('institution', { required: 'Target institution is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base font-semibold text-gray-700 bg-white"
                    >
                      <option value="">Select Institution...</option>
                      {institutions.map((inst) => (
                        <option key={inst._id} value={inst._id}>
                          {inst.institutionName} ({inst.institutionCode})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.institution && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.institution.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Phone Number</label>
                    <input
                      {...registerAdd('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. +1 555-0199"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Designation</label>
                    <input
                      {...registerAdd('designation')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. System Controller"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Access Password</label>
                    <div className="relative">
                      <input
                        {...registerAdd('password', {
                          required: 'Password is required',
                          minLength: { value: 6, message: 'Password must be at least 6 characters' }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full input-underline py-2 pr-10 focus:ring-0 text-base"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errorsAdd.password && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.password.message}</span>}

                    {/* Password Strength Indicator */}
                    {passwordValue && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-gray-400 uppercase tracking-wider font-mono">Keys Strength</span>
                          <span className={`px-2 py-0.5 rounded-md font-mono ${getPasswordStrength(passwordValue).color}`}>
                            {getPasswordStrength(passwordValue).label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${getPasswordStrength(passwordValue).barColor} ${getPasswordStrength(passwordValue).width}`}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Confirm Password</label>
                    <div className="relative">
                      <input
                        {...registerAdd('confirmPassword', {
                          required: 'Confirmation is required',
                          validate: (val) => val === passwordValue || 'Passwords do not match'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full input-underline py-2 pr-10 focus:ring-0 text-base"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errorsAdd.confirmPassword && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.confirmPassword.message}</span>}
                  </div>
                </div>

                {/* Submit Row */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors text-gray-500 border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#8B1538] hover:bg-[#720F2B] text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Register Credentials
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          EDIT MODAL
      ======================================================== */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white max-w-xl w-full rounded-[24px] border border-gray-150 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#8B1538]">Modify Admin Details</h3>
                  <p className="text-gray-500 text-xs mt-0.5 font-semibold">Update contact parameters or designations in the security system.</p>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                    <input
                      {...registerEdit('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.name && <span className="text-red-500 text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Email address</label>
                    <input
                      {...registerEdit('email', { required: 'Email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      type="email"
                      disabled
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Phone Number</label>
                    <input
                      {...registerEdit('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Designation */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Designation</label>
                    <input
                      {...registerEdit('designation')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>
                </div>

                {/* Submit Row */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors text-gray-500 border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#8B1538] hover:bg-[#720F2B] text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Sync Details
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          DELETE MODAL
      ======================================================== */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteDialogOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white max-w-md w-full rounded-[24px] border border-gray-150 p-6 shadow-2xl z-50"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-gray-800">Archive Admin standing</h3>
                  <p className="text-gray-500 text-xs font-semibold leading-relaxed">
                    Are you sure you want to deactivate and soft-delete <span className="font-bold text-[#8B1538]">{selectedAdmin?.name}</span>?
                    This action will immediately terminate active campus credentials.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors text-gray-500 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Confirm Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          CREDENTIAL REPORT MODAL (NEWLY onboarded credentials display)
      ======================================================== */}
      <AnimatePresence>
        {credentialModalOpen && selectedAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCredentialModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white max-w-md w-full rounded-[24px] border border-gray-150 p-8 shadow-2xl z-50 text-xs font-semibold text-gray-700 space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-800">Security Credentials Generated</h3>
                  <p className="text-gray-500 text-[10px] font-semibold">Copy temporary credentials keys below to provide to the administrator.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3 font-semibold">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Performer User</p>
                  <p className="text-gray-800 font-bold mt-0.5">{selectedAdmin.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Login Identity Email</p>
                  <p className="text-gray-800 font-mono mt-0.5">{selectedAdmin.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Temporary Password Seal</p>
                  <p className="text-[#8B1538] font-mono font-bold text-sm tracking-wider mt-0.5 select-all">{tempPasswordCreated}</p>
                </div>
              </div>

              <div className="p-3.5 bg-[#FDF3F6] border border-[#8B1538]/10 rounded-xl flex items-start gap-2.5">
                <Info size={14} className="text-[#8B1538] shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 leading-normal font-semibold">
                  This password is only visible once. Make sure to record these details securely before closing this window.
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setCredentialModalOpen(false);
                    setTempPasswordCreated('');
                  }}
                  className="w-full py-2 bg-[#8B1538] hover:bg-[#720F2B] text-white rounded-xl text-xs font-bold transition-all text-center"
                >
                  Credentials Copy Verified
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          DETAILS DRAWER
      ======================================================== */}
      <AnimatePresence>
        {detailsDrawerOpen && selectedAdmin && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            ></motion.div>

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-150 flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-gray-150 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {selectedAdmin.avatar ? (
                        <img
                          src={`${backendUrl}/${selectedAdmin.avatar}`}
                          alt={selectedAdmin.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={18} className="text-[#8B1538]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-800">{selectedAdmin.name}</h4>
                      <p className="text-[10px] font-mono text-gray-400 lowercase mt-0.5">{selectedAdmin.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailsDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 font-semibold text-xs text-gray-700">
                  {/* Status Card */}
                  <div className="p-4 rounded-2xl border border-gray-150 bg-gray-50/50 flex items-center justify-between">
                    <span className="text-gray-400 font-mono text-[10px] uppercase font-bold tracking-wider">Access Clearance</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      selectedAdmin.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedAdmin.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {selectedAdmin.status}
                    </span>
                  </div>

                  {/* Campus Node Mapping */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-gray-100 pb-1.5">Campus Authorization</h5>
                    {selectedAdmin.institution ? (
                      <div className="flex items-start gap-3 p-3.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <Building2 size={16} className="text-[#8B1538] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-850 font-bold">{selectedAdmin.institution.institutionName}</p>
                          <p className="text-[9px] font-mono font-bold text-gray-400 uppercase mt-0.5 tracking-wider">Node code: {selectedAdmin.institution.institutionCode}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-500 font-mono text-[9px] tracking-wider uppercase font-bold">Orphan Node - No mapped institution</p>
                    )}
                  </div>

                  {/* Profile properties */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-gray-100 pb-1.5">Contact Specs</h5>
                    
                    <div className="flex items-start gap-3">
                      <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Phone Line</p>
                        <p className="text-gray-800 mt-0.5">{selectedAdmin.phone || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Staff Designation</p>
                        <p className="text-gray-800 mt-0.5">{selectedAdmin.designation || 'System Admin'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Date Registered</p>
                        <p className="text-gray-850 mt-0.5">{new Date(selectedAdmin.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setDetailsDrawerOpen(false);
                      handleEditClick(selectedAdmin);
                    }}
                    className="px-4 py-2 bg-[#8B1538] hover:bg-[#720F2B] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit size={12} />
                    Modify Details
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SuperAdminAdmins;
