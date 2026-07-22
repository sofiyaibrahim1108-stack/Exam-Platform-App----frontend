import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const SuperAdminInstitutions = () => {
  // Lists & pagination state
  const [institutions, setInstitutions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal / Drawer visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Active records context
  const [selectedInst, setSelectedInst] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Forms setup
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd },
  } = useForm();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm();

  // Load Institutions on query dependencies change
  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/institutions', {
        params: {
          search,
          status: statusFilter,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setInstitutions(response.data.data.results);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to retrieve institutions list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [search, statusFilter, currentPage]);

  // Helper to compile FormData from raw inputs
  const createFormData = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'logo') {
        if (data.logo && data.logo[0]) {
          formData.append('logo', data.logo[0]);
        }
      } else {
        formData.append(key, data[key] || '');
      }
    });
    return formData;
  };

  // CREATE Action
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering institution...');
    try {
      const formData = createFormData(data);
      await api.post('/institutions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Institution onboarding successful!', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      fetchInstitutions();
    } catch (error) {
      toast.error(error.message || 'Onboarding registration failed.', { id: toastId });
    }
  };

  // Open EDIT Modal populated with active values
  const handleEditClick = (inst) => {
    setSelectedInst(inst);
    setValueEdit('institutionName', inst.institutionName);
    setValueEdit('institutionCode', inst.institutionCode);
    setValueEdit('email', inst.email);
    setValueEdit('phone', inst.phone || '');
    setValueEdit('website', inst.website || '');
    setValueEdit('description', inst.description || '');
    setValueEdit('address', inst.address || '');
    setValueEdit('city', inst.city || '');
    setValueEdit('state', inst.state || '');
    setValueEdit('country', inst.country || '');
    setValueEdit('postalCode', inst.postalCode || '');
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing credentials...');
    try {
      const formData = createFormData(data);
      await api.put(`/institutions/${selectedInst._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Institution credentials updated!', { id: toastId });
      setEditModalOpen(false);
      fetchInstitutions();
    } catch (error) {
      toast.error(error.message || 'Credential modification failed.', { id: toastId });
    }
  };

  // SOFT DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Removing institution profile...');
    try {
      await api.delete(`/institutions/${selectedInst._id}`);
      toast.success('Institution profile deactivated and archived.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchInstitutions();
    } catch (error) {
      toast.error(error.message || 'Deactivation failed.', { id: toastId });
    }
  };

  // STATUS TOGGLE Action
  const handleStatusToggle = async (inst) => {
    const toastId = toast.loading('Toggling security status...');
    try {
      await api.patch(`/institutions/${inst._id}/status`);
      toast.success(`Security clearance modified!`, { id: toastId });
      fetchInstitutions();
    } catch (error) {
      toast.error(error.message || 'Status modification failed.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-[24px] border border-primary/5">
        <div>
          <h2 className="text-2xl font-bold text-primary">Institution Management</h2>
          <p className="text-on-surface-variant text-xs mt-1">Configure, register, and monitor academic institutions on the network.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Onboard Institution
        </button>
      </div>

      {/* Search & Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-3 flex items-center bg-surface rounded-xl px-4 py-2 border border-primary/5 shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search institutions by name, code, or city..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-on-surface-variant/50 outline-none ml-2"
            type="text"
          />
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
            <option value="">All Clearances</option>
            <option value="Active">Active Nodes</option>
            <option value="Inactive">Inactive Nodes</option>
          </select>
        </div>
      </div>

      {/* Main Content Card Wrapper */}
      <div className="glass-panel p-6 rounded-[24px] shadow-sm">
        
        {loading ? (
          // Loading Skeleton
          <div className="space-y-4 py-4">
            <div className="h-8 bg-surface-container-high animate-pulse rounded-lg w-full"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-surface-container-low animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
        ) : institutions.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <span className="material-symbols-outlined text-primary/45 text-5xl">domain_disabled</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">No Institutions Found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">No active or inactive university profiles match your search boundaries.</p>
            </div>
          </div>
        ) : (
          // Data Table View
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/10 pb-4 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  <th className="py-4 px-3">Logo</th>
                  <th className="py-4 px-3">Name & Code</th>
                  <th className="py-4 px-3">Contact Email</th>
                  <th className="py-4 px-3">Location</th>
                  <th className="py-4 px-3 text-center">Clearance Status</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {institutions.map((inst) => (
                  <tr key={inst._id} className="hover:bg-primary/5 transition-colors">
                    {/* Logo Column */}
                    <td className="py-4 px-3">
                      <div className="w-12 h-12 rounded-lg border border-primary/10 flex items-center justify-center overflow-hidden bg-white">
                        {inst.logo ? (
                          <img
                            src={`${backendUrl}/${inst.logo}`}
                            alt={inst.institutionName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-xl">domain</span>
                        )}
                      </div>
                    </td>

                    {/* Name & Code Column */}
                    <td className="py-4 px-3">
                      <p className="font-semibold text-primary">{inst.institutionName}</p>
                      <p className="font-mono text-xs text-on-surface-variant tracking-wider mt-0.5">{inst.institutionCode}</p>
                    </td>

                    {/* Contact Email Column */}
                    <td className="py-4 px-3">
                      <span className="font-medium text-on-surface-variant">{inst.email}</span>
                    </td>

                    {/* Location Column */}
                    <td className="py-4 px-3">
                      <span className="font-semibold text-on-surface">
                        {inst.city ? `${inst.city}, ` : ''}{inst.country || 'Global'}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => handleStatusToggle(inst)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          inst.status === 'Active'
                            ? 'bg-secondary/15 text-secondary'
                            : 'bg-error/10 text-error'
                        } hover:scale-95 transition-transform`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${inst.status === 'Active' ? 'bg-secondary' : 'bg-error'}`}></span>
                        {inst.status}
                      </button>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex justify-end gap-3">
                        {/* View Details Drawer trigger */}
                        <button
                          onClick={() => {
                            setSelectedInst(inst);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        
                        {/* Edit Modal trigger */}
                        <button
                          onClick={() => handleEditClick(inst)}
                          title="Edit Credentials"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        {/* Delete Confirmation trigger */}
                        <button
                          onClick={() => {
                            setSelectedInst(inst);
                            setDeleteDialogOpen(true);
                          }}
                          title="Deactivate / Delete"
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

            {/* Pagination footer */}
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
              className="relative bg-surface-container-lowest max-w-2xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Onboard Academic Institution</h3>
              <p className="text-on-surface-variant text-xs mb-6">Provision institutional servers, configurations, and contacts.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Institution Name</label>
                    <input
                      {...registerAdd('institutionName', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. University of California, Berkeley"
                    />
                    {errorsAdd.institutionName && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.institutionName.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Code</label>
                    <input
                      {...registerAdd('institutionCode', { required: 'Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base uppercase"
                      placeholder="e.g. UCB"
                    />
                    {errorsAdd.institutionCode && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.institutionCode.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Institutional Email</label>
                    <input
                      {...registerAdd('email', { required: 'Contact email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. admin@berkeley.edu"
                      type="email"
                    />
                    {errorsAdd.email && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone</label>
                    <input
                      {...registerAdd('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="+1 (510) 642-6000"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Website URL</label>
                    <input
                      {...registerAdd('website')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="www.berkeley.edu"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Street Address</label>
                    <input
                      {...registerAdd('address')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="110 Sproul Hall"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">City</label>
                    <input
                      {...registerAdd('city')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="Berkeley"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">State / Province</label>
                    <input
                      {...registerAdd('state')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="California"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Country</label>
                    <input
                      {...registerAdd('country')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="United States"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Postal Code</label>
                    <input
                      {...registerAdd('postalCode')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="94720"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description / Notes</label>
                    <textarea
                      {...registerAdd('description')}
                      rows={2}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 focus:ring-0 outline-none text-base"
                      placeholder="Notes on regional campus, settings, exam slots capacity..."
                    />
                  </div>

                  {/* Logo Image Upload */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-2 uppercase px-1">Institutional Seal / Logo</label>
                    <input
                      {...registerAdd('logo')}
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
                    Complete Onboarding
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
              className="relative bg-surface-container-lowest max-w-2xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Institution Credentials</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify contact information, network servers, and details.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Institution Name</label>
                    <input
                      {...registerEdit('institutionName', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.institutionName && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.institutionName.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Code</label>
                    <input
                      {...registerEdit('institutionCode', { required: 'Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base uppercase"
                    />
                    {errorsEdit.institutionCode && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.institutionCode.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Institutional Email</label>
                    <input
                      {...registerEdit('email', { required: 'Contact email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      type="email"
                    />
                    {errorsEdit.email && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone</label>
                    <input
                      {...registerEdit('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Website URL</label>
                    <input
                      {...registerEdit('website')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Street Address</label>
                    <input
                      {...registerEdit('address')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">City</label>
                    <input
                      {...registerEdit('city')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">State / Province</label>
                    <input
                      {...registerEdit('state')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Country</label>
                    <input
                      {...registerEdit('country')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Postal Code</label>
                    <input
                      {...registerEdit('postalCode')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description / Notes</label>
                    <textarea
                      {...registerEdit('description')}
                      rows={2}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 focus:ring-0 outline-none text-base"
                    />
                  </div>

                  {/* Logo Image Upload */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-2 uppercase px-1">Change Seal / Logo (Optional)</label>
                    <input
                      {...registerEdit('logo')}
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
                <h3 className="text-xl font-bold text-primary">Deactivate Institution?</h3>
                <p className="text-on-surface-variant text-sm">
                  This will archive the profile of <span className="font-semibold text-primary">{selectedInst?.institutionName}</span>. 
                  Syllabi and users will remain referenced, but active exams and access credentials will be blocked.
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
                  Confirm Deactivation
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
                {/* Header Drawer */}
                <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                  <h3 className="text-lg font-bold text-primary">Institution Details</h3>
                  <button
                    onClick={() => setDetailsDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Identity Card */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-primary/20 flex items-center justify-center overflow-hidden bg-white p-2">
                    {selectedInst?.logo ? (
                      <img
                        src={`${backendUrl}/${selectedInst.logo}`}
                        alt={selectedInst.institutionName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-4xl">domain</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-primary">{selectedInst?.institutionName}</h4>
                    <p className="font-mono text-xs text-secondary font-bold tracking-widest mt-1 uppercase">{selectedInst?.institutionCode}</p>
                  </div>
                </div>

                {/* Info Blocks */}
                <div className="space-y-4 text-sm">
                  {/* Website */}
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Website</span>
                    <a
                      href={selectedInst?.website ? (selectedInst.website.startsWith('http') ? selectedInst.website : `https://${selectedInst.website}`) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-secondary hover:underline truncate max-w-xs"
                    >
                      {selectedInst?.website || 'Not configured'}
                    </a>
                  </div>

                  {/* Email */}
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Email</span>
                    <span className="font-semibold text-on-surface">{selectedInst?.email}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Phone</span>
                    <span className="font-semibold text-on-surface">{selectedInst?.phone || 'Not configured'}</span>
                  </div>

                  {/* Address */}
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Address</span>
                    <span className="font-semibold text-on-surface text-right max-w-xs leading-snug">
                      {selectedInst?.address ? `${selectedInst.address}, ` : ''}
                      {selectedInst?.city ? `${selectedInst.city}, ` : ''}
                      {selectedInst?.state ? `${selectedInst.state}, ` : ''}
                      {selectedInst?.country || ''}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="py-2">
                    <span className="font-mono text-xs text-on-surface-variant uppercase block mb-1">About / Notes</span>
                    <p className="text-on-surface-variant leading-relaxed bg-surface-container py-3 px-4 rounded-xl text-xs">
                      {selectedInst?.description || 'No notes provisioned for this institutional profile.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status block in drawer */}
              <div className="pt-6 border-t border-primary/10 mt-8 flex justify-between items-center text-sm font-mono text-[10px] font-semibold text-on-surface-variant">
                <span>NODE_STATUS: {selectedInst?.status?.toUpperCase()}</span>
                <span>ONBOARDED: {selectedInst?.createdAt ? new Date(selectedInst.createdAt).toLocaleDateString() : ''}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SuperAdminInstitutions;
