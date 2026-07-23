import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Briefcase, Users, Plus, ShieldCheck, Database, FileText, Download, Check, AlertOctagon, HelpCircle, ArrowLeft, Eye, X, Search, Settings, Calendar, Edit3, Trash2, UserPlus, BookOpen, Layers
} from 'lucide-react';
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
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <Layers size={12} />
              Syllabus & Faculty Mapping
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Faculty Assignment</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Assign subjects to academic staff. Control syllabus administration, AI features, and grade metrics.
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary py-2.5 px-5 rounded-[12px] text-[12.5px] flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            Assign Subject
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Assignments', count: stats.total, icon: Briefcase },
          { title: 'Active Assignments', count: stats.active, icon: CheckCircle2 },
          { title: 'Inactive Assignments', count: stats.inactive, icon: X },
          { title: 'Assigned Staff', count: stats.totalStaff, icon: Users },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">{card.title}</span>
                  <span className="block font-black text-2xl text-[#8B1E3F] font-mono mt-1">{card.count}</span>
                </div>
                <div className="w-10 h-10 rounded-[10px] bg-[#FAF8F7] flex items-center justify-center text-[#8B1E3F] border border-primary/5">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Control bar */}
      <div className="card-flat p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center font-sans">
          {/* Search bar */}
          <div className="search-bar w-full md:max-w-xs">
            <Search size={14} className="text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search staff or subjects..."
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:justify-end text-xs font-semibold">
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="select max-w-xs"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.code}</option>
              ))}
            </select>

            <select
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1); }}
              className="select max-w-xs"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.code}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="select"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={ayFilter}
              onChange={(e) => { setAyFilter(e.target.value); setCurrentPage(1); }}
              className="select"
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
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Briefcase size={24} />
            </div>
            <h4 className="text-base font-bold text-[#111111]">No Assignments Mapped</h4>
            <p className="text-[#6B7280] text-xs mt-1 max-w-xs mx-auto">
              We couldn't find any staff-subject mappings matching your active search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Faculty Info</th>
                  <th>Department / Course</th>
                  <th>Sem / Subject</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="font-bold text-[#8B1E3F]">{item.staff?.name || 'Unknown Staff'}</div>
                      <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">
                        ID: {item.staff?.employeeId || 'N/A'} | {item.staff?.email || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-[#111111]">{item.course?.name || 'N/A'}</div>
                      <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">
                        Dept: {item.department?.code || 'N/A'} | {item.course?.code || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-[#8B1E3F]">{item.subject?.name || 'N/A'}</div>
                      <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">
                        Code: {item.subject?.code || 'N/A'} | Sem {item.semester?.semesterNumber || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-wine font-mono">
                        {item.academicYear}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(item)}
                        className={`badge cursor-pointer active:scale-95 transition-all ${
                          item.status === 'Active'
                            ? 'badge-green hover:bg-emerald-100'
                            : 'badge-amber hover:bg-amber-100'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-[#8B1E3F] hover:bg-[#FDF0F4] rounded-lg transition-colors inline-flex"
                          title="Edit Details"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssignment(item);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          title="Remove Assignment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-lg z-10 relative overflow-hidden font-sans text-xs text-[#111111]"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-base font-black text-[#111111]">Assign Subject</h3>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">Create a link between academic staff and a particular subject.</p>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1 text-[#9CA3AF] hover:text-[#111111] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4 mt-4 font-sans">
                <div className="grid grid-cols-1 gap-3.5">
                  {/* Staff Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Academic Staff Member *</span>
                    <select
                      {...registerAdd('staff', { required: 'Staff Member is required' })}
                      className="select w-full"
                    >
                      <option value="">Select Staff...</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name} ({st.employeeId})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.staff && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsAdd.staff.message}</span>}
                  </div>

                  {/* Department Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Department *</span>
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
                      className="select w-full"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.department && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsAdd.department.message}</span>}
                  </div>

                  {/* Course Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Course *</span>
                    <select
                      {...registerAdd('course', { required: 'Course is required' })}
                      disabled={!addSelectedDept}
                      onChange={(e) => {
                        setAddSelectedCourse(e.target.value);
                        setAddSelectedSem('');
                        setValueAdd('semester', '');
                        setValueAdd('subject', '');
                      }}
                      className="select w-full disabled:opacity-50"
                    >
                      <option value="">Select Course...</option>
                      {addFilteredCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.course && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsAdd.course.message}</span>}
                  </div>

                  {/* Semester Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Semester *</span>
                    <select
                      {...registerAdd('semester', { required: 'Semester is required' })}
                      disabled={!addSelectedCourse}
                      onChange={(e) => {
                        setAddSelectedSem(e.target.value);
                        setValueAdd('subject', '');
                      }}
                      className="select w-full disabled:opacity-50"
                    >
                      <option value="">Select Semester...</option>
                      {addFilteredSemesters.map((s) => (
                        <option key={s._id} value={s._id}>
                          Semester {s.semesterNumber} ({s.academicYear})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.semester && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsAdd.semester.message}</span>}
                  </div>

                  {/* Subject Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Subject *</span>
                    <select
                      {...registerAdd('subject', { required: 'Subject is required' })}
                      disabled={!addSelectedSem}
                      className="select w-full disabled:opacity-50"
                    >
                      <option value="">Select Subject...</option>
                      {addFilteredSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.subject && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsAdd.subject.message}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Academic Year */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Academic Year *</span>
                      <select
                        {...registerAdd('academicYear', { required: 'Academic Year is required' })}
                        className="select w-full"
                      >
                        <option value="">Select AY...</option>
                        {academicYears.map((ay) => (
                          <option key={ay} value={ay}>{ay}</option>
                        ))}
                      </select>
                      {errorsAdd.academicYear && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsAdd.academicYear.message}</span>}
                    </div>

                    {/* Status */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Initial Status</span>
                      <select
                        {...registerAdd('status')}
                        defaultValue="Active"
                        className="select w-full"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end pt-4 mt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2 rounded-lg text-xs"
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
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-lg z-10 relative overflow-hidden font-sans text-xs text-[#111111]"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-base font-black text-[#111111]">Edit Assignment</h3>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">Modify active staff or subject mapping links.</p>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-[#9CA3AF] hover:text-[#111111] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4 mt-4 font-sans">
                <div className="grid grid-cols-1 gap-3.5">
                  {/* Staff Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Academic Staff Member *</span>
                    <select
                      {...registerEdit('staff', { required: 'Staff Member is required' })}
                      className="select w-full"
                    >
                      <option value="">Select Staff...</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name} ({st.employeeId})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.staff && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsEdit.staff.message}</span>}
                  </div>

                  {/* Department Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Department *</span>
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
                      className="select w-full"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.department && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsEdit.department.message}</span>}
                  </div>

                  {/* Course Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Course *</span>
                    <select
                      {...registerEdit('course', { required: 'Course is required' })}
                      disabled={!editSelectedDept}
                      onChange={(e) => {
                        setEditSelectedCourse(e.target.value);
                        setEditSelectedSem('');
                        setValueEdit('semester', '');
                        setValueEdit('subject', '');
                      }}
                      className="select w-full disabled:opacity-50"
                    >
                      <option value="">Select Course...</option>
                      {editFilteredCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.course && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsEdit.course.message}</span>}
                  </div>

                  {/* Semester Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Semester *</span>
                    <select
                      {...registerEdit('semester', { required: 'Semester is required' })}
                      disabled={!editSelectedCourse}
                      onChange={(e) => {
                        setEditSelectedSem(e.target.value);
                        setValueEdit('subject', '');
                      }}
                      className="select w-full disabled:opacity-50"
                    >
                      <option value="">Select Semester...</option>
                      {editFilteredSemesters.map((s) => (
                        <option key={s._id} value={s._id}>
                          Semester {s.semesterNumber} ({s.academicYear})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.semester && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsEdit.semester.message}</span>}
                  </div>

                  {/* Subject Select */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Subject *</span>
                    <select
                      {...registerEdit('subject', { required: 'Subject is required' })}
                      disabled={!editSelectedSem}
                      className="select w-full disabled:opacity-50"
                    >
                      <option value="">Select Subject...</option>
                      {editFilteredSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.subject && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsEdit.subject.message}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Academic Year */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Academic Year *</span>
                      <select
                        {...registerEdit('academicYear', { required: 'Academic Year is required' })}
                        className="select w-full"
                      >
                        <option value="">Select AY...</option>
                        {academicYears.map((ay) => (
                          <option key={ay} value={ay}>{ay}</option>
                        ))}
                      </select>
                      {errorsEdit.academicYear && <span className="text-red-500 text-[10px] font-mono mt-0.5 block">{errorsEdit.academicYear.message}</span>}
                    </div>

                    {/* Status */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Status</span>
                      <select
                        {...registerEdit('status')}
                        className="select w-full"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end pt-4 mt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2 rounded-lg text-xs"
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
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-sm z-10 relative overflow-hidden font-sans text-xs text-[#111111]"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertOctagon size={20} className="text-red-600" />
                <h3 className="text-sm font-black text-[#111111]">Remove Assignment</h3>
              </div>
              <p className="text-[#6B7280] text-xs leading-relaxed mb-6">
                Are you sure you want to remove the subject assignment for{' '}
                <strong className="text-[#8B1E3F] font-bold">{selectedAssignment?.staff?.name}</strong>? This action will disable their portal capabilities for <strong className="text-[#8B1E3F] font-bold">{selectedAssignment?.subject?.name}</strong>.
              </p>
              <div className="flex gap-2 justify-end pt-4 border-t border-primary/5">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all text-[#6B7280]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white"
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
