import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle, Clock, BookOpen, User, Layers, Search, Filter, X,
  Wifi, Camera, Mic, Maximize2, AlertCircle, ChevronRight
} from 'lucide-react';
import api from '../services/api';

/* ── Live countdown (remaining time to exam end) ─────────────────── */
const useRemainingTime = (endTime) => {
  const calc = () => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, pct: 0, expired: true };
    return {
      hours:   Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const iv = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(iv);
  }, [endTime]);
  return t;
};

/* ── Live Exam Card ──────────────────────────────────────────────── */
const LiveExamCard = ({ exam, onStart }) => {
  const rt = useRemainingTime(exam.endTime);
  const faculty = exam.faculty?.name || exam.createdBy?.name || '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.06)] hover:shadow-[0_8px_36px_rgba(122,0,31,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Live banner */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 bg-gradient-to-r from-[#7A001F] to-[#9D174D]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[11px] font-bold text-white uppercase tracking-widest">Live Now</span>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-white/20 text-white">
          {exam.type || 'Exam'}
        </span>
      </div>

      {/* Exam info */}
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-[14px] font-bold text-[#1D1D1F] leading-snug">{exam.title}</h3>
        <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">
          {exam.description || 'This exam is currently active. Start now.'}
        </p>
      </div>

      {/* Countdown */}
      <div className="mx-5 my-3 rounded-[14px] bg-[rgba(122,0,31,0.04)] border border-[rgba(122,0,31,0.08)] p-4">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">Time Remaining</p>
        {rt.expired ? (
          <p className="text-[12px] font-bold text-red-600">Exam window closed</p>
        ) : (
          <div className="flex items-center gap-3">
            {[
              { label: 'Hours', val: rt.hours },
              { label: 'Min',   val: rt.minutes },
              { label: 'Sec',   val: rt.seconds },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col items-center min-w-[40px]">
                <span
                  className="text-[22px] font-bold tabular-nums text-[#7A001F]"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {String(val).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-[#9CA3AF] font-medium">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-5 py-2 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <BookOpen size={11} className="text-[#9CA3AF] shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Subject</p>
            <p className="font-semibold text-[#1D1D1F] truncate">{exam.subject?.name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={11} className="text-[#9CA3AF] shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Faculty</p>
            <p className="font-semibold text-[#1D1D1F] truncate">{faculty}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-[#9CA3AF] shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Duration</p>
            <p className="font-semibold text-[#1D1D1F]">{exam.durationMinutes} min</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers size={11} className="text-[#9CA3AF] shrink-0" />
          <div>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Total Marks</p>
            <p className="font-semibold text-[#1D1D1F]">{exam.totalMarks}</p>
          </div>
        </div>
      </div>

      {/* Proctor status bar */}
      <div className="mx-5 mb-3 mt-2 flex items-center gap-3 px-3 py-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
        <span className="text-[9px] font-semibold text-[#166534] uppercase tracking-wider">Proctor Status</span>
        <div className="flex items-center gap-2 ml-auto">
          {[
            { Icon: Wifi,      label: 'Connection' },
            { Icon: Camera,    label: 'Camera' },
            { Icon: Mic,       label: 'Mic' },
            { Icon: Maximize2, label: 'Fullscreen' },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-1" title={label}>
              <Icon size={11} className="text-[#16A34A]" />
            </div>
          ))}
          <span className="text-[9px] font-bold text-[#16A34A]">Ready</span>
        </div>
      </div>

      {/* Instructions */}
      {exam.instructions && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-xl bg-[rgba(122,0,31,0.04)] border border-[rgba(122,0,31,0.08)]">
          <div className="flex gap-2">
            <AlertCircle size={11} className="text-[#7A001F] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[#6B7280] line-clamp-2">{exam.instructions}</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-5 pb-5 mt-auto">
        <button
          onClick={() => onStart(exam._id)}
          disabled={rt.expired}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] text-[13px] font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(122,0,31,0.3)]"
          style={{ background: rt.expired ? '#9CA3AF' : 'linear-gradient(135deg,#7A001F,#9D174D)' }}
        >
          <PlayCircle size={16} />
          {rt.expired ? 'Window Closed' : 'Start Exam Now'}
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────── */
const StudentLive = () => {
  const navigate = useNavigate();
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
        const live = (res.data.data || []).filter(
          (e) => now >= new Date(e.startTime) && now <= new Date(e.endTime)
        );
        const seen = new Set();
        const subs = [];
        live.forEach((e) => {
          if (e.subject && !seen.has(e.subject._id)) { seen.add(e.subject._id); subs.push(e.subject); }
        });
        setSubjectsList(subs);
        setAllExams(live);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  // Auto-refresh every 30 s to pick up newly-started exams
  useEffect(() => {
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, []);

  const filtered = allExams.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !subjectFilter || e.subject?._id === subjectFilter;
    return matchSearch && matchSubject;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[#1D1D1F]">Live Examinations</h1>
              {filtered.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Live</span>
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#6B7280]">
              Exams currently open for attempt — complete before the window closes.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-green-700">{filtered.length} Active</span>
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
              placeholder="Search exams…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none focus:border-[rgba(122,0,31,0.25)] text-[#1D1D1F] transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none text-[#1D1D1F] min-w-[160px] transition-all appearance-none"
            >
              <option value="">All Subjects</option>
              {subjectsList.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          {(search || subjectFilter) && (
            <button onClick={() => { setSearch(''); setSubjectFilter(''); setPage(1); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] hover:bg-[rgba(122,0,31,0.04)] transition-colors">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.07)] h-80 animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(122,0,31,0.06)] flex items-center justify-center mx-auto mb-4">
            <PlayCircle size={28} className="text-[#C4B5B8]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#1D1D1F]">No Live Exams Right Now</h3>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Check your upcoming exams for your next scheduled assessment.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map((exam) => (
            <LiveExamCard key={exam._id} exam={exam} onStart={(id) => navigate(`/student/exam-session/${id}`)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold text-[#6B7280] bg-white border border-[rgba(122,0,31,0.09)] hover:bg-[rgba(122,0,31,0.04)] disabled:opacity-40 transition-colors">
            Previous
          </button>
          <span className="text-[12px] font-medium text-[#9CA3AF]">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold text-[#6B7280] bg-white border border-[rgba(122,0,31,0.09)] hover:bg-[rgba(122,0,31,0.04)] disabled:opacity-40 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentLive;
