import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2, Plus, Users, BookOpen, Layers, Edit2, Trash2, HelpCircle, Eye, Search, AlertCircle, TrendingUp, CheckCircle,XCircle
} from 'lucide-react';
import api from '../services/api';

const AdminDepartments = () => {
  // Main states
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, noHod: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search, filter, and sorting states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals / Dialogs visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Focus context state
  const [selectedDept, setSelectedDept] = useState(null);

  // Forms hooks
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

  // Load departments from server
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/departments', {
        params: {
          search,
          status: statusFilter,
          sortBy,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setDepartments(response.data.data.results);
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve departments list.');
    } finally {
      setLoading(false);
    }
  };

  // Load staff members for dropdown
  const fetchStaff = async () => {
    try {
      const response = await api.get('/departments/staff');
      if (response.data && response.data.success) {
        setStaffList(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load staff list', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [search, statusFilter, sortBy, currentPage]);

  useEffect(() => {
    fetchStaff();
  }, []);

  // CREATE Action
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering Department...');
    try {
      await api.post('/departments', {
        name: data.name,
        code: data.code,
        head: data.head || null,
        description: data.description,
        status: data.status,
      });

      toast.success('Department created successfully.', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Department creation failed.', { id: toastId });
    }
  };

  // Open EDIT Modal populated with active values
  const handleEditClick = (dept) => {
    setSelectedDept(dept);
    setValueEdit('name', dept.name);
    setValueEdit('code', dept.code);
    setValueEdit('head', dept.head?._id || '');
    setValueEdit('description', dept.description || '');
    setValueEdit('status', dept.status);
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing department details...');
    try {
      await api.put(`/departments/${selectedDept._id}`, {
        name: data.name,
        code: data.code,
        head: data.head || null,
        description: data.description,
        status: data.status,
      });
      toast.success('Department details updated successfully.', { id: toastId });
      setEditModalOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Department update failed.', { id: toastId });
    }
  };

  // SOFT DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Removing department profile...');
    try {
      await api.delete(`/departments/${selectedDept._id}`);
      toast.success('Department deleted successfully.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deactivation failed.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Header panel */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <Building2 size={12} />
              Organization Unit
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Department Management</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">Configure academic divisions, assign heads of departments, and monitor metrics.</p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary py-2 px-4 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
          >
            <Plus size={14} />
            Create Department
          </button>
        </div>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Departments', count: stats.total, icon: Building2, color: '#8B1E3F', bg: '#FDF0F4' },
          { title: 'Active', count: stats.active, icon: CheckCircle, color: '#059669', bg: '#ECFDF5' },
          { title: 'Inactive', count: stats.inactive, icon: XCircle, color: '#D97706', bg: '#FFFBEB' },
          { title: 'Without HOD', count: stats.noHod, icon: AlertCircle, color: '#DC2626', bg: '#FEF2F2' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">{card.title}</span>
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: card.bg, color: card.color }}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-2xl font-black font-mono leading-none mt-1" style={{ color: card.color }}>{card.count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="card-flat p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-3 search-bar">
            <Search size={14} className="text-[#9CA3AF] flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search departments by name or code..."
              type="text"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="code_asc">Code (A-Z)</option>
            <option value="code_desc">Code (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Building2 size={24} />
            </div>
            <h3 className="text-base font-bold text-[#111111]">No Departments Found</h3>
            <p className="text-[#6B7280] text-xs max-w-sm mt-1">There are no academic departments matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th>HOD</th>
                  <th className="text-center">Courses</th>
                  <th className="text-center">Staff</th>
                  <th className="text-center">Students</th>
                  <th className="text-center">Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id}>
                    <td className="font-semibold text-[#8B1E3F]">{dept.name}</td>
                    <td className="font-mono text-xs text-[#6B7280]">{dept.code}</td>
                    <td>
                      {dept.head ? (
                        <div>
                          <p className="font-semibold text-[#111111] leading-tight">{dept.head.name}</p>
                          <p className="text-[10px] text-[#9CA3AF] leading-none mt-0.5 font-mono">{dept.head.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9CA3AF] italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="text-center font-mono font-bold text-[#111111]">{dept.totalCourses}</td>
                    <td className="text-center font-mono font-bold text-[#111111]">{dept.totalStaff}</td>
                    <td className="text-center font-mono font-bold text-[#111111]">{dept.totalStudents}</td>
                    <td className="text-center">
                      <span className={`badge ${dept.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#6B7280]">
                      {new Date(dept.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedDept(dept);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View"
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#8B1E3F] hover:bg-[#FDF0F4] transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleEditClick(dept)}
                          title="Edit"
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#8B1E3F] hover:bg-[#FDF0F4] transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDept(dept);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete"
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
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
          CREATE MODAL
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
              <h3 className="text-xl font-bold text-primary mb-2">Create Department</h3>
              <p className="text-on-surface-variant text-xs mb-6">Provision a new academic division inside your institution.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department Name *</label>
                    <input
                      {...registerAdd('name', { required: 'Department Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Computer Science and Engineering"
                    />
                    {errorsAdd.name && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department Code *</label>
                    <input
                      {...registerAdd('code', { required: 'Department Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. CSE"
                    />
                    {errorsAdd.code && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.code.message}</span>}
                  </div>

                  {/* Department Head Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department Head (HOD)</label>
                    <select
                      {...registerAdd('head')}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Not Assigned</option>
                      {staffList.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerAdd('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief summary about this department's focus, laboratories, or coordinates..."
                    />
                  </div>

                  {/* Status selection */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                    <select
                      {...registerAdd('status')}
                      defaultValue="Active"
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
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
                    Create Department
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
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Department</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify records and updates for this department division.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department Name *</label>
                    <input
                      {...registerEdit('name', { required: 'Department Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Computer Science and Engineering"
                    />
                    {errorsEdit.name && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department Code *</label>
                    <input
                      {...registerEdit('code', { required: 'Department Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. CSE"
                    />
                    {errorsEdit.code && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.code.message}</span>}
                  </div>

                  {/* Department Head Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department Head (HOD)</label>
                    <select
                      {...registerEdit('head')}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Not Assigned</option>
                      {staffList.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerEdit('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief summary about this department's focus, laboratories, or coordinates..."
                    />
                  </div>

                  {/* Status selection */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                    <select
                      {...registerEdit('status')}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* READ ONLY Date details */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Created Date</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedDept ? new Date(selectedDept.createdAt).toLocaleString() : ''}
                      className="w-full border-0 border-b border-dashed border-outline-variant text-on-surface-variant/70 text-sm py-2 cursor-not-allowed bg-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Last Updated</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedDept ? new Date(selectedDept.updatedAt).toLocaleString() : ''}
                      className="w-full border-0 border-b border-dashed border-outline-variant text-on-surface-variant/70 text-sm py-2 cursor-not-allowed bg-transparent outline-none"
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
          DELETE CONFIRMATION DIALOG
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
              <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined">delete_forever</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">Delete Department</h3>
                <p className="text-on-surface-variant text-sm">
                  Are you sure you want to delete the department <strong>{selectedDept?.name} ({selectedDept?.code})</strong>? This action will perform a soft-delete and hide it from all listing indices.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all w-1/2"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="py-3 px-6 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all w-1/2 shadow-md shadow-error/10"
                >
                  Yes, Delete
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
                  <h3 className="text-lg font-bold text-primary">Department Details</h3>
                  <button
                    onClick={() => setDetailsDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Main Identity */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-primary/20 flex items-center justify-center bg-primary/5 text-primary text-3xl font-bold">
                    <span className="material-symbols-outlined text-4xl">domain</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-primary">{selectedDept?.name}</h4>
                    <p className="font-mono text-xs font-semibold text-secondary px-3 py-0.5 bg-secondary/10 rounded-full inline-block tracking-wider mt-1 uppercase">
                      Code: {selectedDept?.code}
                    </p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Department Head</span>
                    <span className="font-semibold text-on-surface">
                      {selectedDept?.head ? selectedDept.head.name : 'Not Assigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Total Courses</span>
                    <span className="font-mono font-bold text-on-surface">{selectedDept?.totalCourses}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Total Staff Profiles</span>
                    <span className="font-mono font-bold text-on-surface">{selectedDept?.totalStaff}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Total Student Candidates</span>
                    <span className="font-mono font-bold text-on-surface">{selectedDept?.totalStudents}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Clearance Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      selectedDept?.status === 'Active' ? 'bg-secondary/15 text-secondary' : 'bg-error/10 text-error'
                    }`}>
                      {selectedDept?.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-col py-2 border-b border-primary/5 space-y-1">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Description</span>
                    <p className="text-on-surface-variant text-xs leading-relaxed bg-surface-container p-3 rounded-xl border border-primary/5">
                      {selectedDept?.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-primary/10 mt-8 flex justify-between items-center text-sm font-mono text-[9px] font-semibold text-on-surface-variant">
                <span>CREATED: {selectedDept?.createdAt ? new Date(selectedDept.createdAt).toLocaleDateString() : ''}</span>
                <span>UPDATED: {selectedDept?.updatedAt ? new Date(selectedDept.updatedAt).toLocaleDateString() : ''}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDepartments;
