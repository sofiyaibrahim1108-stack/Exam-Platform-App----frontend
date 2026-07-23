import React, { useState, useEffect } from 'react';
import { Search, X, Award, UserCheck, Calendar, Filter, FileText, ChevronLeft, ChevronRight, UserMinus } from 'lucide-react';
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
    <div className="space-y-6 text-sm font-sans text-[#1D1D1F] pb-10">
      {/* Top Banner Header */}
      <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="text-xl font-extrabold text-[#1D1D1F] mb-1">Assigned Exam Results</h2>
        <p className="text-[#6B7280] text-xs font-semibold">
          Review score sheets and performance logs for evaluation assessments you designed.
        </p>
      </div>

      {/* Filters Board */}
      <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-xs font-bold text-[#6B7280]">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Search Student</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-250/80 rounded-xl focus:outline-none focus:border-[#8C1D40]/30 text-xs font-bold text-[#1D1D1F]"
              />
              <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Select Created Exam</span>
            <select
              value={examFilter}
              onChange={(e) => { setExamFilter(e.target.value); setPage(1); }}
              className="p-2.5 bg-white border border-gray-250/80 rounded-xl focus:outline-none text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30"
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
              className="flex-1 py-2.5 rounded-xl bg-[#8C1D40] text-white font-bold hover:opacity-95 text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
            >
              <Search size={13} />
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2.5 px-4 rounded-xl border border-gray-250/80 text-[#6B7280] hover:bg-gray-50 text-xs font-bold transition-all active:scale-95"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Staff Results Table */}
      <div className="bg-white rounded-[24px] border border-[rgba(140,29,64,0.08)] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-full border border-gray-100"></div>
            <div className="h-8 bg-gray-100 rounded w-full border border-gray-100"></div>
            <div className="h-8 bg-gray-100 rounded w-full border border-gray-100"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center border-t border-gray-100">
            <UserMinus size={48} className="text-gray-300 mx-auto mb-4" />
            <h4 className="text-sm font-bold text-[#1D1D1F]">No Student Results Found</h4>
            <p className="text-[#6B7280] text-xs mt-1 leading-relaxed max-w-xs mx-auto">
              Either students have not submitted yet, or no score sheets match your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-gray-50 text-[#6B7280] border-b border-gray-100 font-mono text-[9px] font-bold uppercase tracking-wider">
                  <th className="p-4">Student Candidate</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Exam Paper</th>
                  <th className="p-4 text-center">Marks Obtained</th>
                  <th className="p-4 text-center">Percentage</th>
                  <th className="p-4 text-center">Outcome</th>
                  <th className="p-4 text-center">Submission Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150/40">
                {results.map((resDoc) => (
                  <tr key={resDoc._id} className="hover:bg-[#F8ECEF]/10 transition-colors">
                    <td className="p-4">
                      <span className="font-extrabold text-[#1D1D1F] text-xs">{resDoc.student?.name || 'Anonymous Student'}</span>
                      <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">{resDoc.student?.email}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-[#8C1D40]">
                      {resDoc.student?.masterId?.rollNumber || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-[#1D1D1F]">{resDoc.exam?.title}</span>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">
                        Subject: {resDoc.exam?.subject?.name} ({resDoc.exam?.subject?.code})
                      </p>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-[#8C1D40]">
                      {resDoc.marksObtained} / {resDoc.totalMarks}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-[#1D1D1F]">
                      {resDoc.percentage}%
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block border ${
                          resDoc.status === 'Pass'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500/20'
                            : 'bg-red-50 text-red-700 border-red-500/20'
                        }`}
                      >
                        {resDoc.status}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono text-[#6B7280] text-[10px]">
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
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-[#6B7280] disabled:opacity-40 transition-colors flex items-center gap-1 active:scale-95"
          >
            <ChevronLeft size={13} />
            Previous
          </button>
          <span className="text-[#6B7280] font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-[#6B7280] disabled:opacity-40 transition-colors flex items-center gap-1 active:scale-95"
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffResults;
