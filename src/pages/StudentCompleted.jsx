import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Clock, BookOpen, Award, TrendingUp, X, Search, Filter,
  Trophy, Star, ChevronRight, FileText, BarChart3, AlertTriangle, GraduationCap
} from 'lucide-react';
import api from '../services/api';

/* ── Grade badge ─────────────────────────────────────────────────── */
const gradeBadge = (grade, status) => {
  const map = {
    'A+': 'bg-violet-50 text-violet-700 border-violet-200',
    'A':  'bg-green-50 text-green-700 border-green-200',
    'B+': 'bg-blue-50 text-blue-700 border-blue-200',
    'B':  'bg-cyan-50 text-cyan-700 border-cyan-200',
    'C':  'bg-yellow-50 text-yellow-700 border-yellow-200',
    'D':  'bg-orange-50 text-orange-700 border-orange-200',
    'F':  'bg-red-50 text-red-700 border-red-200',
  };
  return map[grade] || (status === 'Pass' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200');
};

const performanceBadge = (pct) => {
  if (pct >= 90) return { label: '🏆 Distinction', cls: 'bg-violet-50 text-violet-700 border-violet-200' };
  if (pct >= 75) return { label: '⭐ Merit',      cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (pct >= 60) return { label: '✅ Pass',        cls: 'bg-green-50 text-green-700 border-green-200' };
  return                { label: '⚠️ Below Pass',  cls: 'bg-red-50 text-red-700 border-red-200' };
};

/* ── Result Detail Modal ─────────────────────────────────────────── */
const ResultModal = ({ result, onClose }) => {
  const navigate = useNavigate();
  const pb = result.percentage != null ? performanceBadge(result.percentage) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative bg-white max-w-md w-full rounded-[24px] border border-[rgba(122,0,31,0.10)] shadow-[0_24px_60px_rgba(122,0,31,0.15)] overflow-hidden z-50"
      >
        {!result.published ? (
          /* Unpublished */
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
              <Clock size={22} className="text-amber-500" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1D1D1F]">Result Pending</h3>
            <p className="text-[12px] text-[#6B7280] leading-relaxed">
              Your attempt has been submitted. The scorecard will be visible once published by the administration.
            </p>
            <div className="px-4 py-3 rounded-[14px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] text-left space-y-1">
              <p className="text-[11px] font-semibold text-[#1D1D1F]">{result.exam?.title}</p>
              <p className="text-[10px] text-[#9CA3AF]">
                {result.exam?.subject?.name} · Submitted {new Date(result.createdAt).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-[12px] text-[13px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] hover:bg-[rgba(122,0,31,0.04)] transition-colors">
              Close
            </button>
          </div>
        ) : (
          /* Published */
          <div className="space-y-0">
            {/* Header gradient */}
            <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-[#7A001F] to-[#9D174D]">
              <button onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <X size={14} />
              </button>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white border border-white/30 uppercase">
                Results Released
              </span>
              <h3 className="text-[15px] font-bold text-white mt-2 leading-snug">{result.exam?.title}</h3>
              <p className="text-[11px] text-white/70 mt-0.5">{result.exam?.subject?.name}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Score cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Score',      val: `${result.marksObtained}/${result.totalMarks}` },
                  { label: 'Percentage', val: `${result.percentage}%` },
                  { label: 'Grade',      val: result.grade || result.status },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-[14px] bg-[rgba(122,0,31,0.04)] border border-[rgba(122,0,31,0.08)] p-3 text-center">
                    <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold tracking-wider">{label}</p>
                    <p className="text-[15px] font-bold text-[#7A001F] mt-1">{val}</p>
                  </div>
                ))}
              </div>

              {/* Performance badge */}
              {pb && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border text-[12px] font-semibold ${pb.cls}`}>
                  <Trophy size={14} />
                  {pb.label}
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    result.status === 'Pass' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {result.status}
                  </span>
                </div>
              )}

              {/* Stat breakdown */}
              {result.statsSummary && (
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded-[12px] bg-green-50 border border-green-200 py-2">
                    <p className="font-bold text-green-700">{result.statsSummary.correct || 0}</p>
                    <p className="text-[9px] text-green-600">Correct</p>
                  </div>
                  <div className="rounded-[12px] bg-red-50 border border-red-200 py-2">
                    <p className="font-bold text-red-700">{result.statsSummary.wrong || 0}</p>
                    <p className="text-[9px] text-red-600">Wrong</p>
                  </div>
                  <div className="rounded-[12px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] py-2">
                    <p className="font-bold text-[#6B7280]">{result.statsSummary.unanswered || 0}</p>
                    <p className="text-[9px] text-[#9CA3AF]">Skipped</p>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-[#9CA3AF] text-right">
                Submitted: {new Date(result.attempt?.submissionTime || result.createdAt).toLocaleString()}
                {result.passingMarks && ` · Pass Mark: ${result.passingMarks}`}
              </p>

              <button
                onClick={() => {
                  onClose();
                  navigate(`/student/results/review/${result._id}`);
                }}
                className="w-full mb-2 py-2.5 rounded-[12px] text-[13px] font-bold text-white bg-[#7A001F] hover:bg-[#9D174D] transition-colors"
              >
                Review Answers
              </button>

              <button onClick={onClose}
                className="w-full py-2.5 rounded-[12px] text-[13px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] hover:bg-[rgba(122,0,31,0.04)] transition-colors">
                Close Scorecard
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ── Exam Result Card ─────────────────────────────────────────────── */
const CompletedCard = ({ exam, onView }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.06)] hover:shadow-[0_8px_32px_rgba(122,0,31,0.10)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
  >
    {/* Header */}
    <div className="px-5 pt-5 pb-4 border-b border-[rgba(122,0,31,0.07)]">
      <div className="flex items-center justify-between mb-2">
        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[rgba(122,0,31,0.08)] text-[#7A001F]">
          {exam.type || 'Exam'}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
          Completed
        </span>
      </div>
      <h3 className="text-[14px] font-bold text-[#1D1D1F] leading-snug">{exam.title}</h3>
      <p className="text-[11px] text-[#6B7280] mt-0.5">{exam.subject?.name} ({exam.subject?.code})</p>
    </div>

    {/* Dates */}
    <div className="px-5 py-3 grid grid-cols-2 gap-3 text-[11px]">
      <div>
        <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Exam Date</p>
        <p className="font-semibold text-[#1D1D1F] mt-0.5">
          {new Date(exam.date || exam.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div>
        <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Duration</p>
        <p className="font-semibold text-[#1D1D1F] mt-0.5">{exam.durationMinutes} min</p>
      </div>
    </div>

    {/* View Result CTA */}
    <div className="px-5 pb-5 mt-auto">
      <button
        onClick={() => onView(exam._id)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[13px] font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_12px_rgba(122,0,31,0.2)]"
        style={{ background: 'linear-gradient(135deg,#7A001F,#9D174D)' }}
      >
        <BarChart3 size={14} />
        View Scorecard
        <ChevronRight size={14} />
      </button>
    </div>
  </motion.div>
);

/* ── Main Page ────────────────────────────────────────────────────── */
const StudentCompleted = () => {
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);
  const [page, setPage] = useState(1);
  const LIMIT = 6;

  const [modalResult, setModalResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams/student');
      if (res.data?.success) {
        const now = new Date();
        const done = (res.data.data || []).filter((e) => now > new Date(e.endTime));
        const seen = new Set();
        const subs = [];
        done.forEach((e) => {
          if (e.subject && !seen.has(e.subject._id)) { seen.add(e.subject._id); subs.push(e.subject); }
        });
        setSubjectsList(subs);
        setAllExams(done);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleViewResult = async (examId) => {
    setLoadingResult(true);
    setModalResult({ loading: true });
    try {
      const res = await api.get('/results', { params: { exam: examId } });
      const list = res.data?.data?.results || [];
      if (!list.length) { setModalResult(null); toast.error('No result record found.'); return; }
      const detail = await api.get(`/results/${list[0]._id}`);
      setModalResult(detail.data?.data || null);
    } catch {
      toast.error('Failed to load scorecard.');
      setModalResult(null);
    } finally {
      setLoadingResult(false);
    }
  };

  const filtered = allExams.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !subjectFilter || e.subject?._id === subjectFilter;
    return matchSearch && matchSubject;
  }).sort((a, b) => {
    const dateA = new Date(a.date || a.startTime || 0).getTime();
    const dateB = new Date(b.date || b.startTime || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;

    const compA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const compB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    if (compB !== compA) return compB - compA;

    const pubA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const pubB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    if (pubB !== pubA) return pubB - pubA;

    const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createB - createA;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1D1D1F]">Completed Assessments</h1>
            <p className="text-[12px] text-[#6B7280] mt-1">
              Review your examination history and view published scorecards.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]">
            <CheckCircle2 size={13} className="text-[#6B7280]" />
            <span className="text-[11px] font-semibold text-[#6B7280]">{filtered.length} Completed</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input type="text" placeholder="Search completed exams…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none focus:border-[rgba(122,0,31,0.25)] text-[#1D1D1F] transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <select value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none text-[#1D1D1F] min-w-[160px] appearance-none">
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
            <div key={i} className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.07)] h-52 animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(122,0,31,0.06)] flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-[#C4B5B8]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#1D1D1F]">No Completed Exams</h3>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Your examination history will appear here after your first attempt.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map((exam) => (
            <CompletedCard key={exam._id} exam={exam} onView={handleViewResult} />
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

      {/* Result Modal */}
      <AnimatePresence>
        {(modalResult || loadingResult) && (
          loadingResult ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-white rounded-[24px] p-10 text-center z-50">
                <div className="w-10 h-10 border-4 border-[rgba(122,0,31,0.2)] border-t-[#7A001F] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[12px] font-semibold text-[#6B7280]">Loading scorecard…</p>
              </div>
            </div>
          ) : modalResult && !modalResult.loading ? (
            <ResultModal result={modalResult} onClose={() => setModalResult(null)} />
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentCompleted;
