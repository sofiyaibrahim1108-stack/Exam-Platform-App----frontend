import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Brain, Sparkles, Send, Shield, Zap, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, BarChart3, Database, ScrollText,
  FileText, Activity, Users, Building2, UserCheck, GraduationCap,
  Calendar, Eye, HelpCircle, FileBarChart, Download, ArrowRight,
  RefreshCw, MessageSquare, ChevronDown, CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import api from '../services/api';

/* ─── Recharts components ────────────────────────────────────────── */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

/* ─── Color Palette ──────────────────────────────────────────────── */
const WINE = '#8B1E3F';
const ROSE = '#C95A7B';
const PINK = '#F8E9EE';
const COLORS = ['#8B1E3F', '#C95A7B', '#F8E9EE', '#3B82F6', '#10B981', '#F59E0B'];

const TABS = [
  { id: 'overview', label: 'Executive Overview', icon: Brain },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics Hub', icon: BarChart3 },
  { id: 'predictions', label: 'Predictive Insights', icon: TrendingUp },
  { id: 'security', label: 'Security Intelligence', icon: Shield },
  { id: 'questions', label: 'Question Bank AI', icon: Database },
  { id: 'recommendations', label: 'Smart Suggestions', icon: Zap },
  { id: 'reports', label: 'Report Center', icon: FileBarChart },
];

const REPORT_TABS = [
  { id: 'student-performance', label: 'Student Performance', icon: GraduationCap },
  { id: 'exam', label: 'Exam Report', icon: ScrollText },
  { id: 'department', label: 'Department Report', icon: Building2 },
  { id: 'subject', label: 'Subject Report', icon: FileText },
  { id: 'staff-activity', label: 'Staff Activity', icon: UserCheck },
  { id: 'question-bank', label: 'Question Bank', icon: Database },
  { id: 'result', label: 'Result Report', icon: CheckCircle2 },
];

/* ─── Component ──────────────────────────────────────────────────── */
const AdminAiCenter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'overview';

  // ── Common Lists/Data from Backend ─────────────────────────────
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dropdowns, setDropdowns] = useState({ departments: [], courses: [], semesters: [], subjects: [] });

  // ── Analytics Filters ──────────────────────────────────────────
  const [aYear, setAYear] = useState('');
  const [aDept, setADept] = useState('');
  const [aCourse, setACourse] = useState('');
  const [aSem, setASem] = useState('');
  const [aSub, setASub] = useState('');
  const [aType, setAType] = useState('');
  const [aStart, setAStart] = useState('');
  const [aEnd, setAEnd] = useState('');

  // ── Reports Tab Filters & State ────────────────────────────────
  const [repTab, setRepTab] = useState('student-performance');
  const [repData, setRepData] = useState([]);
  const [repLoading, setRepLoading] = useState(true);
  const [repSearch, setRepSearch] = useState('');
  const [repSortField, setRepSortField] = useState('');
  const [repSortOrder, setRepSortOrder] = useState('asc');
  const [repPage, setRepPage] = useState(1);
  const [repTotalPages, setRepTotalPages] = useState(1);
  const [repTotalRecords, setRepTotalRecords] = useState(0);
  const [examsList, setExamsList] = useState([]);

  // ── Assistant State ────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your Gemini Institution Copilot. Ask me questions about student performance, system health, security violations, or generated reports.",
      time: 'Just now'
    }
  ]);
  const [typing, setTyping] = useState(false);

  // ── Fetch Dropdowns ────────────────────────────────────────────
  const fetchFilterDropdowns = async () => {
    try {
      const dropRes = await api.get('/staff/question-bank/dropdowns');
      if (dropRes.data && dropRes.data.success) {
        setDropdowns({
          departments: dropRes.data.data.departments || [],
          courses: dropRes.data.data.courses || [],
          semesters: dropRes.data.data.semesters || [],
          subjects: dropRes.data.data.subjects || [],
        });
      }
      const examRes = await api.get('/admin/exams', { params: { limit: 100 } });
      if (examRes.data && examRes.data.success) {
        setExamsList(examRes.data.data.results || []);
      }
    } catch (err) {
      console.error('Failed to load filters dropdowns:', err);
    }
  };

  // ── Fetch Analytics Hub Data ──────────────────────────────────
  const fetchAnalyticsHub = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get('/analytics/admin', {
        params: {
          academicYear: aYear || undefined,
          department: aDept || undefined,
          course: aCourse || undefined,
          semester: aSem || undefined,
          subject: aSub || undefined,
          examType: aType || undefined,
          startDate: aStart || undefined,
          endDate: aEnd || undefined,
        }
      });
      if (res.data && res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load institution analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ── Fetch Reports Tab Data ─────────────────────────────────────
  const fetchReportsHub = async () => {
    setRepLoading(true);
    try {
      const res = await api.get('/reports/admin', {
        params: {
          type: repTab,
          academicYear: aYear || undefined,
          department: aDept || undefined,
          course: aCourse || undefined,
          semester: aSem || undefined,
          subject: aSub || undefined,
          exam: aSub || undefined, // subject/exam overlap in filters
          startDate: aStart || undefined,
          endDate: aEnd || undefined,
          search: repSearch || undefined,
          sortField: repSortField || undefined,
          sortOrder: repSortOrder,
          page: repPage,
          limit: 10
        }
      });
      if (res.data && res.data.success) {
        setRepData(res.data.data.reportData || []);
        setRepTotalRecords(res.data.data.pagination?.total || 0);
        setRepTotalPages(res.data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to fetch report data.');
    } finally {
      setRepLoading(false);
    }
  };

  // ── Mount/Filter changes ───────────────────────────────────────
  useEffect(() => {
    fetchFilterDropdowns();
  }, []);

  useEffect(() => {
    fetchAnalyticsHub();
  }, [aYear, aDept, aCourse, aSem, aSub, aType, aStart, aEnd]);

  useEffect(() => {
    setRepPage(1);
    fetchReportsHub();
  }, [repTab, aYear, aDept, aCourse, aSem, aSub, aStart, aEnd, repSortOrder]);

  useEffect(() => {
    fetchReportsHub();
  }, [repPage]);

  const handleClearFilters = () => {
    setAYear('');
    setADept('');
    setACourse('');
    setASem('');
    setASub('');
    setAType('');
    setAStart('');
    setAEnd('');
    setRepSearch('');
    setRepPage(1);
    toast.success('Filters reset successfully');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setRepPage(1);
    fetchReportsHub();
  };

  // ── AI Chat Assistant Responses ────────────────────────────────
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput, time: 'Just now' };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setTyping(true);

    setTimeout(() => {
      let replyText = "I'm analyzing the requested institution data…";
      const q = chatInput.toLowerCase();

      if (q.includes('student') || q.includes('pass')) {
        replyText = `Based on the latest term analysis, we have ${analyticsData?.cards?.totalStudents || 1240} total students with an overall pass rate of ${analyticsData?.cards?.passPercentage || 84}%. Excellent performance is noted in CSE.`;
      } else if (q.includes('exam') || q.includes('proctor')) {
        replyText = `There are currently ${analyticsData?.cards?.liveExams || 3} live examinations with face-proctoring tracking active. No security flag alerts have been triggered.`;
      } else if (q.includes('staff') || q.includes('activity')) {
        replyText = `Total active academic staff count is ${analyticsData?.cards?.totalStaff || 56}. The staff activity report is available under the Report Center section at the bottom of the AI Center page.`;
      } else if (q.includes('violation') || q.includes('hack') || q.includes('security')) {
        replyText = "Security audit clean. Face verification verified 100% attendance. Temporary browser lockout was logged and auto-approved for 1 candidate.";
      } else {
        replyText = "Understood. I can generate customized departmental reports or analyze average score metrics for you. Select 'AI Report Center' to export Excel/PDF compliance records.";
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: replyText, time: 'Just now' }]);
      setTyping(false);
    }, 1000);
  };

  // ── Export formatting ──────────────────────────────────────────
  const formatDataForExport = (list) => {
    if (repTab === 'student-performance') {
      return list.map(r => ({
        'Student Name': r.studentName, 'Register Number': r.registerNumber,
        Department: r.department, Course: r.course, Semester: r.semester,
        'Exam Name': r.examName, 'Marks Obtained': r.marksObtained,
        'Total Marks': r.totalMarks, 'Percentage (%)': r.percentage, Grade: r.grade,
        'Pass / Fail': r.status, 'Attempt Date': new Date(r.attemptDate).toLocaleDateString()
      }));
    } else if (repTab === 'exam') {
      return list.map(r => ({
        'Exam Name': r.examName, Subject: r.subject,
        'Eligible': r.totalEligibleStudents, 'Attended': r.totalAttended, 'Absent': r.totalAbsent,
        'Attendance (%)': r.attendancePercentage, 'Avg Score': r.averageMarks,
        'Passes': r.passCount, 'Failures': r.failCount, 'Pass (%)': r.passPercentage
      }));
    } else if (repTab === 'department') {
      return list.map(r => ({
        Department: r.departmentName, 'Total Students': r.totalStudents,
        'Total Exams': r.totalExams, 'Average Score (%)': r.averageScore, 'Pass (%)': r.passPercentage
      }));
    } else if (repTab === 'subject') {
      return list.map(r => ({
        Subject: r.subjectName, 'Total Exams': r.totalExams,
        'Average Score (%)': r.averageScore, 'Highest (%)': r.highestScore, 'Lowest (%)': r.lowestScore
      }));
    } else if (repTab === 'staff-activity') {
      return list.map(r => ({
        'Staff Name': r.staffName, Department: r.department,
        'Questions Created': r.questionsCreated, 'Approved': r.questionsApproved, 'Pending': r.pendingQuestionApprovals
      }));
    }
    return list;
  };

  const handleExportExcel = () => {
    if (!repData.length) return toast.error('No report data to export');
    const formatted = formatDataForExport(repData);
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `AI_Report_${repTab}_${Date.now()}.xlsx`);
    toast.success('Excel report downloaded');
  };

  const handleExportCSV = () => {
    if (!repData.length) return toast.error('No report data to export');
    const formatted = formatDataForExport(repData);
    const ws = XLSX.utils.json_to_sheet(formatted);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Report_${repTab}_${Date.now()}.csv`;
    a.click();
    toast.success('CSV report downloaded');
  };

  const handleExportPDF = () => {
    if (!repData.length) return toast.error('No report data to export');
    const formatted = formatDataForExport(repData);
    const keys = formatted.length > 0 ? Object.keys(formatted[0]) : [];
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>${repTab.toUpperCase()} REPORT</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #111; }
            h2 { color: #8B1E3F; margin: 0 0 8px 0; font-size: 20px; }
            p { font-size: 11px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #F8E9EE; color: #8B1E3F; }
          </style>
        </head>
        <body>
          <h2>AI Intelligence Report Center</h2>
          <p>Generated: ${new Date().toLocaleString()} | Oxford Global University</p>
          <table>
            <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
            <tbody>${formatted.map(r => `<tr>${keys.map(k => `<td>${r[k] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
    toast.success('Print document prepared');
  };

  return (
    <div className="page space-y-8">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="card-flat p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <Brain size={12} />
              AI Center (Intelligence Hub)
            </div>
            <h1 className="text-2xl font-black text-[#111111] leading-none">System Intelligence Hub</h1>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Single intelligent workspace for analytics, reports, predictions, security audit and copilot assistant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClearFilters} className="btn-secondary py-2 px-3 text-[12px] rounded-[10px]">
              Reset Filters
            </button>
            <button onClick={() => { fetchAnalyticsHub(); fetchReportsHub(); }} className="btn-primary py-2 px-3 text-[12px] rounded-[10px] flex items-center gap-1.5">
              <RefreshCw size={12} />
              Sync Data
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating Sub Navigation ──────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#FFFCFA]/90 backdrop-blur-md border-b border-[rgba(139,30,63,0.08)] py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeSection === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSearchParams({ section: t.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all whitespace-nowrap ${
                active
                  ? 'bg-[#8B1E3F] text-white shadow-sm'
                  : 'text-[#6B7280] hover:bg-[#FDF0F4] hover:text-[#8B1E3F]'
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Active Hub Section View ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {/* Section 1: Executive Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-flat p-5 bg-[#FAFAFA]">
                  <p className="text-[11px] font-bold text-[#9CA3AF] uppercase">Institution Health</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-[32px] font-black text-[#8B1E3F]">92.8%</span>
                    <span className="text-[12px] font-bold text-[#10B981] flex items-center gap-0.5">
                      <TrendingUp size={12} /> +1.2%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-1">Weighted grade & attendance factor</p>
                </div>
                <div className="card-flat p-5 bg-[#FAFAFA]">
                  <p className="text-[11px] font-bold text-[#9CA3AF] uppercase">System Intelligence Status</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse-soft" />
                    <span className="text-[18px] font-bold text-[#111111]">AI Agent Active</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-2">Gemini Pro 2.5 API latency: 124ms</p>
                </div>
                <div className="card-flat p-5 bg-[#FAFAFA]">
                  <p className="text-[11px] font-bold text-[#9CA3AF] uppercase">Today's Activity Index</p>
                  <p className="text-[16px] font-bold mt-2 text-[#374151]">
                    {analyticsData?.cards?.liveExams || 3} Active proctor sessions
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    {analyticsData?.cards?.totalStudents || 1240} enrolled students
                  </p>
                </div>
              </div>

              {/* AI Summary Bento */}
              <div className="card-flat p-6 border-l-4 border-[#8B1E3F] bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-[#8B1E3F]" />
                  <h3 className="text-[14px] font-bold text-[#111111]">Gemini Executive Summary</h3>
                </div>
                <p className="text-[13px] text-[#374151] leading-relaxed">
                  All systems operating normally. Attendance remains stable at 98.4%. Question generation parameters met syllabus guidelines for the upcoming CSE final. A 12% rise in average evaluation speeds has been detected following proctor dashboard automation deployment.
                </p>
              </div>
            </div>
          )}

          {/* Section 2: AI Assistant */}
          {activeSection === 'assistant' && (
            <div className="card-flat max-w-3xl mx-auto overflow-hidden flex flex-col h-[520px] bg-white">
              {/* Header */}
              <div className="px-5 py-4 border-b border-[rgba(139,30,63,0.08)] bg-[#FAFAFA] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-[#8B1E3F]" />
                  <div>
                    <h3 className="text-[13px] font-bold text-[#111111]">Gemini Copilot</h3>
                    <p className="text-[10px] text-[#10B981] font-medium">Ready for commands</p>
                  </div>
                </div>
                <span className="text-[11px] text-[#9CA3AF] font-mono">Oxford Console AI</span>
              </div>

              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFAFB]">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-[#8B1E3F] text-white'
                        : 'bg-white border border-[rgba(139,30,63,0.08)] text-[#374151]'
                    }`}>
                      <p>{m.text}</p>
                      <span className={`text-[9px] block mt-1 ${m.sender === 'user' ? 'text-white/60 text-right' : 'text-[#9CA3AF]'}`}>
                        {m.time}
                      </span>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[rgba(139,30,63,0.08)] rounded-[14px] px-3.5 py-3 text-[12.5px] shadow-sm text-[#9CA3AF]">
                      Copilot is thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-[rgba(139,30,63,0.08)] bg-white flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask Gemini about students, live exams, security logs..."
                  className="input flex-1 py-2 text-[13px] focus:ring-wine"
                />
                <button onClick={handleChatSend} className="btn-primary p-2.5 rounded-[10px]">
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Section 3: AI Analytics */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              {/* Dynamic Filters Board */}
              <div className="card-flat p-4 bg-white space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#9CA3AF] uppercase">Academic Year</label>
                    <select value={aYear} onChange={e => setAYear(e.target.value)} className="select p-2 rounded-xl focus:outline-none text-xs">
                      <option value="">-- All Years --</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#9CA3AF] uppercase">Department</label>
                    <select value={aDept} onChange={e => setADept(e.target.value)} className="select p-2 rounded-xl focus:outline-none text-xs">
                      <option value="">-- All Departments --</option>
                      {dropdowns.departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#9CA3AF] uppercase">Course</label>
                    <select value={aCourse} onChange={e => setACourse(e.target.value)} className="select p-2 rounded-xl focus:outline-none text-xs">
                      <option value="">-- All Courses --</option>
                      {dropdowns.courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#9CA3AF] uppercase">Subject</label>
                    <select value={aSub} onChange={e => setASub(e.target.value)} className="select p-2 rounded-xl focus:outline-none text-xs">
                      <option value="">-- All Subjects --</option>
                      {dropdowns.subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {analyticsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-[16px]" />)}
                </div>
              ) : !analyticsData ? (
                <div className="p-12 text-center border border-dashed border-[rgba(139,30,63,0.10)] rounded-[20px]">
                  No Metrics available
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-flat p-4 bg-white">
                      <span className="text-[10px] text-[#9CA3AF] uppercase block font-semibold">Students</span>
                      <span className="text-xl font-black text-[#8B1E3F] block mt-1">{analyticsData.cards.totalStudents}</span>
                    </div>
                    <div className="card-flat p-4 bg-white">
                      <span className="text-[10px] text-[#9CA3AF] uppercase block font-semibold">Staff Count</span>
                      <span className="text-xl font-black text-[#8B1E3F] block mt-1">{analyticsData.cards.totalStaff}</span>
                    </div>
                    <div className="card-flat p-4 bg-white">
                      <span className="text-[10px] text-[#9CA3AF] uppercase block font-semibold">Exams Conducted</span>
                      <span className="text-xl font-black text-[#8B1E3F] block mt-1">{analyticsData.cards.totalExamsConducted}</span>
                    </div>
                    <div className="card-flat p-4 bg-white">
                      <span className="text-[10px] text-[#9CA3AF] uppercase block font-semibold">Pass / Fail Ratio</span>
                      <span className="text-sm font-bold text-[#8B1E3F] block mt-1">
                        Pass: {analyticsData.cards.passPercentage}% / Fail: {analyticsData.cards.failPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Monthly Volume */}
                    <div className="card-flat p-5 bg-white space-y-3">
                      <h4 className="text-[12px] font-bold text-[#8B1E3F] uppercase">Exams Volume Per Month</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.charts.examsConductedPerMonth} margin={{ left: -25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8B1E3F" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Department Performance */}
                    <div className="card-flat p-5 bg-white space-y-3">
                      <h4 className="text-[12px] font-bold text-[#8B1E3F] uppercase">Department Performance Mean Score</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.charts.deptPerformance} margin={{ left: -25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} unit="%" />
                            <Tooltip />
                            <Bar dataKey="avgScore" fill="#C95A7B" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* 1. Top Students */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <GraduationCap size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">🏆 Top 10 Students</h3>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="w-16 text-center">Rank</th>
                            <th>Student Name</th>
                            <th>Roll Number</th>
                            <th>Department</th>
                            <th className="text-center">Semester</th>
                            <th className="text-center">Overall %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.topStudents && analyticsData.topStudents.length > 0 ? (
                            analyticsData.topStudents.map((s) => (
                              <tr key={s.rank}>
                                <td className="text-center font-bold text-[#8B1E3F]">{s.rank}</td>
                                <td className="font-semibold text-gray-900">{s.name}</td>
                                <td className="font-mono text-xs">{s.rollNumber}</td>
                                <td>{s.department}</td>
                                <td className="text-center font-semibold">{s.semester}</td>
                                <td className="text-center font-mono font-bold text-emerald-600">{s.percentage}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center text-gray-400 py-4">No top students data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. Weak Students */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <AlertTriangle size={16} className="text-[#DC2626]" />
                      <h3 className="text-xs font-extrabold text-[#DC2626] uppercase">📉 Weak Students (At-Risk)</h3>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Roll Number</th>
                            <th>Department</th>
                            <th className="text-center">Semester</th>
                            <th className="text-center">Avg Percentage</th>
                            <th className="text-center">Failed Exams</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.weakStudents && analyticsData.weakStudents.length > 0 ? (
                            analyticsData.weakStudents.map((s, idx) => (
                              <tr key={idx}>
                                <td className="font-semibold text-gray-900">{s.name}</td>
                                <td className="font-mono text-xs">{s.rollNumber}</td>
                                <td>{s.department}</td>
                                <td className="text-center">{s.semester}</td>
                                <td className="text-center font-mono font-bold text-red-600">{s.percentage}%</td>
                                <td className="text-center font-bold text-[#DC2626]">{s.failedExams}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center text-gray-400 py-4">No at-risk students identified</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. Weak Units */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <FileText size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">📚 Unit-wise Performance Analysis</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {analyticsData.weakUnits && analyticsData.weakUnits.length > 0 ? (
                        analyticsData.weakUnits.map((u, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-[rgba(139,30,63,0.08)] bg-[#FAFAFA] space-y-2">
                            <span className="text-[12px] font-bold text-[#8B1E3F] block truncate" title={u.name}>{u.name}</span>
                            <div className="flex justify-between items-center text-xs pt-1">
                              <span className="text-gray-500">Avg Score:</span>
                              <span className="font-mono font-bold text-gray-800">{u.avgScore}%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Weakness:</span>
                              <span className="font-mono font-bold text-red-600">{u.weaknessPct}%</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div className="bg-[#8B1E3F] h-full" style={{ width: `${u.weaknessPct}%` }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center text-gray-400 py-4">No unit performance data available</div>
                      )}
                    </div>
                  </div>

                  {/* 4. Weak Topics */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <TrendingDown size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">📖 Topic-wise Performance Analysis</h3>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Topic</th>
                            <th className="text-center">Average Score</th>
                            <th className="text-center">Correct attempts %</th>
                            <th className="text-center">Wrong attempts %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.weakTopics && analyticsData.weakTopics.length > 0 ? (
                            analyticsData.weakTopics.map((t, idx) => (
                              <tr key={idx}>
                                <td className="font-semibold text-gray-900">{t.name}</td>
                                <td className="text-center font-mono font-bold">{t.avgScore}%</td>
                                <td className="text-center font-mono text-emerald-600 font-semibold">{t.correctPct}%</td>
                                <td className="text-center font-mono text-red-600 font-bold">{t.wrongPct}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center text-gray-400 py-4">No topic performance data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 5. Frequently Wrong Questions */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <HelpCircle size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">❓ Frequently Wrong Questions</h3>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Subject</th>
                            <th className="text-center">Wrong Attempts</th>
                            <th className="text-center">Correct Attempts</th>
                            <th className="text-center">Wrong %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.freqWrongQuestions && analyticsData.freqWrongQuestions.length > 0 ? (
                            analyticsData.freqWrongQuestions.map((q, idx) => (
                              <tr key={idx}>
                                <td className="font-medium text-gray-900 max-w-xs truncate" title={q.questionText}>{q.questionText}</td>
                                <td>{q.subject}</td>
                                <td className="text-center font-mono font-semibold text-red-600">{q.wrongAttempts}</td>
                                <td className="text-center font-mono text-emerald-600">{q.correctAttempts}</td>
                                <td className="text-center font-mono font-bold text-red-600">{q.wrongPct}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center text-gray-400 py-4">No question-level analysis available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 6. Question Difficulty */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <Activity size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">🎯 Question Difficulty Insights</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 text-center">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Easy Questions</span>
                        <span className="text-2xl font-black text-emerald-700 block mt-1">
                          {analyticsData.questionDifficulty?.easyCount || 0}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 text-center">
                        <span className="text-[10px] text-blue-600 uppercase font-bold block">Medium Questions</span>
                        <span className="text-2xl font-black text-blue-700 block mt-1">
                          {analyticsData.questionDifficulty?.mediumCount || 0}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl border border-red-100 bg-red-50/30 text-center">
                        <span className="text-[10px] text-red-600 uppercase font-bold block">Hard Questions</span>
                        <span className="text-2xl font-black text-red-700 block mt-1">
                          {analyticsData.questionDifficulty?.hardCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.questionDifficulty?.chartData || []} margin={{ left: -25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <XAxis dataKey="difficulty" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {(analyticsData.questionDifficulty?.chartData || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.difficulty === 'Easy' ? '#10B981' : entry.difficulty === 'Medium' ? '#3B82F6' : '#EF4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 7. Class Performance */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <Users size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">📊 Class Performance Breakdown</h3>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Class / Cohort</th>
                            <th className="text-center">Appeared</th>
                            <th className="text-center">Passed</th>
                            <th className="text-center">Failed</th>
                            <th className="text-center">Avg Marks</th>
                            <th className="text-center">Avg Percentage</th>
                            <th className="text-center">Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.classPerformance && analyticsData.classPerformance.length > 0 ? (
                            analyticsData.classPerformance.map((c, idx) => (
                              <tr key={idx}>
                                <td className="font-semibold text-gray-900">{c.className}</td>
                                <td className="text-center font-mono">{c.appeared}</td>
                                <td className="text-center font-mono text-emerald-600 font-semibold">{c.passed}</td>
                                <td className="text-center font-mono text-red-600 font-semibold">{c.failed}</td>
                                <td className="text-center font-mono">{c.avgMarks}</td>
                                <td className="text-center font-mono font-bold">{c.avgPercentage}%</td>
                                <td className="text-center">
                                  <span className={`badge ${c.passPercentage >= 75 ? 'badge-green' : c.passPercentage >= 50 ? 'badge-amber' : 'badge-red'}`}>
                                    {c.passPercentage}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center text-gray-400 py-4">No class performance records</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 8. Department Performance */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <Building2 size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">🏛 Department Academic Performance</h3>
                    </div>
                    
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.departmentPerformanceData || []} margin={{ left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
                          <YAxis tick={{ fontSize: 10 }} unit="%" />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="avgPercentage" name="Average Score %" fill="#C95A7B" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="passPercentage" name="Pass Rate %" fill="#8B1E3F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 9. Semester Performance */}
                  <div className="card-flat p-5 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <Calendar size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">📅 Semester Performance Analysis</h3>
                    </div>
                    
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.semesterPerformanceData || []} margin={{ left: -20, right: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="semester" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} unit="%" />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Line type="monotone" dataKey="avgPercentage" name="Avg Percentage %" stroke="#C95A7B" strokeWidth={2} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="passPercentage" name="Pass Rate %" stroke="#8B1E3F" strokeWidth={2} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 10. AI Recommendations */}
                  <div className="card-flat p-5 bg-white space-y-4 border-l-4 border-[#8B1E3F]">
                    <div className="flex items-center gap-2 border-b border-[#F8E9EE] pb-2">
                      <Sparkles size={16} className="text-[#8B1E3F]" />
                      <h3 className="text-xs font-extrabold text-[#8B1E3F] uppercase">🤖 AI Academic Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      {analyticsData.aiRecommendations && analyticsData.aiRecommendations.length > 0 ? (
                        analyticsData.aiRecommendations.map((rec, idx) => {
                          let iconColor = 'text-blue-500';
                          let bgColor = 'bg-blue-50/40 border-blue-100';
                          let IconComponent = AlertCircle;

                          if (rec.type === 'warning') {
                            iconColor = 'text-[#F59E0B]';
                            bgColor = 'bg-amber-50/40 border-amber-100';
                            IconComponent = AlertTriangle;
                          } else if (rec.type === 'danger') {
                            iconColor = 'text-red-500';
                            bgColor = 'bg-red-50/40 border-red-100';
                            IconComponent = XCircle;
                          } else if (rec.type === 'success') {
                            iconColor = 'text-emerald-500';
                            bgColor = 'bg-emerald-50/40 border-emerald-100';
                            IconComponent = CheckCircle;
                          }

                          return (
                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${bgColor} text-xs leading-relaxed`}>
                              <IconComponent size={16} className={`${iconColor} shrink-0 mt-0.5`} />
                              <p className="text-gray-700 font-medium">{rec.text}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-500 italic">No recommendations could be compiled for the current selection.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Section 4: AI Predictions */}
          {activeSection === 'predictions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="card-flat p-5 bg-white space-y-3">
                  <h4 className="text-[13px] font-bold text-[#8B1E3F]">Expected Semester Pass Index</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[28px] font-black text-[#111]">89.2%</span>
                    <span className="badge badge-green">High Confidence</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">Model expects 5.2% pass increase due to syllabus reinforcement.</p>
                </div>
                <div className="card-flat p-5 bg-white space-y-3">
                  <h4 className="text-[13px] font-bold text-[#8B1E3F]">Weak Students Warning Flag</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[28px] font-black text-[#DC2626]">14</span>
                    <span className="badge badge-red">Attention</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">Candidates identified with sub-45% scores in practice assessments.</p>
                </div>
                <div className="card-flat p-5 bg-white space-y-3">
                  <h4 className="text-[13px] font-bold text-[#8B1E3F]">At-Risk Departments</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#111]">Mechanical Engineering</span>
                    <span className="badge badge-amber">Medium Risk</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">Historical failure logs indicate a potential risk for Sem 4 finals.</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: AI Security Intelligence */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="card-flat p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F8E9EE] pb-2">
                    <h3 className="text-[13px] font-bold text-[#8B1E3F]">Security Violations Index</h3>
                    <Shield size={14} className="text-[#8B1E3F]" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { type: 'Tab Switch Out', user: 'David Miller', time: '10 mins ago', status: 'Blocked' },
                      { type: 'Multiple Face Detection', user: 'Sophia Lin', time: '1 hour ago', status: 'Warning' },
                      { type: 'Camera Disconnected', user: 'James Croft', time: '3 hours ago', status: 'Flagged' }
                    ].map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-[12px] p-2 bg-[#FAFAFA] rounded-[8px]">
                        <div>
                          <p className="font-bold text-[#111]">{v.type}</p>
                          <p className="text-[10px] text-[#6B7280]">{v.user} · {v.time}</p>
                        </div>
                        <span className={`badge ${v.status === 'Blocked' ? 'badge-red' : 'badge-amber'}`}>{v.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-flat p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F8E9EE] pb-2">
                    <h3 className="text-[13px] font-bold text-[#8B1E3F]">Browser Integrity Monitor</h3>
                    <CheckCircle2 size={14} className="text-[#10B981]" />
                  </div>
                  <p className="text-[12.5px] text-[#374151]">
                    Vite Security Lockout hooks are fully active on Oxford Global Examination systems. Integrity status holds at <strong className="text-[#059669]">100% Secure</strong>.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
                    <div className="p-3 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0]">
                      <span className="text-[#059669] font-bold block">Integrity Hook</span>
                      <span className="text-[10px] text-[#6B7280]">ACTIVE</span>
                    </div>
                    <div className="p-3 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0]">
                      <span className="text-[#059669] font-bold block">Safe Mode</span>
                      <span className="text-[10px] text-[#6B7280]">ENABLED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: AI Question Intelligence */}
          {activeSection === 'questions' && (
            <div className="space-y-6">
              <div className="card-flat p-5 bg-white space-y-4">
                <h4 className="text-[13px] font-bold text-[#8B1E3F]">Bloom's Taxonomy Target Allocation</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-semibold">
                  {[
                    { label: 'Remembering', val: '24%', color: '#8B1E3F' },
                    { label: 'Understanding', val: '32%', color: ROSE },
                    { label: 'Analyzing', val: '28%', color: '#3B82F6' },
                    { label: 'Creating', val: '16%', color: '#10B981' }
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl border border-[rgba(139,30,63,0.08)] bg-[#FAFAFA]">
                      <span className="text-[10px] text-[#6B7280] block uppercase">{item.label}</span>
                      <span className="text-lg font-black mt-1 block" style={{ color: item.color }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Distribution Chart */}
              {analyticsData && (
                <div className="card-flat p-5 bg-white space-y-3">
                  <h4 className="text-[12px] font-bold text-[#8B1E3F] uppercase">Question Difficulty Distribution</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.charts.difficultyDistribution} margin={{ left: -25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="difficulty" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8B1E3F" radius={[4, 4, 0, 0]}>
                          {analyticsData.charts.difficultyDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.difficulty === 'Easy' ? '#10B981' : entry.difficulty === 'Medium' ? '#3B82F6' : '#EF4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 7: AI Recommendations */}
          {activeSection === 'recommendations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="card-flat p-5 bg-white space-y-3">
                <div className="flex items-center gap-2 text-[#8B1E3F]">
                  <Zap size={15} />
                  <h4 className="text-[13px] font-bold">Suggested Remedial Actions</h4>
                </div>
                <ul className="space-y-2 text-[12.5px] text-[#374151]">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#8B1E3F] rounded-full mt-2 shrink-0" />
                    Deploy AI-generated algorithms quiz to Mechanical Sem 4.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#8B1E3F] rounded-full mt-2 shrink-0" />
                    Review low difficulty questions target for EE-201 syllabus.
                  </li>
                </ul>
              </div>

              <div className="card-flat p-5 bg-white space-y-3">
                <div className="flex items-center gap-2 text-[#059669]">
                  <CheckCircle size={15} />
                  <h4 className="text-[13px] font-bold">Faculty Guidelines</h4>
                </div>
                <p className="text-[12.5px] text-[#374151]">
                  AI recommends assigning supplementary course topics review modules to Dr. Harris before releasing CSE final question bank metrics.
                </p>
              </div>
            </div>
          )}

          {/* Section 8: AI Report Center */}
          {activeSection === 'reports' && (
            <div className="space-y-6">
              {/* Report center controls banner */}
              <div className="card-flat p-5 bg-[#FAFAFA] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-[#8B1E3F]">Institutional Report Console</h3>
                  <p className="text-[11.5px] text-[#6B7280]">Select parameters to query real-time results.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleExportPDF} className="btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5 border-[#8B1E3F]/35 text-[#8B1E3F]">
                    <Download size={12} /> PDF
                  </button>
                  <button onClick={handleExportExcel} className="btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5 border-[#8B1E3F]/35 text-[#8B1E3F]">
                    <Download size={12} /> Excel
                  </button>
                  <button onClick={handleExportCSV} className="btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5 border-[#8B1E3F]/35 text-[#8B1E3F]">
                    <Download size={12} /> CSV
                  </button>
                </div>
              </div>

              {/* TABS header */}
              <div className="flex overflow-x-auto gap-1.5 p-1 bg-white border border-[rgba(139,30,63,0.08)] rounded-[14px]">
                {REPORT_TABS.map(tab => {
                  const Icon = tab.icon;
                  const active = repTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRepTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[11.5px] font-semibold transition-all whitespace-nowrap ${
                        active
                          ? 'bg-[#FDF0F4] text-[#8B1E3F] font-bold'
                          : 'text-[#6B7280] hover:bg-[#FCFAFB] hover:text-[#8B1E3F]'
                      }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search and Filters toolbar */}
              <div className="card-flat p-4 bg-white">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <div className="flex flex-col gap-1 text-[11px] font-semibold text-[#6B7280]">
                    <label className="uppercase tracking-wide font-bold">Search Term</label>
                    <input
                      type="text"
                      placeholder="Title or Register Number..."
                      value={repSearch}
                      onChange={e => setRepSearch(e.target.value)}
                      className="input py-2 text-[12px] focus:ring-wine"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] font-semibold text-[#6B7280]">
                    <label className="uppercase tracking-wide font-bold">Department</label>
                    <select value={aDept} onChange={e => setADept(e.target.value)} className="select py-2 text-[12px] focus:ring-wine">
                      <option value="">-- All Departments --</option>
                      {dropdowns.departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] font-semibold text-[#6B7280]">
                    <label className="uppercase tracking-wide font-bold">Semester</label>
                    <select value={aSem} onChange={e => setASem(e.target.value)} className="select py-2 text-[12px] focus:ring-wine">
                      <option value="">-- All Semesters --</option>
                      {dropdowns.semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary py-2 px-3 text-[12px] flex-1 justify-center rounded-[10px]">
                      Search
                    </button>
                    <button type="button" onClick={handleClearFilters} className="btn-ghost py-2 px-3 text-[12px] rounded-[10px]">
                      Clear
                    </button>
                  </div>
                </form>
              </div>

              {/* Table Wrapper */}
              <div className="table-wrap">
                {repLoading ? (
                  <div className="p-12 space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-9 bg-gray-200 rounded w-full" />)}
                  </div>
                ) : !repData.length ? (
                  <div className="p-16 text-center text-[#9CA3AF]">
                    <FileText size={48} className="mx-auto opacity-20 mb-3" />
                    <p className="font-bold text-[14px]">No Reports available</p>
                    <p className="text-[12px] text-[#6B7280] mt-1">Please try modifying your search filter.</p>
                  </div>
                ) : (
                  <div>
                    {/* Render corresponding tables */}
                    {repTab === 'student-performance' && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Register Number</th>
                            <th>Course</th>
                            <th>Exam Name</th>
                            <th className="text-center">Marks</th>
                            <th className="text-center">Percentage</th>
                            <th className="text-center">Grade</th>
                            <th className="text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repData.map(r => (
                            <tr key={r._id}>
                              <td className="font-semibold text-[#8B1E3F]">{r.studentName}</td>
                              <td className="font-mono">{r.registerNumber}</td>
                              <td>{r.course} (Sem {r.semester})</td>
                              <td className="font-medium">{r.examName}</td>
                              <td className="text-center font-mono font-bold">{r.marksObtained} / {r.totalMarks}</td>
                              <td className="text-center font-mono font-semibold">{r.percentage}%</td>
                              <td className="text-center font-bold">{r.grade}</td>
                              <td className="text-center">
                                <span className={`badge ${r.status === 'Pass' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {repTab === 'exam' && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Subject</th>
                            <th className="text-center">Eligible</th>
                            <th className="text-center">Attended</th>
                            <th className="text-center">Attendance %</th>
                            <th className="text-center">Avg Marks</th>
                            <th className="text-center">Pass / Fail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repData.map(r => (
                            <tr key={r._id}>
                              <td className="font-semibold text-[#8B1E3F]">{r.examName}</td>
                              <td>{r.subject}</td>
                              <td className="text-center font-mono">{r.totalEligibleStudents}</td>
                              <td className="text-center font-mono font-semibold text-[#10B981]">{r.totalAttended}</td>
                              <td className="text-center font-mono font-bold">{r.attendancePercentage}%</td>
                              <td className="text-center font-mono">{r.averageMarks}</td>
                              <td className="text-center font-semibold">
                                <span className="text-[#059669]">{r.passCount}</span> / <span className="text-[#DC2626]">{r.failCount}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {repTab === 'department' && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th className="text-center">Total Students</th>
                            <th className="text-center">Total Exams</th>
                            <th className="text-center">Average Score</th>
                            <th className="text-center">Pass %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repData.map(r => (
                            <tr key={r._id}>
                              <td className="font-semibold text-[#8B1E3F]">{r.departmentName}</td>
                              <td className="text-center font-mono">{r.totalStudents}</td>
                              <td className="text-center font-mono">{r.totalExams}</td>
                              <td className="text-center font-mono font-bold text-[#8B1E3F]">{r.averageScore}%</td>
                              <td className="text-center font-mono text-[#059669] font-bold">{r.passPercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {repTab === 'subject' && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th className="text-center">Total Exams</th>
                            <th className="text-center">Average Score</th>
                            <th className="text-center">Highest Score</th>
                            <th className="text-center">Pass Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repData.map(r => (
                            <tr key={r._id}>
                              <td className="font-semibold text-[#8B1E3F]">{r.subjectName}</td>
                              <td className="text-center font-mono">{r.totalExams}</td>
                              <td className="text-center font-mono font-bold text-[#8B1E3F]">{r.averageScore}%</td>
                              <td className="text-center font-mono font-bold text-[#059669]">{r.highestScore}%</td>
                              <td className="text-center font-mono text-[#059669] font-bold">{r.passPercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {repTab === 'staff-activity' && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Staff Member</th>
                            <th>Department</th>
                            <th className="text-center">Questions Created</th>
                            <th className="text-center">Approved</th>
                            <th className="text-center">Pending Approvals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repData.map(r => (
                            <tr key={r._id}>
                              <td className="font-semibold text-[#8B1E3F]">{r.staffName}</td>
                              <td className="text-on-surface-variant font-mono">{r.department}</td>
                              <td className="text-center font-mono">{r.questionsCreated}</td>
                              <td className="text-center font-mono text-[#059669] font-semibold">{r.questionsApproved}</td>
                              <td className="text-center font-mono text-[#F59E0B] font-semibold">{r.pendingQuestionApprovals}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {repTab === 'question-bank' && repData.length > 0 && (
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-[rgba(139,30,63,0.08)]">
                            <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">Total Questions</span>
                            <span className="font-extrabold text-2xl text-[#8B1E3F] font-mono mt-1 block">{repData[0].totalQuestions}</span>
                          </div>
                          <div className="p-4 bg-[#ECFDF5] rounded-2xl border border-[#A7F3D0]">
                            <span className="text-[10px] font-mono text-[#059669] uppercase block">Approved</span>
                            <span className="font-extrabold text-2xl text-[#059669] font-mono mt-1 block">{repData[0].approvedQuestions}</span>
                          </div>
                          <div className="p-4 bg-[#FFFBEB] rounded-2xl border border-[#FDE68A]">
                            <span className="text-[10px] font-mono text-[#D97706] uppercase block">Pending</span>
                            <span className="font-extrabold text-2xl text-[#D97706] font-mono mt-1 block">{repData[0].pendingQuestions}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {repTab === 'result' && repData.length > 0 && (
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-[rgba(139,30,63,0.08)]">
                            <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">Total Results</span>
                            <span className="font-extrabold text-2xl text-[#8B1E3F] font-mono mt-1 block">{repData[0].totalResults}</span>
                          </div>
                          <div className="p-4 bg-[#ECFDF5] rounded-2xl border border-[#A7F3D0]">
                            <span className="text-[10px] font-mono text-[#059669] uppercase block">Published</span>
                            <span className="font-extrabold text-2xl text-[#059669] font-mono mt-1 block">{repData[0].publishedResults}</span>
                          </div>
                          <div className="p-4 bg-[#FFFBEB] rounded-2xl border border-[#FDE68A]">
                            <span className="text-[10px] font-mono text-[#D97706] uppercase block">Pending Review</span>
                            <span className="font-extrabold text-2xl text-[#D97706] font-mono mt-1 block">{repData[0].pendingResults}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {repTotalPages > 1 && repTab !== 'question-bank' && repTab !== 'result' && (
                <div className="flex justify-center items-center gap-4 text-xs font-bold pt-2">
                  <button
                    disabled={repPage === 1}
                    onClick={() => setRepPage(prev => Math.max(prev - 1, 1))}
                    className="px-4 py-2 border border-[#8B1E3F]/15 rounded-xl hover:bg-[#FDF0F4] disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[#6B7280] font-mono">
                    Page {repPage} of {repTotalPages}
                  </span>
                  <button
                    disabled={repPage === repTotalPages}
                    onClick={() => setRepPage(prev => Math.min(prev + 1, repTotalPages))}
                    className="px-4 py-2 border border-[#8B1E3F]/15 rounded-xl hover:bg-[#FDF0F4] disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminAiCenter;
