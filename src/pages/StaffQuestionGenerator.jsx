import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, BookOpen, FileText, Search, X, ShieldAlert, Edit3,
  Copy, RefreshCw, Trash2, CheckCircle2, Hourglass, Plus, Layers, Send, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const StaffQuestionGenerator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Resolve query parameter for subject
  const queryParams = new URLSearchParams(location.search);
  const initialSubjectId = queryParams.get('subjectId') || '';

  // Core Data States
  const [assignments, setAssignments] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);
  const [subjectSyllabus, setSubjectSyllabus] = useState(null);
  
  // Form States
  const [selectedUnits, setSelectedUnits] = useState([]); // Array of UnitId strings
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(10);
  
  // List States
  const [drafts, setDrafts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [page, setPage] = useState(1);
  
  // Loading & Loading Stepper States
  const [initialLoading, setInitialLoading] = useState(true);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null); // ID of question undergoing single action like delete/regen/duplicate
  
  // Step tracker during AI Question Generation
  const [generationStep, setGenerationStep] = useState(0);
  const generationSteps = [
    'Authenticating instructions...',
    'Analyzing selected units...',
    'Consulting Gemini AI model...',
    'Generating university-level questions...',
    'Structuring MCQ options...',
    'Validating JSON schema...',
    'Saving drafts to database...'
  ];

  // Modals & Dialogs States
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  
  // Model Forms States
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [manualForm, setManualForm] = useState({
    Question: '',
    OptionA: '',
    OptionB: '',
    OptionC: '',
    OptionD: '',
    CorrectAnswer: 'A',
    Explanation: '',
    Difficulty: 'Medium',
    UnitId: '',
    TopicId: ''
  });
  
  const [editForm, setEditForm] = useState({
    Question: '',
    OptionA: '',
    OptionB: '',
    OptionC: '',
    OptionD: '',
    CorrectAnswer: 'A',
    Explanation: '',
    Difficulty: 'Medium',
    UnitId: '',
    TopicId: ''
  });

  // Fetch initial configuration (assignments and syllabi status)
  const fetchInitialData = async () => {
    setInitialLoading(true);
    try {
      const assResponse = await api.get('/faculty-assignments/staff/me');
      const sylResponse = await api.get('/syllabi');
      
      if (assResponse.data && assResponse.data.success) {
        setAssignments(assResponse.data.data.assignments || []);
      }
      if (sylResponse.data && sylResponse.data.success) {
        setSyllabi(sylResponse.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load initial workspace configuration.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch syllabus details and draft questions when a subject is selected
  useEffect(() => {
    if (!selectedSubjectId) {
      setSubjectSyllabus(null);
      setSelectedUnits([]);
      setDrafts([]);
      return;
    }

    const loadSubjectData = async () => {
      try {
        // Fetch syllabus details
        const response = await api.get(`/syllabi/subject/${selectedSubjectId}`);
        if (response.data && response.data.success && response.data.data) {
          const syl = response.data.data;
          setSubjectSyllabus(syl);
          // Set default manual form unit/topic if units are available
          if (syl.units && syl.units.length > 0) {
            setManualForm(prev => ({
              ...prev,
              UnitId: syl.units[0]._id,
              TopicId: syl.units[0].topics && syl.units[0].topics.length > 0 ? syl.units[0].topics[0]._id : ''
            }));
          }
        } else {
          setSubjectSyllabus(null);
        }
      } catch (error) {
        setSubjectSyllabus(null);
        toast.error('Access denied or no syllabus found.');
      }
      
      // Load drafts
      fetchDrafts();
    };

    setPage(1);
    loadSubjectData();
  }, [selectedSubjectId]);

  // Load question drafts with search/filters/pagination
  const fetchDrafts = async () => {
    if (!selectedSubjectId) return;
    setDraftsLoading(true);
    try {
      const response = await api.get('/staff/questions/drafts', {
        params: {
          SubjectId: selectedSubjectId,
          Difficulty: filterDifficulty || undefined,
          GeneratedBy: filterOrigin || undefined,
          search: search || undefined,
          page,
          limit: 10
        }
      });
      if (response.data && response.data.success) {
        setDrafts(response.data.data.results || []);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to retrieve question drafts.');
    } finally {
      setDraftsLoading(false);
    }
  };

  // Re-fetch drafts when filter, search, or page changes
  useEffect(() => {
    fetchDrafts();
  }, [page, filterDifficulty, filterOrigin]);

  // Perform debounced search trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDrafts();
  };

  const handleResetSearch = () => {
    setSearch('');
    setPage(1);
    // Directly fetch without state delay
    setTimeout(() => fetchDrafts(), 50);
  };

  // Handle Multi-select of Units
  const handleUnitToggle = (unitId) => {
    if (selectedUnits.includes(unitId)) {
      setSelectedUnits(selectedUnits.filter(id => id !== unitId));
    } else {
      setSelectedUnits([...selectedUnits, unitId]);
    }
  };

  // Reset Generation Form
  const handleResetForm = () => {
    setSelectedUnits([]);
    setDifficulty('Medium');
    setQuestionCount(10);
    toast.success('Form parameters reset.');
  };

  // AI Question Generation Orchestrator
  const handleGenerateQuestions = async () => {
    if (!selectedSubjectId) {
      toast.error('Please select an assigned subject.');
      return;
    }
    if (selectedUnits.length === 0) {
      toast.error('Please select at least one unit to generate questions from.');
      return;
    }

    setGenerating(true);
    setGenerationStep(0);

    // Stepper timer for rich UX loading feedback
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < generationSteps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    try {
      const response = await api.post('/staff/questions/generate', {
        subjectId: selectedSubjectId,
        unitIds: selectedUnits,
        difficulty,
        questionCount
      });

      if (response.data && response.data.success) {
        clearInterval(stepInterval);
        setGenerationStep(generationSteps.length - 1);
        
        setTimeout(() => {
          setGenerating(false);
          toast.success(response.data.message || 'Questions generated successfully!');
          fetchDrafts();
        }, 800);
      }
    } catch (error) {
      clearInterval(stepInterval);
      setGenerating(false);
      toast.error(error.message || 'Unable to generate questions. Please try again.');
    }
  };

  // Add Manual Question
  const handleCreateManualQuestion = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/staff/questions/manual', {
        SubjectId: selectedSubjectId,
        ...manualForm
      });
      if (response.data && response.data.success) {
        toast.success('Manual question draft saved successfully.');
        setManualModalOpen(false);
        // Reset form
        setManualForm(prev => ({
          ...prev,
          Question: '',
          OptionA: '',
          OptionB: '',
          OptionC: '',
          OptionD: '',
          CorrectAnswer: 'A',
          Explanation: '',
          Difficulty: 'Medium'
        }));
        fetchDrafts();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save manual question draft.');
    }
  };

  // Duplicate Question Draft
  const handleDuplicateDraft = async (id) => {
    setActionLoadingId(id);
    try {
      const response = await api.post(`/staff/questions/${id}/duplicate`);
      if (response.data && response.data.success) {
        toast.success('Question draft duplicated successfully.');
        fetchDrafts();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to duplicate draft.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Regenerate Single Question
  const handleRegenerateDraft = async (id) => {
    setActionLoadingId(id);
    toast.loading('Regenerating question with Gemini...', { id: 'regen-toast' });
    try {
      const response = await api.post(`/staff/questions/${id}/regenerate`);
      if (response.data && response.data.success) {
        toast.success('Question regenerated successfully.', { id: 'regen-toast' });
        fetchDrafts();
      }
    } catch (error) {
      toast.error(error.message || 'Unable to generate questions. Please try again.', { id: 'regen-toast' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Question Draft
  const handleDeleteDraft = async () => {
    if (!selectedQuestionId) return;
    setActionLoadingId(selectedQuestionId);
    try {
      const response = await api.delete(`/staff/questions/${selectedQuestionId}`);
      if (response.data && response.data.success) {
        toast.success('Question draft deleted.');
        setDeleteConfirmOpen(false);
        fetchDrafts();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete question draft.');
    } finally {
      setActionLoadingId(null);
      setSelectedQuestionId(null);
    }
  };

  // Open Edit Modal and load current draft details
  const openEditModal = (q) => {
    setSelectedQuestionId(q._id);
    setEditForm({
      Question: q.Question,
      OptionA: q.OptionA,
      OptionB: q.OptionB,
      OptionC: q.OptionC,
      OptionD: q.OptionD,
      CorrectAnswer: q.CorrectAnswer,
      Explanation: q.Explanation,
      Difficulty: q.Difficulty,
      UnitId: q.UnitId,
      TopicId: q.TopicId
    });
    setEditModalOpen(true);
  };

  // Save Edit Changes
  const handleUpdateDraft = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/staff/questions/${selectedQuestionId}`, editForm);
      if (response.data && response.data.success) {
        toast.success('Question draft updated successfully.');
        setEditModalOpen(false);
        fetchDrafts();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update draft.');
    } finally {
      setSelectedQuestionId(null);
    }
  };

  // Bulk Submit questions for Approval
  const handleSubmitQuestions = async () => {
    setSubmitConfirmOpen(false);
    toast.loading('Submitting questions for approval...', { id: 'submit-toast' });
    try {
      const response = await api.post('/staff/questions/submit', {
        subjectId: selectedSubjectId
      });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Questions submitted for approval.', { id: 'submit-toast' });
        fetchDrafts();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit questions.', { id: 'submit-toast' });
    }
  };

  // Helpers to fetch names of Unit & Topic from syllabus structure
  const getUnitName = (unitId) => {
    if (!subjectSyllabus || !subjectSyllabus.units) return `Unit: ${unitId}`;
    const unit = subjectSyllabus.units.find(u => u._id === unitId);
    return unit ? `Unit ${unit.unitNumber}: ${unit.title}` : `Unit: ${unitId}`;
  };

  const getTopicName = (unitId, topicId) => {
    if (!subjectSyllabus || !subjectSyllabus.units) return `Topic: ${topicId}`;
    const unit = subjectSyllabus.units.find(u => u._id === unitId);
    if (!unit || !unit.topics) return `Topic: ${topicId}`;
    const topic = unit.topics.find(t => t._id === topicId);
    return topic ? topic.name : `Topic: ${topicId}`;
  };

  // Helper to verify syllabus state for current selected subject
  const currentSubjectSyllabusStatus = () => {
    const s = syllabi.find(sy => sy.subject === selectedSubjectId);
    return s ? s.status : 'None';
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-[24px] animate-pulse">
          <div className="h-8 bg-surface-container-high rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-surface-container-high rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 glass-panel p-6 rounded-[24px] h-[400px] animate-pulse"></div>
          <div className="lg:col-span-8 glass-panel p-6 rounded-[24px] h-[400px] animate-pulse"></div>
        </div>
      </div>
    );
  }

  const syllabusCompleted = currentSubjectSyllabusStatus() === 'Completed';

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#1D1D1F] mb-1">AI Question Generator</h2>
            <p className="text-[#6B7280] text-xs">
              Generate university-level MCQ questions from finalized syllabus documents using Google Gemini 2.5 Flash.
            </p>
          </div>
          
          {selectedSubjectId && syllabusCompleted && drafts.length > 0 && (
            <button
              onClick={() => setSubmitConfirmOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8C1D40] to-[#C74B74] hover:opacity-95 text-white font-bold text-xs transition-all shadow-md shadow-[#8C1D40]/10 flex items-center gap-2 active:scale-95 animate-pulse"
            >
              <Send size={13} />
              Submit All for Approval
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold text-[#1D1D1F] tracking-wider uppercase border-b border-gray-100 pb-2">Generator Settings</h3>

            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Select Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-[#8C1D40]/30 focus:outline-none text-xs font-bold text-[#1D1D1F]"
              >
                <option value="">-- Choose Subject --</option>
                {assignments.map((item) => {
                  const s = syllabi.find(sy => sy.subject === item.subject?._id);
                  const isComp = s?.status === 'Completed';
                  return (
                    <option key={item.subject?._id} value={item.subject?._id}>
                      {item.subject?.name} {isComp ? '🔓 Ready' : '🔒 Locked'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Show status if subject selected */}
            {selectedSubjectId && (
              <div className="text-[10px] font-bold">
                {syllabusCompleted ? (
                  <span className="text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-500/10 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 animate-pulse" />
                    Question Bank Unlocked (Syllabus Mapped)
                  </span>
                ) : (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-800 rounded-2xl space-y-2 mt-2">
                    <p className="font-semibold leading-relaxed text-xs">
                      Question Bank is locked. Please finalize the syllabus analyzer before generating questions.
                    </p>
                    <button
                      onClick={() => navigate(`/staff/syllabus/${selectedSubjectId}`)}
                      className="w-full py-2 bg-red-600 text-white font-bold text-[10px] rounded-xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <Layers size={11} />
                      Finalize Syllabus Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedSubjectId && syllabusCompleted && subjectSyllabus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-2"
              >
                {/* Select Units (Multi select checklist) */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Select Syllabus Unit(s)</label>
                  <div className="max-h-[160px] overflow-y-auto border border-gray-100 rounded-xl p-2 bg-[#FFFDFC]/40 space-y-1">
                    {subjectSyllabus.units && subjectSyllabus.units.map(unit => (
                      <label
                        key={unit._id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-[11px] font-semibold ${
                          selectedUnits.includes(unit._id)
                            ? 'bg-[#F8ECEF] text-[#8C1D40]'
                            : 'hover:bg-gray-50 text-[#6B7280]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnits.includes(unit._id)}
                          onChange={() => handleUnitToggle(unit._id)}
                          className="rounded border-gray-200 text-[#8C1D40] focus:ring-[#8C1D40]"
                        />
                        <span>Unit {unit.unitNumber}: {unit.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Difficulty Capsule Selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Easy', 'Medium', 'Hard'].map((lvl) => {
                      const isActive = difficulty === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            isActive
                              ? lvl === 'Easy'
                                ? 'bg-emerald-600 border-transparent text-white shadow-xs'
                                : lvl === 'Medium'
                                ? 'bg-amber-50 border-transparent text-white shadow-xs'
                                : 'bg-[#8C1D40] border-transparent text-white shadow-xs'
                              : 'bg-white hover:bg-gray-50 text-[#6B7280] border-gray-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Number of Questions Capsule */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Question Count</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 20, 30].map((num) => {
                      const isActive = questionCount === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuestionCount(num)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all text-center ${
                            isActive
                              ? 'bg-[#8C1D40] border-transparent text-white shadow-xs'
                              : 'bg-white hover:bg-gray-50 text-[#6B7280] border-gray-200'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Type (MCQ Read Only) */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Question Type</label>
                  <input
                    type="text"
                    value="MCQ (Multiple Choice)"
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-[#6B7280] cursor-not-allowed"
                  />
                </div>

                {/* Generate / Reset Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#6B7280] text-xs font-bold transition-all"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateQuestions}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-[#8C1D40] to-[#C74B74] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-[#8C1D40]/10 flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Brain size={14} />
                    Generate AI
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side: Generated Questions Drafts Console */}
        <div className="lg:col-span-8 space-y-6">
          {/* Action Tools Header */}
          <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#8C1D40]" />
              <h4 className="text-xs font-extrabold text-[#1D1D1F] tracking-wider uppercase">Question Bank Panel</h4>
            </div>

            {selectedSubjectId && syllabusCompleted && (
              <button
                type="button"
                onClick={() => {
                  if (subjectSyllabus?.units?.length > 0) {
                    setManualForm(prev => ({
                      ...prev,
                      UnitId: subjectSyllabus.units[0]._id,
                      TopicId: subjectSyllabus.units[0].topics?.length > 0 ? subjectSyllabus.units[0].topics[0]._id : ''
                    }));
                  }
                  setManualModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#F8ECEF] text-[#8C1D40] border border-[#8C1D40]/10 hover:bg-[#F8ECEF]/80 transition-all font-bold text-xs flex items-center gap-1.5 ml-auto md:ml-0 active:scale-95"
              >
                <Plus size={14} className="font-bold" />
                Create Manually
              </button>
            )}
          </div>

          {!selectedSubjectId ? (
            <div className="bg-white p-16 text-center rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <h4 className="text-sm font-bold text-[#1D1D1F]">Select a Subject</h4>
              <p className="text-[#6B7280] text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                Please pick an assigned subject from the left panel to load its finalized syllabus and manage your question bank.
              </p>
            </div>
          ) : draftsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] space-y-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-16"></div>
                  </div>
                  <div className="h-5 bg-gray-100 rounded w-3/4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(j => <div key={j} className="h-8 bg-gray-100 rounded w-full"></div>)}
                  </div>
                </div>
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <h4 className="text-sm font-bold text-[#1D1D1F]">No Questions in Drafts</h4>
              <p className="text-[#6B7280] text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                No question drafts found for this subject. Select your parameters and click **Generate AI** to start, or create a question manually.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters & Search Row */}
              <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <div className="md:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Search question texts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-[rgba(140,29,64,0.12)] text-xs font-semibold focus:outline-none focus:border-[#8C1D40]/30"
                  />
                  <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                  {search && (
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-[#8C1D40]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={filterDifficulty}
                  onChange={(e) => {
                    setFilterDifficulty(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white border border-[rgba(140,29,64,0.12)] text-xs font-bold text-[#1D1D1F]"
                >
                  <option value="">Difficulty: All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <select
                  value={filterOrigin}
                  onChange={(e) => {
                    setFilterOrigin(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white border border-[rgba(140,29,64,0.12)] text-xs font-bold text-[#1D1D1F]"
                >
                  <option value="">Created By: All</option>
                  <option value="AI">AI Generator</option>
                  <option value="Staff">Staff (Manual)</option>
                </select>
              </form>

              {/* Questions List Render */}
              <div className="space-y-4">
                {drafts.map((q, index) => {
                  const isActioning = actionLoadingId === q._id;
                  
                  return (
                    <motion.div
                      key={q._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white p-6 rounded-[24px] border relative overflow-hidden transition-all duration-300 ${
                        q.Status === 'Pending Approval'
                          ? 'border-[#C74B74]/20 bg-[#F8ECEF]/10'
                          : 'border-[rgba(140,29,64,0.08)] hover:border-[#8C1D40]/25'
                      }`}
                    >
                      {isActioning && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center z-10">
                          <div className="w-8 h-8 rounded-full border-2 border-[#8C1D40]/20 border-t-[#8C1D40] animate-spin"></div>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#F8ECEF] text-[#8C1D40] text-[9px] font-bold border border-[#8C1D40]/5 uppercase font-mono">
                            {getUnitName(q.UnitId).split(':')[0]}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-50 text-[#6B7280] text-[9px] font-bold border border-gray-100 truncate max-w-[150px]">
                            {getTopicName(q.UnitId, q.TopicId)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase ${
                            q.Difficulty === 'Easy'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-500/20'
                              : q.Difficulty === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-500/20'
                              : 'bg-red-50 text-red-700 border-red-500/20'
                          }`}>
                            {q.Difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-50 text-[#6B7280] text-[9px] font-bold border border-gray-100 uppercase font-mono">
                            By: {q.GeneratedBy}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                          q.Status === 'Pending Approval'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : q.Status === 'Needs Revision'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {q.Status}
                        </span>
                      </div>

                      {/* Question Text */}
                      <h4 className="text-sm font-extrabold text-[#1D1D1F] leading-relaxed mb-4">
                        Q{(pagination.page - 1) * pagination.limit + index + 1}. {q.Question}
                      </h4>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const optionText = q[`Option${opt}`];
                          const isCorrect = q.CorrectAnswer === opt;
                          return (
                            <div
                              key={opt}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-start gap-3 transition-colors ${
                                isCorrect
                                  ? 'bg-green-500/10 border-green-500/20 text-green-800 font-bold'
                                  : 'bg-white border-gray-100 text-[#6B7280]'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black font-mono text-[9px] mt-0.5 ${
                                isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-[#8C1D40]/10 text-[#8C1D40]'
                              }`}>
                                {opt}
                              </span>
                              <span className="flex-1 mt-0.5">{optionText}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.Explanation && (
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-semibold text-[#6B7280] leading-relaxed mb-4">
                          <span className="font-mono text-[#8C1D40] uppercase block font-bold mb-0.5">Explanation</span>
                          {q.Explanation}
                        </div>
                      )}

                      {/* Revision feedback banner */}
                      {q.Status === 'Needs Revision' && (
                        <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl text-xs font-semibold flex items-start gap-2 mb-4">
                          <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-800 block uppercase font-mono text-[9px]">Revision Required</span>
                            <span className="mt-0.5 block font-medium text-[11px] leading-relaxed">{q.RevisionReason || 'Please review and update question elements.'}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions footer if draft status */}
                      {['Draft', 'Needs Revision'].includes(q.Status) && (
                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(q)}
                            className="px-2.5 py-1.5 hover:bg-gray-50 rounded-lg text-[#6B7280] hover:text-[#8C1D40] transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Edit Draft"
                          >
                            <Edit3 size={13} />
                            Edit
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDuplicateDraft(q._id)}
                            className="px-2.5 py-1.5 hover:bg-gray-50 rounded-lg text-[#6B7280] hover:text-[#8C1D40] transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Duplicate Draft"
                          >
                            <Copy size={13} />
                            Duplicate
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRegenerateDraft(q._id)}
                            className="px-2.5 py-1.5 hover:bg-[#F8ECEF] rounded-lg text-[#6B7280] hover:text-[#8C1D40] transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Regenerate single question using Gemini"
                          >
                            <RefreshCw size={13} />
                            Regenerate
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuestionId(q._id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="px-2.5 py-1.5 hover:bg-red-50 rounded-lg text-[#6B7280] hover:text-red-600 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Delete Draft"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center pt-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors text-[#6B7280]"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono font-bold text-[#6B7280]">
                    Page {page} of {pagination.totalPages} ({pagination.total} Questions)
                  </span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors text-[#6B7280]"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GENERATING SCREEN / OVERLAY */}
      <AnimatePresence>
        {generating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-[rgba(140,29,64,0.08)] rounded-[32px] p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-[#8C1D40]/10 border-t-[#8C1D40] animate-spin"></div>
                <Brain size={36} className="text-[#8C1D40] absolute top-5 left-5 animate-pulse" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#1D1D1F]">Gemini Engine Running</h3>
                <p className="text-[#6B7280] text-xs mt-1">Generating MCQs from finalized curriculum text.</p>
              </div>

              {/* Dynamic Steps Loader */}
              <div className="w-full bg-gray-50 p-4 rounded-2xl text-left border border-gray-100">
                <div className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Process Stack</div>
                <div className="space-y-2">
                  {generationSteps.map((step, idx) => {
                    const isDone = generationStep > idx;
                    const isActive = generationStep === idx;
                    return (
                      <div key={idx} className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                        isDone ? 'text-emerald-700 font-bold' : isActive ? 'text-[#8C1D40] font-black' : 'text-gray-400'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        ) : isActive ? (
                          <RefreshCw size={13} className="text-[#8C1D40] animate-spin shrink-0" />
                        ) : (
                          <Hourglass size={13} className="text-gray-300 shrink-0" />
                        )}
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MANUAL QUESTION MODAL */}
      <AnimatePresence>
        {manualModalOpen && subjectSyllabus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManualModalOpen(false)}
              className="fixed inset-0"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[rgba(140,29,64,0.10)] rounded-[28px] shadow-2xl p-6 w-full max-w-2xl z-10 relative overflow-hidden flex flex-col max-h-[85vh] text-xs font-semibold text-[#6B7280]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#1D1D1F]">Create Manual Question</h3>
                  <p className="text-[10px] text-[#6B7280] font-semibold">Manually record draft MCQs mapping to unit topics.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-[#6B7280]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateManualQuestion} className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Form fields: Unit & Topic selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Syllabus Unit</label>
                    <select
                      value={manualForm.UnitId}
                      onChange={(e) => {
                        const unitId = e.target.value;
                        const unit = subjectSyllabus.units.find(u => u._id === unitId);
                        setManualForm(prev => ({
                          ...prev,
                          UnitId: unitId,
                          TopicId: unit && unit.topics?.length > 0 ? unit.topics[0]._id : ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#1D1D1F]"
                    >
                      {subjectSyllabus.units.map(u => (
                        <option key={u._id} value={u._id}>Unit {u.unitNumber}: {u.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Topic Mapped</label>
                    <select
                      value={manualForm.TopicId}
                      onChange={(e) => setManualForm(prev => ({ ...prev, TopicId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#1D1D1F]"
                    >
                      {(() => {
                        const unit = subjectSyllabus.units.find(u => u._id === manualForm.UnitId);
                        if (!unit || !unit.topics) return <option value="">-- No Topics --</option>;
                        return unit.topics.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Difficulty</label>
                  <select
                    value={manualForm.Difficulty}
                    onChange={(e) => setManualForm(prev => ({ ...prev, Difficulty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#1D1D1F]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Question input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Question Text</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Enter question text here..."
                    value={manualForm.Question}
                    onChange={(e) => setManualForm(prev => ({ ...prev, Question: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-[#8C1D40]/30 text-xs font-medium text-[#1D1D1F]"
                  ></textarea>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Option {opt}</label>
                      <input
                        type="text"
                        required
                        placeholder={`Text for Option ${opt}`}
                        value={manualForm[`Option${opt}`]}
                        onChange={(e) => setManualForm(prev => ({ ...prev, [`Option${opt}`]: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 focus:outline-none focus:border-[#8C1D40]/30 text-xs font-semibold text-[#1D1D1F]"
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Answer Select */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Correct Option</label>
                  <select
                    value={manualForm.CorrectAnswer}
                    onChange={(e) => setManualForm(prev => ({ ...prev, CorrectAnswer: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#8C1D40]"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                {/* Explanation */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Academic Explanation</label>
                  <textarea
                    rows="2"
                    placeholder="Provide explanatory context for correct selection..."
                    value={manualForm.Explanation}
                    onChange={(e) => setManualForm(prev => ({ ...prev, Explanation: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-[#8C1D40]/30 text-xs font-medium text-[#1D1D1F]"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold transition-all text-[#6B7280]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#8C1D40] text-white hover:opacity-95 text-xs font-bold transition-all shadow-xs"
                  >
                    Save Draft
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT QUESTION MODAL */}
      <AnimatePresence>
        {editModalOpen && subjectSyllabus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditModalOpen(false);
                setSelectedQuestionId(null);
              }}
              className="fixed inset-0"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[rgba(140,29,64,0.10)] rounded-[28px] shadow-2xl p-6 w-full max-w-2xl z-10 relative overflow-hidden flex flex-col max-h-[85vh] text-xs font-semibold text-[#6B7280]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#1D1D1F]">Edit Question Draft</h3>
                  <p className="text-[10px] text-[#6B7280] font-semibold">Adjust details of draft question and save modifications.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedQuestionId(null);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 text-[#6B7280]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateDraft} className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Syllabus Unit</label>
                    <select
                      value={editForm.UnitId}
                      onChange={(e) => {
                        const unitId = e.target.value;
                        const unit = subjectSyllabus.units.find(u => u._id === unitId);
                        setEditForm(prev => ({
                          ...prev,
                          UnitId: unitId,
                          TopicId: unit && unit.topics?.length > 0 ? unit.topics[0]._id : ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#1D1D1F]"
                    >
                      {subjectSyllabus.units.map(u => (
                        <option key={u._id} value={u._id}>Unit {u.unitNumber}: {u.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Topic Mapped</label>
                    <select
                      value={editForm.TopicId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, TopicId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#1D1D1F]"
                    >
                      {(() => {
                        const unit = subjectSyllabus.units.find(u => u._id === editForm.UnitId);
                        if (!unit || !unit.topics) return <option value="">-- No Topics --</option>;
                        return unit.topics.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Difficulty</label>
                  <select
                    value={editForm.Difficulty}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Difficulty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#1D1D1F]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Question Text</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Enter question text here..."
                    value={editForm.Question}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Question: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-[#8C1D40]/30 text-xs font-medium text-[#1D1D1F]"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Option {opt}</label>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${opt} Text`}
                        value={editForm[`Option${opt}`]}
                        onChange={(e) => setEditForm(prev => ({ ...prev, [`Option${opt}`]: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 focus:outline-none focus:border-[#8C1D40]/30 text-xs font-semibold text-[#1D1D1F]"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Correct Option</label>
                  <select
                    value={editForm.CorrectAnswer}
                    onChange={(e) => setEditForm(prev => ({ ...prev, CorrectAnswer: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#8C1D40]"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Academic Explanation</label>
                  <textarea
                    rows="2"
                    placeholder="Provide explanatory context for correct selection..."
                    value={editForm.Explanation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Explanation: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-[#8C1D40]/30 text-xs font-medium text-[#1D1D1F]"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setSelectedQuestionId(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold transition-all text-[#6B7280]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#8C1D40] text-white hover:opacity-95 text-xs font-bold transition-all shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 rounded-[24px] shadow-2xl p-6 max-w-sm w-full z-10 relative overflow-hidden"
            >
              <h3 className="text-sm font-extrabold text-[#1D1D1F] mb-1">Delete Question Draft?</h3>
              <p className="text-[#6B7280] text-xs mb-4 leading-relaxed font-semibold">
                Are you sure you want to delete this question? This action will move it to trash and cannot be undone directly.
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-105">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setSelectedQuestionId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[#6B7280]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDraft}
                  className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM SUBMIT DIALOG */}
      <AnimatePresence>
        {submitConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 rounded-[24px] shadow-2xl p-6 max-w-sm w-full z-10 relative overflow-hidden"
            >
              <h3 className="text-sm font-extrabold text-[#1D1D1F] mb-1">Submit All for Approval?</h3>
              <p className="text-[#6B7280] text-xs mb-4 leading-relaxed font-semibold">
                This will submit all draft questions for this subject to the Admin for final review. You will not be able to edit them while pending approval.
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-105">
                <button
                  type="button"
                  onClick={() => setSubmitConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[#6B7280]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitQuestions}
                  className="px-4 py-2 text-xs font-bold bg-[#8C1D40] text-white rounded-xl hover:opacity-95 transition-all shadow-xs"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffQuestionGenerator;
