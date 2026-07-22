import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const StaffResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtering States
  const [examsList, setExamsList] = useState([]);
  const [examFilter, setExamFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const fetchStaffExams = async () => {
    try {
      // Fetch exams created by this staff member
      const response = await api.get('/exams/student'); // Student endpoint fetches published/completed exams, wait!
      // To fetch all exams created by this Staff member, we can query `/exams` (which redirects to getMyExams for Staff!).
      // Let's check backend/src/routes/examRoutes.js:
      // router.get('/', examController.getMyExams);
      // Yes! GET /exams fetches the logged-in staff's exams! Let's query that!
      const examsResponse = await api.get('/exams', { params: { limit: 100 } });
      if (examsResponse.data && examsResponse.data.success) {
        setExamsList(examsResponse.data.data.results || []);
      }
    } catch (error) {
      console.error('Failed to load staff exams list:', error);
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
        },
      });

      if (response.data && response.data.success) {
        setResults(response.data.data.results || []);
        setTotalResults(response.data.data.pagination?.total || 0);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch candidate results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffExams();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [page, examFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const handleClearFilters = () => {
    setSearch('');
    setExamFilter('');
    setPage(1);
    setTimeout(() => fetchResults(), 50);
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white">
        <h2 className="text-2xl font-bold text-primary mb-1">Assigned Exam Results</h2>
        <p className="text-on-surface-variant text-xs font-semibold">
          Review score sheets and performance logs for evaluation assessments you designed.
        </p>
      </div>

      {/* Filters Board */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 space-y-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search Student</label>
            <input
              type="text"
              placeholder="Search name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Select Created Exam</label>
            <select
              value={examFilter}
              onChange={(e) => { setExamFilter(e.target.value); setPage(1); }}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold text-primary"
            >
              <option value="">-- All My Designed Exams --</option>
              {examsList.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2.5 px-4 rounded-xl border border-primary/10 text-on-surface-variant hover:bg-primary/5 text-xs font-bold transition-all"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Staff Results Table */}
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
              person_search
            </span>
            <h4 className="text-base font-bold text-on-surface">No Student Results Found</h4>
            <p className="text-on-surface-variant text-xs mt-1">
              Either students have not submitted yet, or no score sheets match your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Student Candidate</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Exam Paper</th>
                  <th className="p-4 text-center">Marks Obtained</th>
                  <th className="p-4 text-center">Percentage</th>
                  <th className="p-4 text-center">Outcome</th>
                  <th className="p-4 text-center">Submission Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {results.map((resDoc) => (
                  <tr key={resDoc._id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-on-surface">{resDoc.student?.name || 'Anonymous Student'}</span>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{resDoc.student?.email}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-primary">
                      {resDoc.student?.masterId?.rollNumber || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className="font-bold">{resDoc.exam?.title}</span>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        Subject: {resDoc.exam?.subject?.name} ({resDoc.exam?.subject?.code})
                      </p>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-primary">
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
                    <td className="p-4 text-center font-mono text-on-surface-variant text-[10px]">
                      {resDoc.attempt?.submissionTime
                        ? new Date(resDoc.attempt.submissionTime).toLocaleString()
                        : new Date(resDoc.createdAt).toLocaleString()}
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

export default StaffResults;
