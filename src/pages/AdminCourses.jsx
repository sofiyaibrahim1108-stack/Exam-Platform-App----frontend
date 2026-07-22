import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminCourses = () => {
  // Main states
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, ug: 0, pg: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filters parameters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Panels visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Focus context state
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Course Types lists
  const courseTypes = ['BE', 'BTech', 'BSc', 'BCA', 'BCom', 'BA', 'ME', 'MTech', 'MSc', 'MBA', 'MCA'];

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

  // Load courses list
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses', {
        params: {
          search,
          department: deptFilter,
          status: statusFilter,
          courseType: typeFilter,
          sortBy,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setCourses(response.data.data.results);
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve courses list.');
    } finally {
      setLoading(false);
    }
  };

  // Load active departments for filter/form dropdown lists
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/courses/departments');
      if (response.data && response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load departments options', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, deptFilter, statusFilter, typeFilter, sortBy, currentPage]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  // CREATE Action
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering Course details...');
    try {
      await api.post('/courses', {
        name: data.name,
        code: data.code,
        department: data.department,
        courseType: data.courseType,
        durationYears: parseInt(data.durationYears, 10),
        totalSemesters: parseInt(data.totalSemesters, 10),
        credits: parseInt(data.credits, 10),
        description: data.description,
        status: data.status,
      });

      toast.success('Course created successfully.', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Course registration failed.', { id: toastId });
    }
  };

  // Open EDIT Modal populated with active values
  const handleEditClick = (course) => {
    setSelectedCourse(course);
    setValueEdit('name', course.name);
    setValueEdit('code', course.code);
    setValueEdit('department', course.department?._id || '');
    setValueEdit('courseType', course.courseType);
    setValueEdit('durationYears', course.durationYears);
    setValueEdit('totalSemesters', course.totalSemesters);
    setValueEdit('credits', course.credits);
    setValueEdit('description', course.description || '');
    setValueEdit('status', course.status);
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing course records...');
    try {
      await api.put(`/courses/${selectedCourse._id}`, {
        name: data.name,
        code: data.code,
        department: data.department,
        courseType: data.courseType,
        durationYears: parseInt(data.durationYears, 10),
        totalSemesters: parseInt(data.totalSemesters, 10),
        credits: parseInt(data.credits, 10),
        description: data.description,
        status: data.status,
      });
      toast.success('Course details updated successfully.', { id: toastId });
      setEditModalOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Course modification failed.', { id: toastId });
    }
  };

  // HARD DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Deleting course record...');
    try {
      await api.delete(`/courses/${selectedCourse._id}`);
      toast.success('Course deleted successfully.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deactivation failed.', { id: toastId });
    }
  };

  // TOGGLE STATUS Action
  const handleStatusToggle = async (course) => {
    const toastId = toast.loading('Changing course status...');
    try {
      const response = await api.patch(`/courses/${course._id}/status`);
      toast.success(response.data.message || 'Status updated.', { id: toastId });
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Clearance toggle failed.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-[24px] border border-primary/5">
        <div>
          <h2 className="text-2xl font-bold text-primary">Course Management</h2>
          <p className="text-on-surface-variant text-xs mt-1">Configure academic courses, specify durations, credit weights, and manage semesters mappings.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Create Course
        </button>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: 'Total Courses', count: stats.total, icon: 'school', color: 'text-primary' },
          { title: 'Active Courses', count: stats.active, icon: 'check_circle', color: 'text-emerald-600' },
          { title: 'Inactive Courses', count: stats.inactive, icon: 'cancel', color: 'text-amber-600' },
          { title: 'UG Courses', count: stats.ug, icon: 'local_library', color: 'text-secondary' },
          { title: 'PG Courses', count: stats.pg, icon: 'workspace_premium', color: 'text-primary' },
        ].map((card) => (
          <div key={card.title} className="glass-panel p-4 rounded-[20px] border border-primary/5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] text-on-surface-variant font-semibold leading-none mb-1.5">{card.title}</p>
              <h3 className="text-2xl font-black font-mono text-primary leading-none">{card.count}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center ${card.color}`}>
              <span className="material-symbols-outlined text-xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-2 flex items-center bg-surface rounded-xl px-4 py-2 border border-primary/5 shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search courses by name or code..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-on-surface-variant/50 outline-none ml-2"
            type="text"
          />
        </div>

        {/* Department Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Type Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            {courseTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
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
        ) : courses.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <span className="material-symbols-outlined text-primary/45 text-5xl">school_disabled</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">No Courses Found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">No academic courses mapped matching your filters search constraints.</p>
            </div>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/10 pb-4 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  <th className="py-4 px-3">Course Name</th>
                  <th className="py-4 px-3">Code</th>
                  <th className="py-4 px-3">Department</th>
                  <th className="py-4 px-3">Type</th>
                  <th className="py-4 px-3 text-center">Duration (Yrs)</th>
                  <th className="py-4 px-3 text-center">Semesters</th>
                  <th className="py-4 px-3 text-center">Credits</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3">Created</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-3 font-semibold text-primary">{course.name}</td>
                    <td className="py-4 px-3 font-mono text-xs text-on-surface-variant">{course.code}</td>
                    <td className="py-4 px-3">
                      {course.department ? (
                        <div>
                          <p className="font-semibold text-on-surface leading-tight">{course.department.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono leading-none mt-0.5">{course.department.code}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-error font-mono font-semibold uppercase">UNASSIGNED_DEPT</span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-secondary/15 text-secondary rounded-full uppercase">
                        {course.courseType}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-on-surface">{course.durationYears}</td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-on-surface">{course.totalSemesters}</td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-on-surface">{course.credits}</td>
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => handleStatusToggle(course)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          course.status === 'Active' ? 'bg-secondary/15 text-secondary' : 'bg-error/10 text-error'
                        } hover:scale-95 transition-transform`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${course.status === 'Active' ? 'bg-secondary' : 'bg-error'}`}></span>
                        {course.status}
                      </button>
                    </td>
                    <td className="py-4 px-3 font-mono text-xs text-on-surface-variant">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Drawer */}
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {/* Edit details */}
                        <button
                          onClick={() => handleEditClick(course)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {/* Delete account */}
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Course"
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
          CREATE COURSE MODAL
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
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Create Course</h3>
              <p className="text-on-surface-variant text-xs mb-6">Provision a new degree course division mapped to a department.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course Name *</label>
                    <input
                      {...registerAdd('name', { required: 'Course Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Bachelor of Technology in CS"
                    />
                    {errorsAdd.name && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course Code *</label>
                    <input
                      {...registerAdd('code', { required: 'Course Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. BTECH-CSE"
                    />
                    {errorsAdd.code && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.code.message}</span>}
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Mapped Department *</label>
                    <select
                      {...registerAdd('department', { required: 'Department is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.department && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.department.message}</span>}
                  </div>

                  {/* Course Type Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course Type *</label>
                    <select
                      {...registerAdd('courseType', { required: 'Course Type is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Type...</option>
                      {courseTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errorsAdd.courseType && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.courseType.message}</span>}
                  </div>

                  {/* Credits */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Credits weight *</label>
                    <input
                      type="number"
                      defaultValue={160}
                      {...registerAdd('credits', { required: 'Credits is required', min: 0 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 160"
                    />
                    {errorsAdd.credits && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.credits.message}</span>}
                  </div>

                  {/* Duration Years */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Duration (Years) *</label>
                    <input
                      type="number"
                      defaultValue={4}
                      {...registerAdd('durationYears', { required: 'Duration is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 4"
                    />
                    {errorsAdd.durationYears && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.durationYears.message}</span>}
                  </div>

                  {/* Total Semesters */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Total Semesters *</label>
                    <input
                      type="number"
                      defaultValue={8}
                      {...registerAdd('totalSemesters', { required: 'Total Semesters is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 8"
                    />
                    {errorsAdd.totalSemesters && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.totalSemesters.message}</span>}
                  </div>

                  {/* Status Selection */}
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

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerAdd('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief summary about this degree, focus tracks, syllabus structure, etc..."
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
                    Create Course
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          EDIT COURSE MODAL
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
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Course</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify records and criteria for this course division.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course Name *</label>
                    <input
                      {...registerEdit('name', { required: 'Course Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Bachelor of Technology in CS"
                    />
                    {errorsEdit.name && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course Code *</label>
                    <input
                      {...registerEdit('code', { required: 'Course Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. BTECH-CSE"
                    />
                    {errorsEdit.code && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.code.message}</span>}
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Mapped Department *</label>
                    <select
                      {...registerEdit('department', { required: 'Department is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.department && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.department.message}</span>}
                  </div>

                  {/* Course Type Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course Type *</label>
                    <select
                      {...registerEdit('courseType', { required: 'Course Type is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Type...</option>
                      {courseTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errorsEdit.courseType && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.courseType.message}</span>}
                  </div>

                  {/* Credits */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Credits weight *</label>
                    <input
                      type="number"
                      {...registerEdit('credits', { required: 'Credits is required', min: 0 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 160"
                    />
                    {errorsEdit.credits && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.credits.message}</span>}
                  </div>

                  {/* Duration Years */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Duration (Years) *</label>
                    <input
                      type="number"
                      {...registerEdit('durationYears', { required: 'Duration is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 4"
                    />
                    {errorsEdit.durationYears && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.durationYears.message}</span>}
                  </div>

                  {/* Total Semesters */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Total Semesters *</label>
                    <input
                      type="number"
                      {...registerEdit('totalSemesters', { required: 'Total Semesters is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 8"
                    />
                    {errorsEdit.totalSemesters && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.totalSemesters.message}</span>}
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                    <select
                      {...registerEdit('status')}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerEdit('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief summary..."
                    />
                  </div>

                  {/* READ ONLY Date details */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Created Date</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedCourse ? new Date(selectedCourse.createdAt).toLocaleString() : ''}
                      className="w-full border-0 border-b border-dashed border-outline-variant text-on-surface-variant/70 text-sm py-2 cursor-not-allowed bg-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Last Updated</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedCourse ? new Date(selectedCourse.updatedAt).toLocaleString() : ''}
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
                <h3 className="text-xl font-bold text-primary">Delete Course</h3>
                <p className="text-on-surface-variant text-sm">
                  Are you sure you want to delete the course <strong>{selectedCourse?.name} ({selectedCourse?.code})</strong>? This action will perform a soft-delete and hide it from all listing indices.
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
                  <h3 className="text-lg font-bold text-primary">Course Details</h3>
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
                    <span className="material-symbols-outlined text-4xl">school</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-primary">{selectedCourse?.name}</h4>
                    <p className="font-mono text-xs font-semibold text-secondary px-3 py-0.5 bg-secondary/10 rounded-full inline-block tracking-wider mt-1 uppercase">
                      Code: {selectedCourse?.code}
                    </p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Course Type</span>
                    <span className="font-mono font-bold text-on-surface uppercase">{selectedCourse?.courseType}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Department</span>
                    <span className="font-semibold text-on-surface">
                      {selectedCourse?.department ? selectedCourse.department.name : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Credits weight</span>
                    <span className="font-mono font-bold text-on-surface">{selectedCourse?.credits}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Duration (Years)</span>
                    <span className="font-mono font-bold text-on-surface">{selectedCourse?.durationYears} yrs</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Total Semesters</span>
                    <span className="font-mono font-bold text-on-surface">{selectedCourse?.totalSemesters}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Clearance Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      selectedCourse?.status === 'Active' ? 'bg-secondary/15 text-secondary' : 'bg-error/10 text-error'
                    }`}>
                      {selectedCourse?.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-col py-2 border-b border-primary/5 space-y-1">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Description</span>
                    <p className="text-on-surface-variant text-xs leading-relaxed bg-surface-container p-3 rounded-xl border border-primary/5">
                      {selectedCourse?.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-primary/10 mt-8 flex justify-between items-center text-sm font-mono text-[9px] font-semibold text-on-surface-variant">
                <span>CREATED: {selectedCourse?.createdAt ? new Date(selectedCourse.createdAt).toLocaleDateString() : ''}</span>
                <span>UPDATED: {selectedCourse?.updatedAt ? new Date(selectedCourse.updatedAt).toLocaleDateString() : ''}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminCourses;
