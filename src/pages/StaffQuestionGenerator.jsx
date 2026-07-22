import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-[24px] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-1">AI Question Generator</h2>
            <p className="text-on-surface-variant text-xs">
              Generate university-level MCQ questions from finalized syllabus documents using Google Gemini 2.5 Flash.
            </p>
          </div>
          
          {selectedSubjectId && syllabusCompleted && drafts.length > 0 && (
            <button
              onClick={() => setSubmitConfirmOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container hover:text-primary transition-all shadow-lg shadow-primary/10 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">send_and_archive</span>
              Submit All for Approval
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-[24px] space-y-4">
            <h3 className="text-sm font-bold text-primary tracking-wider uppercase">Generator Settings</h3>

            {/* Subject Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Select Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-primary/10 focus:border-primary focus:outline-none text-xs font-semibold"
              >
                <option value="">-- Choose Subject --</option>
                {assignments.map((item) => {
                  const s = syllabi.find(sy => sy.subject === item.subject?._id);
                  const isComp = s?.status === 'Completed';
                  return (
                    <option key={item.subject?._id} value={item.subject?._id}>
                      {item.subject?.name} {isComp ? '🔓' : '🔒'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Show status if subject selected */}
            {selectedSubjectId && (
              <div className="text-[10px] font-semibold">
                {syllabusCompleted ? (
                  <span className="text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock_open</span>
                    Question Bank Unlocked (Syllabus finalized)
                  </span>
                ) : (
                  <div className="p-3 bg-error/5 border border-error/10 text-error rounded-xl space-y-2 mt-2">
                    <p className="font-semibold leading-tight">
                      Question Bank is locked. Finalize the syllabus analyzer before generating questions.
                    </p>
                    <button
                      onClick={() => navigate(`/staff/syllabus/${selectedSubjectId}`)}
                      className="px-3 py-1 bg-error text-white font-bold text-[9px] rounded-lg hover:opacity-90"
                    >
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
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase block">Select Syllabus Unit(s)</label>
                  <div className="max-h-[160px] overflow-y-auto border border-primary/5 rounded-xl p-2 bg-surface-container-low space-y-1">
                    {subjectSyllabus.units && subjectSyllabus.units.map(unit => (
                      <label
                        key={unit._id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-[11px] font-semibold ${
                          selectedUnits.includes(unit._id)
                            ? 'bg-primary/5 text-primary'
                            : 'hover:bg-primary/5 text-on-surface-variant'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnits.includes(unit._id)}
                          onChange={() => handleUnitToggle(unit._id)}
                          className="rounded border-primary/10 text-primary focus:ring-primary"
                        />
                        <span>Unit {unit.unitNumber}: {unit.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Difficulty Capsule Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase block">Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Easy', 'Medium', 'Hard'].map((lvl) => {
                      const isActive = difficulty === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                            isActive
                              ? lvl === 'Easy'
                                ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                : lvl === 'Medium'
                                ? 'bg-yellow-500 border-yellow-500 text-white shadow-sm'
                                : 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-surface hover:bg-primary/5 text-on-surface-variant border-primary/10'
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
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase block">Question Count</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 20, 30].map((num) => {
                      const isActive = questionCount === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuestionCount(num)}
                          className={`py-2 rounded-lg border text-xs font-bold transition-all text-center ${
                            isActive
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-surface hover:bg-primary/5 text-on-surface-variant border-primary/10'
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
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Question Type</label>
                  <input
                    type="text"
                    value="MCQ (Multiple Choice Questions)"
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-primary/5 text-xs font-semibold text-on-surface-variant/75 cursor-not-allowed"
                  />
                </div>

                {/* Generate / Reset Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 rounded-xl border border-primary/10 hover:bg-primary/5 text-on-surface-variant text-xs font-bold transition-all"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateQuestions}
                    className="py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
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
          <div className="glass-panel p-4 rounded-[20px] flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              <h4 className="text-xs font-bold text-primary tracking-wider uppercase">Question Bank Panel</h4>
            </div>

            {selectedSubjectId && syllabusCompleted && (
              <button
                onClick={() => {
                  // Set default manual form values from syllabus
                  if (subjectSyllabus?.units?.length > 0) {
                    setManualForm(prev => ({
                      ...prev,
                      UnitId: subjectSyllabus.units[0]._id,
                      TopicId: subjectSyllabus.units[0].topics?.length > 0 ? subjectSyllabus.units[0].topics[0]._id : ''
                    }));
                  }
                  setManualModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-secondary/15 text-secondary border border-secondary/10 hover:bg-secondary/20 transition-all font-bold text-xs flex items-center gap-1.5 ml-auto md:ml-0"
              >
                <span className="material-symbols-outlined text-sm font-bold">add</span>
                Create Manually
              </button>
            )}
          </div>

          {!selectedSubjectId ? (
            <div className="glass-panel p-16 text-center rounded-[24px]">
              <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">school</span>
              <h4 className="text-base font-bold text-on-surface">Select a Subject</h4>
              <p className="text-on-surface-variant text-xs mt-1 max-w-sm mx-auto">
                Please pick an assigned subject from the left panel to load its finalized syllabus and manage your question bank.
              </p>
            </div>
          ) : draftsLoading ? (
            /* Skeleton Loading Questions */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-[24px] space-y-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-surface-container-high rounded w-1/4"></div>
                    <div className="h-4 bg-surface-container-high rounded w-16"></div>
                  </div>
                  <div className="h-5 bg-surface-container-high rounded w-3/4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(j => <div key={j} className="h-8 bg-surface-container-high rounded w-full"></div>)}
                  </div>
                </div>
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <div className="glass-panel p-16 text-center rounded-[24px]">
              <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">description</span>
              <h4 className="text-base font-bold text-on-surface">No Questions in Drafts</h4>
              <p className="text-on-surface-variant text-xs mt-1 max-w-sm mx-auto">
                No question drafts found for this subject. Select your parameters and click **Generate AI** to start, or create a question manually.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters & Search Row */}
              <form onSubmit={handleSearchSubmit} className="glass-panel p-4 rounded-[20px] grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <div className="md:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Search question texts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface border border-primary/10 text-xs focus:outline-none focus:border-primary font-medium"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant/40 text-[18px]">search</span>
                  {search && (
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="absolute right-3 top-2 text-on-surface-variant hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>

                <select
                  value={filterDifficulty}
                  onChange={(e) => {
                    setFilterDifficulty(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-surface border border-primary/10 text-xs font-semibold"
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
                  className="px-3 py-2 rounded-xl bg-surface border border-primary/10 text-xs font-semibold"
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
                      className={`glass-panel p-6 rounded-[24px] border relative overflow-hidden transition-all duration-300 ${
                        q.Status === 'Pending Approval'
                          ? 'border-secondary/15 bg-secondary/5'
                          : 'border-primary/5 hover:border-primary/10'
                      }`}
                    >
                      {isActioning && (
                        <div className="absolute inset-0 bg-surface/50 backdrop-blur-xs flex items-center justify-center z-10">
                          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[9px] font-semibold border border-primary/10 uppercase font-mono">
                            {getUnitName(q.UnitId).split(':')[0]}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[9px] font-bold border border-secondary/10 truncate max-w-[150px]">
                            {getTopicName(q.UnitId, q.TopicId)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase font-mono ${
                            q.Difficulty === 'Easy'
                              ? 'bg-green-500/10 text-green-700 border-green-500/20'
                              : q.Difficulty === 'Medium'
                              ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {q.Difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[9px] font-semibold border border-primary/5 uppercase font-mono">
                            By: {q.GeneratedBy}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          q.Status === 'Pending Approval'
                            ? 'bg-secondary text-white shadow-sm shadow-secondary/10'
                            : q.Status === 'Needs Revision'
                            ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/10'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {q.Status}
                        </span>
                      </div>

                      {/* Question Text */}
                      <h4 className="text-sm font-bold text-primary leading-snug mb-4">
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
                                  ? 'bg-green-500/15 border-green-500/35 text-green-800'
                                  : 'bg-surface-container-lowest/40 border-primary/5 text-on-surface-variant/80'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] mt-0.5 ${
                                isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-primary/10 text-primary'
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
                        <div className="p-3 bg-surface-container-low/60 rounded-xl text-[10px] font-semibold text-on-surface-variant border border-primary/5 mb-4">
                          <span className="font-mono text-primary uppercase block font-bold mb-0.5">Explanation</span>
                          {q.Explanation}
                        </div>
                      )}

                      {/* Revision feedback banner */}
                      {q.Status === 'Needs Revision' && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/25 text-yellow-800 rounded-xl text-[10px] font-semibold flex items-start gap-2 mb-4">
                          <span className="material-symbols-outlined text-[16px] font-bold">warning</span>
                          <div>
                            <span className="font-bold text-amber-800 block uppercase font-mono text-[9px]">Revision Required</span>
                            <span className="mt-0.5 block font-medium">{q.RevisionReason || 'Please review and update question elements.'}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions footer if draft status */}
                      {['Draft', 'Needs Revision'].includes(q.Status) && (
                        <div className="flex justify-end gap-2 pt-3 border-t border-primary/5 mt-2">
                          <button
                            onClick={() => openEditModal(q)}
                            className="p-1.5 hover:bg-primary/5 hover:text-primary rounded-lg text-on-surface-variant/60 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Edit Draft"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDuplicateDraft(q._id)}
                            className="p-1.5 hover:bg-primary/5 hover:text-primary rounded-lg text-on-surface-variant/60 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Duplicate Draft"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            Duplicate
                          </button>

                          <button
                            onClick={() => handleRegenerateDraft(q._id)}
                            className="p-1.5 hover:bg-primary/5 hover:text-primary rounded-lg text-on-surface-variant/60 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Regenerate single question using Gemini"
                          >
                            <span className="material-symbols-outlined text-[16px]">autorenew</span>
                            Regenerate
                          </button>

                          <button
                            onClick={() => {
                              setSelectedQuestionId(q._id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 hover:bg-error/5 hover:text-error rounded-lg text-on-surface-variant/60 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Delete Draft"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
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
                    className="px-4 py-2 text-xs font-bold bg-surface border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono font-bold text-on-surface-variant">
                    Page {page} of {pagination.totalPages} ({pagination.total} Questions)
                  </span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 text-xs font-bold bg-surface border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-primary/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                <span className="material-symbols-outlined text-4xl text-primary absolute top-5 left-5 animate-pulse">psychology</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-primary">Gemini Engine Running</h3>
                <p className="text-on-surface-variant text-xs mt-1">Generating MCQs from finalized curriculum text.</p>
              </div>

              {/* Dynamic Steps Loader */}
              <div className="w-full bg-surface-container p-4 rounded-2xl text-left border border-primary/5">
                <div className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider mb-2">Process Stack</div>
                <div className="space-y-1.5">
                  {generationSteps.map((step, idx) => {
                    const isDone = generationStep > idx;
                    const isActive = generationStep === idx;
                    return (
                      <div key={idx} className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${
                        isDone ? 'text-secondary font-semibold' : isActive ? 'text-primary font-bold' : 'text-on-surface-variant/45'
                      }`}>
                        <span className="material-symbols-outlined text-sm font-bold">
                          {isDone ? 'check_circle' : isActive ? 'autorenew' : 'hourglass_empty'}
                        </span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManualModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-primary/10 rounded-[28px] shadow-2xl p-6 w-full max-w-2xl z-10 relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary">Create Manual Question</h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold">Manually record draft MCQs mapping to unit topics.</p>
                </div>
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateManualQuestion} className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Form fields: Unit & Topic selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Syllabus Unit</label>
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
                      className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold"
                    >
                      {subjectSyllabus.units.map(u => (
                        <option key={u._id} value={u._id}>Unit {u.unitNumber}: {u.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Topic Mapped</label>
                    <select
                      value={manualForm.TopicId}
                      onChange={(e) => setManualForm(prev => ({ ...prev, TopicId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold"
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
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Difficulty</label>
                  <select
                    value={manualForm.Difficulty}
                    onChange={(e) => setManualForm(prev => ({ ...prev, Difficulty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Question input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Question Text</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Enter question text here..."
                    value={manualForm.Question}
                    onChange={(e) => setManualForm(prev => ({ ...prev, Question: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl bg-surface-container border border-primary/10 focus:outline-none focus:border-primary text-xs font-medium"
                  ></textarea>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Option {opt}</label>
                      <input
                        type="text"
                        required
                        placeholder={`Text for Option ${opt}`}
                        value={manualForm[`Option${opt}`]}
                        onChange={(e) => setManualForm(prev => ({ ...prev, [`Option${opt}`]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 focus:outline-none focus:border-primary text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Answer Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Correct Option</label>
                  <select
                    value={manualForm.CorrectAnswer}
                    onChange={(e) => setManualForm(prev => ({ ...prev, CorrectAnswer: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-bold text-primary"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                {/* Explanation */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Academic Explanation</label>
                  <textarea
                    rows="2"
                    placeholder="Provide explanatory context for correct selection..."
                    value={manualForm.Explanation}
                    onChange={(e) => setManualForm(prev => ({ ...prev, Explanation: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl bg-surface-container border border-primary/10 focus:outline-none focus:border-primary text-xs font-medium"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-primary/10 hover:bg-primary/5 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all shadow-md shadow-primary/10"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditModalOpen(false);
                setSelectedQuestionId(null);
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-primary/10 rounded-[28px] shadow-2xl p-6 w-full max-w-2xl z-10 relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary">Edit Question Draft</h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold">Adjust details of draft question and save modifications.</p>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedQuestionId(null);
                  }}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateDraft} className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Syllabus Unit</label>
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
                      className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold"
                    >
                      {subjectSyllabus.units.map(u => (
                        <option key={u._id} value={u._id}>Unit {u.unitNumber}: {u.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Topic Mapped</label>
                    <select
                      value={editForm.TopicId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, TopicId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold"
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
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Difficulty</label>
                  <select
                    value={editForm.Difficulty}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Difficulty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-semibold"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Question Text</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Enter question text here..."
                    value={editForm.Question}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Question: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl bg-surface-container border border-primary/10 focus:outline-none focus:border-primary text-xs font-medium"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase font-mono">Option {opt}</label>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${opt} Text`}
                        value={editForm[`Option${opt}`]}
                        onChange={(e) => setEditForm(prev => ({ ...prev, [`Option${opt}`]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 focus:outline-none focus:border-primary text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase font-mono">Correct Option</label>
                  <select
                    value={editForm.CorrectAnswer}
                    onChange={(e) => setEditForm(prev => ({ ...prev, CorrectAnswer: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-primary/10 text-xs font-bold text-primary"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Academic Explanation</label>
                  <textarea
                    rows="2"
                    placeholder="Provide explanatory context for correct selection..."
                    value={editForm.Explanation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Explanation: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl bg-surface-container border border-primary/10 focus:outline-none focus:border-primary text-xs font-medium"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setSelectedQuestionId(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-primary/10 hover:bg-primary/5 text-xs font-bold transition-all text-on-surface-variant"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all shadow-md shadow-primary/10"
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
              className="bg-surface border border-primary/10 rounded-[24px] shadow-2xl p-6 max-w-sm w-full z-10 relative overflow-hidden"
            >
              <h3 className="text-base font-bold text-primary mb-2">Delete Question Draft?</h3>
              <p className="text-on-surface-variant text-xs mb-4">
                Are you sure you want to delete this question? This action will move it to trash and cannot be undone directly.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setSelectedQuestionId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-surface border border-primary/10 rounded-xl hover:bg-primary/5 transition-colors text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDraft}
                  className="px-4 py-2 text-xs font-bold bg-error text-white rounded-xl hover:opacity-90 transition-opacity"
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
              className="bg-surface border border-primary/10 rounded-[24px] shadow-2xl p-6 max-w-sm w-full z-10 relative overflow-hidden"
            >
              <h3 className="text-base font-bold text-primary mb-2">Submit All for Approval?</h3>
              <p className="text-on-surface-variant text-xs mb-4">
                This will submit all draft questions for this subject to the Admin for final review. You will not be able to edit them while pending approval.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSubmitConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-bold bg-surface border border-primary/10 rounded-xl hover:bg-primary/5 transition-colors text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQuestions}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/95 transition-colors"
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
