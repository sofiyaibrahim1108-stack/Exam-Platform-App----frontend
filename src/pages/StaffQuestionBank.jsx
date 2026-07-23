import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, X, Eye, FileText, Layers, CheckCircle2,
  Calendar, UserCheck, ShieldAlert, Sparkles, Filter, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const StaffQuestionBank = () => {
  // Main Lists & Options States
  const [questions, setQuestions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Syllabus cache to resolve unit numbers (subjectId -> units list)
  const [syllabusCache, setSyllabusCache] = useState({});
  const [loading, setLoading] = useState(true);

  // Active workspace / Batch selection
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Search & Filter Parameter States
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [generatedFilter, setGeneratedFilter] = useState('');
  const [approvedDateFilter, setApprovedDateFilter] = useState('');

  // Slide-over preview drawer
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch approved questions list and dropdown filter elements
  const fetchApprovedData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/staff/question-bank', {
        params: {
          department: deptFilter || undefined,
          course: courseFilter || undefined,
          semester: semFilter || undefined,
          subject: subFilter || undefined,
          difficulty: difficultyFilter || undefined,
          generatedBy: generatedFilter || undefined,
          approvedDate: approvedDateFilter || undefined,
          search: search || undefined,
          limit: 1000, // Retrieve high count to group into batches on client
        }
      });
      if (response.data && response.data.success) {
        setQuestions(response.data.data.results || []);
      }
    } catch (error) {
      toast.error('Failed to load Question Bank.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown options for filters
  const fetchDropdowns = async () => {
    try {
      const dropRes = await api.get('/staff/question-bank/dropdowns');
      if (dropRes.data && dropRes.data.success) {
        setDepartments(dropRes.data.data.departments || []);
        setCourses(dropRes.data.data.courses || []);
        setSemesters(dropRes.data.data.semesters || []);
        setSubjects(dropRes.data.data.subjects || []);
      }
    } catch (err) {
      console.log('Failed to fetch Dropdowns list.', err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchApprovedData();
  }, [
    deptFilter,
    courseFilter,
    semFilter,
    subFilter,
    difficultyFilter,
    generatedFilter,
    approvedDateFilter,
  ]);

  // Handle manual search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApprovedData();
  };

  const handleResetSearch = () => {
    setSearch('');
    setTimeout(() => fetchApprovedData(), 50);
  };

  // Load syllabus details for subjects present in the questions to resolve Unit Numbers
  useEffect(() => {
    const uniqueSubjectIds = [...new Set(questions.map((q) => q.subject?._id).filter(Boolean))];
    
    const fetchSyllabi = async () => {
      const newCache = { ...syllabusCache };
      let updated = false;

      await Promise.all(
        uniqueSubjectIds.map(async (subId) => {
          if (newCache[subId]) return;
          try {
            const res = await api.get(`/staff/question-bank/syllabus/${subId}`);
            if (res.data && res.data.success) {
              newCache[subId] = res.data.data.units || [];
              updated = true;
            }
          } catch (err) {
            console.error('Error loading syllabus cache for subject', subId, err);
          }
        })
      );

      if (updated) {
        setSyllabusCache(newCache);
      }
    };

    if (uniqueSubjectIds.length > 0) {
      fetchSyllabi();
    }
  }, [questions]);

  // Group questions by their source Approved Submission (SubmissionId)
  const getQuestionBatches = () => {
    const groups = {};

    questions.forEach((q) => {
      let batchKey = q.SubmissionId || q.submissionId;
      if (!batchKey) {
        // Fallback: Group legacy questions by date-stamp and subject to keep them clean
        const dateKey = q.ApprovedDate ? new Date(q.ApprovedDate).getTime() : new Date(q.createdAt).getTime();
        const subId = q.subject?._id || 'unknown';
        batchKey = `legacy_${subId}_${dateKey}`;
      }

      if (!groups[batchKey]) {
        groups[batchKey] = {
          key: batchKey,
          submissionId: q.SubmissionId || null,
          subject: q.subject || { name: 'Unassigned Subject', code: 'N/A' },
          approvedDate: q.ApprovedDate || q.createdAt,
          approvedBy: q.ApprovedBy || { name: 'Administrator' },
          createdBy: q.createdBy || { name: 'Faculty' },
          department: q.DepartmentId,
          course: q.CourseId,
          semester: q.SemesterId,
          questions: [],
        };
      }
      groups[batchKey].questions.push(q);
    });

    // Sort batches by approved date descending
    return Object.values(groups).sort((a, b) => new Date(b.approvedDate) - new Date(a.approvedDate));
  };

  // Helper to map UnitId to its human readable Number (e.g. Unit 1)
  const getUnitNumberLabel = (subjectId, unitId) => {
    const units = syllabusCache[subjectId];
    if (!units) return '';
    const unit = units.find((u) => u._id === unitId);
    return unit ? `Unit ${unit.unitNumber}` : '';
  };

  // Helper to collect all unit labels for a batch of questions
  const getBatchUnitsLabel = (batchQuestions) => {
    const labels = batchQuestions
      .map((q) => {
        const subId = q.subject?._id;
        const unitId = q.UnitId;
        return getUnitNumberLabel(subId, unitId);
      })
      .filter(Boolean);

    const uniqueLabels = [...new Set(labels)].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });

    return uniqueLabels.join(', ') || 'General Curriculum';
  };

  const batches = getQuestionBatches();

  if (loading && questions.length === 0) {
    return (
      <div className="space-y-6 font-sans">
        <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-gray-100 animate-pulse rounded-[24px] border border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // WORKSPACE BATCH VIEW (VIEW QUESTIONS INSIDE BATCH)
  // ----------------------------------------------------
  if (selectedBatch) {
    return (
      <div className="space-y-6 font-sans pb-10">
        {/* Detail Workspace Header Banner */}
        <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={() => setSelectedBatch(null)}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#6B7280] hover:text-[#1D1D1F] transition-all active:scale-95"
              title="Back to Batches"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[9px] font-mono font-bold text-[#C74B74] uppercase tracking-wider block">
                Batch Question Bank Details
              </span>
              <h2 className="text-xl font-extrabold text-[#1D1D1F] leading-tight mt-0.5">
                {selectedBatch.subject?.name} <span className="font-mono text-sm opacity-70">({selectedBatch.subject?.code})</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Batch Info Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] shadow-xs">
            <span className="text-[9px] text-[#6B7280] font-mono font-bold uppercase tracking-wider block">Batch Unit(s)</span>
            <span className="text-xs font-bold text-[#8C1D40] mt-1 block truncate">
              {getBatchUnitsLabel(selectedBatch.questions)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] shadow-xs">
            <span className="text-[9px] text-[#6B7280] font-mono font-bold uppercase tracking-wider block">Total Questions</span>
            <span className="text-xs font-bold text-[#8C1D40] mt-1 block">
              {selectedBatch.questions.length} Qs
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] shadow-xs">
            <span className="text-[9px] text-[#6B7280] font-mono font-bold uppercase tracking-wider block">Approved On</span>
            <span className="text-xs font-bold text-[#8C1D40] mt-1 block">
              {new Date(selectedBatch.approvedDate).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] shadow-xs">
            <span className="text-[9px] text-[#6B7280] font-mono font-bold uppercase tracking-wider block">Approved By</span>
            <span className="text-xs font-bold text-[#8C1D40] mt-1 block truncate">
              {selectedBatch.approvedBy?.name || 'Administrator'}
            </span>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {selectedBatch.questions.map((q, index) => (
            <motion.div
              key={q._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] hover:shadow-xs transition-all space-y-4 relative overflow-hidden group"
            >
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#8C1D40] to-[#C74B74] opacity-0 group-hover:opacity-100 transition-opacity"></span>

              {/* Question tags and details drawer button */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${
                    q.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-500/20'
                      : q.difficulty === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-500/20'
                      : 'bg-red-50 text-[#8C1D40] border-red-500/20'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-50 text-[#6B7280] text-[9px] font-mono font-bold border border-gray-100">
                    ORIGIN: {q.GeneratedBy}
                  </span>
                  {q.UnitId && (
                    <span className="px-2 py-0.5 rounded bg-[#F8ECEF] text-[#8C1D40] text-[9px] font-mono font-bold border border-[#8C1D40]/5">
                      {getUnitNumberLabel(q.subject?._id, q.UnitId) || 'Unit mapped'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveQuestion(q);
                    setPreviewOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-[#F8ECEF] text-[#6B7280] hover:text-[#8C1D40] border border-gray-150 transition-all font-bold text-[10px] flex items-center gap-1.5 active:scale-95"
                  title="View Details"
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>

              {/* Question text */}
              <h4 className="text-sm font-extrabold text-[#1D1D1F] leading-relaxed">
                Q{index + 1}. {q.Question || q.text}
              </h4>

              {/* Options grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optionText = q[`Option${opt}`] || q.options?.find(o => o.optionLetter === opt)?.optionText;
                  const isCorrect = (q.CorrectAnswer || q.correctAnswers?.[0]) === opt;
                  return (
                    <div
                      key={opt}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-3 transition-colors ${
                        isCorrect
                          ? 'bg-green-50/10 border-green-500/20 text-green-800 font-bold'
                          : 'bg-white border-gray-100 text-[#6B7280]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] font-mono mt-0.5 ${
                        isCorrect ? 'bg-green-500 text-white shadow-xs' : 'bg-[#8C1D40]/10 text-[#8C1D40]'
                      }`}>
                        {opt}
                      </span>
                      <span className="flex-1">{optionText}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation (if any) */}
              {(q.Explanation || q.explanation) && (
                <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-semibold text-[#6B7280] leading-relaxed">
                  <span className="font-mono text-[#8C1D40] font-bold uppercase block mb-0.5">Academic Explanation</span>
                  {q.Explanation || q.explanation}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* SINGLE PREVIEW DRAWER */}
        <AnimatePresence>
          {previewOpen && activeQuestion && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewOpen(false)}
                className="fixed inset-0"
              ></motion.div>

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-100 p-6 flex flex-col justify-between z-10 overflow-y-auto"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-500/15 text-emerald-800 text-[9px] font-mono font-bold uppercase tracking-wider">
                        Question Repository
                      </span>
                      <h3 className="text-base font-extrabold text-[#1D1D1F] mt-1.5">Question Details</h3>
                    </div>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-[#6B7280]"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Academic Context Headers */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-[#6B7280] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div>
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Subject</span>
                        <span className="text-[#8C1D40] truncate block font-bold mt-0.5">{activeQuestion.subject?.name || 'Subject Mapped'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Approved By</span>
                        <span className="truncate block font-bold text-emerald-700 mt-0.5">{activeQuestion.ApprovedBy?.name || 'Admin'}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-250/20">
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Approved Date</span>
                        <span className="block font-bold truncate text-[#1D1D1F] mt-0.5">
                          {activeQuestion.ApprovedDate ? new Date(activeQuestion.ApprovedDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-250/20">
                        <span className="text-[9px] text-[#9CA3AF] uppercase font-mono block">Creator</span>
                        <span className="block font-bold truncate text-[#8C1D40] mt-0.5">{activeQuestion.createdBy?.name || 'Faculty Member'}</span>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Question Text</span>
                      <div className="p-4 bg-[#F8ECEF]/40 border border-[#8C1D40]/10 rounded-2xl text-xs font-bold text-[#8C1D40] leading-relaxed">
                        {activeQuestion.Question || activeQuestion.text}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Answer Options</span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const optionText = activeQuestion[`Option${opt}`] || activeQuestion.options?.find(o => o.optionLetter === opt)?.optionText;
                          const isCorrect = (activeQuestion.CorrectAnswer || activeQuestion.correctAnswers?.[0]) === opt;
                          return (
                            <div
                              key={opt}
                              className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-3 transition-colors ${
                                isCorrect
                                  ? 'bg-green-50/10 border-green-500/20 text-green-800 font-bold'
                                  : 'bg-white border-gray-100 text-[#6B7280]'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] font-mono mt-0.5 ${
                                isCorrect ? 'bg-green-500 text-white shadow-xs' : 'bg-[#8C1D40]/10 text-[#8C1D40]'
                              }`}>
                                {opt}
                              </span>
                              <span className="flex-1">{optionText}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanation */}
                    {(activeQuestion.Explanation || activeQuestion.explanation) && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Explanation Context</span>
                        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-semibold text-[#6B7280] leading-relaxed">
                          {activeQuestion.Explanation || activeQuestion.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 mt-8 bg-white">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold text-xs transition-all flex items-center justify-center gap-1.5 text-[#6B7280]"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ----------------------------------------------------
  // BATCHES LANDING HOME VIEW
  // ----------------------------------------------------
  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="text-xl font-extrabold text-[#1D1D1F] mb-1">Approved Question Bank</h2>
        <p className="text-[#6B7280] text-xs font-semibold">
          Browse and verify approved questions structured into distinct batches representing each admin-approved submission.
        </p>
      </div>

      {/* Filters Form Panel */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-[20px] grid grid-cols-1 md:grid-cols-4 gap-3 items-center border border-[rgba(140,29,64,0.08)] shadow-xs">
        <div className="relative">
          <input
            type="text"
            placeholder="Search question content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#8C1D40]/30 text-[#1D1D1F]"
          />
          <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
          {search && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="absolute right-3.5 top-3 text-gray-450 hover:text-[#8C1D40]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#1D1D1F]"
        >
          <option value="">Subject: All</option>
          {subjects.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name} ({sub.code})
            </option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#1D1D1F]"
        >
          <option value="">Difficulty: All</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={generatedFilter}
          onChange={(e) => setGeneratedFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#1D1D1F]"
        >
          <option value="">Origin: All</option>
          <option value="AI">AI Generated</option>
          <option value="Staff">Staff (Manual)</option>
        </select>
      </form>

      {/* Batches Grid Display */}
      {batches.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs">
          <Database size={48} className="text-gray-300 mx-auto mb-4" />
          <h4 className="text-sm font-bold text-[#1D1D1F] font-sans">No Batches Found</h4>
          <p className="text-[#6B7280] text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            There are no approved question submissions matching your selected parameters in the question bank.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch, index) => (
            <motion.div
              key={batch.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-64 group relative overflow-hidden"
            >
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#8C1D40] to-[#C74B74] opacity-0 group-hover:opacity-100 transition-opacity"></span>

              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-[#F8ECEF] text-[#8C1D40] text-[9px] font-mono font-bold border border-[#8C1D40]/5 uppercase tracking-wide">
                  {batch.subject?.code}
                </span>
                <h3 className="text-sm font-extrabold text-[#1D1D1F] line-clamp-2 leading-tight mt-1 group-hover:text-[#8C1D40] transition-colors">
                  {batch.subject?.name}
                </h3>
              </div>

              {/* Stats Block */}
              <div className="py-2.5 border-t border-b border-gray-100 space-y-1.5 my-3 text-[10px] font-bold text-[#6B7280]">
                <div className="flex justify-between">
                  <span className="opacity-75">Unit(s):</span>
                  <span className="text-[#8C1D40] font-mono font-bold truncate max-w-[170px]">
                    {getBatchUnitsLabel(batch.questions)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Questions:</span>
                  <span className="text-[#1D1D1F] font-bold">{batch.questions.length} Qs</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Approved Date:</span>
                  <span className="font-mono text-[#1D1D1F] font-bold">
                    {new Date(batch.approvedDate).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Approved By:</span>
                  <span className="text-emerald-700 truncate max-w-[130px] font-bold">
                    {batch.approvedBy?.name || 'Administrator'}
                  </span>
                </div>
              </div>

              {/* View Questions CTA Button */}
              <button
                onClick={() => setSelectedBatch(batch)}
                className="w-full py-2 rounded-xl bg-gray-50 border border-gray-250/20 text-[#6B7280] font-bold hover:bg-[#8C1D40] hover:text-white hover:border-transparent transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
              >
                <Eye size={12} />
                View Questions
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffQuestionBank;
