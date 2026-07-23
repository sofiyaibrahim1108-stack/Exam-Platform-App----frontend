import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, X, Eye, FileText, Layers, CheckCircle2,
  Calendar, UserCheck, ShieldAlert, Sparkles, Filter, Database,
  Brain, Clock, Award, AlertTriangle, Plus, Trash2, Copy, PlusCircle,
  FolderOpen, Settings, CheckSquare, Info, BookOpen, Edit3, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const StaffExams = () => {
  // Navigation / Mode State
  // 'list' or 'form'
  const [mode, setMode] = useState('list');
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingExamStatus, setEditingExamStatus] = useState('Draft');
  
  // Tab State inside Form: 'details' | 'questions' | 'preview'
  const [formTab, setFormTab] = useState('details');

  // Exam List States
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [listTab, setListTab] = useState('Draft'); // 'Draft' | 'Pending Approval'
  
  // Faculty Assignments & Syllabus States
  const [assignments, setAssignments] = useState([]);
  const [syllabusUnits, setSyllabusUnits] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Question Selection States
  const [bankQuestions, setBankQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [questionPage, setQuestionPage] = useState(1);
  const [questionLimit] = useState(10);
  const [totalQuestionsInBank, setTotalQuestionsInBank] = useState(0);

  // Preview Drawer States
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);

  // Form Field States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examType, setExamType] = useState('Internal');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(50);
  const [passingMarks, setPassingMarks] = useState(20);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [instructions, setInstructions] = useState('');
  
  // Selected Questions State: array of { questionId, marks, questionObj }
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Auto-populated fields based on selected subject assignment
  const [mappedDept, setMappedDept] = useState(null);
  const [mappedCourse, setMappedCourse] = useState(null);
  const [mappedSem, setMappedSem] = useState(null);
  const [mappedAcademicYear, setMappedAcademicYear] = useState('');

  // Fetch Exams list
  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const response = await api.get('/exams');
      if (response.data && response.data.success) {
        setExams(response.data.data.results || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to retrieve exams.');
    } finally {
      setLoadingExams(false);
    }
  };

  // Fetch Faculty Assignments
  const fetchFacultyAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const response = await api.get('/faculty-assignments/staff/me');
      if (response.data && response.data.success) {
        setAssignments(response.data.data.assignments || []);
      }
    } catch (error) {
      toast.error('Failed to load subject assignments.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchExams();
    fetchFacultyAssignments();
  }, []);

  // Fetch questions when subject or filters change
  const fetchQuestionsFromBank = async () => {
    if (!selectedSubjectId) {
      setBankQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    try {
      const response = await api.get('/staff/question-bank', {
        params: {
          subject: selectedSubjectId,
          unit: unitFilter || undefined,
          topic: topicFilter || undefined,
          difficulty: difficultyFilter || undefined,
          search: searchQuery || undefined,
          page: questionPage,
          limit: questionLimit,
        },
      });
      if (response.data && response.data.success) {
        setBankQuestions(response.data.data.results || []);
        setTotalQuestionsInBank(response.data.data.pagination?.total || 0);
      }
    } catch (error) {
      toast.error('Failed to load questions from bank.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchQuestionsFromBank();
  }, [selectedSubjectId, unitFilter, topicFilter, difficultyFilter, questionPage]);

  // Fetch syllabus details for units & topics when subject changes
  useEffect(() => {
    const fetchSyllabus = async () => {
      if (!selectedSubjectId) {
        setSyllabusUnits([]);
        return;
      }
      try {
        const response = await api.get(`/staff/question-bank/syllabus/${selectedSubjectId}`);
        if (response.data && response.data.success) {
          setSyllabusUnits(response.data.data.units || []);
        }
      } catch (error) {
        console.error('Syllabus fetch error:', error);
      }
    };
    fetchSyllabus();
    setUnitFilter('');
    setTopicFilter('');
    setQuestionPage(1);
  }, [selectedSubjectId]);

  // Handle subject selection changed - auto-populate fields
  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    if (!subjectId) {
      setMappedDept(null);
      setMappedCourse(null);
      setMappedSem(null);
      setMappedAcademicYear('');
      setSelectedQuestions([]);
      return;
    }

    const matched = assignments.find((a) => a.subject?._id === subjectId);
    if (matched) {
      setMappedDept(matched.department);
      setMappedCourse(matched.course);
      setMappedSem(matched.semester);
      setMappedAcademicYear(matched.academicYear);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedSubjectId('');
    setExamType('Internal');
    setDurationMinutes(60);
    setTotalMarks(50);
    setPassingMarks(20);
    setNegativeMarks(0);
    setInstructions('');
    setSelectedQuestions([]);
    setMappedDept(null);
    setMappedCourse(null);
    setMappedSem(null);
    setMappedAcademicYear('');
    setEditingExamId(null);
    setEditingExamStatus('Draft');
    setFormTab('details');
  };

  // Switch to Form mode (Create)
  const handleCreateNew = () => {
    resetForm();
    setMode('form');
  };

  // Edit draft exam
  const handleEditDraft = async (examId) => {
    setLoadingExams(true);
    try {
      const response = await api.get(`/exams/${examId}`);
      if (response.data && response.data.success) {
        const exam = response.data.data;
        setTitle(exam.title);
        setDescription(exam.description || '');
        setSelectedSubjectId(exam.subject?._id || '');
        setExamType(exam.type);
        setDurationMinutes(exam.durationMinutes);
        setTotalMarks(exam.totalMarks);
        setPassingMarks(exam.passingMarks);
        setNegativeMarks(exam.negativeMarks || 0);
        setInstructions(exam.instructions || '');
        setMappedDept(exam.department);
        setMappedCourse(exam.course);
        setMappedSem(exam.semester);
        setMappedAcademicYear(exam.academicYear || '');
        
        // Populate selected questions (converting from DB format)
        setSelectedQuestions(
          exam.questions.map((q) => ({
            questionId: q.question?._id,
            marks: q.marks || q.question?.marks || 1,
            questionObj: q.question,
          }))
        );

        setEditingExamId(examId);
        setEditingExamStatus(exam.status);
        setMode('form');
        setFormTab('details');
      }
    } catch (error) {
      toast.error('Failed to load exam details.');
    } finally {
      setLoadingExams(false);
    }
  };

  // Duplicate draft exam
  const handleDuplicateExam = async (examId) => {
    const loadingToast = toast.loading('Duplicating exam...');
    try {
      const response = await api.post(`/exams/${examId}/duplicate`);
      if (response.data && response.data.success) {
        toast.success('Exam duplicated successfully!', { id: loadingToast });
        fetchExams();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to duplicate exam.', { id: loadingToast });
    }
  };

  // Delete draft exam
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam draft?')) return;
    const loadingToast = toast.loading('Deleting exam...');
    try {
      const response = await api.delete(`/exams/${examId}`);
      if (response.data && response.data.success) {
        toast.success('Exam draft deleted successfully.', { id: loadingToast });
        fetchExams();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete exam.', { id: loadingToast });
    }
  };

  // Question checkbox toggle
  const handleToggleQuestion = (question) => {
    const exists = selectedQuestions.some((q) => q.questionId === question._id);
    if (exists) {
      setSelectedQuestions(selectedQuestions.filter((q) => q.questionId !== question._id));
    } else {
      setSelectedQuestions([
        ...selectedQuestions,
        {
          questionId: question._id,
          marks: question.marks || 1,
          questionObj: question,
        },
      ]);
    }
  };

  // Handle individual question marks change
  const handleQuestionMarksChange = (questionId, newMarks) => {
    const parsed = parseInt(newMarks, 10);
    if (isNaN(parsed) || parsed < 1) return;
    setSelectedQuestions(
      selectedQuestions.map((q) => (q.questionId === questionId ? { ...q, marks: parsed } : q))
    );
  };

  // Sum of marks calculated dynamically
  const calculatedSumMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

  // Search submission query
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQuestionPage(1);
    fetchQuestionsFromBank();
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setUnitFilter('');
    setTopicFilter('');
    setDifficultyFilter('');
    setQuestionPage(1);
    setTimeout(() => fetchQuestionsFromBank(), 50);
  };

  // Save Draft (Create or Update)
  const handleSaveDraft = async () => {
    if (!title) {
      toast.error('Exam title is required.');
      return;
    }
    if (!selectedSubjectId) {
      toast.error('Subject is required.');
      return;
    }

    const payload = {
      title,
      description,
      department: mappedDept?._id,
      course: mappedCourse?._id,
      semester: mappedSem?._id,
      subject: selectedSubjectId,
      academicYear: mappedAcademicYear,
      type: examType,
      durationMinutes,
      totalMarks,
      passingMarks,
      negativeMarks,
      instructions,
      questions: selectedQuestions.map((q) => ({
        question: q.questionId,
        marks: q.marks,
      })),
    };

    const loadingToast = toast.loading('Saving exam draft...');
    try {
      let res;
      if (editingExamId) {
        res = await api.put(`/exams/${editingExamId}`, payload);
      } else {
        res = await api.post('/exams', payload);
      }

      if (res.data && res.data.success) {
        toast.success(editingExamId ? 'Exam draft updated successfully!' : 'Exam draft created successfully!', {
          id: loadingToast,
        });
        resetForm();
        setMode('list');
        fetchExams();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save exam draft.', { id: loadingToast });
    }
  };

  // Submit Exam for Approval
  const handleSubmitForApproval = async (examId) => {
    const activeId = examId || editingExamId;
    if (!activeId) return;

    if (!examId) {
      // Validate locally if submitting from inside the form mode
      if (selectedQuestions.length === 0) {
        toast.error('Cannot submit an exam without any questions.');
        return;
      }
      if (calculatedSumMarks !== totalMarks) {
        toast.error(`Question marks sum (${calculatedSumMarks}) must equal exam total marks (${totalMarks}) to submit.`);
        return;
      }
    }

    if (!window.confirm('Are you sure you want to submit this exam for approval? Once submitted, it cannot be modified.')) return;

    const loadingToast = toast.loading('Submitting exam for approval...');
    try {
      const response = await api.post(`/exams/${activeId}/submit`);
      if (response.data && response.data.success) {
        toast.success('Exam submitted for Admin approval!', { id: loadingToast });
        resetForm();
        setMode('list');
        fetchExams();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit exam.', { id: loadingToast });
    }
  };

  // Filters topics list based on selected unit
  const getTopicsForSelectedUnit = () => {
    if (!unitFilter || syllabusUnits.length === 0) return [];
    const matchedUnit = syllabusUnits.find((u) => u._id.toString() === unitFilter);
    return matchedUnit ? matchedUnit.topics : [];
  };

  // Helper to resolve unit number and details
  const getUnitName = (unitId) => {
    const u = syllabusUnits.find((unit) => unit._id.toString() === unitId.toString());
    return u ? `Unit ${u.unitNumber}: ${u.title}` : 'N/A';
  };

  // Helper to resolve topic name
  const getTopicName = (topicId) => {
    for (const unit of syllabusUnits) {
      const t = unit.topics.find((tp) => tp._id.toString() === topicId.toString());
      if (t) return t.name;
    }
    return 'N/A';
  };

  // Get filtered exams for the active list view tab
  const getFilteredExams = () => {
    if (listTab === 'Approved') {
      return exams.filter((e) => ['Approved', 'Published', 'Upcoming', 'Live', 'Completed'].includes(e.status));
    }
    return exams.filter((e) => e.status === listTab);
  };

  const getEmptyStateMessage = () => {
    switch (listTab) {
      case 'Draft':
        return "You do not have any exam configurations saved as drafts. Click 'Create Exam Paper' to begin.";
      case 'Pending Approval':
        return 'No exams currently pending admin review. All clear!';
      case 'Approved':
        return 'You do not have any approved exam papers yet. Once the Admin reviews and approves your submission, it will show up here.';
      case 'Rejected':
        return 'No rejected exam configurations found.';
      default:
        return 'No exam papers found.';
    }
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* ----------------------------------------------------
          LIST MODE
          ---------------------------------------------------- */}
      {mode === 'list' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-xl font-extrabold text-[#1D1D1F] mb-1">Exam Configuration</h2>
              <p className="text-[#6B7280] text-xs">
                Configure examinations using questions from your approved question bank. Save drafts, preview, and submit for review.
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8C1D40] to-[#C74B74] hover:opacity-95 text-white font-bold transition-all flex items-center gap-2 text-xs active:scale-95 shadow-xs"
            >
              <PlusCircle size={14} />
              Create Exam Paper
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-100 bg-white p-1 rounded-xl shadow-xs w-max gap-1">
            {['Draft', 'Pending Approval', 'Approved', 'Rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setListTab(tab)}
                className={`px-5 py-2 rounded-lg font-bold text-xs transition-all relative ${
                  listTab === tab
                    ? 'bg-[#8C1D40] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#8C1D40]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Exam List Content */}
          {loadingExams ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[20px] h-28"></div>
              ))}
            </div>
          ) : getFilteredExams().length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-16 text-center border border-[rgba(140,29,64,0.08)] rounded-[28px] bg-white max-w-lg mx-auto shadow-xs"
            >
              <div className="w-14 h-14 bg-[#F8ECEF] text-[#8C1D40] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} />
              </div>
              <h4 className="text-sm font-bold text-[#1D1D1F]">No Exam Papers Found</h4>
              <p className="text-[#6B7280] text-xs mt-1 leading-relaxed">
                {getEmptyStateMessage()}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredExams().map((exam) => (
                <motion.div
                  key={exam._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#8C1D40] to-[#C74B74] opacity-0 group-hover:opacity-100 transition-opacity"></span>

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-[#F8ECEF] border border-[#8C1D40]/10 rounded-md text-[9px] font-mono font-bold text-[#8C1D40] uppercase">
                        {exam.type}
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#F8ECEF]/40 text-[#C74B74] border border-[#8C1D40]/5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                        AY {exam.academicYear}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-[#1D1D1F] leading-tight group-hover:text-[#8C1D40] transition-colors">{exam.title}</h3>
                      <p className="text-[10px] text-[#6B7280] mt-1.5 leading-relaxed line-clamp-2 font-semibold">
                        {exam.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[#6B7280] border-t border-gray-100 pt-3.5">
                      <div>
                        <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Subject</span>
                        <span className="block font-bold text-[#1D1D1F] truncate mt-0.5">
                          {exam.subject?.name} ({exam.subject?.code})
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Duration & Marks</span>
                        <span className="block font-bold truncate text-[#1D1D1F] mt-0.5">
                          {exam.durationMinutes} Mins / {exam.totalMarks} Marks
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-50 mt-1">
                        <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Dept & Sem</span>
                        <span className="block truncate text-[#1D1D1F] mt-0.5">
                          {exam.department?.code} / Sem {exam.semester?.semesterNumber}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-50 mt-1">
                        <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Questions Selected</span>
                        <span className="block font-bold text-[#1D1D1F] mt-0.5">
                          {exam.questions?.length || 0} questions
                        </span>
                      </div>

                      {/* Display metadata based on tab */}
                      {listTab === 'Approved' && (
                        <>
                          <div className="col-span-2 pt-2 border-t border-gray-50 mt-1 grid grid-cols-2 gap-2 text-[#6B7280]">
                            <div>
                              <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Approved By</span>
                              <span className="block font-bold text-emerald-700 mt-0.5">{exam.approvedBy?.name || exam.publishedBy?.name || 'Admin'}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Approved Date</span>
                              <span className="block font-bold font-mono text-[#1D1D1F] mt-0.5">
                                {exam.approvedDate ? new Date(exam.approvedDate).toLocaleDateString() : exam.publishedDate ? new Date(exam.publishedDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Publish Status</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block mt-1 ${
                                ['Published', 'Upcoming', 'Live', 'Completed'].includes(exam.status)
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/20'
                                  : 'bg-amber-50 text-amber-700 border border-amber-500/20'
                              }`}>
                                {['Published', 'Upcoming', 'Live', 'Completed'].includes(exam.status) ? 'Published' : 'Not Published'}
                              </span>
                            </div>
                            {exam.startTime && (
                              <div className="col-span-2 grid grid-cols-2 gap-2 mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <div className="col-span-2 pb-1 border-b border-gray-200/50">
                                  <span className="text-[7px] text-[#9CA3AF] uppercase font-mono block">Exam Date</span>
                                  <span className="block font-bold text-[9px] text-[#8C1D40] mt-0.5">{exam.date ? new Date(exam.date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="mt-1">
                                  <span className="text-[7px] text-[#9CA3AF] uppercase font-mono block">Start Time</span>
                                  <span className="block font-mono text-[9px] text-emerald-700 mt-0.5">{new Date(exam.startTime).toLocaleTimeString()}</span>
                                </div>
                                <div className="mt-1">
                                  <span className="text-[7px] text-[#9CA3AF] uppercase font-mono block">End Time</span>
                                  <span className="block font-mono text-[9px] text-red-700 mt-0.5">{new Date(exam.endTime).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {listTab === 'Rejected' && (
                        <>
                          <div className="col-span-2 pt-2 border-t border-gray-50 mt-1 space-y-1.5 text-[#6B7280]">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Rejected By</span>
                                <span className="block font-bold text-red-700 mt-0.5">{exam.rejectedBy?.name || 'Admin'}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Rejected Date</span>
                                <span className="block font-bold font-mono text-[#1D1D1F] mt-0.5">
                                  {exam.rejectedDate ? new Date(exam.rejectedDate).toLocaleDateString() : new Date(exam.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl">
                              <span className="text-[8px] text-red-800 font-mono uppercase font-bold block">Rejection Reason</span>
                              <p className="mt-0.5 leading-relaxed font-semibold text-red-950 text-[10px]">{exam.rejectionReason || 'No feedback reason provided.'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 mt-6 border-t border-gray-100">
                    {listTab === 'Draft' && (
                      <>
                        <button
                          onClick={() => handleEditDraft(exam._id)}
                          className="flex-1 py-2 rounded-xl text-[10px] bg-[#F8ECEF] hover:bg-[#F8ECEF]/80 text-[#8C1D40] font-bold transition-all text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicateExam(exam._id)}
                          className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-250/20 hover:bg-gray-100 text-[#6B7280] transition-all"
                          title="Duplicate"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleSubmitForApproval(exam._id)}
                          className="flex-1 py-2 rounded-xl text-[10px] bg-[#8C1D40] text-white font-bold hover:opacity-95 transition-all text-center active:scale-95"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam._id)}
                          className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}

                    {listTab === 'Pending Approval' && (
                      <div className="w-full flex items-center justify-between gap-3 text-xs">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-500/20 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                          Pending Admin Review
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditDraft(exam._id)}
                            className="py-1.5 px-3 rounded-lg bg-gray-50 border border-gray-200 text-[#6B7280] hover:text-[#1D1D1F] hover:bg-gray-100 transition-all text-[10px] font-bold"
                          >
                            Preview Details
                          </button>
                          <button
                            onClick={() => handleDuplicateExam(exam._id)}
                            className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[#6B7280] hover:bg-gray-100 hover:text-[#1D1D1F] transition-all"
                            title="Clone"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {listTab === 'Approved' && (
                      <div className="w-full flex gap-2">
                        <button
                          onClick={() => handleEditDraft(exam._id)}
                          className="flex-1 py-2 rounded-xl bg-[#F8ECEF] text-[#8C1D40] hover:bg-[#F8ECEF]/80 transition-all text-[10px] font-bold text-center"
                        >
                          Preview Details
                        </button>
                        <button
                          onClick={() => handleDuplicateExam(exam._id)}
                          className="flex-1 py-2 rounded-xl bg-gray-50 border border-gray-250/20 hover:bg-gray-100 text-[#6B7280] transition-all text-[10px] font-bold flex items-center justify-center gap-1.5"
                        >
                          <Copy size={12} />
                          Clone Exam
                        </button>
                      </div>
                    )}

                    {listTab === 'Rejected' && (
                      <>
                        <button
                          onClick={() => handleEditDraft(exam._id)}
                          className="flex-1 py-2 rounded-xl text-[10px] bg-[#F8ECEF] text-[#8C1D40] font-bold hover:bg-[#F8ECEF]/80 transition-all text-center"
                        >
                          Edit & Correct
                        </button>
                        <button
                          onClick={() => handleSubmitForApproval(exam._id)}
                          className="flex-1 py-2 rounded-xl text-[10px] bg-[#8C1D40] text-white font-bold hover:opacity-95 transition-all text-center active:scale-95 animate-pulse"
                        >
                          Resubmit
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam._id)}
                          className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          FORM MODE
          ---------------------------------------------------- */}
      {mode === 'form' && (
        <div className="bg-white p-6 rounded-[28px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-6">
          
          {/* Form Header */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F8ECEF] border border-[#8C1D40]/10 text-[#8C1D40] text-[9px] font-bold uppercase tracking-wider font-mono">
                {editingExamId ? 'Update Mode' : 'New Configuration'}
              </span>
              <h2 className="text-base font-extrabold text-[#1D1D1F] mt-1.5">
                {editingExamId ? `Edit Exam: ${title}` : 'Configure New Assessment'}
              </h2>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Discard unsaved modifications and return to dashboard?')) {
                  resetForm();
                  setMode('list');
                  fetchExams();
                }
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs inside Creation Flow */}
          <div className="flex border-b border-gray-100 bg-white p-1 rounded-xl shadow-xs w-max gap-1">
            {[
              { id: 'details', label: '1. Exam Details', icon: <Settings size={12} /> },
              { id: 'questions', label: '2. Select Questions', icon: <CheckSquare size={12} />, disabled: !selectedSubjectId },
              { id: 'preview', label: '3. Preview & Submit', icon: <Eye size={12} />, disabled: !selectedSubjectId },
            ].map((tab) => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setFormTab(tab.id)}
                className={`px-4 py-2 font-bold text-xs rounded-lg transition-all flex items-center gap-2 relative ${
                  formTab === tab.id
                    ? 'bg-[#8C1D40] text-white shadow-xs'
                    : tab.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-[#6B7280] hover:text-[#8C1D40]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="py-2">
            
            {/* ----------------- TAB 1: DETAILS ----------------- */}
            {formTab === 'details' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#6B7280] font-semibold text-xs">
                  {/* Subject Selection (Triggers automapping) */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Select Subject *
                    </span>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={editingExamId && editingExamId !== null}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none disabled:opacity-65"
                    >
                      <option value="">-- Choose Assigned Subject --</option>
                      {assignments.map((asg) => (
                        <option key={asg.subject?._id} value={asg.subject?._id}>
                          {asg.subject?.name} ({asg.subject?.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-[#9CA3AF] font-medium mt-0.5">
                      Allows creation only for subjects mapped to your instruction profile.
                    </p>
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Exam Title *
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Data Structures Internal Assessment I"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Exam Description
                    </span>
                    <textarea
                      placeholder="Brief summary of syllabus coverage or student groups..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
                    />
                  </div>

                  {/* Auto-populated Academic Mapping Header */}
                  {selectedSubjectId && (
                    <div className="md:col-span-2 p-4 bg-[#F8ECEF]/40 border border-[#8C1D40]/10 rounded-2xl space-y-3">
                      <span className="text-[9px] font-mono font-bold text-[#8C1D40] uppercase tracking-wider block">
                        Assigned Academic Mapping (Auto-Resolved)
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold text-[#6B7280]">
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Department</span>
                          <span className="block font-bold text-[#1D1D1F] mt-0.5">{mappedDept?.name || 'N/A'} ({mappedDept?.code})</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Course</span>
                          <span className="block font-bold text-[#1D1D1F] mt-0.5">{mappedCourse?.name || 'N/A'} ({mappedCourse?.code})</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Semester</span>
                          <span className="block font-bold text-[#1D1D1F] mt-0.5">Semester {mappedSem?.semesterNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Academic Session</span>
                          <span className="block font-bold text-[#C74B74] mt-0.5">AY {mappedAcademicYear || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exam Type */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Exam Type *
                    </span>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
                    >
                      <option value="Internal">Internal Test</option>
                      <option value="Model">Model Exam</option>
                      <option value="Unit Test">Unit Test</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Quiz">Quiz</option>
                      <option value="Midterm">Midterm</option>
                      <option value="End-Semester">End-Semester</option>
                      <option value="Mock">Mock Exam</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Duration (Minutes) *
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || '')}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
                    />
                  </div>

                  {/* Total Marks */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Total Marks *
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || '')}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
                    />
                  </div>

                  {/* Pass Marks */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Pass Marks *
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(parseInt(e.target.value, 10) || '')}
                      className={`p-3 bg-white border rounded-xl text-xs font-bold text-[#1D1D1F] focus:outline-none focus:border-[#8C1D40]/30 ${
                        passingMarks > totalMarks ? 'border-red-500 text-red-500' : 'border-gray-200'
                      }`}
                    />
                    {passingMarks > totalMarks && (
                      <span className="text-[9px] text-red-500 font-bold mt-0.5">Passing marks cannot exceed total marks.</span>
                    )}
                  </div>

                  {/* Negative Marks */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Negative Marks (Optional, leave 0 if none)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={0.25}
                      value={negativeMarks}
                      onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">
                      Exam Instructions / Rules
                    </span>
                    <textarea
                      placeholder="Add exam instructions (e.g., Candidates must answer all questions, Calculators not allowed)..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={3}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    disabled={!selectedSubjectId || passingMarks > totalMarks}
                    onClick={() => setFormTab('questions')}
                    className="px-5 py-2.5 rounded-xl bg-[#8C1D40] hover:opacity-95 text-white font-bold transition-all text-xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                  >
                    Next: Question Selection
                    <ArrowLeft size={13} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* ----------------- TAB 2: QUESTIONS ----------------- */}
            {formTab === 'questions' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Live Validation Bar */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
                  calculatedSumMarks === totalMarks
                    ? 'bg-emerald-50 border-emerald-500/20 text-emerald-800'
                    : 'bg-amber-50 border-amber-500/20 text-amber-900'
                }`}>
                  <div className="text-xs font-semibold text-[#6B7280]">
                    <p className="font-extrabold text-[#1D1D1F] flex items-center gap-1.5 text-sm">
                      {calculatedSumMarks === totalMarks ? <CheckCircle2 size={15} className="text-emerald-600 animate-pulse" /> : <AlertTriangle size={15} className="text-amber-600" />}
                      Live Validation Checks
                    </p>
                    <p className="text-[11px] mt-1 font-semibold leading-relaxed">
                      Selected: <strong className="text-[#1D1D1F] font-bold">{selectedQuestions.length} Questions</strong>, totaling{' '}
                      <strong className="font-mono text-[#1D1D1F] font-bold">{calculatedSumMarks} marks</strong>. Target Marks:{' '}
                      <strong className="font-mono text-[#1D1D1F] font-bold">{totalMarks}</strong>.
                    </p>
                  </div>
                  {calculatedSumMarks === totalMarks ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider">
                      Ready
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold uppercase tracking-wider">
                      Mismatch ({calculatedSumMarks - totalMarks > 0 ? '+' : ''}{calculatedSumMarks - totalMarks})
                    </span>
                  )}
                </div>

                {/* Filters Row */}
                <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-4">
                  <span className="text-[9px] font-mono font-bold text-[#8C1D40] uppercase tracking-wider block">
                    Question Bank Filters
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold text-[#6B7280]">
                    {/* Search */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Search Text</span>
                      <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Search questions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8C1D40]/30 text-[#1D1D1F]"
                        />
                        <button type="submit" className="p-2.5 bg-[#8C1D40] text-white rounded-xl flex items-center justify-center hover:opacity-95">
                          <Search size={14} />
                        </button>
                      </form>
                    </div>

                    {/* Filter Unit */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Unit</span>
                      <select
                        value={unitFilter}
                        onChange={(e) => {
                          setUnitFilter(e.target.value);
                          setTopicFilter('');
                          setQuestionPage(1);
                        }}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30"
                      >
                        <option value="">-- All Units --</option>
                        {syllabusUnits.map((u) => (
                          <option key={u._id} value={u._id}>
                            Unit {u.unitNumber}: {u.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Topic */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Topic</span>
                      <select
                        value={topicFilter}
                        disabled={!unitFilter}
                        onChange={(e) => {
                          setTopicFilter(e.target.value);
                          setQuestionPage(1);
                        }}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 disabled:opacity-50"
                      >
                        <option value="">-- All Topics --</option>
                        {getTopicsForSelectedUnit().map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Difficulty */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Difficulty</span>
                      <select
                        value={difficultyFilter}
                        onChange={(e) => {
                          setDifficultyFilter(e.target.value);
                          setQuestionPage(1);
                        }}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30"
                      >
                        <option value="">-- All Difficulties --</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3.5 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 text-[#6B7280] hover:bg-gray-50 text-[10px] font-bold"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={fetchQuestionsFromBank}
                      className="px-3.5 py-2 rounded-xl bg-[#F8ECEF] text-[#8C1D40] border border-[#8C1D40]/5 hover:bg-[#F8ECEF]/80 text-[10px] font-bold"
                    >
                      Reload Bank
                    </button>
                  </div>
                </div>

                {/* Questions Selection Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Bank Questions Table (2/3 width) */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-extrabold text-[#1D1D1F] flex items-center gap-1.5">
                      <Database size={15} className="text-[#8C1D40]" />
                      Available Approved Questions ({totalQuestionsInBank})
                    </h3>

                    {loadingQuestions ? (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-gray-50 rounded-xl border border-gray-100"></div>
                        ))}
                      </div>
                    ) : bankQuestions.length === 0 ? (
                      <div className="p-12 text-center border border-[rgba(140,29,64,0.08)] rounded-[24px] bg-white shadow-xs">
                        <AlertTriangle size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-[#6B7280] font-bold">No questions match filters.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-[rgba(140,29,64,0.08)] rounded-[24px] bg-white shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[#6B7280] font-mono text-[9px] font-bold uppercase tracking-wider">
                              <th className="p-3.5 w-12 text-center">Select</th>
                              <th className="p-3.5">Question Prompt</th>
                              <th className="p-3.5 w-24 text-center">Difficulty</th>
                              <th className="p-3.5 w-20 text-center">Marks</th>
                              <th className="p-3.5 w-16 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bankQuestions.map((q) => {
                              const isSelected = selectedQuestions.some((sq) => sq.questionId === q._id);
                              return (
                                <tr
                                  key={q._id}
                                  className={`border-b border-gray-100 hover:bg-[#F8ECEF]/20 transition-colors ${
                                    isSelected ? 'bg-[#F8ECEF]/10 font-bold' : ''
                                  }`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleQuestion(q)}
                                      className="w-4 h-4 rounded border-gray-200 text-[#8C1D40] focus:ring-[#8C1D40]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <p className="line-clamp-2 leading-relaxed text-[#1D1D1F] font-semibold text-xs">
                                      {q.Question || q.text}
                                    </p>
                                    <div className="flex gap-2 mt-2 text-[9px] text-[#6B7280] font-bold">
                                      <span className="bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                                        {getUnitName(q.UnitId)}
                                      </span>
                                      {q.GeneratedBy && (
                                        <span className="bg-[#F8ECEF] text-[#8C1D40] border border-[#8C1D40]/5 px-1.5 py-0.5 rounded uppercase font-mono">
                                          {q.GeneratedBy}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      q.difficulty === 'Easy'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/20'
                                        : q.difficulty === 'Medium'
                                        ? 'bg-amber-50 text-amber-700 border-amber-500/20'
                                        : 'bg-red-50 text-[#8C1D40] border-red-500/20'
                                    }`}>
                                      {q.difficulty}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-xs text-[#1D1D1F]">{q.marks || 1}</td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewQuestion(q);
                                        setPreviewDrawerOpen(true);
                                      }}
                                      className="p-1.5 bg-gray-50 border border-gray-200 hover:bg-[#F8ECEF] text-[#6B7280] hover:text-[#8C1D40] rounded-xl transition-all"
                                      title="Preview Details"
                                    >
                                      <Eye size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalQuestionsInBank > questionLimit && (
                      <div className="flex justify-between items-center text-[10px] text-[#6B7280] font-bold pt-2">
                        <span>
                          Showing {(questionPage - 1) * questionLimit + 1} -{' '}
                          {Math.min(questionPage * questionLimit, totalQuestionsInBank)} of{' '}
                          {totalQuestionsInBank}
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={questionPage === 1}
                            onClick={() => setQuestionPage(questionPage - 1)}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <button
                            disabled={questionPage * questionLimit >= totalQuestionsInBank}
                            onClick={() => setQuestionPage(questionPage + 1)}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Selected Questions Marks Config (1/3 width) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-extrabold text-[#1D1D1F] flex items-center gap-1.5">
                        <CheckSquare size={15} className="text-[#8C1D40]" />
                        Selected Questions ({selectedQuestions.length})
                      </h3>
                      {selectedQuestions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedQuestions([])}
                          className="text-[9px] font-bold text-red-600 hover:opacity-85"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-[24px] border border-[rgba(140,29,64,0.08)] max-h-[460px] overflow-y-auto space-y-3.5 shadow-xs">
                      {selectedQuestions.length === 0 ? (
                        <div className="py-16 text-center text-[#6B7280] text-xs">
                          <PlusCircle size={28} className="text-gray-300 mx-auto mb-2" />
                          <p className="font-bold">No questions selected yet.</p>
                          <p className="text-[9px] text-[#9CA3AF] mt-0.5 font-semibold">Toggle checkboxes on the left table.</p>
                        </div>
                      ) : (
                        selectedQuestions.map((q, idx) => (
                          <div
                            key={q.questionId}
                            className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between gap-3 text-[11px] font-semibold text-[#6B7280]"
                          >
                            <div className="flex-1 space-y-1">
                              <span className="font-mono text-[#8C1D40] text-[9px] font-bold block">
                                Question {idx + 1}
                              </span>
                              <p className="line-clamp-2 text-[#1D1D1F] leading-relaxed">
                                {q.questionObj?.Question || q.questionObj?.text}
                              </p>
                              <span className="text-[8px] bg-gray-200/50 px-1 py-0.5 rounded block w-max font-bold">
                                Default Marks: {q.questionObj?.marks || 1}
                              </span>
                            </div>

                            <div className="flex flex-col items-end gap-2.5">
                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => handleToggleQuestion(q.questionObj)}
                                className="text-red-500 opacity-70 hover:opacity-100"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>

                              {/* Marks config */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[8px] font-mono font-bold text-[#6B7280]">Marks:</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={q.marks}
                                  onChange={(e) => handleQuestionMarksChange(q.questionId, e.target.value)}
                                  className="w-10 p-1 border border-gray-200 rounded-lg font-bold text-center text-xs focus:outline-none focus:border-[#8C1D40]/30 text-[#1D1D1F]"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Next Page / Action buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setFormTab('details')}
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#6B7280] font-bold text-xs flex items-center gap-1.5"
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTab('preview')}
                    className="px-5 py-2.5 rounded-xl bg-[#8C1D40] text-white font-bold hover:opacity-95 transition-all text-xs flex items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    Next: Preview Exam
                    <ArrowLeft size={13} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* ----------------- TAB 3: PREVIEW ----------------- */}
            {formTab === 'preview' && (
              <div className="space-y-6 animate-in fade-in duration-200 text-[#1D1D1F]">
                {/* Print/Mockup Paper Layout */}
                <div className="border border-gray-150 bg-white text-[#202020] rounded-[24px] shadow-sm p-8 md:p-12 max-w-4xl mx-auto space-y-8 font-serif leading-relaxed relative overflow-hidden">
                  
                  {/* Decorative Header Mocks */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8C1D40]"></div>
                  
                  {/* Institutional Header */}
                  <div className="text-center space-y-1.5">
                    <h1 className="text-sm font-sans font-extrabold uppercase tracking-wider text-[#8C1D40]">
                      Oxford Global University
                    </h1>
                    <p className="text-[10px] font-sans font-bold text-[#6B7280] uppercase">
                      Department of {mappedDept?.name || 'Academic Studies'}
                    </p>
                    <p className="text-[10px] font-sans font-bold text-[#6B7280] uppercase">
                      Course: {mappedCourse?.name || 'N/A'} (Sem {mappedSem?.semesterNumber || 'N/A'})
                    </p>
                    <p className="text-[10px] font-sans font-bold text-[#6B7280] uppercase">
                      Academic Year: {mappedAcademicYear}
                    </p>
                  </div>

                  {/* Exam Details Bar */}
                  <div className="border-t-2 border-b-2 border-gray-200 py-4 grid grid-cols-2 gap-4 text-xs font-sans font-extrabold text-[#1D1D1F]">
                    <div className="space-y-1.5">
                      <p>EXAM: <span className="font-semibold text-[#6B7280]">{title}</span></p>
                      <p>SUBJECT: <span className="font-semibold text-[#6B7280]">{assignments.find(a => a.subject?._id === selectedSubjectId)?.subject?.name || 'N/A'} ({assignments.find(a => a.subject?._id === selectedSubjectId)?.subject?.code || ''})</span></p>
                      <p>TYPE: <span className="font-semibold text-[#6B7280]">{examType}</span></p>
                    </div>
                    <div className="space-y-1.5 text-right font-sans font-extrabold text-[#1D1D1F]">
                      <p>DURATION: <span className="font-semibold text-[#6B7280]">{durationMinutes} Minutes</span></p>
                      <p>TOTAL MARKS: <span className="font-semibold text-[#6B7280]">{totalMarks} Marks</span></p>
                      <p>PASSING MARKS: <span className="font-semibold text-[#6B7280]">{passingMarks} Marks</span></p>
                      {negativeMarks > 0 && (
                        <p>NEGATIVE MARKS: <span className="font-extrabold text-red-600">-{negativeMarks} per incorrect response</span></p>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2 font-sans text-xs">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8C1D40] border-b border-gray-150 pb-1">
                      Instructions to Candidates
                    </h4>
                    <p className="text-[10px] leading-relaxed text-[#6B7280] font-semibold whitespace-pre-wrap">
                      {instructions ||
                        '1. Answer all questions honestly.\n2. Ensure total coverage of questions.\n3. Digital devices and smartwatches are strictly forbidden inside the testing perimeter.'}
                    </p>
                  </div>

                  {/* Questions Paper body */}
                  <div className="space-y-8 font-sans text-xs">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8C1D40] border-b border-gray-150 pb-1 mb-4">
                      Section A: Multiple Choice Questions
                    </h4>

                    {selectedQuestions.length === 0 ? (
                      <p className="text-center text-xs italic text-[#6B7280] py-8">
                        No questions selected. Go to tab 2 to select questions.
                      </p>
                    ) : (
                      selectedQuestions.map((sq, idx) => (
                        <div key={sq.questionId} className="space-y-3.5 text-xs text-[#1D1D1F]">
                          <div className="flex justify-between items-start font-extrabold">
                            <span className="flex gap-2">
                              <span>Q{idx + 1}.</span>
                              <span className="leading-relaxed">{sq.questionObj?.Question || sq.questionObj?.text}</span>
                            </span>
                            <span className="font-mono text-[10px] font-bold text-[#8C1D40] shrink-0 ml-4">
                              [{sq.marks} Marks]
                            </span>
                          </div>

                          {/* Options MCQ rendering */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 font-semibold text-[#6B7280] text-[11px]">
                            {['A', 'B', 'C', 'D'].map((opt) => {
                              const optText = sq.questionObj?.[`Option${opt}`] || sq.questionObj?.options?.find(o => o.optionLetter === opt)?.optionText;
                              const isCorrect = sq.questionObj?.CorrectAnswer === opt;
                              return (
                                <div
                                  key={opt}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                                    isCorrect
                                      ? 'bg-green-50/10 border-green-500/20 text-green-850 font-bold'
                                      : 'border-gray-100 bg-white'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] font-mono shrink-0 ${
                                    isCorrect ? 'bg-green-500 text-white shadow-xs' : 'bg-[#8C1D40]/10 text-[#8C1D40]'
                                  }`}>
                                    {opt}
                                  </span>
                                  <span className="truncate">{optText || 'Option value placeholder'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Validation warnings before submit */}
                {calculatedSumMarks !== totalMarks && (
                  <div className="p-4 rounded-xl border bg-amber-50 border-amber-100 text-amber-900 text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-amber-950">Total Marks Mismatch Warning</p>
                      <p className="text-[10px] opacity-85 mt-1 leading-relaxed">
                        Sum of question marks ({calculatedSumMarks}) must equal exam total marks ({totalMarks}) before you can submit for approval. You can still save it as a draft.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation and Action panel */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setFormTab('questions')}
                    className="px-4 py-2 rounded-xl border border-gray-250/20 hover:bg-gray-50 text-[#6B7280] font-bold text-xs flex items-center gap-1.5"
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>

                  <div className="flex gap-2.5">
                    {['Draft', 'Rejected'].includes(editingExamStatus) ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-250/20 text-[#6B7280] font-bold hover:bg-[#F8ECEF] hover:text-[#8C1D40] text-xs transition-all"
                        >
                          {editingExamId ? 'Update Draft' : 'Save Draft'}
                        </button>
                        <button
                          type="button"
                          disabled={selectedQuestions.length === 0 || calculatedSumMarks !== totalMarks}
                          onClick={() => handleSubmitForApproval()}
                          className="px-5 py-2.5 rounded-xl bg-[#8C1D40] text-white font-bold hover:opacity-95 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#8C1D40]/10 active:scale-95 flex items-center gap-1.5"
                        >
                          <Send size={13} />
                          Submit for Approval
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono">
                        Read-Only Review Mode
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SINGLE QUESTION PREVIEW SIDEBAR DRAWER
          ---------------------------------------------------- */}
      <AnimatePresence>
        {previewDrawerOpen && previewQuestion && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDrawerOpen(false)}
              className="fixed inset-0"
            ></motion.div>

            {/* Slide over */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-gray-150 p-6 flex flex-col justify-between z-10 overflow-y-auto"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-500/15 text-emerald-800 text-[9px] font-bold uppercase tracking-wider font-mono">
                      Question Preview
                    </span>
                    <h3 className="text-base font-extrabold text-[#1D1D1F] mt-1.5">Question details</h3>
                  </div>
                  <button
                    onClick={() => setPreviewDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 text-[#6B7280]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-5 text-xs font-semibold text-[#6B7280]">
                  {/* Meta details cards */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-[#6B7280] bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Difficulty</span>
                      <span className="block font-bold text-[#8C1D40] mt-0.5">{previewQuestion.difficulty}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Default Marks</span>
                      <span className="block font-bold text-[#1D1D1F] mt-0.5">{previewQuestion.marks || 1} Marks</span>
                    </div>
                    <div className="pt-2 border-t border-gray-250/20 mt-1 col-span-2 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Syllabus Unit</span>
                        <span className="block font-bold truncate text-[#1D1D1F] mt-0.5">{getUnitName(previewQuestion.UnitId)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#9CA3AF] uppercase font-mono block">Syllabus Topic</span>
                        <span className="block font-bold truncate text-[#1D1D1F] mt-0.5">{getTopicName(previewQuestion.TopicId)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Question Prompt</span>
                    <div className="p-4 bg-[#F8ECEF]/40 border border-[#8C1D40]/10 rounded-xl font-bold text-[#8C1D40] leading-relaxed text-xs">
                      {previewQuestion.Question || previewQuestion.text}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Options</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const optionText = previewQuestion[`Option${opt}`] || previewQuestion.options?.find(o => o.optionLetter === opt)?.optionText;
                        const isCorrect = previewQuestion.CorrectAnswer === opt;
                        return (
                          <div
                            key={opt}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-3 transition-colors ${
                              isCorrect
                                ? 'bg-green-50/10 border-green-500/20 text-green-800'
                                : 'bg-white border-gray-100 text-[#6B7280]'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] font-mono shrink-0 ${
                              isCorrect ? 'bg-green-500 text-white shadow-xs' : 'bg-[#8C1D40]/10 text-[#8C1D40]'
                            }`}>
                              {opt}
                            </span>
                            <span className="truncate">{optionText || 'Option value placeholder'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  {(previewQuestion.Explanation || previewQuestion.explanation) && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Explanation</span>
                      <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl leading-relaxed text-[#6B7280]">
                        {previewQuestion.Explanation || previewQuestion.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-8 bg-white">
                <button
                  type="button"
                  onClick={() => setPreviewDrawerOpen(false)}
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
};

export default StaffExams;
