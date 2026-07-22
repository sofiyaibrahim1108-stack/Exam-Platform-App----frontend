import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentCompleted = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);

  // Result Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const fetchCompletedExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams/student');
      if (response.data && response.data.success) {
        const now = new Date();
        // Filter completed exams client-side based on times
        const completedList = (response.data.data || []).filter((exam) => {
          return now > new Date(exam.endTime);
        });

        // Filter by subject
        let filtered = completedList;
        if (subjectFilter) {
          filtered = filtered.filter((exam) => exam.subject?._id === subjectFilter);
        }

        // Filter by search
        if (search) {
          filtered = filtered.filter((exam) =>
            exam.title.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Extrapolate subjects for filtering dropdown list
        const uniqueSubjects = [];
        const seen = new Set();
        (response.data.data || []).forEach((e) => {
          if (e.subject && !seen.has(e.subject._id)) {
            seen.add(e.subject._id);
            uniqueSubjects.push(e.subject);
          }
        });
        setSubjectsList(uniqueSubjects);

        // Paginate list manually
        setTotalPages(Math.ceil(filtered.length / limit) || 1);
        const startIndex = (page - 1) * limit;
        const paginatedList = filtered.slice(startIndex, startIndex + limit);
        setExams(paginatedList);
      }
    } catch (error) {
      console.error('Failed to load completed exams.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedExams();
  }, [subjectFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCompletedExams();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubjectFilter('');
    setPage(1);
    setTimeout(() => fetchCompletedExams(), 50);
  };

  // Fetch Result Details for the Selected Exam
  const handleViewResult = async (examId) => {
    setLoadingResult(true);
    setModalOpen(true);
    try {
      const response = await api.get('/results', { params: { exam: examId } });
      if (response.data && response.data.success) {
        const resList = response.data.data.results || [];
        if (resList.length > 0) {
          // Fetch full nested detail by ID
          const detailsResponse = await api.get(`/results/${resList[0]._id}`);
          if (detailsResponse.data && detailsResponse.data.success) {
            setActiveResult(detailsResponse.data.data);
          }
        } else {
          setActiveResult(null);
        }
      }
    } catch (error) {
      toast.error('Failed to load scorecard detail.');
      setModalOpen(false);
    } finally {
      setLoadingResult(false);
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary mb-1">Completed Assessments</h2>
        <p className="text-on-surface-variant text-xs font-semibold">
          Review your examination history and check published scorecard grades.
        </p>
      </div>

      {/* Filters Board */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search Exams</label>
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none font-semibold text-xs animate-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Filter Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none font-semibold text-xs"
            >
              <option value="">-- All Enrolled Subjects --</option>
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
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm font-bold">search</span>
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

      {/* Main Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-surface-container-high rounded-[24px] animate-pulse"></div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-16 text-center border-2 border-dashed border-primary/10 rounded-[28px] bg-primary/5 max-w-lg mx-auto"
        >
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
            history
          </span>
          <h4 className="text-base font-bold text-on-surface">No Completed History</h4>
          <p className="text-on-surface-variant text-xs mt-1">
            You do not have any past completed examinations.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => (
            <motion.div
              key={exam._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 bg-primary/10 border border-primary/15 rounded-md text-[9px] font-mono font-bold text-primary uppercase">
                    {exam.type}
                  </span>
                  <span className="px-2.5 py-0.5 bg-gray-500/10 text-gray-700 border border-gray-500/15 rounded-full text-[9px] font-bold">
                    Completed
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-primary leading-snug">{exam.title}</h3>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Subject: <span className="text-on-surface font-semibold">{exam.subject?.name} ({exam.subject?.code})</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-on-surface-variant border-t border-primary/5 pt-3.5 bg-surface-container-lowest/30 p-3 rounded-xl font-mono">
                  <div>
                    <span className="text-[8px] text-on-surface-variant/50 uppercase block">Exam Date</span>
                    <span className="block font-bold text-on-surface">
                      {new Date(exam.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-on-surface-variant/50 uppercase block">Closing Window</span>
                    <span className="block font-bold text-on-surface">
                      {new Date(exam.endTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Result Action Button */}
              <div className="pt-4 mt-6 border-t border-primary/5">
                <button
                  onClick={() => handleViewResult(exam._id)}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">assessment</span>
                  View Scorecard
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 text-xs font-bold pt-4">
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

      {/* SCORECARD DRAWER/MODAL DETAIL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white max-w-lg w-full rounded-[28px] border border-primary/10 shadow-2xl p-6 space-y-6 overflow-hidden z-50"
            >
              {loadingResult ? (
                <div className="p-12 text-center space-y-4 animate-pulse">
                  <div className="w-12 h-12 bg-surface-container-high rounded-full mx-auto"></div>
                  <div className="h-6 bg-surface-container-high rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-surface-container-high rounded w-1/2 mx-auto"></div>
                </div>
              ) : !activeResult ? (
                <div className="text-center p-8 space-y-3">
                  <span className="material-symbols-outlined text-amber-500 text-5xl">warning</span>
                  <h3 className="text-lg font-bold text-on-surface">No scorecard records</h3>
                  <p className="text-xs text-on-surface-variant font-semibold">
                    The evaluation record for this exam attempt could not be retrieved.
                  </p>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="mt-4 px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                  >
                    Close Window
                  </button>
                </div>
              ) : !activeResult.published ? (
                // --- UNPUBLISHED VIEW (RESULT PENDING) ---
                <div className="text-center p-6 space-y-4">
                  <span className="material-symbols-outlined text-amber-500 text-5xl animate-bounce">
                    pending_actions
                  </span>
                  <h3 className="text-lg font-extrabold text-primary">Result Pending</h3>
                  <p className="text-xs text-on-surface-variant font-semibold leading-relaxed px-4">
                    The auto-evaluation is completed, but your scorecard has not been published by the administration yet. Marks are hidden until release.
                  </p>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-primary/5 space-y-2 text-xs font-semibold text-on-surface-variant">
                    <p className="font-bold text-on-surface">{activeResult.exam?.title}</p>
                    <p className="text-[10px] font-mono">
                      Subject: {activeResult.exam?.subject?.name} ({activeResult.exam?.subject?.code})
                    </p>
                    <p className="text-[10px] font-mono">
                      Submission Logged: {new Date(activeResult.attempt?.submissionTime || activeResult.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full mt-4 py-3 rounded-xl border border-outline-variant/60 text-on-surface hover:bg-surface-container-high/40 text-xs font-bold transition-all"
                  >
                    Close Workspace
                  </button>
                </div>
              ) : (
                // --- PUBLISHED VIEW (FULL DETAILED SCORECARD) ---
                <div className="space-y-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start border-b border-primary/5 pb-4">
                    <div>
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-700 border border-green-500/15 rounded text-[9px] font-mono font-bold uppercase">
                        Results Released
                      </span>
                      <h3 className="text-base font-extrabold text-primary mt-1.5">{activeResult.exam?.title}</h3>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        Subject: {activeResult.exam?.subject?.name} ({activeResult.exam?.subject?.code})
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        Student Name: <span className="font-bold text-on-surface">{activeResult.student?.name || 'N/A'}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1 rounded-full hover:bg-surface-container-high/60 transition-colors text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-primary/5 text-center shadow-sm">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase block font-mono">
                        Score Obtained
                      </span>
                      <span className="block font-bold text-sm text-primary font-mono mt-0.5">
                        {activeResult.marksObtained} / {activeResult.totalMarks}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-primary/5 text-center shadow-sm">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase block font-mono">
                        Percentage
                      </span>
                      <span className="block font-bold text-sm text-primary font-mono mt-0.5">
                        {activeResult.percentage}%
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-primary/5 text-center shadow-sm">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase block font-mono">
                        Letter Grade
                      </span>
                      <span className="block font-extrabold text-sm text-primary font-mono mt-0.5">
                        {activeResult.grade}
                      </span>
                    </div>
                  </div>

                  {/* Auto Evaluation Details Card */}
                  <div className="bg-surface-container-low border border-primary/5 rounded-2xl p-4 space-y-3 font-semibold text-xs text-on-surface-variant">
                    <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                      <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase">Evaluation Stats</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          activeResult.status === 'Pass'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {activeResult.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 bg-green-500/5 border border-green-500/10 rounded-xl">
                        <span className="block font-mono font-bold text-green-700">
                          {activeResult.statsSummary?.correct || 0} Correct
                        </span>
                      </div>
                      <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                        <span className="block font-mono font-bold text-red-600">
                          {activeResult.statsSummary?.wrong || 0} Wrong
                        </span>
                      </div>
                      <div className="p-2 bg-surface-container-high rounded-xl">
                        <span className="block font-mono font-bold text-on-surface-variant/80">
                          {activeResult.statsSummary?.unanswered || 0} Skipped
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Timings */}
                  <div className="text-[9px] font-mono text-on-surface-variant/50 text-right space-y-0.5 leading-none">
                    <p>Submission Time: {new Date(activeResult.attempt?.submissionTime || activeResult.createdAt).toLocaleString()}</p>
                    <p>Passing Mark Threshold: {activeResult.passingMarks} Marks</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentCompleted;
