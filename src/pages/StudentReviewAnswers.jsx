import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2, XCircle, BookOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentReviewAnswers = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/results/${resultId}`);
        if (res.data?.success) {
          const resData = res.data.data;
          if (resData && !resData.published) {
            setResult({ unpublished: true });
          } else {
            setResult(resData);
          }
        } else {
          setResult({ error: true, message: res.data?.message || 'Result not yet published.' });
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Result not yet published.';
        setResult({ error: true, message: msg });
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="font-mono text-xs text-primary tracking-widest animate-pulse">RETRIEVING EVALUATION...</p>
      </div>
    );
  }

  if (!result || result.unpublished || result.error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="bg-white max-w-md w-full rounded-[24px] border border-[#F0D6DD] shadow-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-[#1A1A1A]">Review Unavailable</h3>
          <p className="text-sm text-[#666666] leading-relaxed">
            {result?.message || 'Result not yet published.'}
          </p>
          <button
            onClick={() => navigate('/student/completed')}
            className="w-full mt-4 py-3 rounded-full bg-[#7A001F] text-white hover:bg-[#9D174D] text-xs font-bold transition-all shadow-md active:scale-95 text-center flex items-center justify-center gap-2"
          >
            Back to Completed Exams
          </button>
        </div>
      </div>
    );
  }

  const answers = result.attempt?.answers || [];

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-[24px] border border-[#F0D6DD] shadow-[0_12px_30px_rgba(122,0,31,0.06)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#7A001F] hover:underline mb-2 active:scale-95"
          >
            <ChevronLeft size={14} />
            Back to Scorecard
          </button>
          <h2 className="text-xl font-black text-[#1A1A1A] leading-tight">{result.exam?.title}</h2>
          <p className="text-xs text-[#666666] font-semibold">
            Subject: {result.exam?.subject?.name} ({result.exam?.subject?.code})
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-2xl bg-[#FDF3F6] border border-[#F0D6DD] text-right">
          <span className="text-[10px] text-[#9CA3AF] uppercase block font-mono font-bold">Total Score</span>
          <span className="text-lg font-black font-mono text-[#7A001F]">
            {result.marksObtained} / {result.totalMarks}
          </span>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {answers.map((ans, idx) => {
          const q = ans.question;
          if (!q) return null;

          // Determine correctness
          const correctOption = (q.CorrectAnswer || (q.correctAnswers && q.correctAnswers[0]) || '').trim().toUpperCase();
          const studentOption = (ans.selectedOptions && ans.selectedOptions[0] || '').trim().toUpperCase();
          const isCorrect = studentOption === correctOption;

          // Map student answer text
          const studentAnsText = q.options?.find(o => o.optionId.toUpperCase() === studentOption)?.optionText || ans.selectedOptions?.join(', ') || 'Skipped';
          const correctAnsText = q.options?.find(o => o.optionId.toUpperCase() === correctOption)?.optionText || q.CorrectAnswer || q.correctAnswers?.join(', ') || 'N/A';

          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={ans._id || idx}
              className="bg-white p-6 rounded-[24px] border border-[#F0D6DD] shadow-[0_8px_24px_rgba(122,0,31,0.04)] space-y-4"
            >
              {/* Question Meta */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-xs font-black text-[#7A001F] uppercase font-mono">
                  Question {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-50 text-gray-600 border border-gray-200">
                    Difficulty: {q.difficulty || 'Medium'}
                  </span>
                  {q.metadata?.bloomsTaxonomy && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-50 text-gray-600 border border-gray-200">
                      Bloom: {q.metadata.bloomsTaxonomy}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FDF3F6] text-[#7A001F] border border-[#F0D6DD]">
                    Marks: {ans.marksObtained || 0} / {q.marks || 1}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-sm font-extrabold text-[#1A1A1A] leading-relaxed">
                {q.text}
              </h3>

              {/* Answers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-mono block">Your Answer</span>
                  <p className="text-xs font-bold text-[#1A1A1A]">
                    {studentOption ? `${studentOption}. ${studentAnsText}` : 'Unanswered'}
                  </p>
                </div>
                <div className="p-3 bg-[#FDF3F6] rounded-xl border border-[#F0D6DD] space-y-1">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-mono block">Correct Answer</span>
                  <p className="text-xs font-bold text-[#7A001F]">
                    {correctOption ? `${correctOption}. ${correctAnsText}` : correctAnsText}
                  </p>
                </div>
              </div>

              {/* Correctness Status */}
              <div className="flex items-center gap-2 pt-2">
                {isCorrect ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-500/10 text-xs font-bold font-mono">
                    <CheckCircle2 size={14} />
                    ✔ Correct
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-500/10 text-xs font-bold font-mono">
                    <XCircle size={14} />
                    ❌ Incorrect
                  </div>
                )}
              </div>

              {/* Explanation Field */}
              {q.explanation && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/40 border border-amber-500/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold uppercase font-mono">
                    <BookOpen size={14} />
                    Explanation
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {q.explanation}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentReviewAnswers;
