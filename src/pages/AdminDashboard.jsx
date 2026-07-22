import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Mock data for charts
  const studentPerformanceData = [
    { name: 'Sem 1', avgScore: 74, topScore: 92 },
    { name: 'Sem 2', avgScore: 78, topScore: 95 },
    { name: 'Sem 3', avgScore: 81, topScore: 94 },
    { name: 'Sem 4', avgScore: 80, topScore: 97 },
    { name: 'Sem 5', avgScore: 86, topScore: 99 },
  ];

  const departmentData = [
    { name: 'Comp Sci', students: 340, passRate: 94 },
    { name: 'Elec Eng', students: 280, passRate: 89 },
    { name: 'Mech Eng', students: 210, passRate: 84 },
    { name: 'Civil Eng', students: 180, passRate: 81 },
    { name: 'Bio Tech', students: 230, passRate: 91 },
  ];

  const monthlyExamData = [
    { name: 'Jan', examsCount: 12 },
    { name: 'Feb', examsCount: 18 },
    { name: 'Mar', examsCount: 32 },
    { name: 'Apr', examsCount: 45 },
    { name: 'May', examsCount: 26 },
    { name: 'Jun', examsCount: 52 },
  ];

  const passFailData = [
    { name: 'Passed', value: 84 },
    { name: 'Failed', value: 16 },
  ];

  const aiUsageData = [
    { name: 'Comp Sci', questions: 480 },
    { name: 'Elec Eng', questions: 260 },
    { name: 'Mech Eng', questions: 140 },
    { name: 'Civil Eng', questions: 95 },
    { name: 'Bio Tech', questions: 320 },
  ];

  const qBankGrowthData = [
    { name: 'Jan', total: 4200 },
    { name: 'Feb', total: 5050 },
    { name: 'Mar', total: 6100 },
    { name: 'Apr', total: 7200 },
    { name: 'May', total: 7850 },
    { name: 'Jun', total: 8450 },
  ];

  const PIE_COLORS = ['#6b0f1a', '#735c00']; // Maroon and Gold branding!

  // Overview counts data list
  const overviewCards = [
    { title: 'Total Departments', count: '8', icon: 'domain', change: '+1 this term', color: 'text-primary' },
    { title: 'Total Courses', count: '24', icon: 'school', change: 'Flat term-over-term', color: 'text-secondary' },
    { title: 'Total Subjects', count: '142', icon: 'menu_book', change: '+12 new added', color: 'text-primary' },
    { title: 'Total Staff', count: '56', icon: 'badge', change: '2 awaiting approval', color: 'text-secondary' },
    { title: 'Total Students', count: '1,240', icon: 'group', change: '+142 registration', color: 'text-primary' },
    { title: 'Total Exams', count: '48', icon: 'assignment', change: '12 active/scheduled', color: 'text-secondary' },
    { title: 'Total Question Bank', count: '8,450', icon: 'quiz', change: '+850 generated', color: 'text-primary' },
    { title: 'Active Exams', count: '3', icon: 'bolt', change: 'Live proctoring active', color: 'text-emerald-600' },
    { title: 'Upcoming Exams', count: '12', icon: 'schedule', change: 'Next exam tomorrow', color: 'text-amber-600' },
    { title: 'Pending Staff Approval', count: '4', icon: 'gavel', change: 'Requires manual review', color: 'text-error' },
  ];

  // Quick Action handler
  const handleQuickAction = (actionName, path) => {
    toast.success(`Opening ${actionName} panel...`);
    navigate(path);
  };

  const quickActions = [
    { label: 'Create Department', path: '/admin/departments', icon: 'domain' },
    { label: 'Create Course', path: '/admin/courses', icon: 'school' },
    { label: 'Create Subject', path: '/admin/subjects', icon: 'menu_book' },
    { label: 'Add Staff', path: '/admin/staff', icon: 'badge' },
    { label: 'Import Students', path: '/admin/students', icon: 'upload_file' },
    { label: 'Generate AI Questions', path: '/admin/ai-center', icon: 'auto_awesome' },
    { label: 'Create Exam', path: '/admin/exams', icon: 'add_circle' },
    { label: 'View Reports', path: '/admin/reports', icon: 'bar_chart' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Welcome back, Institution Admin</h2>
          <p className="text-on-surface-variant text-xs">
            Review academic progress, monitor live examination metrics, approve faculty profiles, and check AI diagnostic insights.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-mono font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Campus Server Operational
          </span>
        </div>
      </div>

      {/* 10 Bento-Style Overview Cards */}
      <div>
        <h3 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-4 px-1">Institutional Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {overviewCards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className="glass-panel p-4 rounded-[20px] flex flex-col justify-between border border-primary/5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold text-on-surface-variant/80 tracking-tight max-w-[85px] leading-tight">{card.title}</span>
                <span className={`material-symbols-outlined text-[18px] ${card.color}`}>{card.icon}</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black font-mono text-primary leading-none">{card.count}</p>
                <p className="text-[9px] font-medium text-on-surface-variant/65 mt-1.5 truncate">{card.change}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 6 Recharts Charts Grid */}
      <div>
        <h3 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-4 px-1">Analytics & Diagnostics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Student Performance */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary">Student Performance Trends</h4>
              <p className="text-[10px] text-on-surface-variant">Avg scores vs top scores by semester levels</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b0f1a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6b0f1a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#735c00" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#735c00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 15, 26, 0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip wrapperClassName="text-xs font-sans rounded-xl border border-primary/10 shadow-lg" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="avgScore" name="Average GPA Score" stroke="#6b0f1a" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2} />
                  <Area type="monotone" dataKey="topScore" name="Highest Score" stroke="#735c00" fillOpacity={1} fill="url(#colorTop)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Department Comparison */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary">Department Comparison</h4>
              <p className="text-[10px] text-on-surface-variant">Student distribution & average examination pass rate (%)</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 15, 26, 0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip wrapperClassName="text-xs font-sans rounded-xl border border-primary/10 shadow-lg" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="students" name="Student Count" fill="#6b0f1a" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="passRate" name="Pass Rate (%)" fill="#735c00" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Monthly Exam Statistics */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary">Monthly Exam Statistics</h4>
              <p className="text-[10px] text-on-surface-variant">Volume of online assessments conducted</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyExamData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 15, 26, 0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip wrapperClassName="text-xs font-sans rounded-xl border border-primary/10 shadow-lg" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="examsCount" name="Exams Conducted" stroke="#6b0f1a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Pass / Fail Ratio */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary">Pass / Fail Ratio</h4>
              <p className="text-[10px] text-on-surface-variant">Aggregated academic result index of last 100 exams</p>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passFailData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip wrapperClassName="text-xs font-sans rounded-xl border border-primary/10 shadow-lg" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3 font-mono text-[11px] font-semibold text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#6b0f1a]"></span>
                  <span>Passed Candidates: 84%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#735c00]"></span>
                  <span>Failed Candidates: 16%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 5: AI Usage Statistics */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary">AI Usage Statistics</h4>
              <p className="text-[10px] text-on-surface-variant">Questions generated using AI engine by departments</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 15, 26, 0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip wrapperClassName="text-xs font-sans rounded-xl border border-primary/10 shadow-lg" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="questions" name="AI-Generated Questions" fill="#6b0f1a" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {aiUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6b0f1a' : '#735c00'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Question Bank Growth */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary">Question Bank Growth</h4>
              <p className="text-[10px] text-on-surface-variant">Total validated question repository growth curve (6 Months)</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={qBankGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b0f1a" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6b0f1a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 15, 26, 0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip wrapperClassName="text-xs font-sans rounded-xl border border-primary/10 shadow-lg" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="total" name="Total Questions" stroke="#6b0f1a" fillOpacity={1} fill="url(#colorGrowth)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Widgets Section */}
      <div>
        <h3 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-4 px-1">Control Center Widgets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Widget 1: Quick Actions */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 flex flex-col justify-between min-h-[360px]">
            <div>
              <h4 className="text-sm font-bold text-primary">Quick Actions</h4>
              <p className="text-[10px] text-on-surface-variant">Direct access shortcuts to configure platform features</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label, action.path)}
                  className="flex flex-col items-center justify-center p-3 border border-primary/5 hover:border-primary/20 bg-primary/[0.02] hover:bg-primary/5 text-primary rounded-xl text-center transition-all group active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg mb-1.5 group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-[10px] font-semibold tracking-tight leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Widget 2: Upcoming Exams */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 min-h-[360px]">
            <div>
              <h4 className="text-sm font-bold text-primary">Upcoming Exams</h4>
              <p className="text-[10px] text-on-surface-variant">Scheduled academic assessments queue</p>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Distributed Systems Final', code: 'CSE-402', date: 'July 18, 10:00 AM', status: 'Live Soon', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
                { title: 'Microprocessors Lab', code: 'EE-304', date: 'July 20, 02:00 PM', status: '3 days left', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
                { title: 'AI & Machine Learning Quiz', code: 'CSE-512', date: 'July 22, 11:30 AM', status: '5 days left', badge: 'bg-primary/5 text-primary border-primary/10' },
              ].map((exam, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-primary/5 bg-surface-container/30 rounded-xl">
                  <div>
                    <h5 className="text-[11px] font-bold text-primary leading-tight">{exam.title}</h5>
                    <p className="text-[9px] text-on-surface-variant font-mono uppercase mt-0.5">{exam.code} • {exam.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${exam.badge}`}>{exam.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Today's Schedule */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 min-h-[360px]">
            <div>
              <h4 className="text-sm font-bold text-primary">Today's Schedule</h4>
              <p className="text-[10px] text-on-surface-variant">Academic calendar events timeline</p>
            </div>
            <div className="space-y-3 font-mono">
              {[
                { time: '09:00 - 10:30', title: 'CSE Proctoring Active', type: 'Proctoring', color: 'border-l-4 border-l-emerald-600' },
                { time: '11:00 - 12:00', title: 'Syllabi Revision Panel', type: 'Meeting', color: 'border-l-4 border-l-primary' },
                { time: '14:00 - 16:00', title: 'AI Question Validation', type: 'Sync Session', color: 'border-l-4 border-l-secondary' },
                { time: '16:30', title: 'System DB Backup', type: 'Scheduled Event', color: 'border-l-4 border-l-gray-400' },
              ].map((sch, i) => (
                <div key={i} className={`p-2.5 bg-surface-container/30 rounded-xl ${sch.color} flex justify-between items-center`}>
                  <div>
                    <span className="text-[9px] font-bold text-on-surface-variant">{sch.time}</span>
                    <h5 className="text-[10px] font-bold text-primary truncate w-40 mt-0.5">{sch.title}</h5>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-primary/5 text-primary rounded">{sch.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 4: AI Insights */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 min-h-[360px]">
            <div>
              <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base animate-pulse text-secondary">auto_awesome</span>
                AI Insights & Tips
              </h4>
              <p className="text-[10px] text-on-surface-variant">Google Gemini real-time diagnostics summary</p>
            </div>
            <div className="space-y-3 text-xs text-on-surface-variant">
              <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-sm text-secondary mt-0.5">lightbulb</span>
                <p className="leading-relaxed text-[11px]">
                  <strong>CS-101 Question bank</strong> shows lower diversity in high-difficulty sections. Generate 15 more algorithmic questions to improve index.
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/5 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-sm text-primary mt-0.5">trending_up</span>
                <p className="leading-relaxed text-[11px]">
                  <strong>AI Gen Efficiency:</strong> Faculty syllabus parsing speed improved by 24% following the latest model validation update.
                </p>
              </div>
            </div>
          </div>

          {/* Widget 5: Recent Activities */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 min-h-[360px]">
            <div>
              <h4 className="text-sm font-bold text-primary">Recent Activities</h4>
              <p className="text-[10px] text-on-surface-variant">Real-time system action logging</p>
            </div>
            <div className="space-y-3 font-mono">
              {[
                { detail: 'Dr. Harris created 50 AI questions for CSE-302', time: '10m ago' },
                { detail: 'Registrar imported 120 students for Sem 1', time: '1h ago' },
                { detail: 'Exam paper validated for Computer Networks', time: '3h ago' },
                { detail: 'System settings updated: Camera mode ON', time: '5h ago' },
              ].map((act, i) => (
                <div key={i} className="flex justify-between items-start gap-3 text-[10px] border-b border-primary/5 pb-2">
                  <p className="text-on-surface-variant leading-normal w-4/5">{act.detail}</p>
                  <span className="text-[8px] font-bold text-primary/50 text-right w-1/5 whitespace-nowrap mt-0.5">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 6: Latest Notifications */}
          <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 min-h-[360px]">
            <div>
              <h4 className="text-sm font-bold text-primary">Latest Notifications</h4>
              <p className="text-[10px] text-on-surface-variant">Important alerts and workspace flags</p>
            </div>
            <div className="space-y-3 text-[11px] font-semibold">
              <div className="flex items-center justify-between p-2.5 bg-error/5 text-error border border-error/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">gavel</span>
                  <span>4 staff accounts require approval</span>
                </div>
                <button
                  onClick={() => navigate('/admin/staff')}
                  className="px-2 py-0.5 bg-error/10 hover:bg-error/20 rounded font-mono text-[9px]"
                >
                  Verify
                </button>
              </div>
              <div className="p-2.5 bg-amber-500/5 text-amber-700 border border-amber-500/10 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">warning</span>
                <span>CSE-304 Exam Paper review deadline is today</span>
              </div>
              <div className="p-2.5 bg-primary/5 text-primary border border-primary/5 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">info</span>
                <span>Vite production bundle validated successfully</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
