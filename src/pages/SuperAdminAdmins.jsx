import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
      return { score, label: 'Weak', color: 'text-error bg-error/10 border border-error/20', barColor: 'bg-error', width: 'w-1/3' };
    } else if (score <= 4) {
      return { score, label: 'Medium', color: 'text-amber-600 bg-amber-500/10 border border-amber-500/20', barColor: 'bg-amber-500', width: 'w-2/3' };
    } else {
      return { score, label: 'Strong', color: 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20', barColor: 'bg-emerald-500', width: 'w-full' };
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
      const response = await api.get('/institutions', {
        params: { limit: 100 }, // Fetch list of onboarded universities
      });
      if (response.data && response.data.success) {
        setInstitutions(response.data.data.results);
      }
    } catch (error) {
      console.error('Failed to load institutions dropdown list', error);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [search, instFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  // Form data constructor for file transfers
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

  // CREATE Action
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering Administrator account...');
    try {
      const formData = createFormData(data);
      await api.post('/admins', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Campus Admin created successfully.', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      setShowPassword(false);
      setShowConfirmPassword(false);

      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Administrator registration failed.', { id: toastId });
    }
  };

  // Open EDIT Modal populated with active values
  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setValueEdit('name', admin.name);
    setValueEdit('email', admin.email);
    setValueEdit('phone', admin.phone || '');
    setValueEdit('institution', admin.institution?._id || '');
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing administrator details...');
    try {
      const formData = createFormData(data);
      await api.put(`/admins/${selectedAdmin._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Administrator details synced!', { id: toastId });
      setEditModalOpen(false);
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Credential modification failed.', { id: toastId });
    }
  };

  // HARD DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Removing user profile...');
    try {
      await api.delete(`/admins/${selectedAdmin._id}`);
      toast.success('Admin account deleted from network database.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Deactivation failed.', { id: toastId });
    }
  };

  // STATUS TOGGLE Action
  const handleStatusToggle = async (admin) => {
    const toastId = toast.loading('Toggling security clearance...');
    try {
      await api.patch(`/admins/${admin._id}/status`);
      toast.success(`Access level marked as ${admin.status === 'Active' ? 'Suspended' : 'Active'}.`, { id: toastId });
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Clearance toggle failed.', { id: toastId });
    }
  };

  // PASSWORD RESET Action
  const handlePasswordReset = async (admin) => {
    const toastId = toast.loading('Generating new credentials key...');
    try {
      const response = await api.patch(`/admins/${admin._id}/reset-password`);
      toast.success('Credentials reset completed!', { id: toastId });
      
      setTempPasswordCreated(response.data.data.tempPassword);
      setCredentialModalOpen(true);
    } catch (error) {
      toast.error(error.message || 'Reset failed.', { id: toastId });
    }
  };

  // Helper copy-to-clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Temporary password copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-[24px] border border-primary/5">
        <div>
          <h2 className="text-2xl font-bold text-primary">System Admin Management</h2>
          <p className="text-on-surface-variant text-xs mt-1">Provision and regulate campus administrator accounts across colleges.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Provision Admin
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-3 flex items-center bg-surface rounded-xl px-4 py-2 border border-primary/5 shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search admins by name, email, or phone..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-on-surface-variant/50 outline-none ml-2"
            type="text"
          />
        </div>

        {/* Institution Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={instFilter}
            onChange={(e) => {
              setInstFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Institutions</option>
            {institutions.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.institutionCode} - {inst.institutionName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active Profile</option>
            <option value="Suspended">Suspended Profile</option>
          </select>
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="glass-panel p-6 rounded-[24px] shadow-sm">
        
        {loading ? (
          // Loading Skeletons
          <div className="space-y-4 py-4">
            <div className="h-8 bg-surface-container-high animate-pulse rounded-lg w-full"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-surface-container-low animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
        ) : admins.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <span className="material-symbols-outlined text-primary/45 text-5xl">group_off</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">No Admins Mapped</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">No administrators matched your filters search constraints.</p>
            </div>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/10 pb-4 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  <th className="py-4 px-3">Avatar</th>
                  <th className="py-4 px-3">Name & Email</th>
                  <th className="py-4 px-3">Institution Mapped</th>
                  <th className="py-4 px-3">Phone</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {admins.map((adm) => (
                  <tr key={adm._id} className="hover:bg-primary/5 transition-colors">
                    {/* Avatar */}
                    <td className="py-4 px-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-primary/10">
                        {adm.avatar ? (
                          <img
                            src={`${backendUrl}/${adm.avatar}`}
                            alt={adm.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{adm.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </td>

                    {/* Name & Email */}
                    <td className="py-4 px-3">
                      <p className="font-bold text-primary">{adm.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{adm.email}</p>
                    </td>

                    {/* Institution */}
                    <td className="py-4 px-3">
                      {adm.institution ? (
                        <div>
                          <p className="font-semibold text-on-surface">{adm.institution.institutionName}</p>
                          <p className="font-mono text-xs text-on-surface-variant uppercase mt-0.5">{adm.institution.institutionCode}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-error font-mono font-semibold uppercase">UNASSIGNED_NODE</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-3">
                      <span className="font-medium text-on-surface-variant">{adm.phone || '—'}</span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => handleStatusToggle(adm)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          adm.status === 'Active'
                            ? 'bg-secondary/15 text-secondary'
                            : 'bg-error/10 text-error'
                        } hover:scale-95 transition-transform`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${adm.status === 'Active' ? 'bg-secondary' : 'bg-error'}`}></span>
                        {adm.status}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex justify-end gap-3">
                        {/* Reset password */}
                        <button
                          onClick={() => handlePasswordReset(adm)}
                          title="Reset Password"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-amber-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                        </button>

                        {/* View Drawer Details */}
                        <button
                          onClick={() => {
                            setSelectedAdmin(adm);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>

                        {/* Edit details */}
                        <button
                          onClick={() => handleEditClick(adm)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        {/* Delete account */}
                        <button
                          onClick={() => {
                            setSelectedAdmin(adm);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Account"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            <div className="flex items-center justify-between border-t border-primary/10 mt-6 pt-4">
              <span className="text-xs text-on-surface-variant font-mono">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================
          ADD ADMIN MODAL
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
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Provision Campus Admin</h3>
              <p className="text-on-surface-variant text-xs mb-6">Create credentials and map the Admin to their respective institution.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Full Name</label>
                    <input
                      {...registerAdd('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Dr. Thomas Harris"
                    />
                    {errorsAdd.name && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Email Address</label>
                    <input
                      {...registerAdd('email', { required: 'Email address is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. t.harris@berkeley.edu"
                      type="email"
                    />
                    {errorsAdd.email && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone Number *</label>
                    <input
                      {...registerAdd('phone', { required: 'Phone Number is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="+1 (510) 902-1404"
                    />
                    {errorsAdd.phone && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.phone.message}</span>}
                  </div>

                  {/* Institution Map Dropdown */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Assign Institution *</label>
                    <select
                      {...registerAdd('institution', { required: 'Assigning an institution is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Choose Institution...</option>
                      {institutions.map((inst) => (
                        <option key={inst._id} value={inst._id}>
                          {inst.institutionName} ({inst.institutionCode})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.institution && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.institution.message}</span>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Password *</label>
                    <div className="relative">
                      <input
                        {...registerAdd('password', {
                          required: 'Password is required',
                          validate: {
                            minLength: (v) => v.length >= 8 || 'Password must be at least 8 characters long',
                            uppercase: (v) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
                            lowercase: (v) => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
                            number: (v) => /[0-9]/.test(v) || 'Password must contain at least one number',
                            specialChar: (v) => /[^A-Za-z0-9]/.test(v) || 'Password must contain at least one special character',
                          }
                        })}
                        className="w-full input-underline py-2 pr-10 focus:ring-0 text-base"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-2 top-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {errorsAdd.password && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.password.message}</span>}
                    
                    {/* Password Strength Indicator */}
                    {passwordValue && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider">
                          <span className="text-on-surface-variant">Strength:</span>
                          <span className={`px-2 py-0.5 rounded-full ${getPasswordStrength(passwordValue).color}`}>
                            {getPasswordStrength(passwordValue).label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                          <div className={`h-full ${getPasswordStrength(passwordValue).barColor} ${getPasswordStrength(passwordValue).width} transition-all duration-300`}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Confirm Password *</label>
                    <div className="relative">
                      <input
                        {...registerAdd('confirmPassword', {
                          required: 'Confirm Password is required',
                          validate: (value) => value === passwordValue || 'Passwords do not match'
                        })}
                        className="w-full input-underline py-2 pr-10 focus:ring-0 text-base"
                        placeholder="••••••••"
                        type={showConfirmPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute right-2 top-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {errorsAdd.confirmPassword && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.confirmPassword.message}</span>}
                  </div>

                  {/* Profile avatar photo upload */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-2 uppercase px-1">Profile Photo (Optional)</label>
                    <input
                      {...registerAdd('avatar')}
                      className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/5 file:text-primary hover:file:bg-primary/10 file:cursor-pointer"
                      type="file"
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all"
                  >
                    Create Campus Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          EDIT ADMIN MODAL
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
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Admin Credentials</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify administrator contact mapping configuration files.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Full Name</label>
                    <input
                      {...registerEdit('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.name && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Email Address</label>
                    <input
                      {...registerEdit('email', { required: 'Email address is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      type="email"
                    />
                    {errorsEdit.email && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone Number</label>
                    <input
                      {...registerEdit('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Institution Map Dropdown */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Assign Institution</label>
                    <select
                      {...registerEdit('institution', { required: 'Assigning an institution is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Choose Institution...</option>
                      {institutions.map((inst) => (
                        <option key={inst._id} value={inst._id}>
                          {inst.institutionName} ({inst.institutionCode})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.institution && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.institution.message}</span>}
                  </div>

                  {/* Profile avatar photo upload */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-2 uppercase px-1">Update Profile Photo (Optional)</label>
                    <input
                      {...registerEdit('avatar')}
                      className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/5 file:text-primary hover:file:bg-primary/10 file:cursor-pointer"
                      type="file"
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          DELETE DIALOG
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
              className="relative bg-surface-container-lowest max-w-md w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined">warning</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">Remove Admin Profile?</h3>
                <p className="text-on-surface-variant text-sm">
                  This will hard-delete the account of <span className="font-semibold text-primary">{selectedAdmin?.name}</span> from the network database.
                  This action is irreversible and blocks administrative access to the campus node immediately.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all w-1/2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="py-3 px-6 rounded-xl bg-error text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all w-1/2"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          TEMPORARY PASSWORD DISPLAY MODAL
      ======================================================== */}
      <AnimatePresence>
        {credentialModalOpen && (
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
              className="relative bg-surface-container-lowest max-w-md w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 text-center space-y-6 animate-in fade-in duration-250"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined">vpn_key</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">New Temporary Credentials</h3>
                <p className="text-on-surface-variant text-sm">
                  Please copy and share this temporary password with the administrator. It is hashed in the database and will not be displayed again.
                </p>
              </div>

              {/* Password text block */}
              <div className="bg-surface-container py-4 px-6 rounded-xl flex items-center justify-between border border-primary/5 max-w-sm mx-auto shadow-inner">
                <span className="font-mono text-lg font-bold text-primary select-all tracking-widest">{tempPasswordCreated}</span>
                <button
                  onClick={() => copyToClipboard(tempPasswordCreated)}
                  title="Copy password"
                  className="p-2 text-on-surface-variant hover:text-primary rounded-lg transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
              </div>

              <div>
                <button
                  onClick={() => setCredentialModalOpen(false)}
                  className="py-3 px-8 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all w-full max-w-xs shadow-md shadow-primary/10"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          VIEW DETAILS DRAWER
      ======================================================== */}
      <AnimatePresence>
        {detailsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsDrawerOpen(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-surface-container-lowest border-l border-primary/10 shadow-2xl p-8 z-50 overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                  <h3 className="text-lg font-bold text-primary">Admin Account Details</h3>
                  <button
                    onClick={() => setDetailsDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Profile Card */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden bg-primary/5 text-primary text-3xl font-bold">
                    {selectedAdmin?.avatar ? (
                      <img
                        src={`${backendUrl}/${selectedAdmin.avatar}`}
                        alt={selectedAdmin.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{selectedAdmin?.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-primary">{selectedAdmin?.name}</h4>
                    <p className="font-mono text-[10px] font-semibold text-secondary px-2.5 py-0.5 bg-secondary/10 rounded-full inline-block tracking-wider mt-1 uppercase">
                      {selectedAdmin?.role}
                    </p>
                  </div>
                </div>

                {/* Info Blocks */}
                <div className="space-y-4 text-sm">
                  {/* Email */}
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Email Address</span>
                    <span className="font-semibold text-on-surface">{selectedAdmin?.email}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Phone</span>
                    <span className="font-semibold text-on-surface">{selectedAdmin?.phone || '—'}</span>
                  </div>

                  {/* Mapped Institution */}
                  <div className="flex flex-col py-2 border-b border-primary/5 space-y-1">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Mapped Institution</span>
                    {selectedAdmin?.institution ? (
                      <div className="bg-surface-container p-3 rounded-xl border border-primary/5">
                        <p className="font-semibold text-primary">{selectedAdmin.institution.institutionName}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant uppercase mt-0.5">Code: {selectedAdmin.institution.institutionCode}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-error font-semibold font-mono uppercase">NODE_UNASSIGNED</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-primary/10 mt-8 flex justify-between items-center text-sm font-mono text-[10px] font-semibold text-on-surface-variant">
                <span>NODE_CLEARANCE: {selectedAdmin?.status?.toUpperCase()}</span>
                <span>REGISTERED: {selectedAdmin?.createdAt ? new Date(selectedAdmin.createdAt).toLocaleDateString() : ''}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SuperAdminAdmins;
