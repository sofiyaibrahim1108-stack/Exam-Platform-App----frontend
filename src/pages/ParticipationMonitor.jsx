import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserMinus, Percent, Search, RefreshCw, AlertCircle, 
  ChevronLeft, ChevronRight, BookOpen, Calendar, HelpCircle, Layers,ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import api from '../services/api';
import toast from 'react-hot-toast';

const ParticipationMonitor = ({ role = 'Admin' }) => {
  // Dropdown options
  const [dropdowns, setDropdowns] = useState({
    departments: [],
    courses: [],
    semesters: [],
    subjects: [],
    exams: []
  });

  // Selected filters
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState(''); // Labeled as "Batch/Section"

  // Real-time metrics states
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  const [examData, setExamData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [attemptedList, setAttemptedList] = useState([]);
  const [notAttemptedList, setNotAttemptedList] = useState([]);

  // Tab & search states
  const [activeTab, setActiveTab] = useState('attempted'); // 'attempted' | 'notAttempted'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load dropdowns on mount
  const fetchDropdowns = async () => {
    setLoadingDropdowns(true);
    try {
      const res = await api.get('/monitoring/dropdowns');
      if (res.data?.success) {
        setDropdowns(res.data.data);
      } else {
        toast.error('Failed to load filter dropdown choices.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching filters list.');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Fetch metrics for selected exam
  const fetchMetrics = async (showRefreshedIndicator = false) => {
    if (!examFilter) return;

    if (showRefreshedIndicator) {
      setRefreshing(true);
    } else {
      setLoadingMetrics(true);
    }
    setError('');

    try {
      const res = await api.get(`/monitoring/metrics/${examFilter}`);
      if (res.data?.success) {
        const { exam, metrics: m, attemptedStudents, notAttemptedStudents } = res.data.data;
        setExamData(exam);
        setMetrics(m);
        setAttemptedList(attemptedStudents || []);
        setNotAttemptedList(notAttemptedStudents || []);
      } else {
        setError('Failed to retrieve monitoring logs.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server encountered an error gathering participation metrics.');
    } finally {
      setLoadingMetrics(false);
      setRefreshing(false);
    }
  };

  // Trigger metrics reload when exam selection changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    if (examFilter) {
      fetchMetrics();
    } else {
      setExamData(null);
      setMetrics(null);
      setAttemptedList([]);
      setNotAttemptedList([]);
    }
  }, [examFilter]);

  // Set up 30 seconds auto-refresh interval
  useEffect(() => {
    if (!examFilter) return;
    
    const interval = setInterval(() => {
      fetchMetrics(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [examFilter]);

  // Filtered dropdowns logic to make selection reactive
  const filteredCourses = dropdowns.courses.filter(c => !deptFilter || String(c.department) === String(deptFilter));
  const filteredSemesters = dropdowns.semesters.filter(s => !courseFilter || String(s.course) === String(courseFilter));
  const filteredSubjects = dropdowns.subjects.filter(sub => {
    const matchDept = !deptFilter || String(sub.department) === String(deptFilter);
    const matchCourse = !courseFilter || String(sub.course) === String(courseFilter);
    const matchSem = !semFilter || String(sub.semester) === String(semFilter);
    return matchDept && matchCourse && matchSem;
  });

  const filteredExams = dropdowns.exams.filter(ex => {
    const matchDept = !deptFilter || String(ex.department) === String(deptFilter);
    const matchCourse = !courseFilter || String(ex.course) === String(courseFilter);
    const matchSem = !semFilter || String(ex.semester) === String(semFilter);
    const matchSub = !subFilter || String(ex.subject?._id || ex.subject) === String(subFilter);
    return matchDept && matchCourse && matchSem && matchSub;
  });

  // Automatically select the single exam if filtered lists narrow down to one
  useEffect(() => {
    if (filteredExams.length === 1 && examFilter !== filteredExams[0]._id) {
      setExamFilter(filteredExams[0]._id);
    }
  }, [filteredExams, deptFilter, courseFilter, semFilter, subFilter]);

  // Reset filters
  const handleResetFilters = () => {
    setDeptFilter('');
    setCourseFilter('');
    setSemFilter('');
    setSubFilter('');
    setExamFilter('');
    setSectionFilter('');
  };

  // Get current list (Attempted vs Not Attempted)
  const currentRawList = activeTab === 'attempted' ? attemptedList : notAttemptedList;

  // Apply frontend search & section filters
  const filteredStudentList = currentRawList.filter(student => {
    const matchesSearch = searchQuery.trim() === '' || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Batch/Section filter matches section key if provided
    const matchesSection = !sectionFilter || 
      (student.section && student.section.toLowerCase() === sectionFilter.toLowerCase()) ||
      (student.semester && String(student.semester).toLowerCase().includes(sectionFilter.toLowerCase()));

    return matchesSearch && matchesSection;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudentList.length / itemsPerPage);
  const paginatedList = filteredStudentList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 bg-[#FFFDFC]">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A] flex items-center gap-2">
            <ClipboardList size={22} className="text-[#8C1D40]" />
            Real-Time Participation Monitor
          </h2>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Observe student exam completions, active attempts, and attendance patterns in real-time.
          </p>
        </div>
        
        {examFilter && (
          <button
            onClick={() => fetchMetrics(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#8C1D40] transition-colors"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Force Refresh'}
          </button>
        )}
      </div>

      {/* FILTER BAR PANEL */}
      <div className="bg-white border border-[#F0D6DD]/80 rounded-[20px] p-5 shadow-[0_4px_16px_rgba(122,0,31,0.01)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <span className="text-xs font-black text-[#8C1D40] uppercase tracking-wider">Search & Academic Filters</span>
          <button 
            onClick={handleResetFilters}
            className="text-[10px] font-bold text-gray-500 hover:text-[#8C1D40] hover:underline"
          >
            Clear All Filters
          </button>
        </div>

        {loadingDropdowns ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Dept */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setCourseFilter(''); setSemFilter(''); setSubFilter(''); setExamFilter(''); }}
                className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
              >
                <option value="">All Departments</option>
                {dropdowns.departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">Course</label>
              <select
                value={courseFilter}
                onChange={(e) => { setCourseFilter(e.target.value); setSemFilter(''); setSubFilter(''); setExamFilter(''); }}
                className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
              >
                <option value="">All Courses</option>
                {filteredCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">Semester</label>
              <select
                value={semFilter}
                onChange={(e) => { setSemFilter(e.target.value); setSubFilter(''); setExamFilter(''); }}
                className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
              >
                <option value="">All Semesters</option>
                {filteredSemesters.map(s => (
                  <option key={s._id} value={s._id}>{s.name} (Sem {s.semesterNumber})</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">Subject</label>
              <select
                value={subFilter}
                onChange={(e) => { setSubFilter(e.target.value); setExamFilter(''); }}
                className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
              >
                <option value="">All Subjects</option>
                {filteredSubjects.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>

            {/* Section / Batch */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">Batch / Section</label>
              <input
                type="text"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                placeholder="A / B / Batch 2026..."
                className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
              />
            </div>

            {/* Target Exam Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#8C1D40] uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C1D40] inline-block animate-ping"></span>
                Target Exam
              </label>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full bg-[#FAF0F4] border border-[#8C1D40]/30 rounded-xl px-3 py-1.5 text-xs font-bold text-[#8C1D40] focus:outline-none focus:border-[#8C1D40] transition-colors"
              >
                <option value="" className="text-gray-500 font-semibold">-- Select Exam --</option>
                {filteredExams.map(ex => (
                  <option key={ex._id} value={ex._id}>{ex.title}</option>
                ))}
              </select>
            </div>

          </div>
        )}
      </div>

      {/* METRICS PANEL & DETAIL STATE */}
      {!examFilter ? (
        <div className="bg-white border border-[#F0D6DD]/50 rounded-[24px] py-16 text-center shadow-xs">
          <Users size={36} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Select an Exam to Monitor</h3>
          <p className="text-xs text-gray-400 font-semibold max-w-sm mx-auto mt-1 leading-relaxed">
            Please choose an active or completed assessment from the filters above to access real-time participation statistics and logs.
          </p>
        </div>
      ) : loadingMetrics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 animate-pulse border border-gray-150 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-50 animate-pulse border border-gray-150 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
          <AlertCircle size={24} className="text-red-600 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-red-800">Monitoring Connection Failure</h4>
          <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Real-time Indicator banner */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Feed: Auto-refreshing every 30 seconds</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600">Last Synced: {new Date().toLocaleTimeString()}</span>
          </div>

          {/* REAL-TIME SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Students */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Total Students Assigned</p>
                <p className="text-2xl font-black text-gray-800">{metrics?.totalStudents || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                <Users size={18} />
              </div>
            </div>

            {/* Card 2: Attempted */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wide">Students Attempted</p>
                <p className="text-2xl font-black text-[#059669]">{metrics?.attemptedCount || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
                <UserCheck size={18} />
              </div>
            </div>

            {/* Card 3: Not Attempted */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-red-600 uppercase tracking-wide">Not Attempted</p>
                <p className="text-2xl font-black text-red-600">{metrics?.notAttemptedCount || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <UserMinus size={18} />
              </div>
            </div>

            {/* Card 4: Attendance */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-[#8C1D40] uppercase tracking-wide">Attendance Percentage</p>
                <p className="text-2xl font-black text-[#8C1D40]">{metrics?.attendancePercentage || 0}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#8C1D40]/5 border border-[#8C1D40]/10 flex items-center justify-center text-[#8C1D40]">
                <Percent size={16} />
              </div>
            </div>

          </div>

          {/* ATTENDANCE PROGRESS VISUALIZATION */}
          <div className="bg-white border border-gray-150 rounded-[20px] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Attempt Completion Progress</h4>
                <p className="text-[10px] font-semibold text-gray-500 mt-0.5">
                  Visual representation of examinees currently writing or completed relative to total assigned.
                </p>
              </div>
              <span className="text-sm font-black text-[#8C1D40]">
                {metrics?.attemptedCount || 0} / {metrics?.totalStudents || 0} Students ({metrics?.attendancePercentage || 0}%)
              </span>
            </div>

            {/* Modern visual Progress track */}
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics?.attendancePercentage || 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#8C1D40] to-[#C74B74] rounded-full relative"
                />
              </div>
              
              <div className="flex justify-between text-[10px] font-bold text-gray-400">
                <span>0% Started</span>
                <span>50% Midpoint</span>
                <span>100% Completed</span>
              </div>
            </div>
          </div>

          {/* MAIN TABS VIEWPORT */}
          <div className="bg-white border border-gray-150 rounded-[20px] shadow-xs overflow-hidden">
            
            {/* Tabs Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 bg-[#FAFAFA] px-5 py-3 gap-3">
              
              {/* Tab options */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setActiveTab('attempted'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'attempted'
                      ? 'bg-[#8C1D40] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-150/60'
                  }`}
                >
                  Attempted Students ({attemptedList.length})
                </button>
                <button
                  onClick={() => { setActiveTab('notAttempted'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'notAttempted'
                      ? 'bg-[#8C1D40] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-150/60'
                  }`}
                >
                  Not Attempted ({notAttemptedList.length})
                </button>
              </div>

              {/* Table search filter */}
              <div className="relative max-w-xs w-full">
                <Search size={14} className="text-gray-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search by Name or Roll..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
                />
              </div>

            </div>

            {/* TAB CONTENT: STUDENTS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-gray-700">
                <thead className="bg-[#FAFAFA] border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                  {activeTab === 'attempted' ? (
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Roll Number</th>
                      <th className="px-6 py-4">Dept / Course / Sem</th>
                      <th className="px-6 py-4">Start Time</th>
                      <th className="px-6 py-4">Submitted Time</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Roll Number</th>
                      <th className="px-6 py-4">Dept / Course / Sem</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'attempted' ? 6 : 4} className="px-6 py-12 text-center text-gray-400">
                        <Users size={24} className="mx-auto mb-2 text-gray-300" />
                        No matching student records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((st, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{st.name}</td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-600">{st.rollNumber}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5 text-[11px] leading-tight">
                            <p className="text-gray-800 font-bold">{st.department}</p>
                            <p className="text-gray-400 font-semibold">{st.course} · Sem {st.semester}</p>
                          </div>
                        </td>
                        
                        {activeTab === 'attempted' ? (
                          <>
                            <td className="px-6 py-4 font-mono font-semibold text-gray-500">{formatDateTime(st.startTime)}</td>
                            <td className="px-6 py-4 font-mono font-semibold text-gray-500">{formatDateTime(st.submittedTime)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                st.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                              }`}>
                                {st.status}
                              </span>
                            </td>
                          </>
                        ) : (
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-150">
                              {st.status}
                            </span>
                          </td>
                        )}

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TAB FOOTER: PAGINATION */}
            {totalPages > 1 && (
              <div className="bg-[#FAFAFA] border-t border-gray-100 px-6 py-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudentList.length)} to {Math.min(currentPage * itemsPerPage, filteredStudentList.length)} of {filteredStudentList.length} students
                </span>
                
                <div className="flex gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#8C1D40] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-[#8C1D40] text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#8C1D40] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default ParticipationMonitor;
