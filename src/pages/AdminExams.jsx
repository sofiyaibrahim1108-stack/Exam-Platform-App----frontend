import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, Calendar, Clock, BookOpen, Search, X, Check, Eye, Trash2
} from 'lucide-react';
import api from '../services/api';

const AdminExams = () => {
  // Exams and pagination states
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Empty = 'All' (excludes Draft)
  const [subjectFilter, setSubjectFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExams, setTotalExams] = useState(0);

  // Mapped drop-downs for filters
  const [subjectsList, setSubjectsList] = useState([]);

  // Active details preview drawer
  const [activeExam, setActiveExam] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Scheduling & Publishing modal
  const [scheduleExam, setScheduleExam] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Rejection modal
  const [rejectExam, setRejectExam] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all exams from admin API
  const fetchExamsList = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/exams', {
        params: {
          status: statusFilter || undefined,
          subject: subjectFilter || undefined,
          search: search || undefined,
          page,
          limit,
        },
      });
      if (response.data && response.data.success) {
        setExams(response.data.data.results || []);
        setTotalExams(response.data.data.pagination?.total || 0);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load exams list.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects to populate filter drop-down
  const fetchSubjects = async () => {
    try {
      const response = await api.get('/staff/question-bank/dropdowns');
      if (response.data && response.data.success) {
        setSubjectsList(response.data.data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects filter dropdown.', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchExamsList();
  }, [statusFilter, subjectFilter, page]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExamsList();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSubjectFilter('');
    setPage(1);
    setTimeout(() => fetchExamsList(), 50);
  };

  // Action: Approve Exam
  const handleApprove = async (examId) => {
    if (!window.confirm('Are you sure you want to approve this exam paper?')) return;
    const loadingToast = toast.loading('Approving exam paper...');
    try {
      const response = await api.put(`/admin/exams/${examId}/approve`);
      if (response.data && response.data.success) {
        toast.success('Exam paper approved successfully!', { id: loadingToast });
        fetchExamsList();
        // Update active details drawer if open
        if (activeExam && activeExam._id === examId) {
          handleOpenDrawer(examId);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Approval failed.', { id: loadingToast });
    }
  };

  // Action: Reject Exam (Opens Modal)
  const handleOpenRejectModal = (exam) => {
    setRejectExam(exam);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    const loadingToast = toast.loading('Rejecting exam paper...');
    try {
      const response = await api.put(`/admin/exams/${rejectExam._id}/reject`, {
        reason: rejectionReason,
      });
      if (response.data && response.data.success) {
        toast.success('Exam paper rejected.', { id: loadingToast });
        setRejectModalOpen(false);
        setRejectExam(null);
        fetchExamsList();
        if (activeExam && activeExam._id === rejectExam._id) {
          handleOpenDrawer(rejectExam._id);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Rejection failed.', { id: loadingToast });
    }
  };

  // Action: Schedule & Publish (Opens Modal)
  const handleOpenPublishModal = (exam) => {
    setScheduleExam(exam);
    
    // Format dates/times to datetime-local values (YYYY-MM-DDTHH:MM)
    const formatDate = (d) => {
      if (!d) return '';
      const date = new Date(d);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatTime = (d) => {
      if (!d) return '';
      const date = new Date(d);
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${formatDate(d)}T${hours}:${mins}`;
    };

    setExamDate(exam.date ? formatDate(exam.date) : '');
    setStartTime(exam.startTime ? formatTime(exam.startTime) : '');
    setEndTime(exam.endTime ? formatTime(exam.endTime) : '');
    setScheduleModalOpen(true);
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!examDate || !startTime || !endTime) {
      toast.error('Please specify Exam Date, Start Time, and End Time.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      toast.error('End Time must be strictly greater than Start Time.');
      return;
    }

    const loadingToast = toast.loading('Scheduling and publishing exam...');
    try {
      const response = await api.put(`/admin/exams/${scheduleExam._id}/publish`, {
        date: examDate,
        startTime,
        endTime,
      });
      if (response.data && response.data.success) {
        toast.success('Exam scheduled and published successfully!', { id: loadingToast });
        setScheduleModalOpen(false);
        setScheduleExam(null);
        fetchExamsList();
        if (activeExam && activeExam._id === scheduleExam._id) {
          handleOpenDrawer(scheduleExam._id);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Publishing failed.', { id: loadingToast });
    }
  };

  // Action: Unpublish
  const handleUnpublish = async (examId) => {
    if (!window.confirm('Are you sure you want to unpublish this exam? It will revert to Approved state.')) return;
    const loadingToast = toast.loading('Unpublishing exam...');
    try {
      const response = await api.put(`/admin/exams/${examId}/unpublish`);
      if (response.data && response.data.success) {
        toast.success('Exam unpublished and reverted to Approved.', { id: loadingToast });
        fetchExamsList();
        if (activeExam && activeExam._id === examId) {
          handleOpenDrawer(examId);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Unpublishing failed.', { id: loadingToast });
    }
  };

  // Drawer Preview
  const handleOpenDrawer = async (examId) => {
    try {
      const response = await api.get(`/admin/exams/${examId}`);
      if (response.data && response.data.success) {
        setActiveExam(response.data.data);
        setDrawerOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load exam details.');
    }
  };

  // Helper status badge color mapping
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending Approval':
        return 'badge-gray';
      case 'Approved':
        return 'badge-green';
      case 'Rejected':
        return 'badge-red';
      case 'Published':
        return 'badge-wine';
      case 'Upcoming':
        return 'badge-blue';
      case 'Live':
        return 'badge-green animate-pulse';
      case 'Completed':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <ShieldAlert size={12} />
              Evaluation Center
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Administrative Exam Control</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Review, approve, and schedule assessment configurations. Publish exams to students or unpublish active nodes.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Form Panel */}
      <div className="card-flat p-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Search Title</span>
            <div className="search-bar">
              <Search size={14} className="text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search exam title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Filter Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Upcoming">Upcoming (Scheduled)</option>
              <option value="Live">Live (Active Now)</option>
              <option value="Completed">Completed (Past)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Filter Subject</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="select"
            >
              <option value="">All Subjects</option>
              {subjectsList.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary py-2 px-4 flex-1 text-[12.5px] rounded-[10px] flex items-center justify-center gap-1.5"
            >
              <Search size={13} />
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-secondary py-2 px-3 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Main Exams List Table */}
      {loading ? (
        <div className="space-y-3 p-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Calendar size={24} />
          </div>
          <h4 className="text-base font-bold text-[#111111]">No Exams Listed</h4>
          <p className="text-[#6B7280] text-xs mt-1">
            There are no exam papers matching your queries. Adjust filters to search.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Dept & Sem</th>
                  <th>Staff Name</th>
                  <th className="text-center">Questions</th>
                  <th className="text-center">Total Marks</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id}>
                    <td>
                      <p className="font-semibold text-[#8B1E3F] truncate max-w-[180px]">
                        {exam.title}
                      </p>
                      {exam.date && (
                        <p className="text-[9px] font-mono text-[#6B7280] mt-0.5">
                          Date: {new Date(exam.date).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td>
                      <p className="font-semibold text-[#111111]">{exam.subject?.name}</p>
                      <p className="text-[9px] font-mono text-[#6B7280]">Code: {exam.subject?.code}</p>
                    </td>
                    <td>
                      <p className="font-semibold text-[#111111]">{exam.department?.code}</p>
                      <p className="text-[9px] font-mono text-[#6B7280]">Sem: {exam.semester?.semesterNumber}</p>
                    </td>
                    <td>
                      {exam.createdBy?.name || 'Faculty'}
                    </td>
                    <td className="text-center font-mono font-bold text-[#111111]">
                      {exam.questions?.length || 0}
                    </td>
                    <td className="text-center font-mono font-bold text-[#111111]">
                      {exam.totalMarks}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${getStatusBadgeClass(exam.status)}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5 items-center">
                        <button
                          onClick={() => handleOpenDrawer(exam._id)}
                          className="py-1 px-2.5 text-[11.5px] rounded-[8px] bg-gray-50 border border-gray-200 text-[#111111] hover:bg-gray-100 font-bold transition-all flex items-center gap-1"
                        >
                          <Eye size={12} />
                          Review
                        </button>

                        {exam.status === 'Pending Approval' && (
                          <>
                            <button
                              onClick={() => handleApprove(exam._id)}
                              className="py-1 px-2.5 text-[11.5px] rounded-[8px] bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(exam)}
                              className="py-1 px-2.5 text-[11.5px] rounded-[8px] bg-red-600 text-white hover:bg-red-700 font-bold transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {exam.status === 'Approved' && (
                          <button
                            onClick={() => handleOpenPublishModal(exam)}
                            className="py-1 px-2.5 text-[11.5px] rounded-[8px] bg-[#8B1E3F] text-white hover:bg-[#A62E52] font-bold transition-all flex items-center gap-1"
                          >
                            <Calendar size={12} />
                            Publish
                          </button>
                        )}

                        {exam.status === 'Upcoming' && (
                          <>
                            <button
                              onClick={() => handleOpenPublishModal(exam)}
                              className="py-1 px-2.5 text-[11.5px] rounded-[8px] bg-gray-50 border border-gray-200 text-[#111111] hover:bg-gray-100 font-bold transition-all"
                              title="Reschedule"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleUnpublish(exam._id)}
                              className="py-1 px-2.5 text-[11.5px] rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 font-bold transition-all"
                            >
                              Unpublish
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-primary/5 text-xs text-[#6B7280]">
              <span className="font-mono text-xs">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalExams)} of {totalExams} exams
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= totalExams}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          REJECTION MODAL Dialog
          ---------------------------------------------------- */}
      <AnimatePresence>
        {rejectModalOpen && rejectExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-md z-10 relative overflow-hidden"
            >
              <h3 className="text-base font-bold text-primary mb-1">Reject Exam Paper</h3>
              <p className="text-on-surface-variant text-[11px] mb-4">
                Please provide a rejection feedback reason for the Staff creator.
              </p>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="text-[9px] font-mono font-bold text-on-surface-variant uppercase">
                    Feedback Reason <span className="text-error">*</span>
                  </label>
                  <textarea
                    required
                    placeholder="e.g. Total marks mismatch, or Unit III syllabus coverage is insufficient."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none focus:border-primary text-xs transition-all font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-primary/5 mt-4">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    className="px-4 py-2 border border-primary/10 text-on-surface-variant text-[11px] font-bold rounded-xl hover:bg-primary/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-error text-white font-bold text-[11px] rounded-xl hover:opacity-95 shadow-md shadow-error/10"
                  >
                    Confirm Reject
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          PUBLISH & SCHEDULE MODAL Dialog
          ---------------------------------------------------- */}
      <AnimatePresence>
        {scheduleModalOpen && scheduleExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setScheduleModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-md z-10 relative overflow-hidden"
            >
              <h3 className="text-base font-bold text-primary mb-1">Schedule & Publish Exam</h3>
              <p className="text-on-surface-variant text-[11px] mb-4">
                Set dates and window limits. Unlocks and registers students automatically.
              </p>

              <form onSubmit={handlePublishSubmit} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-bold text-on-surface-variant uppercase">
                    Exam Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-bold text-on-surface-variant uppercase">
                    Start Date-Time <span className="text-error">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-bold text-on-surface-variant uppercase">
                    End Date-Time <span className="text-error">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-primary/5 mt-4">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-4 py-2 border border-primary/10 text-on-surface-variant text-[11px] font-bold rounded-xl hover:bg-primary/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white font-bold text-[11px] rounded-xl hover:opacity-95 shadow-md shadow-primary/10 animate-in fade-in"
                  >
                    Schedule & Publish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          EXAM REVIEW PREVIEW DRAWER
          ---------------------------------------------------- */}
      <AnimatePresence>
        {drawerOpen && activeExam && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-surface h-full shadow-2xl border-l border-primary/10 p-6 flex flex-col justify-between z-10 overflow-y-auto"
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${getStatusBadgeClass(activeExam.status)}`}>
                      {activeExam.status}
                    </span>
                    <h3 className="text-base font-bold text-primary mt-1.5">Exam Configuration Details</h3>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-primary/5 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[20px] block">close</span>
                  </button>
                </div>

                <div className="space-y-6 text-xs font-semibold text-on-surface-variant">
                  {/* Title and metadata block */}
                  <div className="p-4 bg-surface-container-low border border-primary/5 rounded-xl space-y-1.5 font-bold">
                    <p className="text-primary text-sm font-sans">{activeExam.title}</p>
                    <p className="text-[10px] font-normal leading-relaxed text-on-surface-variant/80">
                      {activeExam.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Reject Feedback (If Rejected) */}
                  {activeExam.status === 'Rejected' && activeExam.rejectionReason && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-900 rounded-xl">
                      <span className="font-mono text-[9px] font-bold block uppercase">Admin Rejection Feedback</span>
                      <p className="mt-1 font-medium">{activeExam.rejectionReason}</p>
                    </div>
                  )}

                  {/* Academic Context Map Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-3.5 rounded-xl border border-primary/5">
                    <div>
                      <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Subject Mapping</span>
                      <span className="block font-bold text-primary">{activeExam.subject?.name} ({activeExam.subject?.code})</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Department</span>
                      <span className="block font-bold">{activeExam.department?.name}</span>
                    </div>
                    <div className="pt-2 border-t border-primary/5">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Course / Sem</span>
                      <span className="block font-bold">{activeExam.course?.name} / Sem {activeExam.semester?.semesterNumber}</span>
                    </div>
                    <div className="pt-2 border-t border-primary/5">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Academic Year</span>
                      <span className="block font-bold text-secondary">AY {activeExam.academicYear}</span>
                    </div>
                    <div className="pt-2 border-t border-primary/5">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Staff Creator</span>
                      <span className="block font-bold">{activeExam.createdBy?.name || 'Faculty'}</span>
                    </div>
                    <div className="pt-2 border-t border-primary/5">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Exam Parameters</span>
                      <span className="block font-bold font-mono">
                        {activeExam.durationMinutes} Mins / {activeExam.totalMarks} Marks
                      </span>
                    </div>
                  </div>

                  {/* Scheduling values */}
                  {activeExam.startTime && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                      <span className="text-[9px] font-mono font-bold text-primary uppercase block">
                        Published Schedule Window
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Date</span>
                          <span className="block font-bold">{new Date(activeExam.date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Start Time</span>
                          <span className="block font-bold font-mono text-green-700">{new Date(activeExam.startTime).toLocaleTimeString()}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">End Time</span>
                          <span className="block font-bold font-mono text-red-700">{new Date(activeExam.endTime).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions Preview */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono font-bold text-primary uppercase block">
                      Assessments Questions List ({activeExam.questions?.length || 0} Questions)
                    </span>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activeExam.questions?.map((q, idx) => (
                        <div
                          key={q.question?._id || idx}
                          className="p-3 bg-surface-container-low border border-primary/5 rounded-xl text-[11px]"
                        >
                          <div className="flex justify-between font-bold text-on-surface mb-1">
                            <span>Q{idx + 1}. {q.question?.Question || q.question?.text}</span>
                            <span className="font-mono text-[9px] text-primary shrink-0 ml-3">
                              [{q.marks || q.question?.marks || 1} Marks]
                            </span>
                          </div>
                          
                          {/* MCQ Options Mocks */}
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const optionVal = q.question?.[`Option${opt}`] || q.question?.options?.find(o => o.optionLetter === opt)?.optionText;
                            const isCorrect = q.question?.CorrectAnswer === opt;
                            if (!optionVal) return null;
                            return (
                              <p
                                key={opt}
                                className={`text-[10px] pl-4 mt-0.5 ${
                                  isCorrect ? 'text-green-700 font-bold' : 'text-on-surface-variant/75'
                                }`}
                              >
                                {opt}. {optionVal}
                              </p>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="pt-6 border-t border-primary/5 mt-8 flex gap-3 bg-surface sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-primary/10 hover:bg-primary/5 font-bold text-xs transition-all text-center"
                >
                  Close Preview
                </button>

                {activeExam.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => handleApprove(activeExam._id)}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-all text-center shadow-sm"
                    >
                      Approve Exam
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(activeExam)}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all text-center shadow-sm"
                    >
                      Reject Exam
                    </button>
                  </>
                )}

                {activeExam.status === 'Approved' && (
                  <button
                    onClick={() => handleOpenPublishModal(activeExam)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary hover:opacity-95 text-white font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">event</span>
                    Schedule & Publish
                  </button>
                )}

                {activeExam.status === 'Upcoming' && (
                  <button
                    onClick={() => handleUnpublish(activeExam._id)}
                    className="flex-1 py-2.5 rounded-xl border border-red-500/20 text-error hover:bg-error/10 font-bold text-xs transition-all text-center"
                  >
                    Unpublish Exam
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExams;
