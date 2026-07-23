import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, Search, Edit2, Trash2, Eye, Award, CheckCircle, XCircle, ShieldAlert, GraduationCap, Building2, Layers, Clock
} from 'lucide-react';
import api from '../services/api';

const AdminSemesters = () => {
  // Main states
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, current: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filters parameters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Panels visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Focus context state
  const [selectedSem, setSelectedSem] = useState(null);

  // Dynamic filter lists for modals
  const [addSelectedDept, setAddSelectedDept] = useState('');
  const [editSelectedDept, setEditSelectedDept] = useState('');

  // Forms hooks
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    setValue: setValueAdd,
    formState: { errors: errorsAdd },
  } = useForm();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm();

  // Load semesters list
  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/semesters', {
        params: {
          search,
          department: deptFilter,
          course: courseFilter,
          status: statusFilter,
          sortBy,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setSemesters(response.data.data.results);
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve semesters list.');
    } finally {
      setLoading(false);
    }
  };

  // Load active courses and departments for filter/form dropdown lists
  const fetchDropdowns = async () => {
    try {
      const response = await api.get('/semesters/dropdowns');
      if (response.data && response.data.success) {
        setDepartments(response.data.data.departments);
        setCourses(response.data.data.courses);
      }
    } catch (error) {
      console.error('Failed to load active courses/departments lists', error);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, [search, deptFilter, courseFilter, statusFilter, sortBy, currentPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // CREATE Action
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering Semester details...');
    try {
      await api.post('/semesters', {
        name: data.name,
        semesterNumber: parseInt(data.semesterNumber, 10),
        department: data.department,
        course: data.course,
        academicYear: data.academicYear,
        description: data.description,
        status: data.status,
      });

      toast.success('Semester created successfully.', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      setAddSelectedDept('');
      fetchSemesters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Semester creation failed.', { id: toastId });
    }
  };

  // Open EDIT Modal populated with active values
  const handleEditClick = (sem) => {
    setSelectedSem(sem);
    setEditSelectedDept(sem.department?._id || '');
    setValueEdit('name', sem.name);
    setValueEdit('semesterNumber', sem.semesterNumber);
    setValueEdit('department', sem.department?._id || '');
    setValueEdit('course', sem.course?._id || '');
    setValueEdit('academicYear', sem.academicYear);
    setValueEdit('description', sem.description || '');
    setValueEdit('status', sem.status);
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing semester records...');
    try {
      await api.put(`/semesters/${selectedSem._id}`, {
        name: data.name,
        semesterNumber: parseInt(data.semesterNumber, 10),
        department: data.department,
        course: data.course,
        academicYear: data.academicYear,
        description: data.description,
        status: data.status,
      });
      toast.success('Semester details updated successfully.', { id: toastId });
      setEditModalOpen(false);
      fetchSemesters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Semester modification failed.', { id: toastId });
    }
  };

  // HARD DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Deleting semester record...');
    try {
      await api.delete(`/semesters/${selectedSem._id}`);
      toast.success('Semester deleted successfully.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchSemesters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deactivation failed.', { id: toastId });
    }
  };

  // TOGGLE STATUS Action
  const handleStatusToggle = async (sem) => {
    const toastId = toast.loading('Changing semester status...');
    try {
      const response = await api.patch(`/semesters/${sem._id}/status`);
      toast.success(response.data.message || 'Status updated.', { id: toastId });
      fetchSemesters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Clearance toggle failed.', { id: toastId });
    }
  };

  // Helper filters for course selections in modal forms
  const addFilteredCourses = courses.filter(course => course.department === addSelectedDept);
  const editFilteredCourses = courses.filter(course => course.department === editSelectedDept);

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
              <Calendar size={12} />
              Term Schedule
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Semester Management</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">Configure academic terms, duration boundaries, and link courses to subjects.</p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary py-2 px-4 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
          >
            <Plus size={14} />
            Create Semester
          </button>
        </div>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Semesters', count: stats.total, icon: Calendar, color: '#8B1E3F', bg: '#FDF0F4' },
          { title: 'Active Semesters', count: stats.active, icon: CheckCircle, color: '#059669', bg: '#ECFDF5' },
          { title: 'Inactive Semesters', count: stats.inactive, icon: XCircle, color: '#D97706', bg: '#FFFBEB' },
          { title: 'Current Semester', count: stats.current, icon: Clock, color: '#3B82F6', bg: '#EFF6FF' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase text-xs">{card.title}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1 search-bar">
            <Search size={14} className="text-[#9CA3AF] flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search semesters..."
              type="text"
            />
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCourseFilter('');
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">All Courses</option>
            {courses
              .filter(course => !deptFilter || course.department === deptFilter)
              .map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name} ({course.code})
                </option>
              ))}
          </select>

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
            <option value="number_asc">Semester Number (Asc)</option>
            <option value="number_desc">Semester Number (Desc)</option>
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
        ) : semesters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar size={24} />
            </div>
            <h3 className="text-base font-bold text-[#111111]">No Semesters Found</h3>
            <p className="text-[#6B7280] text-xs max-w-sm mt-1">No academic semesters mapped matching your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table">
              <thead>
                <tr>
                  <th>Semester Name</th>
                  <th className="text-center">Number</th>
                  <th>Department</th>
                  <th>Course</th>
                  <th className="text-center">Academic Year</th>
                  <th className="text-center">Subjects</th>
                  <th className="text-center">Students</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3">Created</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((sem) => (
                  <tr key={sem._id}>
                    <td className="font-semibold text-[#8B1E3F]">{sem.name}</td>
                    <td className="text-center font-mono font-semibold text-[#111111]">{sem.semesterNumber}</td>
                    <td>
                      {sem.department ? (
                        <div>
                          <p className="font-semibold text-[#111111] leading-tight">{sem.department.name}</p>
                          <p className="text-[10px] text-[#9CA3AF] font-mono leading-none mt-0.5">{sem.department.code}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-mono font-semibold">UNASSIGNED_DEPT</span>
                      )}
                    </td>
                    <td>
                      {sem.course ? (
                        <div>
                          <p className="font-semibold text-[#111111] leading-tight">{sem.course.name}</p>
                          <p className="text-[10px] text-[#9CA3AF] font-mono leading-none mt-0.5">{sem.course.code}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-mono font-semibold">UNASSIGNED_COURSE</span>
                      )}
                    </td>
                    <td className="text-center font-mono text-[#111111]">{sem.academicYear}</td>
                    <td className="text-center font-mono font-bold text-[#111111]">{sem.subjectsCount}</td>
                    <td className="text-center font-mono font-bold text-[#111111]">{sem.studentsCount}</td>
                    <td className="text-center">
                      <button
                        onClick={() => handleStatusToggle(sem)}
                        className={`badge ${sem.status === 'Active' ? 'badge-green' : 'badge-red'} hover:scale-95 transition-transform`}
                      >
                        {sem.status}
                      </button>
                    </td>
                    <td className="font-mono text-xs text-[#6B7280]">
                      {new Date(sem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedSem(sem);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View"
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#8B1E3F] hover:bg-[#FDF0F4] transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleEditClick(sem)}
                          title="Edit"
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#8B1E3F] hover:bg-[#FDF0F4] transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSem(sem);
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
          CREATE SEMESTER MODAL
      ======================================================== */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setAddModalOpen(false);
                setAddSelectedDept('');
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Create Semester</h3>
              <p className="text-on-surface-variant text-xs mb-6">Map a new term division under courses inside your institution.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester Name *</label>
                    <input
                      {...registerAdd('name', { required: 'Semester Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. First Semester"
                    />
                    {errorsAdd.name && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Semester Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester Number *</label>
                    <input
                      type="number"
                      {...registerAdd('semesterNumber', { required: 'Semester Number is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 1"
                    />
                    {errorsAdd.semesterNumber && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.semesterNumber.message}</span>}
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Academic Year *</label>
                    <input
                      {...registerAdd('academicYear', { required: 'Academic Year is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 2026-2027"
                    />
                    {errorsAdd.academicYear && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.academicYear.message}</span>}
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerAdd('department', {
                        required: 'Department is required',
                        onChange: (e) => {
                          setAddSelectedDept(e.target.value);
                          setValueAdd('course', '');
                        }
                      })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {errorsAdd.department && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.department.message}</span>}
                  </div>

                  {/* Course Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course *</label>
                    <select
                      {...registerAdd('course', { required: 'Course is required' })}
                      disabled={!addSelectedDept}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Course...</option>
                      {addFilteredCourses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.course && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.course.message}</span>}
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

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerAdd('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief term summary..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalOpen(false);
                      setAddSelectedDept('');
                    }}
                    className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all"
                  >
                    Create Semester
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          EDIT SEMESTER MODAL
      ======================================================== */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditModalOpen(false);
                setEditSelectedDept('');
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Semester</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify records and coordinates for this semester division.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester Name *</label>
                    <input
                      {...registerEdit('name', { required: 'Semester Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. First Semester"
                    />
                    {errorsEdit.name && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Semester Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester Number *</label>
                    <input
                      type="number"
                      {...registerEdit('semesterNumber', { required: 'Semester Number is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 1"
                    />
                    {errorsEdit.semesterNumber && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.semesterNumber.message}</span>}
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Academic Year *</label>
                    <input
                      {...registerEdit('academicYear', { required: 'Academic Year is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 2026-2027"
                    />
                    {errorsEdit.academicYear && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.academicYear.message}</span>}
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerEdit('department', {
                        required: 'Department is required',
                        onChange: (e) => {
                          setEditSelectedDept(e.target.value);
                          setValueEdit('course', '');
                        }
                      })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {errorsEdit.department && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.department.message}</span>}
                  </div>

                  {/* Course Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course *</label>
                    <select
                      {...registerEdit('course', { required: 'Course is required' })}
                      disabled={!editSelectedDept}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Course...</option>
                      {editFilteredCourses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.course && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.course.message}</span>}
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

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerEdit('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief term summary..."
                    />
                  </div>

                  {/* READ ONLY Date details */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Created Date</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedSem ? new Date(selectedSem.createdAt).toLocaleString() : ''}
                      className="w-full border-0 border-b border-dashed border-outline-variant text-on-surface-variant/70 text-sm py-2 cursor-not-allowed bg-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Last Updated</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedSem ? new Date(selectedSem.updatedAt).toLocaleString() : ''}
                      className="w-full border-0 border-b border-dashed border-outline-variant text-on-surface-variant/70 text-sm py-2 cursor-not-allowed bg-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditSelectedDept('');
                    }}
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
                <h3 className="text-xl font-bold text-primary">Delete Semester</h3>
                <p className="text-on-surface-variant text-sm">
                  Are you sure you want to delete the semester <strong>{selectedSem?.name} (No: {selectedSem?.semesterNumber})</strong>? This action will perform a soft-delete and hide it from all listing indices.
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
                  <h3 className="text-lg font-bold text-primary">Semester Details</h3>
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
                    <span className="material-symbols-outlined text-4xl">calendar_today</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-primary">{selectedSem?.name}</h4>
                    <p className="font-mono text-xs font-semibold text-secondary px-3 py-0.5 bg-secondary/10 rounded-full inline-block tracking-wider mt-1 uppercase">
                      Number: {selectedSem?.semesterNumber}
                    </p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Academic Year</span>
                    <span className="font-mono font-bold text-on-surface">{selectedSem?.academicYear}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Department</span>
                    <span className="font-semibold text-on-surface">
                      {selectedSem?.department ? selectedSem.department.name : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Course Mapping</span>
                    <span className="font-semibold text-on-surface">
                      {selectedSem?.course ? `${selectedSem.course.name} (${selectedSem.course.code})` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Subjects Count</span>
                    <span className="font-mono font-bold text-on-surface">{selectedSem?.subjectsCount}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Students Registered</span>
                    <span className="font-mono font-bold text-on-surface">{selectedSem?.studentsCount}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Clearance Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      selectedSem?.status === 'Active' ? 'bg-secondary/15 text-secondary' : 'bg-error/10 text-error'
                    }`}>
                      {selectedSem?.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-col py-2 border-b border-primary/5 space-y-1">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Description</span>
                    <p className="text-on-surface-variant text-xs leading-relaxed bg-surface-container p-3 rounded-xl border border-primary/5">
                      {selectedSem?.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-primary/10 mt-8 flex justify-between items-center text-sm font-mono text-[9px] font-semibold text-on-surface-variant">
                <span>CREATED: {selectedSem?.createdAt ? new Date(selectedSem.createdAt).toLocaleDateString() : ''}</span>
                <span>UPDATED: {selectedSem?.updatedAt ? new Date(selectedSem.updatedAt).toLocaleDateString() : ''}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminSemesters;
