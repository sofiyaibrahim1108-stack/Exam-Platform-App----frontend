import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import api from '../services/api';

const STATUS_COLORS = {
  Draft: '#8B5CF6',
  'Pending Approval': '#F59E0B',
  Approved: '#10B981',
  Rejected: '#EF4444',
  Published: '#06B6D4',
  Active: '#3B82F6',
  Completed: '#6366F1',
  Cancelled: '#6B7280',
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    assignedSubjects: 0,
    totalQuestionDrafts: 0,
    pendingQuestionApproval: 0,
    approvedQuestions: 0,
    rejectedQuestions: 0,
    examsCreated: 0,
    upcomingExams: 0,
    publishedResults: 0,
    charts: {
      questionStatusDistribution: [],
      subjectWiseQuestionCount: [],
      monthlyQuestionSubmission: [],
      examStatus: [],
    },
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/faculty-assignments/staff/dashboard-stats');
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve staff dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'question_draft':
        return 'edit_note';
      case 'question_approval':
        return 'verified';
      case 'exam_created':
        return 'assignment_add';
      case 'notification':
        return 'notifications';
      default:
        return 'history';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'question_draft':
        return 'bg-purple-500/10 text-purple-600';
      case 'question_approval':
        return 'bg-emerald-500/10 text-emerald-600';
      case 'exam_created':
        return 'bg-blue-500/10 text-blue-600';
      case 'notification':
        return 'bg-amber-500/10 text-amber-600';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="glass-panel p-6 rounded-[24px]">
          <div className="h-8 bg-surface-container-high rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 bg-surface-container-high rounded-[20px] glass-panel"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-container-high rounded-[24px] glass-panel"></div>
          <div className="h-64 bg-surface-container-high rounded-[24px] glass-panel"></div>
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Assigned Subjects', count: stats.assignedSubjects, icon: 'collections_bookmark', color: 'text-primary' },
    { title: 'Total Question Drafts', count: stats.totalQuestionDrafts, icon: 'edit_note', color: 'text-purple-600' },
    { title: 'Pending Question Approval', count: stats.pendingQuestionApproval, icon: 'hourglass_empty', color: 'text-amber-600' },
    { title: 'Approved Questions', count: stats.approvedQuestions, icon: 'verified', color: 'text-emerald-600' },
    { title: 'Rejected Questions', count: stats.rejectedQuestions, icon: 'cancel', color: 'text-rose-600' },
    { title: 'Exams Created', count: stats.examsCreated, icon: 'assignment_add', color: 'text-indigo-600' },
    { title: 'Upcoming Exams', count: stats.upcomingExams, icon: 'event', color: 'text-teal-600' },
    { title: 'Published Results', count: stats.publishedResults, icon: 'analytics', color: 'text-blue-600' },
  ];

  const quickActions = [
    { name: 'Generate AI Questions', desc: 'Create prompt questions using AI', icon: 'auto_awesome', path: '/staff/questions' },
    { name: 'Create Question', desc: 'Add MCQ, essay or coding questions', icon: 'edit', path: '/staff/questions' },
    { name: 'Open Question Bank', desc: 'Browse approved question repository', icon: 'inventory_2', path: '/staff/question-bank' },
    { name: 'Create Exam', desc: 'Schedule new assessments', icon: 'assignment_add', path: '/staff/exams' },
    { name: 'View Results', desc: 'Audit student performance', icon: 'assessment', path: '/staff/results' },
  ];

  const isQuestionStatusEmpty =
    !stats.charts?.questionStatusDistribution ||
    stats.charts.questionStatusDistribution.every((d) => d.value === 0);

  const isSubjectWiseEmpty =
    !stats.charts?.subjectWiseQuestionCount ||
    stats.charts.subjectWiseQuestionCount.length === 0 ||
    stats.charts.subjectWiseQuestionCount.every((d) => d.count === 0);

  const isMonthlySubmissionEmpty =
    !stats.charts?.monthlyQuestionSubmission ||
    stats.charts.monthlyQuestionSubmission.every((d) => d.count === 0);

  const isExamStatusEmpty =
    !stats.charts?.examStatus ||
    stats.charts.examStatus.every((d) => d.count === 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="glass-panel p-6 rounded-[24px]">
        <h2 className="text-2xl font-bold text-primary mb-1">Faculty Workspace</h2>
        <p className="text-on-surface-variant text-xs">
          Comprehensive dashboard for your assigned subjects, question creation workflow, upcoming exams, and student result analytics.
        </p>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="glass-panel p-4 rounded-[20px] border border-primary/5 flex items-center justify-between shadow-sm hover:translate-y-[-2px] transition-all duration-300"
          >
            <div>
              <p className="text-[10px] text-on-surface-variant font-semibold mb-1 uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className="text-2xl font-black font-mono text-primary leading-none">{card.count}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
              <span className={`material-symbols-outlined text-lg ${card.color}`}>{card.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Status Distribution */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">donut_large</span>
            Question Status Distribution
          </h3>
          {isQuestionStatusEmpty ? (
            <div className="h-60 flex flex-col items-center justify-center text-on-surface-variant/40">
              <span className="material-symbols-outlined text-4xl mb-1">pie_chart_outline</span>
              <p className="text-xs">No question data recorded yet.</p>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.charts.questionStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {stats.charts.questionStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Subject-wise Question Count */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">bar_chart</span>
            Subject-wise Question Count
          </h3>
          {isSubjectWiseEmpty ? (
            <div className="h-60 flex flex-col items-center justify-center text-on-surface-variant/40">
              <span className="material-symbols-outlined text-4xl mb-1">assessment</span>
              <p className="text-xs">No questions assigned per subject.</p>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.subjectWiseQuestionCount} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val, name, props) => [val, props.payload.subjectName || 'Count']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Monthly Question Submission */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">show_chart</span>
            Monthly Question Submission
          </h3>
          {isMonthlySubmissionEmpty ? (
            <div className="h-60 flex flex-col items-center justify-center text-on-surface-variant/40">
              <span className="material-symbols-outlined text-4xl mb-1">timeline</span>
              <p className="text-xs">No submission activity over past 6 months.</p>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.charts.monthlyQuestionSubmission} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubmission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmission)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Exam Status */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">fact_check</span>
            Exam Status Breakdown
          </h3>
          {isExamStatusEmpty ? (
            <div className="h-60 flex flex-col items-center justify-center text-on-surface-variant/40">
              <span className="material-symbols-outlined text-4xl mb-1">assignment</span>
              <p className="text-xs">No exams provisioned yet.</p>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.examStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.charts.examStatus.map((entry, index) => (
                      <Cell key={`exam-cell-${index}`} fill={STATUS_COLORS[entry.status] || '#0EA5E9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">bolt</span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((act) => (
              <div
                key={act.name}
                onClick={() => navigate(act.path)}
                className="p-4 rounded-xl border border-primary/5 bg-surface-container-low hover:bg-primary/5 transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">{act.icon}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    {act.name}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities Timeline */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">history</span>
            Recent Activities
          </h3>

          {!stats.recentActivities || stats.recentActivities.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-6 text-on-surface-variant/40">
              <span className="material-symbols-outlined text-3xl mb-1">history</span>
              <p className="text-[11px]">No recent staff activities recorded.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3.5 overflow-y-auto pr-1 max-h-64">
              {stats.recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-[11px]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getActivityColor(act.type)}`}>
                    <span className="material-symbols-outlined text-base">{getActivityIcon(act.type)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                      {act.category}
                    </span>
                    <p className="font-semibold text-on-surface leading-tight mt-0.5">{act.message}</p>
                    <span className="text-[9px] font-mono text-on-surface-variant mt-0.5 block">
                      {new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
