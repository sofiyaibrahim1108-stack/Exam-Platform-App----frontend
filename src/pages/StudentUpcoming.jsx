import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, User, BookOpen, Lock, ChevronRight,
  Search, Filter, X, Layers, AlertCircle
} from 'lucide-react';
import api from '../services/api';

/* ── Countdown hook (live, per-exam) ─────────────────────────────── */
const useCountdown = (targetDate) => {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const iv = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return time;
};

/* ── Single Exam Card ─────────────────────────────────────────────── */
const ExamCard = ({ exam }) => {
  const cd = useCountdown(exam.startTime);
  const faculty = exam.faculty?.name || exam.createdBy?.name || '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.06)] hover:shadow-[0_8px_32px_rgba(122,0,31,0.10)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Card Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[rgba(122,0,31,0.07)] flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[rgba(122,0,31,0.08)] text-[#7A001F]">
              {exam.type || 'Exam'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              Upcoming
            </span>
          </div>
          <h3 className="text-[14px] font-bold text-[#1D1D1F] leading-snug truncate">{exam.title}</h3>
          <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">
            {exam.description || 'Assessment scheduled for this subject.'}
          </p>
        </div>
        <Lock size={16} className="text-[#D1D5DB] shrink-0 mt-1" />
      </div>

      {/* Countdown */}
      <div className="px-5 py-4 bg-[rgba(122,0,31,0.03)]">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">Starts In</p>
        {cd.done ? (
          <p className="text-[11px] font-bold text-[#7A001F]">Starting soon…</p>
        ) : (
          <div className="flex items-center gap-2">
            {[
              { label: 'D', val: cd.days },
              { label: 'H', val: cd.hours },
              { label: 'M', val: cd.minutes },
              { label: 'S', val: cd.seconds },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[15px] font-bold text-[#7A001F] tabular-nums w-8 text-center">
                  {String(val).padStart(2, '0')}
                </span>
                <span className="text-[8px] text-[#9CA3AF] font-medium">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
        <div className="flex items-start gap-1.5">
          <BookOpen size={12} className="text-[#9CA3AF] mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold tracking-wider">Subject</p>
            <p className="font-semibold text-[#1D1D1F] truncate">{exam.subject?.name || '—'}</p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <User size={12} className="text-[#9CA3AF] mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold tracking-wider">Faculty</p>
            <p className="font-semibold text-[#1D1D1F] truncate">{faculty}</p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Calendar size={12} className="text-[#9CA3AF] mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold tracking-wider">Date</p>
            <p className="font-semibold text-[#1D1D1F]">
              {new Date(exam.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Clock size={12} className="text-[#9CA3AF] mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold tracking-wider">Time</p>
            <p className="font-semibold text-[#1D1D1F]">
              {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Clock size={12} className="text-[#9CA3AF] mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold tracking-wider">Duration</p>
            <p className="font-semibold text-[#1D1D1F]">{exam.durationMinutes} min</p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Layers size={12} className="text-[#9CA3AF] mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold tracking-wider">Marks</p>
            <p className="font-semibold text-[#1D1D1F]">{exam.totalMarks}</p>
          </div>
        </div>
      </div>

      {/* Instructions pill */}
      {exam.instructions && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-xl bg-[rgba(122,0,31,0.04)] border border-[rgba(122,0,31,0.08)]">
          <div className="flex items-start gap-2">
            <AlertCircle size={11} className="text-[#7A001F] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[#6B7280] line-clamp-2">{exam.instructions}</p>
          </div>
        </div>
      )}

      {/* Footer locked button */}
      <div className="px-5 pb-5 mt-auto">
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[12px] font-semibold text-[#9CA3AF] bg-[#F9FAFB] border border-[rgba(122,0,31,0.07)] cursor-not-allowed"
        >
          <Lock size={13} />
          Locked — Not Started Yet
        </button>
      </div>
    </motion.div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────── */
const StudentUpcoming = () => {
  const [exams, setExams] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);
  const [page, setPage] = useState(1);
  const LIMIT = 6;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams/student');
      if (res.data?.success) {
        const now = new Date();
        const upcoming = (res.data.data || []).filter((e) => now < new Date(e.startTime));

        // Subjects for filter
        const seen = new Set();
        const subs = [];
        upcoming.forEach((e) => {
          if (e.subject && !seen.has(e.subject._id)) { seen.add(e.subject._id); subs.push(e.subject); }
        });
        setSubjectsList(subs);
        setAllExams(upcoming);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  // Filter & paginate in memory
  const filtered = allExams.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !subjectFilter || e.subject?._id === subjectFilter;
    return matchSearch && matchSubject;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const SkeletonCard = () => (
    <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.07)] shadow-sm h-72 animate-pulse" />
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1D1D1F]">Upcoming Examinations</h1>
            <p className="text-[12px] text-[#6B7280] mt-1">
              Your scheduled assessments — they unlock automatically at start time.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-semibold text-blue-700">{filtered.length} Upcoming</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by exam title…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none focus:border-[rgba(122,0,31,0.25)] focus:ring-2 focus:ring-[rgba(122,0,31,0.08)] text-[#1D1D1F] transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none focus:border-[rgba(122,0,31,0.25)] text-[#1D1D1F] min-w-[160px] transition-all appearance-none"
            >
              <option value="">All Subjects</option>
              {subjectsList.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          {(search || subjectFilter) && (
            <button
              onClick={() => { setSearch(''); setSubjectFilter(''); setPage(1); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] hover:bg-[rgba(122,0,31,0.04)] transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : paginated.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-20 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-[rgba(122,0,31,0.06)] flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-[#C4B5B8]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#1D1D1F]">No Upcoming Exams</h3>
          <p className="text-[12px] text-[#9CA3AF] mt-1">No scheduled assessments match your current filters.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map((exam) => <ExamCard key={exam._id} exam={exam} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold text-[#6B7280] bg-white border border-[rgba(122,0,31,0.09)] hover:bg-[rgba(122,0,31,0.04)] disabled:opacity-40 transition-colors"
          >Previous</button>
          <span className="text-[12px] font-medium text-[#9CA3AF]">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold text-[#6B7280] bg-white border border-[rgba(122,0,31,0.09)] hover:bg-[rgba(122,0,31,0.04)] disabled:opacity-40 transition-colors"
          >Next</button>
        </div>
      )}
    </div>
  );
};

export default StudentUpcoming;
