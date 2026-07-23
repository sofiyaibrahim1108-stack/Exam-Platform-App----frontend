import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Eye, X, BookOpen, Clock, Settings, Layers, Calendar, UserCheck, ShieldAlert, FileText, ClipboardList,Search
} from 'lucide-react';
import api from '../services/api';

const AdminQuestionBank = () => {
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
      const response = await api.get('/admin/question-bank', {
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
      const dropRes = await api.get('/admin/question-bank/dropdowns');
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
            const res = await api.get(`/admin/question-bank/syllabus/${subId}`);
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
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-[24px] animate-pulse border border-primary/5">
          <div className="h-8 bg-surface-container-high rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-surface-container-high rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-surface-container-high animate-pulse rounded-[24px]"></div>
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
      <div className="space-y-6">
        {/* Detail Workspace Header Banner */}
        <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setSelectedBatch(null)}
              className="p-2 rounded-xl border border-primary/10 hover:bg-[#FDF0F4] hover:text-[#8B1E3F] text-on-surface transition-all"
              title="Back to Batches"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-1 tracking-wider block">
                  Batch Question Bank Details (Admin Console)
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#111111] leading-tight">
                {selectedBatch.subject?.name} <span className="font-mono text-sm text-[#6B7280]">({selectedBatch.subject?.code})</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Batch Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card p-4">
            <span className="text-[9px] text-[#9CA3AF] font-mono font-bold uppercase block">Batch Unit(s)</span>
            <span className="text-xs font-bold text-[#111111] mt-1 block truncate">
              {getBatchUnitsLabel(selectedBatch.questions)}
            </span>
          </div>
          <div className="stat-card p-4">
            <span className="text-[9px] text-[#9CA3AF] font-mono font-bold uppercase block">Total Questions</span>
            <span className="text-xs font-bold text-[#111111] mt-1 block">
              {selectedBatch.questions.length} Qs
            </span>
          </div>
          <div className="stat-card p-4">
            <span className="text-[9px] text-[#9CA3AF] font-mono font-bold uppercase block">Approved On</span>
            <span className="text-xs font-bold text-[#111111] mt-1 block">
              {new Date(selectedBatch.approvedDate).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="stat-card p-4">
            <span className="text-[9px] text-[#9CA3AF] font-mono font-bold uppercase block">Approved By</span>
            <span className="text-xs font-bold text-[#111111] mt-1 block truncate">
              {selectedBatch.approvedBy?.name}
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
              className="card-flat p-6 rounded-[24px] space-y-4 relative"
            >
              {/* Question tags and details drawer button */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${
                    q.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : q.difficulty === 'Medium'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-[#8B1E3F] border-[rgba(139,30,63,0.12)]'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-50 text-[#6B7280] text-[9px] font-mono font-bold border border-gray-150">
                    ORIGIN: {q.GeneratedBy}
                  </span>
                  {q.UnitId && (
                    <span className="px-2 py-0.5 rounded bg-[#FDF0F4] text-[#8B1E3F] text-[9px] font-mono font-bold border border-[rgba(139,30,63,0.12)]">
                      {getUnitNumberLabel(q.subject?._id, q.UnitId) || 'Unit mapped'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveQuestion(q);
                    setPreviewOpen(true);
                  }}
                  className="py-1 px-2.5 text-[11.5px] rounded-[8px] bg-[#FDF0F4] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white font-bold transition-all flex items-center gap-1"
                  title="View Details"
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>

              {/* Question text */}
              <h4 className="text-sm font-bold text-primary leading-snug">
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
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-3 transition-colors ${
                        isCorrect
                          ? 'bg-green-500/15 border-green-500/30 text-green-800'
                          : 'bg-surface-container-lowest/50 border-primary/5 text-on-surface-variant/80'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] font-mono ${
                        isCorrect ? 'bg-green-500 text-white shadow-sm' : 'bg-primary/10 text-primary'
                      }`}>
                        {opt}
                      </span>
                      <span>{optionText}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation (if any) */}
              {(q.Explanation || q.explanation) && (
                <div className="p-3 bg-surface-container-low border border-primary/5 rounded-xl text-[10px] font-semibold text-on-surface-variant/85 leading-relaxed">
                  <span className="font-mono text-primary font-bold uppercase block mb-0.5">Academic Explanation</span>
                  {q.Explanation || q.explanation}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* SINGLE PREVIEW DRAWER */}
        <AnimatePresence>
          {previewOpen && activeQuestion && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewOpen(false)}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              ></motion.div>

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-surface h-full shadow-2xl border-l border-primary/10 p-6 flex flex-col justify-between z-10 overflow-y-auto"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-800 text-[9px] font-bold uppercase tracking-wider font-mono">
                        Question Repository
                      </span>
                      <h3 className="text-base font-bold text-primary mt-1.5">Question Details</h3>
                    </div>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="p-1 rounded-lg text-[#6B7280] hover:bg-gray-100 hover:text-[#111111]"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Academic Context Headers */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-on-surface-variant bg-surface-container-low p-3.5 rounded-xl border border-primary/5">
                      <div>
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Subject</span>
                        <span className="text-primary truncate block font-bold">{activeQuestion.subject?.name || 'Subject Mapped'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Approved By</span>
                        <span className="truncate block font-bold text-emerald-700">{activeQuestion.ApprovedBy?.name || 'Admin'}</span>
                      </div>
                      <div className="pt-2 border-t border-primary/5">
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Approved Date</span>
                        <span className="block font-bold truncate">
                          {activeQuestion.ApprovedDate ? new Date(activeQuestion.ApprovedDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-primary/5">
                        <span className="text-[9px] text-on-surface-variant/50 uppercase font-mono block">Original Creator</span>
                        <span className="block font-bold truncate text-primary">{activeQuestion.createdBy?.name || 'Faculty Member'}</span>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Question Text</span>
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-xs font-bold text-primary leading-relaxed">
                        {activeQuestion.Question || activeQuestion.text}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase font-mono">Answer Options</span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const optionText = activeQuestion[`Option${opt}`] || activeQuestion.options?.find(o => o.optionLetter === opt)?.optionText;
                          const isCorrect = (activeQuestion.CorrectAnswer || activeQuestion.correctAnswers?.[0]) === opt;
                          return (
                            <div
                              key={opt}
                              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-3 transition-colors ${
                                isCorrect
                                  ? 'bg-green-500/15 border-green-500/30 text-green-800'
                                  : 'bg-surface-container-low/40 border-primary/5 text-on-surface-variant/80'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono ${
                                isCorrect ? 'bg-green-500 text-white shadow-sm' : 'bg-primary/10 text-primary'
                              }`}>
                                {opt}
                              </span>
                              <span>{optionText}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanation */}
                    {(activeQuestion.Explanation || activeQuestion.explanation) && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Explanation Context</span>
                        <div className="p-3.5 bg-surface-container-low border border-primary/5 rounded-xl text-[11px] font-semibold text-on-surface-variant leading-relaxed">
                          {activeQuestion.Explanation || activeQuestion.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-primary/5 mt-8 bg-surface">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-primary/10 hover:bg-primary/5 font-bold text-xs transition-all flex items-center justify-center gap-1"
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <ClipboardList size={12} />
              Validated Repository
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Approved Question Bank</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Browse and verify approved questions structured into distinct batches representing each admin-approved submission.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Form Panel */}
      <form onSubmit={handleSearchSubmit} className="card-flat p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1 search-bar">
            <Search size={14} className="text-[#9CA3AF] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="text-[#9CA3AF] hover:text-[#8B1E3F]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="select"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="select"
          >
            <option value="">All Courses</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          {/* Semester Filter */}
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="select"
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => <option key={s._id} value={s._id}>{s.name} (Sem {s.semesterNumber})</option>)}
          </select>

          {/* Subject Filter */}
          <select
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            className="select"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
        </div>
      </form>

      {/* Batches Grid Display */}
      {batches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Layers size={24} />
          </div>
          <h4 className="text-base font-bold text-[#111111]">No Batches Found</h4>
          <p className="text-[#6B7280] text-xs mt-1 max-w-sm">
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
              className="card-flat p-6 flex flex-col justify-between h-56 bg-white"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-[#FDF0F4] text-[#8B1E3F] text-[9px] font-mono font-bold border border-[rgba(139,30,63,0.12)] uppercase tracking-wide">
                  {batch.subject?.code}
                </span>
                <h3 className="text-sm font-bold text-[#111111] line-clamp-2 leading-tight">
                  {batch.subject?.name}
                </h3>
              </div>

              {/* Stats Block */}
              <div className="py-2 border-t border-b border-[#F3F4F6] space-y-1 my-3 text-[11px] text-[#6B7280]">
                <div className="flex justify-between">
                  <span className="opacity-75">Unit(s):</span>
                  <span className="text-[#8B1E3F] font-bold truncate max-w-[170px]">
                    {getBatchUnitsLabel(batch.questions)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Questions:</span>
                  <span className="text-[#8B1E3F] font-bold">{batch.questions.length} Qs</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Approved Date:</span>
                  <span className="font-mono font-bold text-[#111111]">
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
                    {batch.approvedBy?.name}
                  </span>
                </div>
              </div>

              {/* View Questions CTA Button */}
              <button
                onClick={() => setSelectedBatch(batch)}
                className="btn-secondary py-2 w-full text-[12px] rounded-[10px] flex items-center justify-center gap-1.5"
              >
                <Eye size={13} />
                View Questions
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminQuestionBank;
