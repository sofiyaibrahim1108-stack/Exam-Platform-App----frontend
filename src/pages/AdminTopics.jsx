import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminTopics = () => {
  // Main states
  const [topics, setTopics] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, averageHours: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filters parameters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Panels visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Focus context state
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Dynamic filter lists for modal dependent dropdowns
  const [addSelectedDept, setAddSelectedDept] = useState('');
  const [addSelectedCourse, setAddSelectedCourse] = useState('');
  const [addSelectedSem, setAddSelectedSem] = useState('');
  const [addSelectedSubject, setAddSelectedSubject] = useState('');

  const [editSelectedDept, setEditSelectedDept] = useState('');
  const [editSelectedCourse, setEditSelectedCourse] = useState('');
  const [editSelectedSem, setEditSelectedSem] = useState('');
  const [editSelectedSubject, setEditSelectedSubject] = useState('');

  // Difficulty levels
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  // Statuses
  const statuses = ['Active', 'Inactive', 'Completed'];

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

  // Load topics list
  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/topics', {
        params: {
          search,
          department: deptFilter,
          course: courseFilter,
          semester: semFilter,
          subject: subFilter,
          unit: unitFilter,
          status: statusFilter,
          sortBy,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setTopics(response.data.data.results);
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve topics list.');
    } finally {
      setLoading(false);
    }
  };

  // Load dropdown options
  const fetchDropdowns = async () => {
    try {
      const response = await api.get('/topics/dropdowns');
      if (response.data && response.data.success) {
        setDepartments(response.data.data.departments);
        setCourses(response.data.data.courses);
        setSemesters(response.data.data.semesters);
        setSubjects(response.data.data.subjects);
        setUnits(response.data.data.units);
      }
    } catch (error) {
      console.error('Failed to load active dropdown options', error);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [search, deptFilter, courseFilter, semFilter, subFilter, unitFilter, statusFilter, sortBy, currentPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // CREATE Action
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering Topic details...');
    try {
      await api.post('/topics', {
        name: data.name,
        code: data.code,
        topicNumber: parseInt(data.topicNumber, 10),
        department: data.department,
        course: data.course,
        semester: data.semester,
        subject: data.subject,
        unit: data.unit,
        estimatedHours: parseInt(data.estimatedHours, 10),
        difficulty: data.difficulty,
        description: data.description,
        status: data.status,
      });

      toast.success('Topic created successfully.', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      setAddSelectedDept('');
      setAddSelectedCourse('');
      setAddSelectedSem('');
      setAddSelectedSubject('');
      fetchTopics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Topic creation failed.', { id: toastId });
    }
  };

  // Open EDIT Modal populated with active values
  const handleEditClick = (topic) => {
    setSelectedTopic(topic);
    setEditSelectedDept(topic.department?._id || '');
    setEditSelectedCourse(topic.course?._id || '');
    setEditSelectedSem(topic.semester?._id || '');
    setEditSelectedSubject(topic.subject?._id || '');
    setValueEdit('name', topic.name);
    setValueEdit('code', topic.code);
    setValueEdit('topicNumber', topic.topicNumber);
    setValueEdit('department', topic.department?._id || '');
    setValueEdit('course', topic.course?._id || '');
    setValueEdit('semester', topic.semester?._id || '');
    setValueEdit('subject', topic.subject?._id || '');
    setValueEdit('unit', topic.unit?._id || '');
    setValueEdit('estimatedHours', topic.estimatedHours);
    setValueEdit('difficulty', topic.difficulty);
    setValueEdit('description', topic.description || '');
    setValueEdit('status', topic.status);
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing topic records...');
    try {
      await api.put(`/topics/${selectedTopic._id}`, {
        name: data.name,
        code: data.code,
        topicNumber: parseInt(data.topicNumber, 10),
        department: data.department,
        course: data.course,
        semester: data.semester,
        subject: data.subject,
        unit: data.unit,
        estimatedHours: parseInt(data.estimatedHours, 10),
        difficulty: data.difficulty,
        description: data.description,
        status: data.status,
      });
      toast.success('Topic details updated successfully.', { id: toastId });
      setEditModalOpen(false);
      fetchTopics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Topic modification failed.', { id: toastId });
    }
  };

  // HARD DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Deleting topic record...');
    try {
      await api.delete(`/topics/${selectedTopic._id}`);
      toast.success('Topic deleted successfully.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchTopics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deactivation failed.', { id: toastId });
    }
  };

  // TOGGLE STATUS Action
  const handleStatusToggle = async (topic) => {
    const toastId = toast.loading('Changing status...');
    try {
      const response = await api.patch(`/topics/${topic._id}/status`);
      toast.success(response.data.message || 'Status updated.', { id: toastId });
      fetchTopics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status toggle failed.', { id: toastId });
    }
  };

  // Modal dependent dropdowns filtering
  const addFilteredCourses = courses.filter(c => c.department === addSelectedDept);
  const addFilteredSemesters = semesters.filter(s => s.course === addSelectedCourse);
  const addFilteredSubjects = subjects.filter(sub => sub.semester === addSelectedSem);
  const addFilteredUnits = units.filter(u => u.subject === addSelectedSubject);

  const editFilteredCourses = courses.filter(c => c.department === editSelectedDept);
  const editFilteredSemesters = semesters.filter(s => s.course === editSelectedCourse);
  const editFilteredSubjects = subjects.filter(sub => sub.semester === editSelectedSem);
  const editFilteredUnits = units.filter(u => u.subject === editSelectedSubject);

  return (
    <div className="space-y-6">
      
      {/* Upper Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-[24px] border border-primary/5">
        <div>
          <h2 className="text-2xl font-bold text-primary">Topic Management</h2>
          <p className="text-on-surface-variant text-xs mt-1">Configure syllabus topic units, credit hours weight, and link course nodes.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[20px]">menu_book</span>
          Create Topic
        </button>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Topics', count: stats.total, icon: 'list_alt', color: 'text-primary' },
          { title: 'Active Topics', count: stats.active, icon: 'check_circle', color: 'text-emerald-600' },
          { title: 'Completed Topics', count: stats.completed, icon: 'task_alt', color: 'text-secondary' },
          { title: 'Average Hours', count: `${stats.averageHours} hrs`, icon: 'schedule', color: 'text-amber-600' },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-2 flex items-center bg-surface rounded-xl px-4 py-2 border border-primary/5 shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search topics by name..."
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
              setCourseFilter('');
              setSemFilter('');
              setSubFilter('');
              setUnitFilter('');
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setSemFilter('');
              setSubFilter('');
              setUnitFilter('');
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
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
        </div>

        {/* Semester Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={semFilter}
            onChange={(e) => {
              setSemFilter(e.target.value);
              setSubFilter('');
              setUnitFilter('');
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
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
        </div>

        {/* Subject Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={subFilter}
            onChange={(e) => {
              setSubFilter(e.target.value);
              setUnitFilter('');
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Subjects</option>
            {subjects
              .filter(sub => !semFilter || sub.semester === semFilter)
              .map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
          </select>
        </div>

        {/* Unit Filter */}
        <div className="bg-surface rounded-xl px-4 py-2.5 border border-primary/5 shadow-sm">
          <select
            value={unitFilter}
            onChange={(e) => {
              setUnitFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
          >
            <option value="">All Units</option>
            {units
              .filter(u => !subFilter || u.subject === subFilter)
              .map((u) => (
                <option key={u._id} value={u._id}>
                  Unit {u.unitNumber} ({u.name})
                </option>
              ))}
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
        ) : topics.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <span className="material-symbols-outlined text-primary/45 text-5xl">description</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">No Topics Found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">No syllabus topics mapped matching your search criteria.</p>
            </div>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/10 pb-4 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  <th className="py-4 px-3">Topic Name</th>
                  <th className="py-4 px-3 text-center">No</th>
                  <th className="py-4 px-3">Unit</th>
                  <th className="py-4 px-3">Subject</th>
                  <th className="py-4 px-3 text-center">Semester</th>
                  <th className="py-4 px-3">Difficulty</th>
                  <th className="py-4 px-3 text-center">Hours</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {topics.map((topic) => (
                  <tr key={topic._id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-3">
                      <div className="font-semibold text-primary">{topic.name}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono uppercase mt-0.5">{topic.code}</div>
                    </td>
                    <td className="py-4 px-3 text-center font-mono text-xs text-on-surface-variant">{topic.topicNumber}</td>
                    <td className="py-4 px-3">
                      {topic.unit ? (
                        <div>
                          <p className="font-semibold text-on-surface leading-tight">Unit {topic.unit.unitNumber}</p>
                          <p className="text-[10px] text-on-surface-variant leading-none mt-0.5">{topic.unit.name}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-error font-mono font-semibold">UNASSIGNED_UNIT</span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      {topic.subject ? (
                        <div>
                          <p className="font-semibold text-on-surface leading-tight">{topic.subject.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono leading-none mt-0.5">{topic.subject.code}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-error font-mono font-semibold">UNASSIGNED_SUB</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center font-mono text-on-surface">
                      {topic.semester ? `Semester ${topic.semester.semesterNumber}` : 'Unassigned'}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        topic.difficulty === 'Beginner' ? 'bg-emerald-100 text-emerald-800' :
                        topic.difficulty === 'Advanced' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {topic.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-on-surface">{topic.estimatedHours} hrs</td>
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => handleStatusToggle(topic)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          topic.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                          topic.status === 'Completed' ? 'bg-secondary/15 text-secondary' :
                          'bg-error/10 text-error'
                        } hover:scale-95 transition-transform`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          topic.status === 'Active' ? 'bg-emerald-500' :
                          topic.status === 'Completed' ? 'bg-secondary' :
                          'bg-error'
                        }`}></span>
                        {topic.status}
                      </button>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Drawer */}
                        <button
                          onClick={() => {
                            setSelectedTopic(topic);
                            setDetailsDrawerOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {/* Edit details */}
                        <button
                          onClick={() => handleEditClick(topic)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {/* Delete account */}
                        <button
                          onClick={() => {
                            setSelectedTopic(topic);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Topic"
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
          CREATE TOPIC MODAL
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
                setAddSelectedCourse('');
                setAddSelectedSem('');
                setAddSelectedSubject('');
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Create Topic</h3>
              <p className="text-on-surface-variant text-xs mb-6">Map a new curriculum topic division under units inside your institution.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Topic Name *</label>
                    <input
                      {...registerAdd('name', { required: 'Topic Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Master Theorem for Recurrences"
                    />
                    {errorsAdd.name && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Topic Code *</label>
                    <input
                      {...registerAdd('code', { required: 'Topic Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. DAA-T1.2"
                    />
                    {errorsAdd.code && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.code.message}</span>}
                  </div>

                  {/* Topic Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Topic Number *</label>
                    <input
                      type="number"
                      {...registerAdd('topicNumber', { required: 'Topic Number is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 1"
                    />
                    {errorsAdd.topicNumber && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.topicNumber.message}</span>}
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerAdd('department', {
                        required: 'Department is required',
                        onChange: (e) => {
                          setAddSelectedDept(e.target.value);
                          setAddSelectedCourse('');
                          setAddSelectedSem('');
                          setAddSelectedSubject('');
                          setValueAdd('course', '');
                          setValueAdd('semester', '');
                          setValueAdd('subject', '');
                          setValueAdd('unit', '');
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
                      {...registerAdd('course', {
                        required: 'Course is required',
                        onChange: (e) => {
                          setAddSelectedCourse(e.target.value);
                          setAddSelectedSem('');
                          setAddSelectedSubject('');
                          setValueAdd('semester', '');
                          setValueAdd('subject', '');
                          setValueAdd('unit', '');
                        }
                      })}
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

                  {/* Semester Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester *</label>
                    <select
                      {...registerAdd('semester', {
                        required: 'Semester is required',
                        onChange: (e) => {
                          setAddSelectedSem(e.target.value);
                          setAddSelectedSubject('');
                          setValueAdd('subject', '');
                          setValueAdd('unit', '');
                        }
                      })}
                      disabled={!addSelectedCourse}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Semester...</option>
                      {addFilteredSemesters.map((sem) => (
                        <option key={sem._id} value={sem._id}>
                          Semester {sem.semesterNumber} ({sem.name})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.semester && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.semester.message}</span>}
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Subject *</label>
                    <select
                      {...registerAdd('subject', {
                        required: 'Subject is required',
                        onChange: (e) => {
                          setAddSelectedSubject(e.target.value);
                          setValueAdd('unit', '');
                        }
                      })}
                      disabled={!addSelectedSem}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Subject...</option>
                      {addFilteredSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.subject && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.subject.message}</span>}
                  </div>

                  {/* Unit Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Unit *</label>
                    <select
                      {...registerAdd('unit', { required: 'Unit reference is required' })}
                      disabled={!addSelectedSubject}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Unit...</option>
                      {addFilteredUnits.map((u) => (
                        <option key={u._id} value={u._id}>
                          Unit {u.unitNumber} ({u.name})
                        </option>
                      ))}
                    </select>
                    {errorsAdd.unit && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.unit.message}</span>}
                  </div>

                  {/* Estimated Hours */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Estimated Hours *</label>
                    <input
                      type="number"
                      defaultValue={2}
                      {...registerAdd('estimatedHours', { required: 'Hours is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 2"
                    />
                    {errorsAdd.estimatedHours && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.estimatedHours.message}</span>}
                  </div>

                  {/* Difficulty Selection */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Difficulty *</label>
                    <select
                      {...registerAdd('difficulty', { required: 'Difficulty is required' })}
                      defaultValue="Intermediate"
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      {difficulties.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                    <select
                      {...registerAdd('status')}
                      defaultValue="Active"
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerAdd('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief topic syllabus details..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalOpen(false);
                      setAddSelectedDept('');
                      setAddSelectedCourse('');
                      setAddSelectedSem('');
                      setAddSelectedSubject('');
                    }}
                    className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all"
                  >
                    Create Topic
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          EDIT TOPIC MODAL
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
                setEditSelectedCourse('');
                setEditSelectedSem('');
                setEditSelectedSubject('');
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Topic</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify records and syllabus specifications for this topic.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Topic Name *</label>
                    <input
                      {...registerEdit('name', { required: 'Topic Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Master Theorem for Recurrences"
                    />
                    {errorsEdit.name && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Topic Code *</label>
                    <input
                      {...registerEdit('code', { required: 'Topic Code is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. DAA-T1.2"
                    />
                    {errorsEdit.code && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.code.message}</span>}
                  </div>

                  {/* Topic Number */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Topic Number *</label>
                    <input
                      type="number"
                      {...registerEdit('topicNumber', { required: 'Topic Number is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 1"
                    />
                    {errorsEdit.topicNumber && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.topicNumber.message}</span>}
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerEdit('department', {
                        required: 'Department is required',
                        onChange: (e) => {
                          setEditSelectedDept(e.target.value);
                          setEditSelectedCourse('');
                          setEditSelectedSem('');
                          setEditSelectedSubject('');
                          setValueEdit('course', '');
                          setValueEdit('semester', '');
                          setValueEdit('subject', '');
                          setValueEdit('unit', '');
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
                      {...registerEdit('course', {
                        required: 'Course is required',
                        onChange: (e) => {
                          setEditSelectedCourse(e.target.value);
                          setEditSelectedSem('');
                          setEditSelectedSubject('');
                          setValueEdit('semester', '');
                          setValueEdit('subject', '');
                          setValueEdit('unit', '');
                        }
                      })}
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

                  {/* Semester Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Semester *</label>
                    <select
                      {...registerEdit('semester', {
                        required: 'Semester is required',
                        onChange: (e) => {
                          setEditSelectedSem(e.target.value);
                          setEditSelectedSubject('');
                          setValueEdit('subject', '');
                          setValueEdit('unit', '');
                        }
                      })}
                      disabled={!editSelectedCourse}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Semester...</option>
                      {editFilteredSemesters.map((sem) => (
                        <option key={sem._id} value={sem._id}>
                          Semester {sem.semesterNumber} ({sem.name})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.semester && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.semester.message}</span>}
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Subject *</label>
                    <select
                      {...registerEdit('subject', {
                        required: 'Subject is required',
                        onChange: (e) => {
                          setEditSelectedSubject(e.target.value);
                          setValueEdit('unit', '');
                        }
                      })}
                      disabled={!editSelectedSem}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Subject...</option>
                      {editFilteredSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.subject && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.subject.message}</span>}
                  </div>

                  {/* Unit Dropdown */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Unit *</label>
                    <select
                      {...registerEdit('unit', { required: 'Unit reference is required' })}
                      disabled={!editSelectedSubject}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">Select Unit...</option>
                      {editFilteredUnits.map((u) => (
                        <option key={u._id} value={u._id}>
                          Unit {u.unitNumber} ({u.name})
                        </option>
                      ))}
                    </select>
                    {errorsEdit.unit && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.unit.message}</span>}
                  </div>

                  {/* Estimated Hours */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Estimated Hours *</label>
                    <input
                      type="number"
                      {...registerEdit('estimatedHours', { required: 'Hours is required', min: 1 })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. 2"
                    />
                    {errorsEdit.estimatedHours && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.estimatedHours.message}</span>}
                  </div>

                  {/* Difficulty Selection */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Difficulty *</label>
                    <select
                      {...registerEdit('difficulty', { required: 'Difficulty is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      {difficulties.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                    <select
                      {...registerEdit('status')}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Description</label>
                    <textarea
                      {...registerEdit('description')}
                      className="w-full border-0 border-b-2 border-outline-variant py-2 focus:ring-0 text-base focus:border-primary outline-none resize-none h-20 bg-transparent"
                      placeholder="Enter a brief topic syllabus details..."
                    />
                  </div>

                  {/* READ ONLY Date details */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Created Date</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedTopic ? new Date(selectedTopic.createdAt).toLocaleString() : ''}
                      className="w-full border-0 border-b border-dashed border-outline-variant text-on-surface-variant/70 text-sm py-2 cursor-not-allowed bg-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Last Updated</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedTopic ? new Date(selectedTopic.updatedAt).toLocaleString() : ''}
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
                      setEditSelectedCourse('');
                      setEditSelectedSem('');
                      setEditSelectedSubject('');
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
                <h3 className="text-xl font-bold text-primary">Delete Topic</h3>
                <p className="text-on-surface-variant text-sm">
                  Are you sure you want to delete the topic <strong>{selectedTopic?.name} ({selectedTopic?.code})</strong>? This action will perform a soft-delete and hide it from all listing indices.
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
                  <h3 className="text-lg font-bold text-primary">Topic Details</h3>
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
                    <span className="material-symbols-outlined text-4xl">description</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-primary">{selectedTopic?.name}</h4>
                    <p className="font-mono text-xs font-semibold text-secondary px-3 py-0.5 bg-secondary/10 rounded-full inline-block tracking-wider mt-1 uppercase">
                      Code: {selectedTopic?.code}
                    </p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Topic Number</span>
                    <span className="font-mono font-bold text-on-surface">{selectedTopic?.topicNumber}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Department</span>
                    <span className="font-semibold text-on-surface">
                      {selectedTopic?.department ? selectedTopic.department.name : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Course Mapping</span>
                    <span className="font-semibold text-on-surface">
                      {selectedTopic?.course ? `${selectedTopic.course.name} (${selectedTopic.course.code})` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Semester</span>
                    <span className="font-semibold text-on-surface">
                      {selectedTopic?.semester ? `Semester ${selectedTopic.semester.semesterNumber}` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Subject Title</span>
                    <span className="font-semibold text-on-surface">
                      {selectedTopic?.subject ? `${selectedTopic.subject.name} (${selectedTopic.subject.code})` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Unit Mapping</span>
                    <span className="font-semibold text-on-surface">
                      {selectedTopic?.unit ? `Unit ${selectedTopic.unit.unitNumber} (${selectedTopic.unit.name})` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Estimated Hours</span>
                    <span className="font-mono font-bold text-on-surface">{selectedTopic?.estimatedHours} hrs</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Difficulty Rating</span>
                    <span className="font-mono font-bold text-on-surface">{selectedTopic?.difficulty}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-primary/5">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Clearance Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      selectedTopic?.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                      selectedTopic?.status === 'Completed' ? 'bg-secondary/15 text-secondary' :
                      'bg-error/10 text-error'
                    }`}>
                      {selectedTopic?.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-col py-2 border-b border-primary/5 space-y-1">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Description</span>
                    <p className="text-on-surface-variant text-xs leading-relaxed bg-surface-container p-3 rounded-xl border border-primary/5">
                      {selectedTopic?.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-primary/10 mt-8 flex justify-between items-center text-sm font-mono text-[9px] font-semibold text-on-surface-variant">
                <span>CREATED: {selectedTopic?.createdAt ? new Date(selectedTopic.createdAt).toLocaleDateString() : ''}</span>
                <span>UPDATED: {selectedTopic?.updatedAt ? new Date(selectedTopic.updatedAt).toLocaleDateString() : ''}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminTopics;
