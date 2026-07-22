import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-[24px] border border-primary/5">
        <div>
          <h2 className="text-2xl font-bold text-primary">Department Management</h2>
          <p className="text-on-surface-variant text-xs mt-1">Configure academic divisions, assign heads of departments, and monitor metrics.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">add_home</span>
          Create Department
        </button>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Departments', count: stats.total, icon: 'domain', color: 'text-primary' },
          { title: 'Active Departments', count: stats.active, icon: 'check_circle', color: 'text-emerald-600' },
          { title: 'Inactive Departments', count: stats.inactive, icon: 'cancel', color: 'text-amber-600' },
          { title: 'Without HOD', count: stats.noHod, icon: 'gavel', color: 'text-error' },
        ].map((card) => (
          <div key={card.title} className="glass-panel p-6 rounded-[24px] border border-primary/5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-on-surface-variant font-medium leading-none mb-2">{card.title}</p>
              <h3 className="text-3xl font-black font-mono text-primary leading-none">{card.count}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center ${card.color}`}>
              <span className="material-symbols-outlined text-2xl">{card.icon}</span>
            </div>
          </div>
        ))}
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
            placeholder="Search departments by name or code..."
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
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="code_asc">Code (A-Z)</option>
            <option value="code_desc">Code (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="glass-panel p-6 rounded-[24px] shadow-sm">
        {loading ? (
          // Loading Skeletons
          <div className="space-y-4 py-4">
            <div className="h-8 bg-surface-container-high animate-pulse rounded-lg w-full"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-surface-container-low animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <span className="material-symbols-outlined text-primary/45 text-5xl">domain_disabled</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">No Departments Found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">There are no academic departments matching your criteria.</p>
            </div>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/10 pb-4 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  <th className="py-4 px-3">Department Name</th>
                  <th className="py-4 px-3">Code</th>
                  <th className="py-4 px-3">HOD</th>
                  <th className="py-4 px-3 text-center">Courses</th>
                  <th className="py-4 px-3 text-center">Staff</th>
                  <th className="py-4 px-3 text-center">Students</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3">Created</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {departments.map((dept) => (
                  <tr key={dept._id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-3 font-semibold text-primary">{dept.name}</td>
                    <td className="py-4 px-3 font-mono text-xs text-on-surface-variant">{dept.code}</td>
                    <td className="py-4 px-3">
                      {dept.head ? (
                        <div>
                          <p className="font-semibold text-on-surface leading-tight">{dept.head.name}</p>
                          <p className="text-[10px] text-on-surface-variant leading-none mt-0.5">{dept.head.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant/60 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-on-surface">{dept.totalCourses}</td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-on-surface">{dept.totalStaff}</td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-on-surface">{dept.totalStudents}</td>
                    <td className="py-4 px-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        dept.status === 'Active' ? 'bg-secondary/15 text-secondary' : 'bg-error/10 text-error'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.status === 'Active' ? 'bg-secondary' : 'bg-error'}`}></span>
                        {dept.status}
                      </span>
                    </td>
                    <td className="py-4 px-3 font-mono text-xs text-on-surface-variant">
                      {new Date(dept.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Drawer */}
                        <button
                          onClick={() => {
                            setSelectedDept(dept);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {/* Edit details */}
                        <button
                          onClick={() => handleEditClick(dept)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {/* Delete account */}
                        <button
                          onClick={() => {
                            setSelectedDept(dept);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Department"
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
