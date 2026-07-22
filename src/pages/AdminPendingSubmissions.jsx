import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminPendingSubmissions = () => {
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
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [submittedFilter, setSubmittedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal & Action states
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [activeSubmissionDetails, setActiveSubmissionDetails] = useState(null); // { submission, questions }
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [actionModal, setActionModal] = useState(null); // 'approve' | 'reject' | 'sendback'
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch pending submissions
  const fetchPendingData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/submissions/pending', {
        params: {
          department: deptFilter || undefined,
          course: courseFilter || undefined,
          semester: semFilter || undefined,
          subject: subFilter || undefined,
          submittedBy: submittedFilter || undefined,
          search: search || undefined,
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
      toast.error('Failed to load pending submissions.');
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
    fetchPendingData();
  }, [deptFilter, courseFilter, semFilter, subFilter, submittedFilter, currentPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPendingData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDeptFilter('');
    setCourseFilter('');
    setSemFilter('');
    setSubFilter('');
    setSubmittedFilter('');
    setCurrentPage(1);
    toast.success('Filters cleared.');
    setTimeout(() => fetchPendingData(), 50);
  };

  // Load Single Submission details
  const handleOpenSubmission = async (id) => {
    setActiveSubmissionId(id);
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

  // Perform Submission Review Action (Approve / Reject / Sendback)
  const handleReviewAction = async (e) => {
    e.preventDefault();
    if (!activeSubmissionId) return;
    if (actionModal !== 'approve' && !actionReason.trim()) {
      toast.error('Please specify a reason.');
      return;
    }

    setSubmittingAction(true);
    const toastId = toast.loading(`Processing batch submission ${actionModal}...`);
    try {
      let endpoint = `/admin/submissions/${activeSubmissionId}/approve`;
      let payload = {};

      if (actionModal === 'reject') {
        endpoint = `/admin/submissions/${activeSubmissionId}/reject`;
        payload = { RejectedReason: actionReason };
      } else if (actionModal === 'sendback') {
        endpoint = `/admin/submissions/${activeSubmissionId}/send-back`;
        payload = { RevisionReason: actionReason };
      }

      const response = await api.put(endpoint, payload);
      if (response.data && response.data.success) {
        toast.success(
          `Batch submission successfully ${
            actionModal === 'approve'
              ? 'approved and added to Question Bank'
              : actionModal === 'reject'
              ? 'rejected'
              : 'returned for revision'
          }.`,
          { id: toastId }
        );
        setActionModal(null);
        setPreviewOpen(false);
        setActionReason('');
        setActiveSubmissionDetails(null);
        fetchPendingData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transaction failed.', { id: toastId });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reusable stat card widget
  const renderStatCard = (title, count, icon, color) => (
    <div className="glass-panel p-5 rounded-[24px] border border-primary/5 flex items-center justify-between shadow-xs">
      <div>
        <p className="text-[10px] font-mono font-bold text-on-surface-variant/75 uppercase tracking-wider">{title}</p>
        <h4 className={`text-2xl font-black mt-1 ${color}`}>{count}</h4>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/5 ${color}`}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-[24px]">
        <h2 className="text-2xl font-bold text-primary mb-1">Batch Approval Worklist</h2>
        <p className="text-on-surface-variant text-xs">
          Review entire batches of MCQ questions submitted by Faculty staff. Verify, approve, reject, or return the whole submission in one click.
        </p>
      </div>

      {/* Dashboard Stats Row */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-surface-container-high rounded-[24px]"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {renderStatCard('Pending Submissions', stats.pendingCount, 'gavel', 'text-amber-600')}
          {renderStatCard('Approved Today', stats.approvedToday, 'task_alt', 'text-emerald-600')}
          {renderStatCard('Rejected Today', stats.rejectedToday, 'cancel', 'text-error')}
          {renderStatCard('Returned For Revision', stats.returnedForRevision, 'assignment_return', 'text-secondary')}
          {renderStatCard('Approved Questions', stats.totalQuestionBank, 'database', 'text-primary')}
        </div>
      )}

      {/* Filters Form Panel */}
      <div className="glass-panel p-6 rounded-[24px] space-y-4">
        <h3 className="text-xs font-mono font-black text-primary uppercase tracking-wider">Advanced Search</h3>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search Subject or Submission ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-primary/10 text-xs focus:outline-none focus:border-primary font-medium"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant/40 text-[18px]">search</span>
          </div>

          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setCourseFilter(''); setSemFilter(''); setSubFilter(''); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-surface border border-primary/10 text-xs font-semibold text-on-surface-variant"
          >
            <option value="">Department: All</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.code} - {d.name}</option>)}
          </select>

          <select
            value={courseFilter}
            onChange={(e) => { setCourseFilter(e.target.value); setSemFilter(''); setSubFilter(''); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-surface border border-primary/10 text-xs font-semibold text-on-surface-variant"
            disabled={!deptFilter}
          >
            <option value="">Course: All</option>
            {courses.filter(c => c.department?._id === deptFilter || c.department === deptFilter).map(c => (
              <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
            ))}
          </select>

          <select
            value={semFilter}
            onChange={(e) => { setSemFilter(e.target.value); setSubFilter(''); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-surface border border-primary/10 text-xs font-semibold text-on-surface-variant"
            disabled={!courseFilter}
          >
            <option value="">Semester: All</option>
            {semesters.filter(s => s.course?._id === courseFilter || s.course === courseFilter).map(s => (
              <option key={s._id} value={s._id}>Semester {s.semesterNumber} - {s.name}</option>
            ))}
          </select>

          <select
            value={subFilter}
            onChange={(e) => { setSubFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-surface border border-primary/10 text-xs font-semibold text-on-surface-variant"
            disabled={!semFilter}
          >
            <option value="">Subject: All</option>
            {subjects.filter(sub => sub.semester?._id === semFilter || sub.semester === semFilter).map(sub => (
              <option key={sub._id} value={sub._id}>{sub.code} - {sub.name}</option>
            ))}
          </select>

          <select
            value={submittedFilter}
            onChange={(e) => { setSubmittedFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-surface border border-primary/10 text-xs font-semibold text-on-surface-variant"
          >
            <option value="">Submitted By: All</option>
            {staffList.map(st => <option key={st._id} value={st._id}>{st.name}</option>)}
          </select>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 border border-primary/10 text-on-surface-variant hover:bg-primary/5 font-bold text-xs rounded-xl transition-all"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white hover:bg-primary/95 font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10"
            >
              Search Submissions
            </button>
          </div>
        </form>
      </div>

      {/* Main Pending Submissions Table */}
      {loading ? (
        <div className="glass-panel p-6 rounded-[24px] space-y-4 animate-pulse">
          <div className="h-6 bg-surface-container-high rounded w-1/4"></div>
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-surface-container-high rounded w-full"></div>)}
        </div>
      ) : submissions.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-[24px]">
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">gavel</span>
          <h4 className="text-base font-bold text-on-surface">No Pending Batches</h4>
          <p className="text-on-surface-variant text-xs mt-1 max-w-sm mx-auto">
            All submitted question batches have been processed. The pending queue is clean.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-[24px] overflow-hidden border border-primary/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-primary/5 border-b border-primary/10 text-[10px] font-mono font-bold text-primary uppercase tracking-wider">
                  <th className="px-6 py-4">Submission ID</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Academic details</th>
                  <th className="px-6 py-4">Questions</th>
                  <th className="px-6 py-4">Submitted By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 font-medium">
                {submissions.map((sub, idx) => (
                  <tr key={sub._id} className="hover:bg-primary/5/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {sub._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">{sub.Subject?.name}</div>
                      <div className="text-[10px] text-on-surface-variant/60 font-mono mt-0.5 uppercase">{sub.Subject?.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{sub.CourseId?.name}</div>
                      <div className="text-[10px] text-on-surface-variant/60 font-mono uppercase mt-0.5">
                        {sub.DepartmentId?.code} (Semester {sub.SemesterId?.semesterNumber})
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {sub.TotalQuestions} MCQs
                    </td>
                    <td className="px-6 py-4">
                      <div>{sub.SubmittedBy?.name}</div>
                      <div className="text-[10px] text-on-surface-variant/60 mt-0.5">{sub.SubmittedBy?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {new Date(sub.SubmittedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenSubmission(sub._id)}
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-bold hover:bg-primary-container hover:text-primary transition-all text-[10px] flex items-center gap-1 shadow-sm shadow-primary/5"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        Review Batch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-primary/5 bg-primary/5/10 flex justify-between items-center text-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 font-bold bg-surface border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="font-mono font-bold text-on-surface-variant">
                Page {currentPage} of {pagination.totalPages} ({pagination.total} Batches)
              </span>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 font-bold bg-surface border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* BATCH REVIEW SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
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
              className="relative w-full max-w-2xl bg-surface h-full shadow-2xl border-l border-primary/10 p-6 flex flex-col justify-between z-10"
            >
              {detailsLoading ? (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-xs text-on-surface-variant mt-3 font-semibold">Retrieving batch questions...</span>
                </div>
              ) : activeSubmissionDetails ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  
                  {/* Drawer Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider font-mono">
                        SUBMISSION ID: {activeSubmissionDetails.submission._id.slice(-8).toUpperCase()}
                      </span>
                      <h3 className="text-base font-bold text-primary mt-1.5">Review Batch Submission</h3>
                    </div>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="p-1 rounded-full hover:bg-primary/5 text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[22px]">close</span>
                    </button>
                  </div>

                  {/* Scrollable Questions list container */}
                  <div className="flex-1 overflow-y-auto space-y-5 pr-2 mb-6" style={{ scrollbarWidth: 'thin' }}>
                    
                    {/* Batch Metadata Header */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-on-surface-variant bg-surface-container-low p-4 rounded-xl border border-primary/5">
                      <div>
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Subject Context</span>
                        <span className="text-primary truncate block font-bold">
                          {activeSubmissionDetails.submission.Subject?.name || 'Subject Mapped'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Course / Semester</span>
                        <span className="truncate block font-bold text-on-surface">
                          {activeSubmissionDetails.submission.CourseId?.name || 'Course Mapped'} (Sem {activeSubmissionDetails.submission.SemesterId?.semesterNumber})
                        </span>
                      </div>
                      <div className="pt-2 border-t border-primary/5">
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Submitted By</span>
                        <span className="block font-bold truncate">
                          {activeSubmissionDetails.submission.SubmittedBy?.name} ({new Date(activeSubmissionDetails.submission.SubmittedDate).toLocaleDateString()})
                        </span>
                      </div>
                      <div className="pt-2 border-t border-primary/5">
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Total Questions</span>
                        <span className="block font-black text-primary truncate">
                          {activeSubmissionDetails.questions.length} MCQ Questions
                        </span>
                      </div>
                    </div>

                    {/* Questions Loop */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-mono font-black text-primary uppercase tracking-wider">Submitted Question Items</h4>
                      {activeSubmissionDetails.questions.map((q, idx) => (
                        <div key={q._id} className="p-4 bg-surface-container-lowest border border-primary/10 rounded-2xl space-y-3.5">
                          
                          <div className="flex justify-between items-center text-[9px] font-bold text-on-surface-variant font-mono">
                            <span className="px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary">
                              Q{idx + 1} • DIFFICULTY: {q.Difficulty || q.difficulty}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-container border uppercase">
                              By: {q.GeneratedBy || (q.metadata?.isAiGenerated ? 'AI' : 'Staff')}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-primary leading-relaxed">
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
                                      ? 'bg-green-500/15 border-green-500/30 text-green-800'
                                      : 'bg-surface border-primary/5 text-on-surface-variant/80'
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
                            <div className="p-3 bg-surface border border-primary/5 rounded-xl text-[10px] font-semibold text-on-surface-variant leading-relaxed">
                              <span className="font-mono text-[9px] text-primary uppercase block font-bold mb-0.5">Explanation</span>
                              {q.Explanation || q.explanation}
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[9px] font-semibold border">
                              Unit {q.UnitId || 'N/A'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[9px] font-semibold border truncate max-w-[150px]">
                              Topic {q.TopicId || 'N/A'}
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="flex gap-3 pt-4 border-t border-primary/10 bg-surface">
                    <button
                      type="button"
                      onClick={() => setActionModal('sendback')}
                      className="flex-1 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20 font-bold text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">assignment_return</span>
                      Return Batch
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionModal('reject')}
                      className="flex-1 py-2.5 rounded-xl bg-error/10 border border-error/15 text-error hover:bg-error/20 font-bold text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">cancel</span>
                      Reject Batch
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionModal('approve')}
                      className="flex-[2] py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 font-bold text-xs transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">task_alt</span>
                      Approve Batch
                    </button>
                  </div>

                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG MODAL (APPROVE/REJECT/SENDBACK) */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-primary/10 rounded-[28px] shadow-2xl p-6 max-w-md w-full relative z-10 overflow-hidden"
            >
              <h3 className="text-base font-bold text-primary mb-1">
                {actionModal === 'approve'
                  ? 'Confirm Batch Approval'
                  : actionModal === 'reject'
                  ? 'Reject Batch Submission'
                  : 'Return Batch for Revision'}
              </h3>
              <p className="text-on-surface-variant text-xs leading-normal mb-4">
                {actionModal === 'approve'
                  ? 'This will approve the entire submission batch and immediately move ALL questions into the central Question Bank database in one click.'
                  : actionModal === 'reject'
                  ? 'Select the reason for rejecting this entire batch submission. This action will log in history records.'
                  : 'Select revision instructions. The complete batch will become editable again in the original Staff member accounts.'}
              </p>

              <form onSubmit={handleReviewAction} className="space-y-4">
                {actionModal !== 'approve' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Action Feedback Reason
                    </label>
                    {actionModal === 'reject' ? (
                      <select
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold text-on-surface-variant"
                      >
                        <option value="">-- Select Rejection Reason --</option>
                        <option value="Poor Question Quality">Poor Question Quality</option>
                        <option value="Out Of Syllabus">Out Of Syllabus</option>
                        <option value="Incorrect Answers">Incorrect Answers</option>
                        <option value="Duplicate Questions">Duplicate Questions</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <select
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold text-on-surface-variant"
                      >
                        <option value="">-- Select Revision Action --</option>
                        <option value="Improve Explanations">Improve Explanations</option>
                        <option value="Correct Answers">Correct Answers</option>
                        <option value="Improve Question Quality">Improve Question Quality</option>
                        <option value="Update Difficulty">Update Difficulty</option>
                      </select>
                    )}

                    {actionReason === 'Other' && (
                      <textarea
                        rows="2"
                        required
                        placeholder="Provide details..."
                        value={actionReason === 'Other' ? '' : actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="w-full mt-2 px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs focus:outline-none focus:border-primary font-medium"
                      ></textarea>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => { setActionModal(null); setActionReason(''); }}
                    className="px-4 py-2 rounded-xl border border-primary/10 hover:bg-primary/5 text-xs font-bold transition-all"
                    disabled={submittingAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md shadow-primary/5 ${
                      actionModal === 'approve'
                        ? 'bg-primary hover:bg-primary/95'
                        : actionModal === 'reject'
                        ? 'bg-error hover:opacity-90'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                    disabled={submittingAction}
                  >
                    {submittingAction ? 'Processing...' : 'Confirm Action'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPendingSubmissions;
