import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Database, HelpCircle, CheckCircle2, CornerUpLeft, Plus, FileText, Download, Check, AlertOctagon, ArrowLeft, Eye, X, Search
} from 'lucide-react';
import api from '../services/api';

const AdminRejectedSubmissions = () => {
  // Main Lists & Options States
  const [submissions, setSubmissions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Dashboard & Loading States
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    returnedForRevision: 0,
    totalQuestionBank: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Search & Filter Parameter States
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [submittedFilter, setSubmittedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal & Action states
  const [activeSubmissionDetails, setActiveSubmissionDetails] = useState(null); // { submission, questions }
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch rejected submissions
  const fetchRejectedData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/submissions/rejected', {
        params: {
          department: deptFilter || undefined,
          course: courseFilter || undefined,
          semester: semFilter || undefined,
          subject: subFilter || undefined,
          submittedBy: submittedFilter || undefined,
          page: currentPage,
          limit: 10
        }
      });
      if (response.data && response.data.success) {
        setSubmissions(response.data.data.results || []);
        setPagination(response.data.data.pagination);
        if (response.data.data.stats) {
          setStats(response.data.data.stats);
        }
      }
    } catch (error) {
      toast.error('Failed to load rejected submissions.');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  // Fetch dropdown options for filters
  const fetchDropdowns = async () => {
    try {
      const dropRes = await api.get('/units/dropdowns');
      if (dropRes.data && dropRes.data.success) {
        setDepartments(dropRes.data.data.departments || []);
        setCourses(dropRes.data.data.courses || []);
        setSemesters(dropRes.data.data.semesters || []);
        setSubjects(dropRes.data.data.subjects || []);
      }

      const staffRes = await api.get('/user-management/staff');
      if (staffRes.data && staffRes.data.success) {
        setStaffList(staffRes.data.data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown dependencies', err);
    }
  };

  useEffect(() => {
    fetchRejectedData();
  }, [deptFilter, courseFilter, semFilter, subFilter, submittedFilter, currentPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleResetFilters = () => {
    setDeptFilter('');
    setCourseFilter('');
    setSemFilter('');
    setSubFilter('');
    setSubmittedFilter('');
    setCurrentPage(1);
    toast.success('Filters cleared.');
    setTimeout(() => fetchRejectedData(), 50);
  };

  // Load Single Submission details
  const handleOpenSubmission = async (id) => {
    setDetailsLoading(true);
    setPreviewOpen(true);
    try {
      const response = await api.get(`/admin/submissions/${id}`);
      if (response.data && response.data.success) {
        setActiveSubmissionDetails(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load submission details.');
      setPreviewOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Reusable stat card widget
  const renderStatCard = (title, count, icon, color) => {
    let IconComponent = Database;
    if (icon === 'gavel') IconComponent = AlertOctagon;
    if (icon === 'task_alt') IconComponent = CheckCircle2;
    if (icon === 'cancel') IconComponent = X;
    if (icon === 'assignment_return') IconComponent = CornerUpLeft;
    if (icon === 'database') IconComponent = Database;

    return (
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">{title}</span>
            <span className="block font-black text-2xl text-[#111111] font-mono mt-1">{count}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#FAF8F7] flex items-center justify-center text-[#8B1E3F] border border-primary/5">
            <IconComponent size={18} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
            <AlertOctagon size={12} />
            Rejections History Archive
          </div>
          <h2 className="text-2xl font-black text-[#111111] leading-none">Rejected Submissions Log</h2>
          <p className="text-[13px] text-[#6B7280] mt-1.5">
            Historical records of all rejected question batches, including rejection feedback details and academic scopes.
          </p>
        </div>
      </div>

      {/* Dashboard Stats Row */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-[16px]"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {renderStatCard('Pending Submissions', stats.pendingCount, 'gavel', 'text-amber-600')}
          {renderStatCard('Approved Today', stats.approvedToday, 'task_alt', 'text-emerald-600')}
          {renderStatCard('Rejected Submissions', stats.rejectedToday, 'cancel', 'text-error')}
          {renderStatCard('Returned For Revision', stats.returnedForRevision, 'assignment_return', 'text-secondary')}
          {renderStatCard('Approved Questions', stats.totalQuestionBank, 'database', 'text-primary')}
        </div>
      )}

      {/* Filters Form Panel */}
      <div className="card-flat p-5 bg-white">
        <h3 className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block mb-3">Advanced Rejections Filters</h3>
        <form onSubmit={(e) => { e.preventDefault(); fetchRejectedData(); }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end text-xs font-semibold font-sans">
          
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Department</span>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCourseFilter(''); setSemFilter(''); setSubFilter(''); setCurrentPage(1); }}
              className="select"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.code} - {d.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Course</span>
            <select
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setSemFilter(''); setSubFilter(''); setCurrentPage(1); }}
              className="select"
              disabled={!deptFilter}
            >
              <option value="">All Courses</option>
              {courses.filter(c => c.department?._id === deptFilter || c.department === deptFilter).map(c => (
                <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Semester</span>
            <select
              value={semFilter}
              onChange={(e) => { setSemFilter(e.target.value); setSubFilter(''); setCurrentPage(1); }}
              className="select"
              disabled={!courseFilter}
            >
              <option value="">All Semesters</option>
              {semesters.filter(s => s.course?._id === courseFilter || s.course === courseFilter).map(s => (
                <option key={s._id} value={s._id}>Sem {s.semesterNumber} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Subject</span>
            <select
              value={subFilter}
              onChange={(e) => { setSubFilter(e.target.value); setCurrentPage(1); }}
              className="select"
              disabled={!semFilter}
            >
              <option value="">All Subjects</option>
              {subjects.filter(sub => sub.semester?._id === semFilter || sub.semester === semFilter).map(sub => (
                <option key={sub._id} value={sub._id}>{sub.code} - {sub.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Submitted By</span>
            <select
              value={submittedFilter}
              onChange={(e) => { setSubmittedFilter(e.target.value); setCurrentPage(1); }}
              className="select"
            >
              <option value="">All Faculty Staff</option>
              {staffList.map(st => <option key={st._id} value={st._id}>{st.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 lg:col-span-2 lg:col-start-4">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-secondary py-2 px-3 flex-1 text-[12.5px] rounded-[10px]"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="btn-primary py-2 px-4 flex-1 text-[12.5px] rounded-[10px] whitespace-nowrap"
            >
              Filter Rejections
            </button>
          </div>
        </form>
      </div>

      {/* Main Rejected Submissions Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <X size={24} />
            </div>
            <h4 className="text-base font-bold text-[#111111]">No Rejected Submissions</h4>
            <p className="text-[#6B7280] text-xs mt-1 max-w-sm mx-auto">
              No rejected submission logs found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Submission ID</th>
                  <th>Subject</th>
                  <th>Rejection Reason</th>
                  <th>Submitted By</th>
                  <th>Rejected By</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td className="font-mono font-bold text-[#8B1E3F]">
                      {sub._id.slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div className="font-bold text-[#111111]">{sub.Subject?.name}</div>
                      <div className="text-[10px] text-[#6B7280] font-mono mt-0.5 uppercase">{sub.Subject?.code}</div>
                    </td>
                    <td>
                      <span className="badge badge-red inline-block max-w-[150px] truncate" title={sub.RejectedReason}>
                        {sub.RejectedReason || 'No Reason Stated'}
                      </span>
                    </td>
                    <td>
                      <div className="text-[#111111] font-bold">{sub.SubmittedBy?.name}</div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">{sub.SubmittedBy?.email}</div>
                    </td>
                    <td>
                      <div className="text-[#111111] font-bold">{sub.ApprovedBy?.name || 'Administrator'}</div>
                    </td>
                    <td className="font-mono text-[#6B7280]">
                      {new Date(sub.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenSubmission(sub._id)}
                        className="btn-primary py-1.5 px-3 rounded-[8px] text-[10.5px] inline-flex items-center gap-1"
                        title="View Submission Details"
                      >
                        <Eye size={12} />
                        Review Batch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && submissions.length > 0 && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-primary/5 text-xs text-[#6B7280]">
          <span className="font-mono text-xs">
            Showing {(currentPage - 1) * pagination.limit + 1} - {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} batches
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* BATCH PREVIEW DRAWER */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex justify-end font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            ></motion.div>

            {/* Slide-over Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-primary/10 p-6 flex flex-col justify-between z-10 font-sans text-xs text-[#111111]"
            >
              {detailsLoading ? (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="w-10 h-10 border-2 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-xs text-[#6B7280] mt-3 font-semibold">Retrieving batch questions...</span>
                </div>
              ) : activeSubmissionDetails ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  
                  {/* Drawer Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[9px] font-bold uppercase tracking-wider font-mono">
                        SUBMISSION ID: {activeSubmissionDetails.submission._id.slice(-8).toUpperCase()}
                      </span>
                      <h3 className="text-base font-black text-[#111111] mt-1.5">Rejected Batch Details</h3>
                    </div>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-100 text-[#6B7280]"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Scrollable Questions list container */}
                  <div className="flex-1 overflow-y-auto space-y-5 pr-2 mb-6" style={{ scrollbarWidth: 'thin' }}>
                    
                    {/* Rejection Reason feedback box */}
                    <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-start gap-3">
                      <AlertOctagon size={16} className="text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold font-mono uppercase text-red-700">Rejection Reason</div>
                        <div className="text-xs mt-0.5 font-medium leading-relaxed text-red-950">
                          {activeSubmissionDetails.submission.RejectedReason || 'No Reason Specified.'}
                        </div>
                      </div>
                    </div>

                    {/* Batch Metadata Header */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-[#6B7280] bg-[#FAF8F7] p-4 rounded-xl border border-primary/5">
                      <div>
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Subject Context</span>
                        <span className="text-[#8B1E3F] truncate block font-bold">
                          {activeSubmissionDetails.submission.Subject?.name || 'Subject Mapped'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Course / Semester</span>
                        <span className="truncate block font-bold text-[#111111]">
                          {activeSubmissionDetails.submission.CourseId?.name || 'Course Mapped'} (Sem {activeSubmissionDetails.submission.SemesterId?.semesterNumber})
                        </span>
                      </div>
                      <div className="pt-2 border-t border-primary/5">
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Submitted By</span>
                        <span className="block font-bold truncate text-[#111111]">
                          {activeSubmissionDetails.submission.SubmittedBy?.name}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-primary/5">
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Total Questions</span>
                        <span className="block font-black text-[#8B1E3F] truncate">
                          {activeSubmissionDetails.questions.length} MCQ Questions
                        </span>
                      </div>
                    </div>

                    {/* Questions Loop */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-mono font-black text-[#9CA3AF] uppercase tracking-wider">Submitted Question Items</h4>
                      {activeSubmissionDetails.questions.map((q, idx) => (
                        <div key={q._id} className="p-4 bg-[#FAF8F7]/50 border border-primary/10 rounded-2xl space-y-3.5">
                          
                          <div className="flex justify-between items-center text-[9px] font-bold text-[#6B7280] font-mono">
                            <span className="px-2 py-0.5 rounded bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] text-[#8B1E3F]">
                              Q{idx + 1} • DIFFICULTY: {q.Difficulty || q.difficulty}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-gray-100 uppercase">
                              By: {q.GeneratedBy || (q.metadata?.isAiGenerated ? 'AI' : 'Staff')}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-[#8B1E3F] leading-relaxed">
                            {q.Question || q.text}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {['A', 'B', 'C', 'D'].map(opt => {
                              const optionText = q[`Option${opt}`] || q.options?.find(o => o.optionId === opt)?.optionText || '';
                              const isCorrect = (q.CorrectAnswer || q.correctAnswers?.[0]) === opt;
                              return (
                                <div
                                  key={opt}
                                  className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-start gap-2.5 transition-colors ${
                                    isCorrect
                                      ? 'bg-green-500/10 border-green-500/20 text-green-800 font-bold'
                                      : 'bg-white border-primary/5 text-[#6B7280]'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black font-mono text-[9px] mt-0.5 ${
                                    isCorrect ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                                  }`}>
                                    {opt}
                                  </span>
                                  <span className="flex-1 mt-0.5 truncate">{optionText}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          {(q.Explanation || q.explanation) && (
                            <div className="p-3 bg-white border border-primary/5 rounded-xl text-[10px] font-semibold text-[#6B7280] leading-relaxed">
                              <span className="font-mono text-[9px] text-[#8B1E3F] uppercase block font-bold mb-0.5">Explanation</span>
                              {q.Explanation || q.explanation}
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <span className="px-2 py-0.5 rounded bg-white text-[#6B7280] text-[9px] font-semibold border">
                              Unit {q.UnitId || 'N/A'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white text-[#6B7280] text-[9px] font-semibold border truncate max-w-[150px]">
                              Topic {q.TopicId || 'N/A'}
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Close Footer */}
                  <div className="pt-4 border-t border-primary/5 bg-white">
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      className="w-full py-2.5 rounded-xl border border-primary/10 hover:bg-primary/5 text-xs font-bold transition-all flex items-center justify-center gap-1 text-[#6B7280]"
                    >
                      Close Details
                    </button>
                  </div>

                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRejectedSubmissions;
