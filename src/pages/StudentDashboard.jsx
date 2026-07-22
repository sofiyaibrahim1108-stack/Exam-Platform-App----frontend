import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scorecard Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch student exams
      const examsRes = await api.get('/exams/student');
      if (examsRes.data && examsRes.data.success) {
        setExams(examsRes.data.data || []);
      }

      // Fetch student results
      const resultsRes = await api.get('/results?limit=100');
      if (resultsRes.data && resultsRes.data.success) {
        setResults(resultsRes.data.data.results || []);
      }

      // Fetch student notifications
      const alertsRes = await api.get('/notifications');
      if (alertsRes.data && alertsRes.data.success) {
        setNotifications(alertsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to retrieve student dashboard data.', error);
      toast.error('Could not load complete dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Categorize Exams
  const now = new Date();

  const upcomingExams = exams.filter((e) => now < new Date(e.startTime));
  const liveExams = exams.filter(
    (e) => now >= new Date(e.startTime) && now <= new Date(e.endTime)
  );
  const completedExams = exams.filter((e) => now > new Date(e.endTime));

  // Compute Published Results Metrics
  const publishedResults = results.filter((r) => r.published);
  const totalPublishedCount = publishedResults.length;

  const averageScore =
    totalPublishedCount > 0
      ? parseFloat(
          (
            publishedResults.reduce(
              (acc, curr) => acc + (curr.percentage || 0),
              0
            ) / totalPublishedCount
          ).toFixed(1)
        )
      : 0;

  const passedCount = publishedResults.filter((r) => r.status === 'Pass').length;
  const failedCount = publishedResults.filter((r) => r.status === 'Fail').length;

  const passPercentage =
    totalPublishedCount > 0
      ? parseFloat(((passedCount / totalPublishedCount) * 100).toFixed(1))
      : 0;

  // Performance Standing Calculation
  let performanceTier = 'Good Standing';
  if (averageScore >= 85) performanceTier = 'Top 10% (Distinction)';
  else if (averageScore >= 75) performanceTier = 'Top 25% (First Class)';
  else if (averageScore >= 60) performanceTier = 'Satisfactory Progress';
  else if (totalPublishedCount > 0) performanceTier = 'Needs Focus';

  // Subject-wise performance calculation
  const subjectMap = {};
  publishedResults.forEach((r) => {
    const subName = r.subject?.name || 'General Subject';
    if (!subjectMap[subName]) {
      subjectMap[subName] = { totalPct: 0, count: 0, code: r.subject?.code || '' };
    }
    subjectMap[subName].totalPct += r.percentage || 0;
    subjectMap[subName].count += 1;
  });

  const subjectAverages = Object.keys(subjectMap).map((subName) => ({
    name: subName,
    code: subjectMap[subName].code,
    average: parseFloat(
      (subjectMap[subName].totalPct / subjectMap[subName].count).toFixed(1)
    ),
  }));

  subjectAverages.sort((a, b) => b.average - a.average);

  const strongestSubject = subjectAverages.length > 0 ? subjectAverages[0] : null;
  const weakestSubject =
    subjectAverages.length > 1 ? subjectAverages[subjectAverages.length - 1] : null;

  // Semester Completion Rate (Completed vs Total Enrolled Exams)
  const semesterCompletionPct =
    exams.length > 0
      ? parseFloat(((completedExams.length / exams.length) * 100).toFixed(0))
      : 0;

  // Timeline grouping for upcoming exams
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 86400000;
  const dayAfterTomorrowStart = tomorrowStart + 86400000;

  const todayExams = upcomingExams.filter((e) => {
    const t = new Date(e.startTime).getTime();
    return t >= todayStart && t < tomorrowStart;
  });

  const tomorrowExams = upcomingExams.filter((e) => {
    const t = new Date(e.startTime).getTime();
    return t >= tomorrowStart && t < dayAfterTomorrowStart;
  });

  const laterExams = upcomingExams.filter((e) => {
    const t = new Date(e.startTime).getTime();
    return t >= dayAfterTomorrowStart;
  });

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data && response.data.success) {
        const alertsRes = await api.get('/notifications');
        if (alertsRes.data && alertsRes.data.success) {
          setNotifications(alertsRes.data.data || []);
        }
      }
    } catch (error) {
      toast.error('Failed to mark alert as read.');
    }
  };

  const handleViewResultModal = async (resultObj) => {
    setModalOpen(true);
    setLoadingResult(true);
    try {
      const res = await api.get(`/results/${resultObj._id}`);
      if (res.data && res.data.success) {
        setActiveResult(res.data.data);
      } else {
        setActiveResult(resultObj);
      }
    } catch (error) {
      setActiveResult(resultObj);
    } finally {
      setLoadingResult(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-surface-container-high rounded-[28px]"></div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-surface-container-high rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-surface-container-high rounded-3xl"></div>
          <div className="h-72 bg-surface-container-high rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-on-surface pb-12">
      {/* 1. HERO WELCOME BANNER */}
      <div className="glass-panel p-6 lg:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-secondary/10 relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider border border-primary/20">
                AI Analytics Portal
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Active Candidate
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-primary leading-tight">
              Welcome back, {user?.name || 'Student Candidate'}!
            </h1>

            <p className="text-xs text-on-surface-variant font-medium flex flex-wrap items-center gap-2">
              <span className="font-bold text-on-surface">
                {user?.course?.name || 'Computer Science Engineering'}
              </span>
              <span>•</span>
              <span>{user?.department?.name || 'Department of Technology'}</span>
              <span>•</span>
              <span className="font-mono text-primary font-semibold">
                {user?.semester?.name || 'Semester 4'}
              </span>
            </p>
          </div>

          {/* Date & Time Widget */}
          <div className="p-4 rounded-2xl bg-white/80 border border-primary/10 backdrop-blur-md text-right shrink-0 shadow-sm">
            <span className="text-[10px] font-mono uppercase text-on-surface-variant/70 font-semibold block">
              Current Academic Date
            </span>
            <span className="text-sm font-bold text-primary font-mono block mt-0.5">
              {now.toLocaleDateString('en-US', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant block mt-0.5">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Subtle Decorative Background Circles */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. ANIMATED STATISTICS CARDS (6 METRICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Live Exams */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => navigate('/student/live')}
          className="glass-panel p-4.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-all flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
              Live Exams
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-700 font-mono block">
              {liveExams.length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1 mt-1">
              {liveExams.length > 0 ? 'Active Now' : 'No Active Exams'}
            </span>
          </div>
        </motion.div>

        {/* Upcoming Exams */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => navigate('/student/upcoming')}
          className="glass-panel p-4.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer transition-all flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-blue-800 uppercase tracking-wider">
              Upcoming
            </span>
            <span className="material-symbols-outlined text-blue-700 text-base">event</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-700 font-mono block">
              {upcomingExams.length}
            </span>
            <span className="text-[10px] font-semibold text-blue-800 flex items-center gap-1 mt-1">
              Scheduled
            </span>
          </div>
        </motion.div>

        {/* Completed Exams */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => navigate('/student/completed')}
          className="glass-panel p-4.5 rounded-2xl border border-primary/10 bg-white hover:border-primary/20 cursor-pointer transition-all flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">
              Completed
            </span>
            <span className="material-symbols-outlined text-primary text-base">history_edu</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-primary font-mono block">
              {completedExams.length}
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant flex items-center gap-1 mt-1">
              Finished
            </span>
          </div>
        </motion.div>

        {/* Average Score */}
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-panel p-4.5 rounded-2xl border border-primary/10 bg-white shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">
              Avg Score
            </span>
            <span className="material-symbols-outlined text-primary text-base">analytics</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-primary font-mono block">
              {averageScore}%
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant flex items-center gap-1 mt-1">
              Overall Grade Avg
            </span>
          </div>
        </motion.div>

        {/* Pass Percentage */}
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-panel p-4.5 rounded-2xl border border-primary/10 bg-white shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">
              Pass Rate
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-700 font-mono block">
              {passPercentage}%
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1 mt-1">
              Passed Assessments
            </span>
          </div>
        </motion.div>

        {/* Performance Standing */}
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-panel p-4.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-amber-900 uppercase tracking-wider">
              Standing
            </span>
            <span className="material-symbols-outlined text-amber-700 text-base">military_tech</span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-black text-amber-900 truncate block">
              {performanceTier}
            </span>
            <span className="text-[9px] font-mono text-amber-800/80 block mt-1">
              Based on {totalPublishedCount} Results
            </span>
          </div>
        </motion.div>
      </div>

      {/* 3. QUICK ACTIONS BAR */}
      <div className="glass-panel p-4 rounded-2xl border border-primary/10 bg-white shadow-sm">
        <span className="text-[10px] font-mono font-bold text-on-surface-variant/70 uppercase tracking-wider block mb-3 px-1">
          Quick Actions Portal
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/student/live')}
            className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base animate-pulse">play_circle</span>
            Live Exams ({liveExams.length})
          </button>
          <button
            onClick={() => navigate('/student/upcoming')}
            className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">calendar_today</span>
            Upcoming ({upcomingExams.length})
          </button>
          <button
            onClick={() => navigate('/student/completed')}
            className="p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/15 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">assessment</span>
            My Scorecards
          </button>
          <button
            onClick={() => navigate('/student/profile')}
            className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">person</span>
            Student Profile
          </button>
          <button
            onClick={() => navigate('/student/notifications')}
            className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-2 col-span-2 sm:col-span-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">notifications</span>
            Alerts ({notifications.length})
          </button>
        </div>
      </div>

      {/* 4. PERFORMANCE ANALYTICS CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE CHART: Recent Exam Performance */}
        <div className="glass-panel p-6 rounded-[28px] border border-primary/10 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-primary/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">show_chart</span>
                Recent Exam Performance Trend
              </h3>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                Percentage scores across published examinations over time
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              {publishedResults.length} Scores
            </span>
          </div>

          {publishedResults.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-1">
                insights
              </span>
              <p className="font-semibold">No performance trend yet</p>
              <p className="text-[10px]">Complete exams to visualize your progress curve.</p>
            </div>
          ) : (
            <div className="pt-2">
              {/* Interactive SVG Line Graph */}
              <div className="h-44 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6B0F1A" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6B0F1A" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 37.5, 75, 112.5, 150].map((y, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={y}
                      x2="400"
                      y2={y}
                      stroke="#E5E7EB"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Points & Path */}
                  {(() => {
                    const items = publishedResults.slice(-8);
                    const step = items.length > 1 ? 400 / (items.length - 1) : 200;
                    const points = items.map((item, idx) => {
                      const x = items.length === 1 ? 200 : idx * step;
                      const y = 150 - ((item.percentage || 0) / 100) * 130 - 10;
                      return { x, y, pct: item.percentage || 0, title: item.exam?.title };
                    });

                    const pathD = points.reduce((acc, p, idx) => {
                      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                    }, '');

                    const areaD = `${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#lineGrad)" />
                        <path d={pathD} fill="none" stroke="#6B0F1A" strokeWidth="3" strokeLinecap="round" />
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#6B0F1A" stroke="#FFFFFF" strokeWidth="2" />
                            <text
                              x={p.x}
                              y={p.y - 10}
                              textAnchor="middle"
                              fill="#6B0F1A"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {p.pct}%
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* BAR CHART: Subject-wise Performance */}
        <div className="glass-panel p-6 rounded-[28px] border border-primary/10 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-primary/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">bar_chart</span>
                Subject-wise Average Marks
              </h3>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                Comparative analysis across enrolled subjects
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              {subjectAverages.length} Subjects
            </span>
          </div>

          {subjectAverages.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-1">
                equalizer
              </span>
              <p className="font-semibold">No subject data available</p>
              <p className="text-[10px]">Complete exams in different subjects to see breakdown.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {subjectAverages.slice(0, 4).map((sub, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-on-surface truncate max-w-[220px]" title={sub.name}>
                      {sub.name} {sub.code ? `(${sub.code})` : ''}
                    </span>
                    <span className="font-mono font-bold text-primary">{sub.average}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.average >= 75
                          ? 'bg-emerald-600'
                          : sub.average >= 50
                          ? 'bg-primary'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(sub.average, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. DONUT CHART, SEMESTER PROGRESS & AI INSIGHTS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DONUT CHART: Pass vs Fail Ratio */}
        <div className="glass-panel p-6 rounded-[28px] border border-primary/10 bg-white shadow-sm flex flex-col justify-between">
          <div className="border-b border-primary/5 pb-3">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">pie_chart</span>
              Pass vs Fail Distribution
            </h3>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
              Evaluation success ratio
            </p>
          </div>

          <div className="py-6 flex items-center justify-center relative">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3.8"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10B981"
                strokeWidth="3.8"
                strokeDasharray={`${passPercentage}, 100`}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-primary font-mono block">
                {passPercentage}%
              </span>
              <span className="text-[9px] font-mono font-bold uppercase text-on-surface-variant/70">
                Pass Rate
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold pt-2 border-t border-primary/5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-mono text-emerald-800 uppercase block">Passed</span>
              <span className="font-bold text-emerald-900 font-mono text-sm">{passedCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-mono text-rose-800 uppercase block">Failed</span>
              <span className="font-bold text-rose-900 font-mono text-sm">{failedCount}</span>
            </div>
          </div>
        </div>

        {/* CIRCULAR PROGRESS: Semester Completion */}
        <div className="glass-panel p-6 rounded-[28px] border border-primary/10 bg-white shadow-sm flex flex-col justify-between">
          <div className="border-b border-primary/5 pb-3">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">donut_large</span>
              Semester Exam Completion
            </h3>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
              Completed vs Enrolled Examination Nodes
            </p>
          </div>

          <div className="py-6 flex items-center justify-center relative">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3.8"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#6B0F1A"
                strokeWidth="3.8"
                strokeDasharray={`${semesterCompletionPct}, 100`}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-primary font-mono block">
                {semesterCompletionPct}%
              </span>
              <span className="text-[9px] font-mono font-bold uppercase text-on-surface-variant/70">
                Completed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold pt-2 border-t border-primary/5 font-mono">
            <div className="p-2 rounded-xl bg-surface-container-high">
              <span className="text-[9px] text-on-surface-variant/70 uppercase block">Completed</span>
              <span className="font-bold text-primary text-sm">{completedExams.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-high">
              <span className="text-[9px] text-on-surface-variant/70 uppercase block">Total Enrolled</span>
              <span className="font-bold text-on-surface text-sm">{exams.length}</span>
            </div>
          </div>
        </div>

        {/* AI PERFORMANCE INSIGHTS CARD */}
        <div className="glass-panel p-6 rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/5 via-white to-secondary/5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-primary/10 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-600">auto_awesome</span>
              AI Performance Insights
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[9px] font-bold">
              SMART ADVISOR
            </span>
          </div>

          <div className="space-y-3 my-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-primary/10 space-y-1">
              <span className="text-[9px] font-mono uppercase text-emerald-800 font-bold block">
                Strongest Subject Focus
              </span>
              <span className="font-bold text-emerald-900 block truncate">
                {strongestSubject ? `${strongestSubject.name} (${strongestSubject.average}%)` : 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-primary/10 space-y-1">
              <span className="text-[9px] font-mono uppercase text-amber-800 font-bold block">
                Recommended Focus Area
              </span>
              <span className="font-bold text-amber-900 block truncate">
                {weakestSubject ? `${weakestSubject.name} (${weakestSubject.average}%)` : 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-[11px] text-on-surface leading-relaxed font-medium">
              💡 {strongestSubject ? (
                `Great momentum in ${strongestSubject.name}! ${
                  weakestSubject
                    ? `Allocate extra review hours toward ${weakestSubject.name} ahead of upcoming exams.`
                    : 'Maintain your consistent preparation schedule.'
                }`
              ) : (
                'Complete your initial examinations to unlock tailored AI performance recommendations.'
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-primary/10 flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
            <span>Accuracy: {averageScore}%</span>
            <span>Exams Evaluated: {totalPublishedCount}</span>
          </div>
        </div>
      </div>

      {/* 6. UPCOMING EXAM TIMELINE & RECENT NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UPCOMING EXAM TIMELINE (2 COLUMNS) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-[28px] border border-primary/10 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-primary/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">event_upcoming</span>
                Upcoming Examination Schedule
              </h3>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                Timeline view of upcoming test schedules
              </p>
            </div>
            <button
              onClick={() => navigate('/student/upcoming')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Full Schedule
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </button>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-1.5">
                event_available
              </span>
              <p className="font-bold text-on-surface">No Upcoming Exams</p>
              <p className="text-[10px] mt-0.5">You have no pending scheduled exams at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Today */}
              {todayExams.length > 0 && (
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                    Today
                  </span>
                  {todayExams.map((exam) => (
                    <div
                      key={exam._id}
                      className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-bold text-primary truncate">{exam.title}</h4>
                        <p className="text-[10px] text-on-surface-variant font-mono">
                          Subject: {exam.subject?.name} • Duration: {exam.durationMinutes} mins
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/student/exam-session/${exam._id}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 shrink-0 transition-all shadow-sm"
                      >
                        Enter Session
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tomorrow */}
              {tomorrowExams.length > 0 && (
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                    Tomorrow
                  </span>
                  {tomorrowExams.map((exam) => (
                    <div
                      key={exam._id}
                      className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-bold text-primary truncate">{exam.title}</h4>
                        <p className="text-[10px] text-on-surface-variant font-mono">
                          Subject: {exam.subject?.name} • Starts: {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                        Tomorrow
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Later */}
              {laterExams.length > 0 && (
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                    Upcoming Later
                  </span>
                  {laterExams.slice(0, 3).map((exam) => (
                    <div
                      key={exam._id}
                      className="p-4 rounded-2xl border border-primary/10 bg-surface-container-lowest flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-bold text-primary truncate">{exam.title}</h4>
                        <p className="text-[10px] text-on-surface-variant font-mono">
                          Subject: {exam.subject?.name} • Date: {new Date(exam.startTime).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-on-surface-variant">
                        {new Date(exam.startTime).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RECENT NOTIFICATIONS FEED (1 COLUMN) */}
        <div className="glass-panel p-6 rounded-[28px] border border-primary/10 bg-white shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-primary/5 pb-3">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">notifications</span>
              Recent Alerts
            </h3>
            <button
              onClick={() => navigate('/student/notifications')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              All Alerts
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant/60 text-xs">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-1.5">
                  notifications_off
                </span>
                <p className="font-semibold">All clear!</p>
                <p className="text-[10px]">No recent alerts found.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 rounded-2xl border flex gap-3 items-start text-xs transition-all ${
                    !n.read
                      ? 'bg-primary/5 border-primary/20 shadow-xs'
                      : 'bg-surface-container-lowest border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">
                    assignment_late
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5 text-left">
                    <p className={`text-[11px] leading-snug truncate ${!n.read ? 'font-bold text-primary' : 'font-semibold text-on-surface'}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-on-surface-variant line-clamp-2 leading-normal">
                      {n.message}
                    </p>
                    <span className="text-[8px] font-mono text-on-surface-variant/50 block pt-0.5">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(e, n._id)}
                      className="py-1 px-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 text-[9px] font-bold shrink-0 transition-colors"
                    >
                      Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate('/student/notifications')}
            className="w-full py-2.5 rounded-xl border border-primary/15 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all text-center"
          >
            Open Notification Center
          </button>
        </div>
      </div>

      {/* 7. RECENT RESULTS TABLE */}
      <div className="glass-panel p-6 rounded-[28px] border border-primary/10 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-primary/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">fact_check</span>
              Recent Examination Results
            </h3>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
              Scorecards and evaluation summaries of recent assessments
            </p>
          </div>
          <button
            onClick={() => navigate('/student/completed')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            All Results
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>

        {results.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant/60 text-xs">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-1.5">
              history_edu
            </span>
            <p className="font-bold text-on-surface">No Result Records Found</p>
            <p className="text-[10px] mt-0.5">Your exam scorecards will appear here once published.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-primary/10 text-[10px] font-mono font-bold uppercase text-on-surface-variant/70">
                  <th className="py-3 px-4">Exam Title</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Marks Obtained</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {results.slice(0, 5).map((res) => (
                  <tr key={res._id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary">{res.exam?.title || 'Examination'}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                      {res.subject?.name || 'Subject'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {res.published ? `${res.marksObtained} / ${res.totalMarks}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-primary">
                      {res.published ? `${res.percentage}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {!res.published ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono">
                          Pending
                        </span>
                      ) : res.status === 'Pass' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
                          PASS
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold font-mono">
                          FAIL
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewResultModal(res)}
                        className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-[11px] hover:bg-primary/95 transition-all shadow-xs inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        Scorecard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SCORECARD MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white max-w-lg w-full rounded-[28px] border border-primary/10 shadow-2xl p-6 space-y-6 overflow-hidden z-50"
            >
              {loadingResult ? (
                <div className="p-12 text-center space-y-4 animate-pulse">
                  <div className="w-12 h-12 bg-surface-container-high rounded-full mx-auto"></div>
                  <div className="h-6 bg-surface-container-high rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-surface-container-high rounded w-1/2 mx-auto"></div>
                </div>
              ) : !activeResult ? (
                <div className="text-center p-8 space-y-3">
                  <span className="material-symbols-outlined text-amber-500 text-5xl">warning</span>
                  <h3 className="text-lg font-bold text-on-surface">No scorecard records</h3>
                  <p className="text-xs text-on-surface-variant font-semibold">
                    The evaluation record for this exam attempt could not be retrieved.
                  </p>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="mt-4 px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                  >
                    Close Window
                  </button>
                </div>
              ) : !activeResult.published ? (
                <div className="text-center p-6 space-y-4">
                  <span className="material-symbols-outlined text-amber-500 text-5xl animate-bounce">
                    pending_actions
                  </span>
                  <h3 className="text-lg font-extrabold text-primary">Result Pending</h3>
                  <p className="text-xs text-on-surface-variant font-semibold leading-relaxed px-4">
                    The auto-evaluation is completed, but your scorecard has not been published by administration yet. Marks are hidden until release.
                  </p>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full mt-4 py-3 rounded-xl border border-outline-variant/60 text-on-surface hover:bg-surface-container-high/40 text-xs font-bold transition-all"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b border-primary/5 pb-4">
                    <div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/15 rounded text-[9px] font-mono font-bold uppercase">
                        Scorecard Released
                      </span>
                      <h3 className="text-base font-extrabold text-primary mt-1.5">
                        {activeResult.exam?.title}
                      </h3>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        Subject: {activeResult.exam?.subject?.name} ({activeResult.exam?.subject?.code})
                      </p>
                    </div>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1 rounded-full hover:bg-surface-container-high/60 transition-colors text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-primary/5 text-center shadow-sm">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase block font-mono">
                        Score Obtained
                      </span>
                      <span className="block font-bold text-sm text-primary font-mono mt-0.5">
                        {activeResult.marksObtained} / {activeResult.totalMarks}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-primary/5 text-center shadow-sm">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase block font-mono">
                        Percentage
                      </span>
                      <span className="block font-bold text-sm text-primary font-mono mt-0.5">
                        {activeResult.percentage}%
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-primary/5 text-center shadow-sm">
                      <span className="text-[8px] text-on-surface-variant/50 uppercase block font-mono">
                        Letter Grade
                      </span>
                      <span className="block font-extrabold text-sm text-primary font-mono mt-0.5">
                        {activeResult.grade}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-primary/5 rounded-2xl p-4 space-y-3 font-semibold text-xs text-on-surface-variant">
                    <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                      <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase">Evaluation Stats</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          activeResult.status === 'Pass'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {activeResult.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                        <span className="block font-mono font-bold text-emerald-700">
                          {activeResult.statsSummary?.correct || 0} Correct
                        </span>
                      </div>
                      <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                        <span className="block font-mono font-bold text-rose-600">
                          {activeResult.statsSummary?.wrong || 0} Wrong
                        </span>
                      </div>
                      <div className="p-2 bg-surface-container-high rounded-xl">
                        <span className="block font-mono font-bold text-on-surface-variant/80">
                          {activeResult.statsSummary?.unanswered || 0} Skipped
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-on-surface-variant/50 text-right leading-none space-y-0.5">
                    <p>Submission Time: {new Date(activeResult.attempt?.submissionTime || activeResult.createdAt).toLocaleString()}</p>
                    <p>Passing Threshold: {activeResult.passingMarks} Marks</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
