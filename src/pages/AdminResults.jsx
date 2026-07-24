import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Award, CheckCircle, XCircle, Search, Calendar, ChevronLeft, ChevronRight, EyeOff, Send, HelpCircle, GraduationCap, X
} from 'lucide-react';
import api from '../services/api';

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtering States
  const [examsList, setExamsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [examFilter, setExamFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Statistics
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchDropdowns = async () => {
    try {
      // Fetch exams list
      const examsResponse = await api.get('/admin/exams', { params: { limit: 100 } });
      if (examsResponse.data && examsResponse.data.success) {
        setExamsList(examsResponse.data.data.results || []);
      }
      
      // Fetch subjects list
      const subjectsResponse = await api.get('/staff/question-bank/dropdowns');
      if (subjectsResponse.data && subjectsResponse.data.success) {
        setSubjectsList(subjectsResponse.data.data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to load dropdown listings:', error);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get('/results', {
        params: {
          page,
          limit,
          search: search || undefined,
          exam: examFilter || undefined,
          subject: subjectFilter || undefined,
          published: publishedFilter || undefined,
        },
      });

      if (response.data && response.data.success) {
        setResults(response.data.data.results || []);
        setTotalResults(response.data.data.pagination?.total || 0);
        setTotalPages(response.data.data.pagination?.totalPages || 1);

        // Fetch overall stats for summary cards
        const allRes = await api.get('/results', { params: { limit: 1000 } });
        if (allRes.data && allRes.data.success) {
          const list = allRes.data.data.results || [];
          setPublishedCount(list.filter((r) => r.published || r.resultStatus === 'Published').length);
          setVerifiedCount(list.filter((r) => !r.published && (r.resultStatus === 'Verified' || !r.resultStatus)).length);
          setDraftCount(list.filter((r) => !r.published && r.resultStatus !== 'Verified' && r.resultStatus && r.resultStatus !== 'Published').length);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch evaluation results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [page, examFilter, subjectFilter, publishedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const handleClearFilters = () => {
    setSearch('');
    setExamFilter('');
    setSubjectFilter('');
    setPublishedFilter('');
    setPage(1);
    setTimeout(() => fetchResults(), 50);
  };

  const handlePublishResults = async (examId) => {
    if (!window.confirm('Are you sure you want to publish results for this exam? This will notify the eligible candidates.')) return;
    const loadToast = toast.loading('Publishing exam results...');
    try {
      const response = await api.patch(`/results/exam/${examId}/publish`);
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Results published successfully!', { id: loadToast });
        fetchResults();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to publish results.', { id: loadToast });
    }
  };

  const handleUnpublishResults = async (examId) => {
    if (!window.confirm('Are you sure you want to unpublish results for this exam? Candidates will no longer see their marks.')) return;
    const loadToast = toast.loading('Unpublishing exam results...');
    try {
      const response = await api.patch(`/results/exam/${examId}/unpublish`);
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Results unpublished successfully!', { id: loadToast });
        fetchResults();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to unpublish results.', { id: loadToast });
    }
  };

  const handleBulkPublish = async () => {
    setBulkPublishing(true);
    setShowConfirmModal(false);
    const loadToast = toast.loading('Bulk publishing results...');
    try {
      const response = await api.post('/results/publish-all', {
        examId: examFilter || undefined,
        subjectId: subjectFilter || undefined,
        search: search || undefined,
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Results published successfully!', { id: loadToast });
        fetchResults();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to bulk publish results.', { id: loadToast });
    } finally {
      setBulkPublishing(false);
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner Header */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <Award size={12} />
              Performance Ledger
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Result Management Dashboard</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Access candidate scorecard details, auto-graded MCQ statistics, and control result publication states.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase text-xs">Total Scorecards Graded</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#FDF0F4] text-[#8B1E3F] flex items-center justify-center">
              <GraduationCap size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#8B1E3F] leading-none mt-1">{totalResults}</p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Graded candidate papers</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase text-xs">Published Results</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <CheckCircle size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#059669] leading-none mt-1">{publishedCount}</p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Visible to candidates</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase text-xs">Draft Results (Pending)</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#D97706] leading-none mt-1">{draftCount}</p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Releasable marks</p>
        </div>
      </div>

      {/* Filters Board */}
      <div className="card-flat p-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Search Student</span>
            <div className="search-bar">
              <Search size={14} className="text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Name or Roll Number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Filter Subject</span>
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
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

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Filter Exam</span>
            <select
              value={examFilter}
              onChange={(e) => { setExamFilter(e.target.value); setPage(1); }}
              className="select"
            >
              <option value="">All Exams</option>
              {examsList.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Status</span>
            <select
              value={publishedFilter}
              onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
              className="select"
            >
              <option value="">All Statuses</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
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
              onClick={handleClearFilters}
              className="btn-secondary py-2 px-3 text-[12.5px] rounded-[10px] flex items-center justify-center gap-1.5"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Publish Section */}
      <div className="card-flat p-4 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>Total Students :</span>
            <span className="font-bold font-mono text-[#8B1E3F]">{totalResults}</span>
          </div>
          <div className="w-px h-3 bg-gray-200 self-center hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span>Published :</span>
            <span className="font-bold font-mono text-green-600">{publishedCount}</span>
          </div>
          <div className="w-px h-3 bg-gray-200 self-center hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span>Verified :</span>
            <span className="font-bold font-mono text-[#8B1E3F]">{verifiedCount}</span>
          </div>
          <div className="w-px h-3 bg-gray-200 self-center hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span>Draft :</span>
            <span className="font-bold font-mono text-amber-600">{draftCount}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={bulkPublishing || verifiedCount === 0}
          className="btn-primary py-2 px-4 text-[12.5px] rounded-[10px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
        >
          {bulkPublishing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Publishing Results...</span>
            </>
          ) : (
            <>
              <Send size={13} />
              <span>Publish All Results</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-2xl border border-gray-100"
            >
              <h3 className="text-lg font-bold text-[#8B1E3F] mb-2">Publish Results</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Are you sure you want to publish results for all eligible students?
                <br /><br />
                This action will make the results visible to students.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#8B1E3F] hover:bg-gray-50 border border-[rgba(139,30,63,0.3)] rounded-lg transition-all"
                  disabled={bulkPublishing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkPublish}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#8B1E3F] hover:bg-[#A62E52] rounded-lg transition-all flex items-center gap-1.5"
                  disabled={bulkPublishing}
                >
                  {bulkPublishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Results Table List */}
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Award size={24} />
            </div>
            <h4 className="text-base font-bold text-[#111111]">No Results Available</h4>
            <p className="text-[#6B7280] text-xs mt-1">
              No auto-graded exam scorecards match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate Details</th>
                  <th>Exam Paper</th>
                  <th className="text-center">Marks Obtained</th>
                  <th className="text-center">Percentage</th>
                  <th className="text-center">Pass/Fail</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((resDoc) => (
                  <tr key={resDoc._id}>
                    <td>
                      <p className="font-bold text-[#8B1E3F]">{resDoc.student?.name || 'Anonymous Student'}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                        Roll: {resDoc.student?.masterId?.rollNumber || 'N/A'}
                      </p>
                    </td>
                    <td>
                      <p className="font-bold text-[#111111]">{resDoc.exam?.title}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">
                        Subject: {resDoc.exam?.subject?.name} ({resDoc.exam?.subject?.code})
                      </p>
                    </td>
                    <td className="text-center font-mono font-bold text-[#111111]">
                      {resDoc.marksObtained} / {resDoc.totalMarks}
                    </td>
                    <td className="text-center font-mono font-bold text-[#111111]">
                      {resDoc.percentage}%
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          resDoc.status === 'Pass'
                            ? 'badge-green'
                            : 'badge-red'
                        }`}
                      >
                        {resDoc.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          resDoc.published
                            ? 'badge-green font-bold'
                            : 'badge-gray'
                        }`}
                      >
                        {resDoc.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {resDoc.published ? (
                          <button
                            onClick={() => handleUnpublishResults(resDoc.exam?._id)}
                            className="py-1 px-2.5 text-[11.5px] rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 font-bold transition-all flex items-center gap-1"
                          >
                            <EyeOff size={12} />
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishResults(resDoc.exam?._id)}
                            className="py-1 px-2.5 text-[11.5px] rounded-[8px] bg-[#8B1E3F] text-white hover:bg-[#A62E52] font-bold transition-all flex items-center gap-1"
                          >
                            <Send size={12} />
                            Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-primary/5 text-xs text-[#6B7280]">
          <span className="font-mono text-xs">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalResults)} of {totalResults} scorecards
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
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResults;
