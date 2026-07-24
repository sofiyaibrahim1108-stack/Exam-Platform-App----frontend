import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const StaffSyllabusAnalyzer = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [units, setUnits] = useState([]);
  
  // PDF Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // AI Processing States
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const processingSteps = [
    'Uploading PDF...',
    'Reading PDF...',
    'Extracting Text...',
    'Detecting Units...',
    'Detecting Topics...',
    'Detecting Subtopics...',
    'Saving Draft...'
  ];

  // Confirmation Modals
  const [showConfirmFinal, setShowConfirmFinal] = useState(false);
  const [showConfirmReprocess, setShowConfirmReprocess] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Load subject/assignment and syllabus data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Find the faculty assignment mapping to resolve metadata
      const assResponse = await api.get('/staff-subjects/my-subjects');
      if (assResponse.data && assResponse.data.success) {
        const found = assResponse.data.data.assignments.find(
          (a) => a.subject?._id === subjectId
        );
        if (found) {
          setAssignment(found);
        } else {
          toast.error('Unauthorized access to this subject.');
          navigate('/staff/assigned-subjects');
          return;
        }
      }

      // Fetch the syllabus if it exists
      const sylResponse = await api.get(`/syllabi/subject/${subjectId}`);
      if (sylResponse.data && sylResponse.data.success && sylResponse.data.data) {
        setSyllabus(sylResponse.data.data);
        setUnits(sylResponse.data.data.units || []);
      } else {
        setSyllabus(null);
        setUnits([]);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to retrieve subject details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const validateAndUploadFile = (file) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF documents are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Maximum file size allowed is 10 MB.');
      return;
    }
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/syllabi/upload/${subjectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data && response.data.success) {
        setSyllabus(response.data.data);
        setUnits(response.data.data.units || []);
        toast.success('Syllabus PDF uploaded successfully.');
        
        // Auto trigger AI extraction once uploaded
        handleAIExtract();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload PDF.');
    } finally {
      setUploading(false);
    }
  };

  // AI Extraction Orchestrator
  const handleAIExtract = async () => {
    setProcessing(true);
    setProcessingStep(0);

    // Dynamic stepper simulation for maximum visual engagement
    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev < processingSteps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      const response = await api.post(`/syllabi/extract/${subjectId}`);
      clearInterval(stepInterval);
      setProcessingStep(processingSteps.length - 1); // Jump to saving draft
      
      setTimeout(() => {
        if (response.data && response.data.success) {
          setSyllabus(response.data.data);
          setUnits(response.data.data.units || []);
          toast.success('AI Syllabus parsing complete.');
        }
        setProcessing(false);
      }, 800);

    } catch (error) {
      clearInterval(stepInterval);
      setProcessing(false);
      toast.error(error.message || 'AI extraction failed.');
    }
  };

  // Reprocess AI trigger
  const triggerReprocess = async () => {
    setShowConfirmReprocess(false);
    setProcessing(true);
    setProcessingStep(0);

    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev < processingSteps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      const response = await api.post(`/syllabi/reprocess/${subjectId}`);
      clearInterval(stepInterval);
      setProcessingStep(processingSteps.length - 1);

      setTimeout(() => {
        if (response.data && response.data.success) {
          setSyllabus(response.data.data);
          setUnits(response.data.data.units || []);
          toast.success('AI Syllabus reprocessed successfully.');
        }
        setProcessing(false);
      }, 800);
    } catch (error) {
      clearInterval(stepInterval);
      setProcessing(false);
      toast.error(error.message || 'AI reprocessing failed.');
    }
  };

  // Delete PDF trigger
  const triggerDeletePDF = async () => {
    setShowConfirmDelete(false);
    setLoading(true);
    try {
      const response = await api.delete(`/syllabi/pdf/${subjectId}`);
      if (response.data && response.data.success) {
        setSyllabus(response.data.data);
        setUnits([]);
        toast.success('Syllabus PDF and structure deleted.');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Save actions
  const handleSaveDraft = async () => {
    try {
      const response = await api.put(`/syllabi/save-draft/${subjectId}`, { units });
      if (response.data && response.data.success) {
        setSyllabus(response.data.data);
        toast.success('Syllabus draft saved successfully.');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save draft.');
    }
  };

  const handleSaveFinal = async () => {
    setShowConfirmFinal(false);
    try {
      const response = await api.put(`/syllabi/save-final/${subjectId}`, { units });
      if (response.data && response.data.success) {
        setSyllabus(response.data.data);
        toast.success('Syllabus finalized! Question Bank is now unlocked.', { icon: '🔓' });
        navigate('/staff/assigned-subjects');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to finalize syllabus.');
    }
  };

  // -----------------------------------------------------------------
  // Tree Structure Operations
  // -----------------------------------------------------------------

  const addUnit = () => {
    const nextNum = units.length > 0 ? Math.max(...units.map(u => u.unitNumber)) + 1 : 1;
    const newUnit = {
      unitNumber: nextNum,
      title: `Unit ${nextNum}: New Unit`,
      description: '',
      topics: []
    };
    setUnits([...units, newUnit]);
    toast.success('Unit added. Scroll down to edit.');
  };

  const editUnitTitle = (index, val) => {
    const updated = [...units];
    updated[index].title = val;
    setUnits(updated);
  };

  const editUnitNumber = (index, val) => {
    const updated = [...units];
    updated[index].unitNumber = parseInt(val, 10) || updated[index].unitNumber;
    setUnits(updated);
  };

  const deleteUnit = (index) => {
    const updated = units.filter((_, i) => i !== index);
    setUnits(updated);
    toast.error('Unit deleted.');
  };

  const moveUnit = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === units.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...units];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setUnits(updated);
  };

  // Topics
  const addTopic = (unitIndex) => {
    const updated = [...units];
    const newTopic = {
      name: 'New Topic',
      subtopics: []
    };
    updated[unitIndex].topics.push(newTopic);
    setUnits(updated);
  };

  const editTopicName = (unitIndex, topicIndex, val) => {
    const updated = [...units];
    updated[unitIndex].topics[topicIndex].name = val;
    setUnits(updated);
  };

  const deleteTopic = (unitIndex, topicIndex) => {
    const updated = [...units];
    updated[unitIndex].topics = updated[unitIndex].topics.filter((_, i) => i !== topicIndex);
    setUnits(updated);
  };

  const moveTopic = (unitIndex, topicIndex, direction) => {
    const topics = units[unitIndex].topics;
    if (direction === 'up' && topicIndex === 0) return;
    if (direction === 'down' && topicIndex === topics.length - 1) return;

    const targetIndex = direction === 'up' ? topicIndex - 1 : topicIndex + 1;
    const updated = [...units];
    const temp = updated[unitIndex].topics[topicIndex];
    updated[unitIndex].topics[topicIndex] = updated[unitIndex].topics[targetIndex];
    updated[unitIndex].topics[targetIndex] = temp;

    setUnits(updated);
  };

  // Subtopics
  const addSubtopic = (unitIndex, topicIndex, text) => {
    if (!text.trim()) return;
    const updated = [...units];
    updated[unitIndex].topics[topicIndex].subtopics.push(text.trim());
    setUnits(updated);
  };

  const editSubtopicText = (unitIndex, topicIndex, subIndex, val) => {
    const updated = [...units];
    updated[unitIndex].topics[topicIndex].subtopics[subIndex] = val;
    setUnits(updated);
  };

  const deleteSubtopic = (unitIndex, topicIndex, subIndex) => {
    const updated = [...units];
    updated[unitIndex].topics[topicIndex].subtopics = updated[unitIndex].topics[topicIndex].subtopics.filter((_, i) => i !== subIndex);
    setUnits(updated);
  };

  // Helper: Retrieve Base Uploads URL
  const getPdfUrl = () => {
    if (!syllabus?.pdfPath) return '';
    const base = api.defaults.baseURL.replace('/api/v1', '');
    return `${base}/${syllabus.pdfPath}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="glass-panel p-8 rounded-[24px]">
          <div className="h-6 bg-surface-container-high rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 h-[400px] rounded-[24px]"></div>
          <div className="glass-panel p-6 h-[400px] rounded-[24px]"></div>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const { subject, department, course, semester, academicYear } = assignment;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Subject Information */}
      <div className="glass-panel p-6 rounded-[24px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-primary">{subject?.name}</h2>
            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[9px] font-mono font-bold text-primary uppercase">
              {subject?.subjectType}
            </span>
          </div>
          <p className="text-on-surface-variant text-xs">
            Course ID: <span className="font-mono">{subject?.code}</span> | Semester {semester?.semesterNumber}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-container-low p-4 rounded-xl text-[10px] font-semibold text-on-surface-variant">
          <div>
            <span className="text-[9px] block text-on-surface-variant/40 uppercase font-mono">Department</span>
            <span className="text-on-surface font-bold">{department?.name} ({department?.code})</span>
          </div>
          <div>
            <span className="text-[9px] block text-on-surface-variant/40 uppercase font-mono">Course Path</span>
            <span className="text-on-surface font-bold">{course?.name}</span>
          </div>
          <div>
            <span className="text-[9px] block text-on-surface-variant/40 uppercase font-mono">Academic Year</span>
            <span className="text-secondary font-bold">AY {academicYear}</span>
          </div>
          <div>
            <span className="text-[9px] block text-on-surface-variant/40 uppercase font-mono">Status</span>
            <span className={`font-bold ${syllabus?.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>
              {syllabus?.status ? `${syllabus.status} Workspace` : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Upload & PDF Preview Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-[24px] space-y-4">
            <h3 className="text-sm font-bold text-primary border-b border-primary/5 pb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">cloud_upload</span>
              Syllabus Document Upload
            </h3>

            {/* Drag & Drop Window */}
            {!syllabus?.pdfPath ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`p-10 text-center border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-primary bg-primary/5 scale-[0.98]'
                    : 'border-primary/20 hover:border-primary/55 hover:bg-primary/5'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
                
                {uploading ? (
                  <div className="space-y-3">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-semibold text-primary animate-pulse">Uploading file payload...</p>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-primary/30 mb-3 animate-bounce">
                      picture_as_pdf
                    </span>
                    <h4 className="text-xs font-bold text-on-surface">Drag & Drop Syllabus PDF here</h4>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">or click to browse your local filesystem</p>
                    <span className="px-3 py-1 bg-surface-container rounded-full text-[9px] font-mono mt-4 font-bold text-on-surface-variant/75">
                      PDF ONLY • MAX 10MB
                    </span>
                  </>
                )}
              </div>
            ) : (
              /* PDF Loaded Workspace */
              <div className="space-y-4">
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <span className="material-symbols-outlined text-xl text-primary">picture_as_pdf</span>
                    <div className="text-left overflow-hidden">
                      <p className="text-[11px] font-bold text-primary truncate max-w-[180px]">
                        {syllabus.pdfPath.split('/').pop()}
                      </p>
                      <p className="text-[9px] font-mono text-on-surface-variant/60">
                        Workspace Document loaded
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors tooltip"
                      title="Replace Document"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="p-1.5 rounded-lg hover:bg-error/15 text-error transition-colors"
                      title="Delete Document"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Document preview iframe */}
                <div className="border border-primary/5 rounded-xl overflow-hidden h-[360px] bg-surface-container-lowest relative shadow-inner">
                  <iframe
                    src={getPdfUrl()}
                    className="w-full h-full"
                    title="Syllabus Document Viewer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tree Structure & AI Analyzer Viewport */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-[24px] space-y-6 min-h-[480px] flex flex-col">
            
            {/* Toolbar / Header */}
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">account_tree</span>
                Syllabus Framework
              </h3>

              {syllabus?.pdfPath && !processing && (
                <button
                  onClick={() => setShowConfirmReprocess(true)}
                  className="px-3 py-1 bg-secondary text-white rounded-lg text-[10px] font-bold hover:bg-secondary/90 transition-all flex items-center gap-1 shadow-md shadow-secondary/15"
                >
                  <span className="material-symbols-outlined text-[12px]">psychology</span>
                  Reprocess AI
                </button>
              )}
            </div>

            {/* AI PROCESSING STAGE */}
            {processing ? (
              <div className="flex-1 flex flex-col justify-center items-center py-12">
                <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                  <span className="material-symbols-outlined text-3xl text-primary animate-pulse">psychology</span>
                </div>

                <div className="w-full max-w-sm space-y-4 text-center">
                  <h4 className="text-sm font-bold text-primary animate-pulse">AI Model Orchestrator Active</h4>
                  
                  {/* Progress Indicator bar */}
                  <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Steps check-off list */}
                  <div className="bg-surface-container-low p-4 rounded-xl text-left space-y-2 text-[11px]">
                    {processingSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 font-medium">
                        {processingStep > idx ? (
                          <span className="material-symbols-outlined text-green-600 font-bold text-[14px]">done</span>
                        ) : processingStep === idx ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0"></div>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px]">circle</span>
                        )}
                        <span className={processingStep === idx ? 'text-primary font-bold animate-pulse' : processingStep > idx ? 'text-green-800' : 'text-on-surface-variant/50'}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : units.length === 0 ? (
              /* Empty State */
              <div className="flex-1 flex flex-col justify-center items-center py-16 text-center max-w-md mx-auto">
                <span className="material-symbols-outlined text-5xl text-primary/10 mb-4 animate-pulse">
                  schema
                </span>
                <h4 className="text-sm font-bold text-on-surface">Syllabus Structure Unconfigured</h4>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  Please drag & drop or upload the course syllabus PDF in the left panel. The AI engine will parse and extract structural units, topics, and subtopics automatically.
                </p>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={addUnit}
                    className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-all"
                  >
                    Create Manually
                  </button>
                </div>
              </div>
            ) : (
              /* INTERACTIVE REVIEW TREE */
              <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {units.map((unit, uIdx) => (
                  <motion.div
                    key={uIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-primary/10 bg-primary/5/30 space-y-3 relative group"
                  >
                    {/* Unit Header Controller */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/5 pb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          value={unit.unitNumber}
                          onChange={(e) => editUnitNumber(uIdx, e.target.value)}
                          className="w-10 text-center font-mono font-bold text-xs bg-surface-container border border-primary/10 rounded py-0.5"
                          title="Unit Number"
                          min="1"
                        />
                        <input
                          type="text"
                          value={unit.title}
                          onChange={(e) => editUnitTitle(uIdx, e.target.value)}
                          className="flex-1 text-xs font-bold text-primary bg-transparent focus:bg-surface-container focus:outline-none focus:px-2 rounded py-0.5 transition-all"
                          placeholder="Unit Title"
                        />
                      </div>

                      {/* Unit Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveUnit(uIdx, 'up')}
                          disabled={uIdx === 0}
                          className="p-1 rounded text-on-surface-variant hover:bg-primary/5 disabled:opacity-30"
                          title="Move Up"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          onClick={() => moveUnit(uIdx, 'down')}
                          disabled={uIdx === units.length - 1}
                          className="p-1 rounded text-on-surface-variant hover:bg-primary/5 disabled:opacity-30"
                          title="Move Down"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_downward</span>
                        </button>
                        <button
                          onClick={() => addTopic(uIdx)}
                          className="p-1 rounded text-secondary hover:bg-secondary/15"
                          title="Add Topic"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                        </button>
                        <button
                          onClick={() => deleteUnit(uIdx)}
                          className="p-1 rounded text-error hover:bg-error/15"
                          title="Delete Unit"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Topics Tree */}
                    <div className="pl-4 space-y-3 border-l border-primary/10">
                      {unit.topics && unit.topics.map((topic, tIdx) => {
                        const newSubInputId = `sub-input-${uIdx}-${tIdx}`;
                        return (
                          <div key={tIdx} className="space-y-2 bg-surface-container-lowest/60 p-2.5 rounded-lg border border-primary/5 relative">
                            {/* Topic Row Header */}
                            <div className="flex justify-between items-center gap-2">
                              <input
                                type="text"
                                value={topic.name}
                                onChange={(e) => editTopicName(uIdx, tIdx, e.target.value)}
                                className="flex-1 text-xs font-semibold text-on-surface bg-transparent focus:bg-surface-container focus:outline-none focus:px-2 rounded py-0.5"
                                placeholder="Topic Name"
                              />

                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => moveTopic(uIdx, tIdx, 'up')}
                                  disabled={tIdx === 0}
                                  className="p-0.5 rounded text-on-surface-variant hover:bg-primary/5 disabled:opacity-30"
                                >
                                  <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                </button>
                                <button
                                  onClick={() => moveTopic(uIdx, tIdx, 'down')}
                                  disabled={tIdx === unit.topics.length - 1}
                                  className="p-0.5 rounded text-on-surface-variant hover:bg-primary/5 disabled:opacity-30"
                                >
                                  <span className="material-symbols-outlined text-xs">arrow_downward</span>
                                </button>
                                <button
                                  onClick={() => deleteTopic(uIdx, tIdx)}
                                  className="p-0.5 rounded text-error hover:bg-error/10"
                                >
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                              </div>
                            </div>

                            {/* Subtopics Tag Area */}
                            <div className="pl-4 space-y-1.5">
                              {/* Existing Tags */}
                              <div className="flex flex-wrap gap-1">
                                {topic.subtopics && topic.subtopics.map((sub, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container-high rounded-full border border-primary/5 text-[10px] font-medium"
                                  >
                                    <input
                                      type="text"
                                      value={sub}
                                      onChange={(e) => editSubtopicText(uIdx, tIdx, sIdx, e.target.value)}
                                      className="bg-transparent focus:outline-none text-[10px] w-20 sm:w-28 font-medium"
                                    />
                                    <button
                                      onClick={() => deleteSubtopic(uIdx, tIdx, sIdx)}
                                      className="text-error hover:bg-error/15 rounded-full p-0.5"
                                    >
                                      <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Input to Add Subtopic */}
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const input = document.getElementById(newSubInputId);
                                  addSubtopic(uIdx, tIdx, input.value);
                                  input.value = '';
                                }}
                                className="flex items-center gap-1.5 pt-1.5"
                              >
                                <input
                                  id={newSubInputId}
                                  type="text"
                                  placeholder="Add subtopic..."
                                  className="text-[10px] px-2 py-0.5 bg-surface-container rounded border border-primary/5 focus:outline-none focus:border-secondary flex-1"
                                />
                                <button
                                  type="submit"
                                  className="px-2 py-0.5 bg-primary text-white font-bold text-[9px] rounded-lg hover:bg-primary/95 transition-all"
                                >
                                  Add
                                </button>
                              </form>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={addUnit}
                  className="w-full py-2.5 border-2 border-dashed border-primary/10 hover:border-primary/30 rounded-xl text-primary font-bold text-xs bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add New Unit Frame
                </button>
              </div>
            )}

            {/* Actions Toolbar */}
            {units.length > 0 && !processing && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 mt-auto border-t border-primary/5">
                <button
                  onClick={() => navigate('/staff/assigned-subjects')}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 bg-secondary/15 text-secondary hover:bg-secondary/25 border border-secondary/10 font-bold text-xs rounded-xl transition-all"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => setShowConfirmFinal(true)}
                  className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  Save Final & Unlock
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* DIALOG MODALS WITH FRAMER MOTION */}
      {/* ----------------------------------------------------------------- */}

      <AnimatePresence>
        {/* CONFIRM SAVE FINAL */}
        {showConfirmFinal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmFinal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-sm z-10 relative overflow-hidden text-center"
            >
              <span className="material-symbols-outlined text-4xl text-primary mb-3">lock_open</span>
              <h3 className="text-base font-bold text-primary mb-2">Finalize Syllabus</h3>
              <p className="text-on-surface-variant text-xs mb-6 leading-relaxed">
                Are you sure you want to finalize the syllabus structure? This action will save the completed units list and **unlock the Question Bank** workspace for this subject.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirmFinal(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high font-bold text-xs rounded-xl transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSaveFinal}
                  className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md"
                >
                  Confirm & Finalize
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CONFIRM REPROCESS AI */}
        {showConfirmReprocess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmReprocess(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-sm z-10 relative overflow-hidden text-center"
            >
              <span className="material-symbols-outlined text-4xl text-secondary mb-3">psychology</span>
              <h3 className="text-base font-bold text-primary mb-2">Reprocess Syllabus with AI</h3>
              <p className="text-on-surface-variant text-xs mb-6 leading-relaxed">
                This will overwrite any manual reviews or edits you have made so far with fresh AI content extracted from the loaded PDF. Proceed?
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirmReprocess(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={triggerReprocess}
                  className="px-4 py-2 bg-secondary text-white font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all shadow-md"
                >
                  Reprocess Now
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CONFIRM DELETE PDF */}
        {showConfirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmDelete(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-sm z-10 relative overflow-hidden text-center"
            >
              <span className="material-symbols-outlined text-4xl text-error mb-3">warning</span>
              <h3 className="text-base font-bold text-primary mb-2">Delete Syllabus Workspace</h3>
              <p className="text-on-surface-variant text-xs mb-6 leading-relaxed">
                Are you sure you want to delete the uploaded syllabus PDF? This will wipe the current text extraction database and reset the units tree structure.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={triggerDeletePDF}
                  className="px-4 py-2 bg-error text-white font-bold text-xs rounded-xl hover:bg-error/90 transition-all shadow-md"
                >
                  Delete Payload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StaffSyllabusAnalyzer;
