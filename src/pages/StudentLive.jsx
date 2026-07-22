import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const StudentLive = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);

  const fetchLiveExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams/student');
      if (response.data && response.data.success) {
        const now = new Date();
        // Filter live exams client-side based on times
        const liveList = (response.data.data || []).filter((exam) => {
          const start = new Date(exam.startTime);
          const end = new Date(exam.endTime);
          return now >= start && now <= end;
        });

        // Filter by subject
        let filtered = liveList;
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
      console.error('Failed to load live exams.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveExams();
  }, [subjectFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLiveExams();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubjectFilter('');
    setPage(1);
    setTimeout(() => fetchLiveExams(), 50);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary mb-1">Live Active Examinations</h2>
        <p className="text-on-surface-variant text-xs font-semibold">
          Assessments available for immediate attempt. Complete them before the specified End Time limits.
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
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none font-semibold text-xs"
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
            <div key={i} className="h-48 bg-surface-container-high rounded-[24px] animate-pulse"></div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-16 text-center border-2 border-dashed border-primary/10 rounded-[28px] bg-primary/5 max-w-lg mx-auto"
        >
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
            play_disabled
          </span>
          <h4 className="text-base font-bold text-on-surface">No Active Exams</h4>
          <p className="text-on-surface-variant text-xs mt-1">
            There are no live exams currently open for attempt. Check Upcoming Exams for schedule.
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
                  <span className="px-2 py-0.5 bg-primary/10 border border-primary/15 rounded-md text-[9px] font-mono font-bold text-primary uppercase animate-pulse">
                    {exam.type}
                  </span>
                  <span className="px-2.5 py-0.5 bg-green-500/15 text-green-800 border border-green-500/35 rounded-full text-[9px] font-bold animate-pulse">
                    Live Now
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-primary leading-snug">{exam.title}</h3>
                  <p className="text-[10px] text-on-surface-variant mt-1 line-clamp-2">
                    {exam.description || 'No description provided.'}
                  </p>
                </div>

                {/* Exam Parameters details grid */}
                <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-on-surface-variant border-t border-primary/5 pt-3.5 bg-surface-container-lowest/30 p-3 rounded-xl">
                  <div>
                    <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Subject</span>
                    <span className="block font-bold text-primary truncate">
                      {exam.subject?.name} ({exam.subject?.code})
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Duration & Marks</span>
                    <span className="block font-bold">
                      {exam.durationMinutes} Mins / {exam.totalMarks} Marks
                    </span>
                  </div>
                  <div className="pt-2 border-t border-primary/5">
                    <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Dept & Course</span>
                    <span className="block truncate">
                      {exam.department?.code} / {exam.course?.code}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-primary/5">
                    <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Sem & Year</span>
                    <span className="block font-mono">
                      Sem {exam.semester?.semesterNumber} / AY {exam.academicYear}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-primary/5 col-span-2">
                    <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Closing Window</span>
                    <span className="block font-mono font-bold text-red-700">
                      Ends at {new Date(exam.endTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4 mt-6 border-t border-primary/5">
                <button
                  onClick={() => navigate(`/student/exam-session/${exam._id}`)}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-bold">play_arrow</span>
                  Start Exam
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
    </div>
  );
};

export default StudentLive;
