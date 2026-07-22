import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminFacultyAssignment = () => {
  // Page states
  const [assignments, setAssignments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalStaff: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ayFilter, setAyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals visibility state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Form cascading selectors state
  const [addSelectedDept, setAddSelectedDept] = useState('');
  const [addSelectedCourse, setAddSelectedCourse] = useState('');
  const [addSelectedSem, setAddSelectedSem] = useState('');

  const [editSelectedDept, setEditSelectedDept] = useState('');
  const [editSelectedCourse, setEditSelectedCourse] = useState('');
  const [editSelectedSem, setEditSelectedSem] = useState('');

  const academicYears = ['2025-26', '2026-27', '2027-28'];

  // Form hooks
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

  // Retrieve assignments list
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/faculty-assignments', {
        params: {
          search,
          department: deptFilter,
          course: courseFilter,
          semester: semFilter,
          subject: subFilter,
          staff: staffFilter,
          status: statusFilter,
          academicYear: ayFilter,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setAssignments(response.data.data.results);
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to retrieve assignments.');
    } finally {
      setLoading(false);
    }
  };

  // Retrieve dependency options (departments, courses, semesters, subjects)
  const fetchDropdowns = async () => {
    try {
      // Re-use active units dropdowns list
      const dropResponse = await api.get('/units/dropdowns');
      if (dropResponse.data && dropResponse.data.success) {
        setDepartments(dropResponse.data.data.departments || []);
        setCourses(dropResponse.data.data.courses || []);
        setSemesters(dropResponse.data.data.semesters || []);
        setSubjects(dropResponse.data.data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to load cascading dropdown datasets', error);
    }
  };

  // Retrieve active Staff list for assignment selector
  const fetchStaffList = async () => {
    try {
      const staffResponse = await api.get('/user-management/staff', {
        params: { limit: 1000, status: 'Active' },
      });
      if (staffResponse.data && staffResponse.data.success) {
        setStaffList(staffResponse.data.data.results || []);
      }
    } catch (error) {
      console.error('Failed to load active staff listing', error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [search, deptFilter, courseFilter, semFilter, subFilter, staffFilter, statusFilter, ayFilter, currentPage]);

  useEffect(() => {
    fetchDropdowns();
    fetchStaffList();
  }, []);

  // Submit single assignment
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Assigning subject to faculty member...');
    try {
      await api.post('/faculty-assignments', {
        staff: data.staff,
        department: data.department,
        course: data.course,
        semester: data.semester,
        subject: data.subject,
        academicYear: data.academicYear,
        status: data.status,
      });
      toast.success('Subject assigned successfully!', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      setAddSelectedDept('');
      setAddSelectedCourse('');
      setAddSelectedSem('');
      fetchAssignments();
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || 'Faculty assignment failed.', { id: toastId });
    }
  };

  // Open edit modal and load active values
  const handleEditClick = (assignment) => {
    setSelectedAssignment(assignment);
    setEditSelectedDept(assignment.department?._id || '');
    setEditSelectedCourse(assignment.course?._id || '');
    setEditSelectedSem(assignment.semester?._id || '');

    setValueEdit('staff', assignment.staff?._id || '');
    setValueEdit('department', assignment.department?._id || '');
    setValueEdit('course', assignment.course?._id || '');
    setValueEdit('semester', assignment.semester?._id || '');
    setValueEdit('subject', assignment.subject?._id || '');
    setValueEdit('academicYear', assignment.academicYear || '');
    setValueEdit('status', assignment.status || 'Active');

    setEditModalOpen(true);
  };

  // Submit updated assignment details
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing assignment details...');
    try {
      await api.put(`/faculty-assignments/${selectedAssignment._id}`, {
        staff: data.staff,
        department: data.department,
        course: data.course,
        semester: data.semester,
        subject: data.subject,
        academicYear: data.academicYear,
        status: data.status,
      });
      toast.success('Assignment updated successfully.', { id: toastId });
      setEditModalOpen(false);
      fetchAssignments();
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || 'Update failed.', { id: toastId });
    }
  };

  // Toggle active/inactive status
  const handleStatusToggle = async (assignment) => {
    const toastId = toast.loading('Toggling assignment status...');
    try {
      const response = await api.patch(`/faculty-assignments/${assignment._id}/status`);
      toast.success(response.data.message || 'Status toggled successfully.', { id: toastId });
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle status.', { id: toastId });
    }
  };

  // Delete assignment confirmation handler
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Removing assignment reference...');
    try {
      await api.delete(`/faculty-assignments/${selectedAssignment._id}`);
      toast.success('Faculty assignment deleted successfully.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Removal failed.', { id: toastId });
    }
  };

  // Filter lists based on selected cascades
  const addFilteredCourses = courses.filter((c) => c.department?._id === addSelectedDept || c.department === addSelectedDept);
  const addFilteredSemesters = semesters.filter((s) => s.course?._id === addSelectedCourse || s.course === addSelectedCourse);
  const addFilteredSubjects = subjects.filter((sub) => sub.semester?._id === addSelectedSem || sub.semester === addSelectedSem);

  const editFilteredCourses = courses.filter((c) => c.department?._id === editSelectedDept || c.department === editSelectedDept);
  const editFilteredSemesters = semesters.filter((s) => s.course?._id === editSelectedCourse || s.course === editSelectedCourse);
  const editFilteredSubjects = subjects.filter((sub) => sub.semester?._id === editSelectedSem || sub.semester === editSelectedSem);

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-[24px] border border-primary/5">
        <div>
          <h2 className="text-2xl font-bold text-primary">Faculty Assignment</h2>
          <p className="text-on-surface-variant text-xs mt-1">
            Assign subjects to academic staff. Control syllabus administration, AI features, and grade metrics.
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
          Assign Subject
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Assignments', count: stats.total, icon: 'assignment', color: 'text-primary' },
          { title: 'Active Assignments', count: stats.active, icon: 'check_circle', color: 'text-emerald-600' },
          { title: 'Inactive Assignments', count: stats.inactive, icon: 'cancel', color: 'text-amber-600' },
          { title: 'Assigned Staff', count: stats.totalStaff, icon: 'group', color: 'text-secondary' },
        ].map((card) => (
          <div key={card.title} className="glass-panel p-6 rounded-[24px] border border-primary/5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-on-surface-variant font-medium mb-2">{card.title}</p>
              <h3 className="text-3xl font-black font-mono text-primary leading-none">{card.count}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center">
              <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Control bar */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="flex items-center bg-surface-container/60 rounded-xl px-3 py-2 border border-primary/5 shadow-sm w-full md:max-w-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search staff or subjects..."
              className="bg-transparent border-none focus:ring-0 text-xs w-full placeholder:text-on-surface-variant/40 outline-none ml-2"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:justify-end">
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface border border-primary/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary max-w-xs"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.code}</option>
              ))}
            </select>

            <select
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface border border-primary/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary max-w-xs"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.code}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface border border-primary/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={ayFilter}
              onChange={(e) => { setAyFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface border border-primary/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
            >
              <option value="">All Academic Years</option>
              {academicYears.map(ay => (
                <option key={ay} value={ay}>{ay}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="glass-panel rounded-[24px] border border-primary/5 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col justify-center items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <p className="font-mono text-[10px] text-primary tracking-widest animate-pulse">LOADING ASSIGNMENTS...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">assignment_late</span>
            <h4 className="text-base font-bold text-on-surface">No Assignments Mapped</h4>
            <p className="text-on-surface-variant text-xs mt-1 max-w-xs mx-auto">
              We couldn't find any staff-subject mappings matching your active search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/40 text-on-surface-variant font-mono text-[10px] font-semibold border-b border-primary/5 uppercase">
                  <th className="px-6 py-4">Faculty Info</th>
                  <th className="px-6 py-4">Department / Course</th>
                  <th className="px-6 py-4">Sem / Subject</th>
                  <th className="px-6 py-4">Academic Year</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {assignments.map((item) => (
                  <tr key={item._id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-primary">{item.staff?.name || 'Unknown Staff'}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                        ID: {item.staff?.employeeId || 'N/A'} | {item.staff?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold">{item.course?.name || 'N/A'}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                        Dept: {item.department?.code || 'N/A'} | {item.course?.code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-primary">{item.subject?.name || 'N/A'}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                        Code: {item.subject?.code || 'N/A'} | Sem {item.semester?.semesterNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/15 rounded-md text-[10px] font-mono font-bold text-secondary">
                        {item.academicYear}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(item)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                          item.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="w-8 h-8 rounded-lg hover:bg-primary/10 text-primary flex items-center justify-center transition-colors"
                          title="Edit Details"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssignment(item);
                            setDeleteDialogOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-error/10 text-error flex items-center justify-center transition-colors"
                          title="Remove Assignment"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-primary/5">
                <span className="text-[10px] font-mono font-medium text-on-surface-variant uppercase">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-primary/5 hover:bg-primary/5 text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-primary/5 hover:bg-primary/5 text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface rounded-[28px] border border-primary/10 shadow-2xl p-6 w-full max-w-lg z-10 relative overflow-hidden"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Assign Subject</h3>
              <p className="text-on-surface-variant text-xs mb-6">Create a link between academic staff and a particular subject.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Staff Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Academic Staff Member *</label>
                    <select
                      {...registerAdd('staff', { required: 'Staff Member is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Staff...</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name} ({st.employeeId})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.staff && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsAdd.staff.message}</span>}
                  </div>

                  {/* Department Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerAdd('department', { required: 'Department is required' })}
                      onChange={(e) => {
                        setAddSelectedDept(e.target.value);
                        setAddSelectedCourse('');
                        setAddSelectedSem('');
                        setValueAdd('course', '');
                        setValueAdd('semester', '');
                        setValueAdd('subject', '');
                      }}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.department && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsAdd.department.message}</span>}
                  </div>

                  {/* Course Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course *</label>
                    <select
                      {...registerAdd('course', { required: 'Course is required' })}
                      disabled={!addSelectedDept}
                      onChange={(e) => {
                        setAddSelectedCourse(e.target.value);
                        setAddSelectedSem('');
                        setValueAdd('semester', '');
                        setValueAdd('subject', '');
                      }}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Course...</option>
                      {addFilteredCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.course && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsAdd.course.message}</span>}
                  </div>

                  {/* Semester Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester *</label>
                    <select
                      {...registerAdd('semester', { required: 'Semester is required' })}
                      disabled={!addSelectedCourse}
                      onChange={(e) => {
                        setAddSelectedSem(e.target.value);
                        setValueAdd('subject', '');
                      }}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Semester...</option>
                      {addFilteredSemesters.map((s) => (
                        <option key={s._id} value={s._id}>
                          Semester {s.semesterNumber} ({s.academicYear})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.semester && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsAdd.semester.message}</span>}
                  </div>

                  {/* Subject Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Subject *</label>
                    <select
                      {...registerAdd('subject', { required: 'Subject is required' })}
                      disabled={!addSelectedSem}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Subject...</option>
                      {addFilteredSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.subject && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsAdd.subject.message}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Academic Year */}
                    <div>
                      <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Academic Year *</label>
                      <select
                        {...registerAdd('academicYear', { required: 'Academic Year is required' })}
                        className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                      >
                        <option value="">Select AY...</option>
                        {academicYears.map((ay) => (
                          <option key={ay} value={ay}>{ay}</option>
                        ))}
                      </select>
                      {errorsAdd.academicYear && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsAdd.academicYear.message}</span>}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Initial Status</label>
                      <select
                        {...registerAdd('status')}
                        defaultValue="Active"
                        className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-primary text-white hover:bg-primary-container rounded-xl transition-all shadow-lg shadow-primary/10"
                  >
                    Assign
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface rounded-[28px] border border-primary/10 shadow-2xl p-6 w-full max-w-lg z-10 relative overflow-hidden"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Assignment</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify active staff or subject mapping links.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Staff Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Academic Staff Member *</label>
                    <select
                      {...registerEdit('staff', { required: 'Staff Member is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Staff...</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name} ({st.employeeId})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.staff && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsEdit.staff.message}</span>}
                  </div>

                  {/* Department Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerEdit('department', { required: 'Department is required' })}
                      onChange={(e) => {
                        setEditSelectedDept(e.target.value);
                        setEditSelectedCourse('');
                        setEditSelectedSem('');
                        setValueEdit('course', '');
                        setValueEdit('semester', '');
                        setValueEdit('subject', '');
                      }}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.department && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsEdit.department.message}</span>}
                  </div>

                  {/* Course Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course *</label>
                    <select
                      {...registerEdit('course', { required: 'Course is required' })}
                      disabled={!editSelectedDept}
                      onChange={(e) => {
                        setEditSelectedCourse(e.target.value);
                        setEditSelectedSem('');
                        setValueEdit('semester', '');
                        setValueEdit('subject', '');
                      }}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Course...</option>
                      {editFilteredCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.course && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsEdit.course.message}</span>}
                  </div>

                  {/* Semester Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester *</label>
                    <select
                      {...registerEdit('semester', { required: 'Semester is required' })}
                      disabled={!editSelectedCourse}
                      onChange={(e) => {
                        setEditSelectedSem(e.target.value);
                        setValueEdit('subject', '');
                      }}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Semester...</option>
                      {editFilteredSemesters.map((s) => (
                        <option key={s._id} value={s._id}>
                          Semester {s.semesterNumber} ({s.academicYear})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.semester && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsEdit.semester.message}</span>}
                  </div>

                  {/* Subject Select */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Subject *</label>
                    <select
                      {...registerEdit('subject', { required: 'Subject is required' })}
                      disabled={!editSelectedSem}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Subject...</option>
                      {editFilteredSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.subject && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsEdit.subject.message}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Academic Year */}
                    <div>
                      <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Academic Year *</label>
                      <select
                        {...registerEdit('academicYear', { required: 'Academic Year is required' })}
                        className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                      >
                        <option value="">Select AY...</option>
                        {academicYears.map((ay) => (
                          <option key={ay} value={ay}>{ay}</option>
                        ))}
                      </select>
                      {errorsEdit.academicYear && <span className="text-error text-[10px] font-mono mt-0.5 block">{errorsEdit.academicYear.message}</span>}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                      <select
                        {...registerEdit('status')}
                        className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm focus:ring-0 focus:border-primary outline-none cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-primary text-white hover:bg-primary-container rounded-xl transition-all shadow-lg shadow-primary/10"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE DIALOG */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteDialogOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-sm z-10 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 text-error mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="text-base font-bold">Remove Assignment</h3>
              </div>
              <p className="text-on-surface-variant text-xs mb-6">
                Are you sure you want to remove the subject assignment for{' '}
                <strong className="text-primary">{selectedAssignment?.staff?.name}</strong>? This action will disable their portals
                capabilities for <strong className="text-primary">{selectedAssignment?.subject?.name}</strong>.
              </p>
              <div className="flex gap-3 justify-end pt-4 border-t border-primary/5">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-4 py-2 text-xs font-semibold hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 text-xs font-semibold bg-error text-white hover:bg-error/80 rounded-xl transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFacultyAssignment;
