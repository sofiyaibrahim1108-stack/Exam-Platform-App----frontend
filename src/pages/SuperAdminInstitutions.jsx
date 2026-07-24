import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Plus, Eye, Edit, Trash2, Building2, ExternalLink,
  Globe, Phone, Mail, MapPin, X, Info, ShieldCheck, ShieldX, Calendar
} from 'lucide-react';
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
      <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#8B1538]">Institution Management</h2>
          <p className="text-gray-500 text-xs mt-0.5 font-semibold">Configure, register, and monitor academic institutions on the network.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#8B1538] hover:bg-[#720F2B] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#8B1538]/10"
        >
          <Plus size={15} />
          Onboard Institution
        </button>
      </div>

      {/* Search & Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-3 flex items-center bg-white border border-gray-150 rounded-xl px-4 py-2 shadow-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search institutions by name, code, or city..."
            className="bg-transparent border-none focus:ring-0 text-xs font-semibold w-full placeholder:text-gray-400 outline-none ml-2 text-gray-800"
            type="text"
          />
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
            <option value="Active">Active Nodes</option>
            <option value="Inactive">Inactive Nodes</option>
          </select>
        </div>
      </div>

      {/* Main Content Card Wrapper */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)]">
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="h-8 bg-gray-100 animate-pulse rounded-lg w-full"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-gray-50 animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Building2 size={40} className="text-gray-300" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-800">No Institutions Found</h3>
              <p className="text-gray-500 text-xs max-w-sm font-semibold">No active or inactive university profiles match your search boundaries.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 pb-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-3">Logo</th>
                  <th className="py-4 px-3">Name & Code</th>
                  <th className="py-4 px-3">Contact Email</th>
                  <th className="py-4 px-3">Location</th>
                  <th className="py-4 px-3 text-center">Clearance Status</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {institutions.map((inst) => (
                  <tr key={inst._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Logo Column */}
                    <td className="py-4 px-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-150 flex items-center justify-center overflow-hidden bg-white shrink-0">
                        {inst.logo ? (
                          <img
                            src={`${backendUrl}/${inst.logo}`}
                            alt={inst.institutionName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building2 size={16} className="text-gray-405 text-[#8B1538]" />
                        )}
                      </div>
                    </td>

                    {/* Name & Code Column */}
                    <td className="py-4 px-3">
                      <p className="font-bold text-gray-850">{inst.institutionName}</p>
                      <p className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{inst.institutionCode}</p>
                    </td>

                    {/* Contact Email Column */}
                    <td className="py-4 px-3">
                      <span className="text-gray-500 font-semibold">{inst.email}</span>
                    </td>

                    {/* Location Column */}
                    <td className="py-4 px-3">
                      <span className="text-gray-800">
                        {inst.city ? `${inst.city}, ` : ''}{inst.country || 'Global'}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => handleStatusToggle(inst)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inst.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                        } transition-transform`}
                      >
                        <span className={`w-1 h-1 rounded-full ${inst.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {inst.status}
                      </button>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedInst(inst);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        
                        <button
                          onClick={() => handleEditClick(inst)}
                          title="Edit Credentials"
                          className="p-1.5 rounded-lg hover:bg-[#FDF3F6] text-[#8B1538] transition-colors"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedInst(inst);
                            setDeleteDialogOpen(true);
                          }}
                          title="Deactivate / Delete"
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
              className="relative bg-white max-w-2xl w-full rounded-[24px] border border-gray-150 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#8B1538]">Onboard Academic Institution</h3>
                  <p className="text-gray-500 text-xs mt-0.5 font-semibold">Provision institutional servers, configurations, and contacts.</p>
                </div>
                <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Institution Name</label>
                    <input
                      {...registerAdd('institutionName', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. University of California, Berkeley"
                    />
                    {errorsAdd.institutionName && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.institutionName.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Code</label>
                    <input
                      {...registerAdd('institutionCode', { required: 'Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base uppercase"
                      placeholder="e.g. UCB"
                    />
                    {errorsAdd.institutionCode && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.institutionCode.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Institutional Email</label>
                    <input
                      {...registerAdd('email', { required: 'Contact email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. admin@berkeley.edu"
                      type="email"
                    />
                    {errorsAdd.email && <span className="text-red-500 text-xs block font-mono mt-1">{errorsAdd.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Phone</label>
                    <input
                      {...registerAdd('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="+1 (510) 642-6000"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Website URL</label>
                    <input
                      {...registerAdd('website')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="www.berkeley.edu"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Street Address</label>
                    <input
                      {...registerAdd('address')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 101 University Hall"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">City</label>
                    <input
                      {...registerAdd('city')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Berkeley"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">State / Province</label>
                    <input
                      {...registerAdd('state')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. California"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Country</label>
                    <input
                      {...registerAdd('country')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. United States"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Postal Code</label>
                    <input
                      {...registerAdd('postalCode')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 94720"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Description / Notes</label>
                    <textarea
                      {...registerAdd('description')}
                      rows={2}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="Provide basic notes about campus parameters..."
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase">Institution Seal Logo</label>
                    <input
                      {...registerAdd('logo')}
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FDF3F6] file:text-[#8B1538] hover:file:bg-[#FCEEF2] file:cursor-pointer"
                    />
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
                    Register Node
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
              className="relative bg-white max-w-2xl w-full rounded-[24px] border border-gray-150 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#8B1538]">Edit Institution Details</h3>
                  <p className="text-gray-500 text-xs mt-0.5 font-semibold">Modify security keys, active email lines, or campus descriptions.</p>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Institution Name</label>
                    <input
                      {...registerEdit('institutionName', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.institutionName && <span className="text-red-500 text-xs block font-mono mt-1">{errorsEdit.institutionName.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Code</label>
                    <input
                      {...registerEdit('institutionCode', { required: 'Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base uppercase"
                      disabled
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Institutional Email</label>
                    <input
                      {...registerEdit('email', { required: 'Contact email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      type="email"
                    />
                    {errorsEdit.email && <span className="text-red-500 text-xs block font-mono mt-1">{errorsEdit.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Phone</label>
                    <input
                      {...registerEdit('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Website URL</label>
                    <input
                      {...registerEdit('website')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Street Address</label>
                    <input
                      {...registerEdit('address')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">City</label>
                    <input
                      {...registerEdit('city')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">State / Province</label>
                    <input
                      {...registerEdit('state')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Country</label>
                    <input
                      {...registerEdit('country')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Postal Code</label>
                    <input
                      {...registerEdit('postalCode')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Description / Notes</label>
                    <textarea
                      {...registerEdit('description')}
                      rows={2}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase">Modify Institution Seal Logo</label>
                    <input
                      {...registerEdit('logo')}
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FDF3F6] file:text-[#8B1538] hover:file:bg-[#FCEEF2] file:cursor-pointer"
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
                    Sync Credentials
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
                  <h3 className="text-base font-extrabold text-gray-800">Archive Academic Profile</h3>
                  <p className="text-gray-500 text-xs font-semibold leading-relaxed">
                    Are you sure you want to deactivate and soft-delete <span className="font-bold text-[#8B1538]">{selectedInst?.institutionName}</span>? 
                    All sub-databases associated with this node will lose active sync clearance.
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
                  Deactivate Profile
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
        {detailsDrawerOpen && selectedInst && (
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
                    <div className="w-12 h-12 rounded-xl border border-gray-150 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {selectedInst.logo ? (
                        <img
                          src={`${backendUrl}/${selectedInst.logo}`}
                          alt={selectedInst.institutionName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 size={20} className="text-[#8B1538]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-800">{selectedInst.institutionName}</h4>
                      <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mt-0.5">{selectedInst.institutionCode}</p>
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
                    <span className="text-gray-400 font-mono text-[10px] uppercase font-bold tracking-wider">Node Standing</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      selectedInst.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedInst.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {selectedInst.status}
                    </span>
                  </div>

                  {/* Basic Parameters */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-gray-100 pb-1.5">Network Coordinates</h5>
                    
                    <div className="flex items-start gap-3">
                      <Mail size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Contact Email</p>
                        <p className="text-gray-800 mt-0.5">{selectedInst.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Phone Line</p>
                        <p className="text-gray-800 mt-0.5">{selectedInst.phone || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Web Domain</p>
                        {selectedInst.website ? (
                          <a
                            href={selectedInst.website.startsWith('http') ? selectedInst.website : `https://${selectedInst.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8B1538] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            {selectedInst.website}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <p className="text-gray-500 mt-0.5">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Physical Address */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-gray-100 pb-1.5">Campus Location</h5>
                    
                    <div className="flex items-start gap-3">
                      <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Street Address</p>
                        <p className="text-gray-800 mt-0.5">{selectedInst.address || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">City</p>
                        <p className="text-gray-800 mt-0.5">{selectedInst.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">State / Province</p>
                        <p className="text-gray-800 mt-0.5">{selectedInst.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Country</p>
                        <p className="text-gray-800 mt-0.5">{selectedInst.country || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Postal Code</p>
                        <p className="text-gray-800 mt-0.5">{selectedInst.postalCode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Description */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-gray-100 pb-1.5">Institutional Context</h5>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      {selectedInst.description || 'No description notes saved for this campus profile.'}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setDetailsDrawerOpen(false);
                      handleEditClick(selectedInst);
                    }}
                    className="px-4 py-2 bg-[#8B1538] hover:bg-[#720F2B] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit size={12} />
                    Modify Profile
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

export default SuperAdminInstitutions;
