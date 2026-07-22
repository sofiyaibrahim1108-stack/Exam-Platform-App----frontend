import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
          setPublishedCount(list.filter((r) => r.published).length);
          setDraftCount(list.filter((r) => !r.published).length);
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

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary mb-1">Result Management Dashboard</h2>
        <p className="text-on-surface-variant text-xs font-semibold">
          Access candidate scorecard details, auto-graded MCQ statistics, and control result publication states.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-[20px] bg-white border border-primary/5 shadow-sm">
          <span className="text-[10px] text-on-surface-variant/60 uppercase font-mono block">Total Scorecards Graded</span>
          <span className="block font-extrabold text-2xl text-primary font-mono mt-1">
            {totalResults} Candidates
          </span>
        </div>
        <div className="glass-card p-5 rounded-[20px] bg-white border border-primary/5 shadow-sm">
          <span className="text-[10px] text-on-surface-variant/60 uppercase font-mono block">Published Results</span>
          <span className="block font-extrabold text-2xl text-green-700 font-mono mt-1">
            {publishedCount} Exams
          </span>
        </div>
        <div className="glass-card p-5 rounded-[20px] bg-white border border-primary/5 shadow-sm">
          <span className="text-[10px] text-on-surface-variant/60 uppercase font-mono block">Draft Results (Pending)</span>
          <span className="block font-extrabold text-2xl text-amber-600 font-mono mt-1">
            {draftCount} Exams
          </span>
        </div>
      </div>

      {/* Filters Board */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 space-y-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search Student</label>
            <input
              type="text"
              placeholder="Name or Roll Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Filter Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Subjects --</option>
              {subjectsList.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Filter Exam</label>
            <select
              value={examFilter}
              onChange={(e) => { setExamFilter(e.target.value); setPage(1); }}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Exams --</option>
              {examsList.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Status</label>
              <select
                value={publishedFilter}
                onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
                className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
              >
                <option value="">-- All --</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2.5 px-4 rounded-xl border border-primary/10 text-on-surface-variant hover:bg-primary/5 text-xs font-bold transition-all shrink-0 h-[38px] self-end"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Results Table List */}
      <div className="glass-panel rounded-[24px] border border-primary/5 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-8 bg-surface-container-high rounded w-full"></div>
            <div className="h-8 bg-surface-container-high rounded w-full"></div>
            <div className="h-8 bg-surface-container-high rounded w-full"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center border-t border-primary/5">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
              history_edu
            </span>
            <h4 className="text-base font-bold text-on-surface">No Results Available</h4>
            <p className="text-on-surface-variant text-xs mt-1">
              No auto-graded exam scorecards match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Candidate Details</th>
                  <th className="p-4">Exam Paper</th>
                  <th className="p-4 text-center">Marks Obtained</th>
                  <th className="p-4 text-center">Percentage</th>
                  <th className="p-4 text-center">Pass/Fail</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {results.map((resDoc) => (
                  <tr key={resDoc._id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-primary">{resDoc.student?.name || 'Anonymous Student'}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        Roll: {resDoc.student?.masterId?.rollNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold">{resDoc.exam?.title}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        Subject: {resDoc.exam?.subject?.name} ({resDoc.exam?.subject?.code})
                      </p>
                    </td>
                    <td className="p-4 text-center font-mono font-bold">
                      {resDoc.marksObtained} / {resDoc.totalMarks}
                    </td>
                    <td className="p-4 text-center font-mono font-bold">
                      {resDoc.percentage}%
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          resDoc.status === 'Pass'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {resDoc.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          resDoc.published
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-amber-500 text-white shadow-sm'
                        }`}
                      >
                        {resDoc.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {resDoc.published ? (
                          <button
                            onClick={() => handleUnpublishResults(resDoc.exam?._id)}
                            className="py-1.5 px-3 rounded-lg border border-amber-600/30 text-amber-700 bg-amber-50 hover:bg-amber-100/50 text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">visibility_off</span>
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishResults(resDoc.exam?._id)}
                            className="py-1.5 px-3 rounded-lg bg-primary text-white hover:bg-primary/95 text-[10px] font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">publish</span>
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
        <div className="flex justify-center items-center gap-4 text-xs font-bold pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-on-surface-variant font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminResults;
