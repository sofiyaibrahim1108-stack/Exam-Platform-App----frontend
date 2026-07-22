import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentExamPlaceholder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExamDetails = async () => {
    try {
      const response = await api.get(`/exams/student/${id}`);
      if (response.data && response.data.success) {
        setExam(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to retrieve exam configurations.');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExamDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center animate-pulse space-y-4">
        <div className="h-10 bg-surface-container-high rounded-lg w-1/3 mx-auto"></div>
        <div className="h-40 bg-surface-container-high rounded-xl w-2/3 mx-auto"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-12 text-center text-on-surface-variant font-bold">
        Exam configuration load failed.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white flex justify-between items-center">
        <div>
          <span className="px-2 py-0.5 bg-green-500/15 text-green-800 border border-green-500/35 rounded-md text-[9px] font-mono font-bold uppercase animate-pulse">
            Active Workspace
          </span>
          <h2 className="text-xl font-bold text-primary mt-1.5">{exam.title}</h2>
          <p className="text-[10px] font-mono text-on-surface-variant">
            Subject: {exam.subject?.name} ({exam.subject?.code})
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to exit this active workspace?')) {
              navigate('/student/dashboard');
            }
          }}
          className="px-4 py-2 border border-red-500/10 text-error hover:bg-error/5 text-xs font-bold rounded-xl transition-all"
        >
          Exit Session
        </button>
      </div>

      {/* Rules Notice */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 shadow-sm bg-white text-xs font-semibold text-on-surface-variant">
        <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-primary/5 pb-2">
          <span className="material-symbols-outlined text-base">rule</span>
          Assessment Rules & Guidelines
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-low p-4 rounded-xl border border-primary/5">
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Total Marks</span>
            <span className="block font-bold font-mono">{exam.totalMarks} Marks</span>
          </div>
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Passing Score</span>
            <span className="block font-bold font-mono">{exam.passingMarks} Marks</span>
          </div>
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Negative Marks</span>
            <span className="block font-bold font-mono text-red-600">-{exam.negativeMarks} Marks</span>
          </div>
          <div>
            <span className="text-[8px] text-on-surface-variant/50 uppercase font-mono block">Allocated Time</span>
            <span className="block font-bold font-mono">{exam.durationMinutes} Minutes</span>
          </div>
        </div>

        <div className="space-y-2 leading-relaxed p-4 bg-primary/5 border border-primary/5 rounded-xl">
          <span className="font-mono text-primary font-bold uppercase text-[9px] block mb-1">
            Instructions to Candidate
          </span>
          <p className="whitespace-pre-wrap">
            {exam.instructions ||
              '1. Ensure you have a stable network connection before starting.\n2. Do not navigate away from the workspace screen during attempt.\n3. The evaluation session will auto-submit responses when the time limit expires.'}
          </p>
        </div>
      </div>

      {/* Mock workspace notice */}
      <div className="p-8 text-center bg-green-500/10 border border-green-500/15 rounded-[24px] space-y-2 max-w-lg mx-auto">
        <span className="material-symbols-outlined text-green-700 text-5xl mb-2 animate-bounce block">
          check_circle
        </span>
        <h4 className="text-sm font-bold text-green-900">Active Verification Complete</h4>
        <p className="text-xs text-green-800 font-semibold leading-relaxed">
          The time lock validation completed successfully. This student is authenticated and authorized to start the exam.
        </p>
        <p className="text-[10px] text-green-700 pt-2 font-mono">
          [MOCK INTERFACE ACTIVE - ATTEMPT RUNTIMES WILL UNLOCK IN EVALUATION MODULE]
        </p>
      </div>
    </div>
  );
};

export default StudentExamPlaceholder;
