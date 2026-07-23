import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  GraduationCap, Upload, Download, UserPlus, Search, Edit2, Trash, Check, X, AlertTriangle, Users, UserCheck, Shield
} from 'lucide-react';
import api from '../services/api';

const AdminStudents = () => {
  // Main states
  const [studentsList, setStudentsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filter parameters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [registeredFilter, setRegisteredFilter] = useState('');

  // Modals & Panels visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Focus context state
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Dependent dropdown triggers
  const [addSelectedDept, setAddSelectedDept] = useState('');
  const [addSelectedCourse, setAddSelectedCourse] = useState('');
  const [editSelectedDept, setEditSelectedDept] = useState('');
  const [editSelectedCourse, setEditSelectedCourse] = useState('');

  // Excel import preview state
  const [previewData, setPreviewData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

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

  // Load students records
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user-management/students', {
        params: {
          search,
          department: deptFilter,
          course: courseFilter,
          semester: semFilter,
          status: statusFilter,
          isRegistered: registeredFilter,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setStudentsList(response.data.data.results);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve students records.');
    } finally {
      setLoading(false);
    }
  };

  // Load active dropdown options
  const fetchDropdowns = async () => {
    try {
      const response = await api.get('/topics/dropdowns'); // Reusing existing helper for Academic hierarchies
      if (response.data && response.data.success) {
        setDepartments(response.data.data.departments);
        setCourses(response.data.data.courses);
        setSemesters(response.data.data.semesters);
      }
    } catch (error) {
      console.error('Failed to load active dropdown options', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, deptFilter, courseFilter, semFilter, statusFilter, registeredFilter, currentPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // CREATE Action (Manual)
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering Student records...');
    try {
      await api.post('/user-management/students', {
        rollNumber: data.rollNumber,
        registerNumber: data.registerNumber,
        name: data.name,
        email: data.email,
        department: data.department,
        course: data.course,
        semester: data.semester,
        section: data.section,
        status: data.status,
      });

      toast.success('Student master record registered successfully.', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      setAddSelectedDept('');
      setAddSelectedCourse('');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.', { id: toastId });
    }
  };

  // Open EDIT modal
  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditSelectedDept(student.department?._id || '');
    setEditSelectedCourse(student.course?._id || '');
    setValueEdit('rollNumber', student.rollNumber);
    setValueEdit('registerNumber', student.registerNumber);
    setValueEdit('name', student.name);
    setValueEdit('email', student.email);
    setValueEdit('department', student.department?._id || '');
    setValueEdit('course', student.course?._id || '');
    setValueEdit('semester', student.semester?._id || '');
    setValueEdit('section', student.section || '');
    setValueEdit('status', student.status);
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing record changes...');
    try {
      await api.put(`/user-management/students/${selectedStudent._id}`, {
        rollNumber: data.rollNumber,
        registerNumber: data.registerNumber,
        name: data.name,
        email: data.email,
        department: data.department,
        course: data.course,
        semester: data.semester,
        section: data.section,
        status: data.status,
      });

      toast.success('Record updated successfully.', { id: toastId });
      setEditModalOpen(false);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Record update failed.', { id: toastId });
    }
  };

  // DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Removing record from database...');
    try {
      await api.delete(`/user-management/students/${selectedStudent._id}`);
      toast.success('Record deleted successfully.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deletion failed.', { id: toastId });
    }
  };

  // EXPORT Excel Action
  const handleExport = async () => {
    const toastId = toast.loading('Exporting student records...');
    try {
      const response = await api.get('/user-management/export/students');
      if (response.data && response.data.success) {
        const rawData = response.data.data.map(item => ({
          'Roll Number': item.rollNumber,
          'Register Number': item.registerNumber,
          'Name': item.name,
          'Email': item.email,
          'Department Code': item.department?.code || '',
          'Course Code': item.course?.code || '',
          'Semester': item.semester?.semesterNumber || '',
          'Section': item.section || '',
          'Is Registered': item.isRegistered ? 'Yes' : 'No',
          'Status': item.status,
          'Imported Date': new Date(item.importedAt).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(rawData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Master');
        XLSX.writeFile(wb, 'Student_Master_List.xlsx');
        toast.success('Student records exported successfully.', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to export student records.', { id: toastId });
    }
  };

  // EXCEL Import File Upload & Parse
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws);

        // Basic schema mapping from columns
        const parsed = rawJson.map(row => ({
  rollNumber: row['Roll Number'] || row['rollNumber'] || '',
  registerNumber: row['Register Number'] || row['registerNumber'] || '',
  name: row['Name'] || row['name'] || '',
  email: row['Email'] || row['email'] || '',
  department: row['Department Code'] || row['Department Name'] || row['Department'] || row['department'] || '',
  course: row['Course Code'] || row['Course Name'] || row['Course'] || row['course'] || '',
  semester: row['Semester'] || row['semester'] || '',
  section: row['Section'] || row['section'] || '',
}));

        // Validate duplicates in import list
        const duplicates = [];
        const seen = new Set();
        parsed.forEach((item, index) => {
          if (item.rollNumber) {
            if (seen.has(item.rollNumber)) {
              duplicates.push(`Row ${index + 2}: Duplicate Roll Number "${item.rollNumber}" in list.`);
            } else {
              seen.add(item.rollNumber);
            }
          }
        });

        setImportErrors(duplicates);
        setPreviewData(parsed);
      } catch (err) {
        toast.error('Failed to parse Excel sheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // SUBMIT parsed rows to API
  const handleImportSubmit = async () => {
    if (importErrors.length > 0) {
      toast.error('Please resolve validation errors in preview list.');
      return;
    }
    if (previewData.length === 0) {
      toast.error('No valid records to import.');
      return;
    }

    const toastId = toast.loading('Importing records to database...');
    try {
      await api.post('/user-management/import/students', { records: previewData });
      toast.success('All records imported successfully!', { id: toastId });
      setImportModalOpen(false);
      setPreviewData([]);
      setImportErrors([]);
      fetchStudents();
    } catch (error) {
      if (error.response?.data?.errors) {
        setImportErrors(error.response.data.errors);
        toast.error('Excel rows failed validation. See logs.', { id: toastId });
      } else {
        toast.error(error.response?.data?.message || 'Import failed.', { id: toastId });
      }
    }
  };

  // Manual create dynamic filters
  const addFilteredCourses = courses.filter(c => c.department === addSelectedDept);
  const addFilteredSemesters = semesters.filter(s => s.course === addSelectedCourse);

  const editFilteredCourses = courses.filter(c => c.department === editSelectedDept);
  const editFilteredSemesters = semesters.filter(s => s.course === editSelectedCourse);

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <GraduationCap size={12} />
              Academic Records
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Student Management</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">Configure student enrollments, course limits, and bulk import Excel listings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="btn-secondary py-2 px-3 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
            >
              <Upload size={14} />
              Import Excel
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary py-2 px-3 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
            >
              <Download size={14} />
              Export Excel
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-primary py-2 px-4 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Total Students</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#FDF0F4] text-[#8B1E3F] flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#8B1E3F] leading-none mt-1">{pagination.total}</p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Master enrollment roster</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Active Students</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <UserCheck size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#059669] leading-none mt-1">
            {studentsList.filter(s => s.status === 'Active').length}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Currently active in term</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Pending Registration</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <AlertTriangle size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#DC2626] leading-none mt-1">
            {studentsList.filter(s => !s.isRegistered).length}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Master entries awaiting sign up</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-flat p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-2 search-bar">
            <Search size={14} className="text-[#9CA3AF] flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Roll, Reg, Name, Email..."
              type="text"
            />
          </div>

          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCourseFilter('');
              setSemFilter('');
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
              setSemFilter('');
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

          {/* Semester Filter */}
          <select
            value={semFilter}
            onChange={(e) => {
              setSemFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">All Semesters</option>
            {semesters
              .filter(sem => !courseFilter || sem.course === courseFilter)
              .map((sem) => (
                <option key={sem._id} value={sem._id}>
                  Semester {sem.semesterNumber}
                </option>
              ))}
          </select>

          {/* Registration filter */}
          <select
            value={registeredFilter}
            onChange={(e) => {
              setRegisteredFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">Registration Status</option>
            <option value="true">Registered Accounts</option>
            <option value="false">Unregistered Master</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : studentsList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-base font-bold text-[#111111]">No Student Records</h3>
            <p className="text-[#6B7280] text-xs max-w-sm mt-1">No master records found. Try adding manually or uploading Excel.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Reg Number</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Dept & Course</th>
                  <th className="text-center">Semester</th>
                  <th className="text-center">Registration</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((student) => (
                  <tr key={student._id}>
                    <td className="font-mono font-bold text-[#8B1E3F]">{student.rollNumber}</td>
                    <td className="font-mono text-[#6B7280]">{student.registerNumber}</td>
                    <td className="font-semibold text-[#111111]">{student.name}</td>
                    <td className="text-[#6B7280] font-mono text-[11.5px]">{student.email}</td>
                    <td>
                      <p className="font-semibold text-[#111111]">{student.course?.name || 'Unassigned'}</p>
                      <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{student.department?.name || ''}</p>
                    </td>
                    <td className="text-center font-mono">
                      Sem {student.semester?.semesterNumber || '—'} {student.section ? `(${student.section})` : ''}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${student.isRegistered ? 'badge-wine' : 'badge-gray'}`}>
                        {student.isRegistered ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${student.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(student)}
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#8B1E3F] hover:bg-[#FDF0F4] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-primary/10 mt-6 pt-4">
              <span className="text-xs text-on-surface-variant font-mono">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MANUAL CREATE MODAL
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
              <h3 className="text-xl font-bold text-primary mb-2">Add Student Master</h3>
              <p className="text-on-surface-variant text-xs mb-6">Create a single student master entry to allow portal login setup.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Roll Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Roll Number *</label>
                    <input
                      {...registerAdd('rollNumber', { required: 'Roll Number is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 21CS05"
                    />
                    {errorsAdd.rollNumber && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.rollNumber.message}</span>}
                  </div>

                  {/* Register Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Register Number *</label>
                    <input
                      {...registerAdd('registerNumber', { required: 'Register Number is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 312221104005"
                    />
                    {errorsAdd.registerNumber && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.registerNumber.message}</span>}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Full Name *</label>
                    <input
                      {...registerAdd('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Alan Turing"
                    />
                    {errorsAdd.name && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Student Email *</label>
                    <input
                      type="email"
                      {...registerAdd('email', { required: 'Email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. aturing@institution.edu"
                    />
                    {errorsAdd.email && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.email.message}</span>}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerAdd('department', {
                        required: 'Department mapping is required',
                        onChange: (e) => {
                          setAddSelectedDept(e.target.value);
                          setAddSelectedCourse('');
                          setValueAdd('course', '');
                          setValueAdd('semester', '');
                        }
                      })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                    {errorsAdd.department && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.department.message}</span>}
                  </div>

                  {/* Course */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course *</label>
                    <select
                      {...registerAdd('course', {
                        required: 'Course mapping is required',
                        onChange: (e) => {
                          setAddSelectedCourse(e.target.value);
                          setValueAdd('semester', '');
                        }
                      })}
                      disabled={!addSelectedDept}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Course...</option>
                      {addFilteredCourses.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                    {errorsAdd.course && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.course.message}</span>}
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester *</label>
                    <select
                      {...registerAdd('semester', { required: 'Semester mapping is required' })}
                      disabled={!addSelectedCourse}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Semester...</option>
                      {addFilteredSemesters.map(s => (
                        <option key={s._id} value={s._id}>Semester {s.semesterNumber}</option>
                      ))}
                    </select>
                    {errorsAdd.semester && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.semester.message}</span>}
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Section</label>
                    <input
                      {...registerAdd('section')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. A"
                    />
                  </div>

                  {/* Status */}
                  <div>
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
                    Save Record
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
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Student Master</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify records for this student master entry.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Roll Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Roll Number *</label>
                    <input
                      {...registerEdit('rollNumber', { required: 'Roll Number is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.rollNumber && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.rollNumber.message}</span>}
                  </div>

                  {/* Register Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Register Number *</label>
                    <input
                      {...registerEdit('registerNumber', { required: 'Register Number is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.registerNumber && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.registerNumber.message}</span>}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Full Name *</label>
                    <input
                      {...registerEdit('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.name && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Student Email *</label>
                    <input
                      type="email"
                      {...registerEdit('email', { required: 'Email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.email && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.email.message}</span>}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerEdit('department', {
                        required: 'Department mapping is required',
                        onChange: (e) => {
                          setEditSelectedDept(e.target.value);
                          setEditSelectedCourse('');
                          setValueEdit('course', '');
                          setValueEdit('semester', '');
                        }
                      })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                    {errorsEdit.department && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.department.message}</span>}
                  </div>

                  {/* Course */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Course *</label>
                    <select
                      {...registerEdit('course', {
                        required: 'Course mapping is required',
                        onChange: (e) => {
                          setEditSelectedCourse(e.target.value);
                          setValueEdit('semester', '');
                        }
                      })}
                      disabled={!editSelectedDept}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Course...</option>
                      {editFilteredCourses.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                    {errorsEdit.course && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.course.message}</span>}
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester *</label>
                    <select
                      {...registerEdit('semester', { required: 'Semester mapping is required' })}
                      disabled={!editSelectedCourse}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Semester...</option>
                      {editFilteredSemesters.map(s => (
                        <option key={s._id} value={s._id}>Semester {s.semesterNumber}</option>
                      ))}
                    </select>
                    {errorsEdit.semester && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.semester.message}</span>}
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Section</label>
                    <input
                      {...registerEdit('section')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Status */}
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
                    Sync Changes
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
              <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined">delete_forever</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">Remove Student Master</h3>
                <p className="text-on-surface-variant text-sm">
                  Are you sure you want to remove the record for <strong>{selectedStudent?.name}</strong>? If this student has registered, their active User authentication account will also be deleted.
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
                  className="py-3 px-6 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all w-1/2"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          BATCH IMPORT EXCEL MODAL
      ======================================================== */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setImportModalOpen(false);
                setPreviewData([]);
                setImportErrors([]);
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-4xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">Import Student Master (Excel)</h3>
                <p className="text-on-surface-variant text-xs mb-6">
                  Upload an Excel workbook (`.xlsx`, `.xls`) with columns: `Roll Number`, `Register Number`, `Name`, `Email`, `Department Code`, `Course Code`, `Semester`, `Section`.
                </p>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-primary/10 rounded-2xl p-8 text-center bg-primary/5 cursor-pointer relative hover:bg-primary/10 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">upload_file</span>
                  <p className="text-sm font-semibold text-primary">Click or drag Excel file to preview data</p>
                  <p className="text-xs text-on-surface-variant mt-1">Accepts standard spreadsheet extensions.</p>
                </div>

                {/* Validation logs panel */}
                {importErrors.length > 0 && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-4 mt-6 max-h-[150px] overflow-y-auto text-xs text-error font-mono space-y-1">
                    <p className="font-bold">Errors found in validation check:</p>
                    {importErrors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}

                {/* Live spreadsheet preview table */}
                {previewData.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-bold text-primary">Sheet Preview ({previewData.length} records parsed)</h4>
                    <div className="overflow-y-auto max-h-[220px] rounded-xl border border-primary/5 bg-surface text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-primary/5 sticky top-0 font-semibold text-primary">
                          <tr>
                            <th className="p-2 border-b border-primary/5">Roll Number</th>
                            <th className="p-2 border-b border-primary/5">Reg Number</th>
                            <th className="p-2 border-b border-primary/5">Name</th>
                            <th className="p-2 border-b border-primary/5">Email</th>
                            <th className="p-2 border-b border-primary/5">Dept Code</th>
                            <th className="p-2 border-b border-primary/5">Course Code</th>
                            <th className="p-2 border-b border-primary/5">Semester</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5 font-mono">
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-primary/5">
                              <td className="p-2">{row.rollNumber || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2">{row.registerNumber || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2 font-sans font-semibold">{row.name || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2">{row.email || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2">{row.department || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2">{row.course || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2">{row.semester || <span className="text-error font-bold">MISSING</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t border-primary/5 mt-6">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setPreviewData([]);
                    setImportErrors([]);
                  }}
                  className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={previewData.length === 0}
                  className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Confirm Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminStudents;
