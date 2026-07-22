import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdowns lists loaded from backend
  const [departmentsList, setDepartmentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [semestersList, setSemestersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const response = await api.get('/staff/question-bank/dropdowns');
      if (response.data && response.data.success) {
        const { departments, courses, semesters, subjects } = response.data.data;
        setDepartmentsList(departments || []);
        setCoursesList(courses || []);
        setSemestersList(semesters || []);
        setSubjectsList(subjects || []);
      }
    } catch (error) {
      console.error('Failed to load filters dropdowns:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/admin', {
        params: {
          academicYear: academicYear || undefined,
          department: department || undefined,
          course: course || undefined,
          semester: semester || undefined,
          subject: subject || undefined,
          examType: examType || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });

      if (response.data && response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load institution analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [academicYear, department, course, semester, subject, examType, startDate, endDate]);

  const handleClearFilters = () => {
    setAcademicYear('');
    setDepartment('');
    setCourse('');
    setSemester('');
    setSubject('');
    setExamType('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Dashboard Top Banner */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Administrative Analytics</h2>
          <p className="text-on-surface-variant text-xs font-semibold">
            Real-time aggregate data, subject grading distributions, exam schedules, and staff activities.
          </p>
        </div>
        <button
          onClick={handleClearFilters}
          className="py-2.5 px-4 rounded-xl border border-primary/10 text-primary hover:bg-primary/5 text-xs font-bold transition-all shrink-0 self-start md:self-center"
        >
          Reset Filters
        </button>
      </div>

      {/* Dynamic Filters Board */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Years --</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Departments --</option>
              {departmentsList.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Courses --</option>
              {coursesList.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Semesters --</option>
              {semestersList.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Subjects --</option>
              {subjectsList.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            >
              <option value="">-- All Types --</option>
              <option value="Internal Assessment">Internal Assessment</option>
              <option value="Semester Exam">Semester Exam</option>
              <option value="Quiz">Quiz</option>
              <option value="Practice Test">Practice Test</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-container-high rounded-[20px]"></div>
          ))}
          {[1, 2].map((i) => (
            <div key={i} className="md:col-span-2 h-72 bg-surface-container-high rounded-[24px]"></div>
          ))}
        </div>
      ) : !data ? (
        <div className="p-16 text-center border-2 border-dashed border-primary/10 rounded-[28px] bg-primary/5">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20">analytics</span>
          <h3 className="text-base font-bold text-on-surface mt-2">No Metrics Loaded</h3>
          <p className="text-on-surface-variant text-xs mt-1">Failed to aggregate statistics. Please reload the console.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Total Students</span>
              <span className="block font-bold text-2xl text-primary font-mono mt-1">{data.cards.totalStudents}</span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Total Staff</span>
              <span className="block font-bold text-2xl text-primary font-mono mt-1">{data.cards.totalStaff}</span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Total Departments</span>
              <span className="block font-bold text-2xl text-primary font-mono mt-1">{data.cards.totalDepartments}</span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Total Subjects</span>
              <span className="block font-bold text-2xl text-primary font-mono mt-1">{data.cards.totalSubjects}</span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Conducted Exams</span>
              <span className="block font-bold text-2xl text-primary font-mono mt-1">{data.cards.totalExamsConducted}</span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Live / Completed</span>
              <span className="block font-bold text-lg text-primary font-mono mt-2.5">
                {data.cards.liveExams} Live / {data.cards.completedExams} Done
              </span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Unreleased Results (Draft)</span>
              <span className="block font-bold text-2xl text-amber-600 font-mono mt-1">
                {data.cards.pendingEvaluations} Candidates
              </span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Published Scorecards</span>
              <span className="block font-bold text-2xl text-green-700 font-mono mt-1">
                {data.cards.publishedResults} Records
              </span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all md:col-span-2">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Average Institution Grade</span>
              <span className="block font-extrabold text-2xl text-primary font-mono mt-1">
                {data.cards.averageInstitutionScore}% Mean score
              </span>
            </div>
            <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all md:col-span-2">
              <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Grading Success Rates</span>
              <span className="block font-extrabold text-lg text-primary font-mono mt-2.5">
                Pass: <span className="text-green-700 font-bold font-mono">{data.cards.passPercentage}%</span> / Fail: <span className="text-red-600 font-bold font-mono">{data.cards.failPercentage}%</span>
              </span>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Exams Conducted Per Month */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-primary uppercase">Exams Conducted Per Month</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.examsConductedPerMonth} margin={{ left: -20, bottom: -5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pass vs Fail Distribution */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-primary uppercase">Institution Pass vs Fail Distribution</h3>
              <div className="h-64 flex items-center justify-center gap-6">
                {data.charts.passFailDistribution[0].value === 0 && data.charts.passFailDistribution[1].value === 0 ? (
                  <p className="text-xs font-semibold text-on-surface-variant">No published grades available to plot.</p>
                ) : (
                  <>
                    <div className="w-[180px] h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.charts.passFailDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {data.charts.passFailDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-[10px] space-y-2 font-mono font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Pass: {data.charts.passFailDistribution[0].value} Candidates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Fail: {data.charts.passFailDistribution[1].value} Candidates</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 3: Department-wise Average Score */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-primary uppercase">Department-wise Mean Score %</h3>
              <div className="h-64">
                {data.charts.deptPerformance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                    No department grades compiled.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.deptPerformance} margin={{ left: -20, bottom: -5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 600 }} unit="%" />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                      <Bar dataKey="avgScore" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 4: Subject-wise Performance */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-primary uppercase">Subject-wise Average Score %</h3>
              <div className="h-64">
                {data.charts.subjectPerformance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                    No subject grades compiled.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.charts.subjectPerformance} margin={{ left: 10, bottom: -5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis type="number" tick={{ fontSize: 9, fontWeight: 600 }} unit="%" />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 8, fontWeight: 600 }} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                      <Bar dataKey="avgScore" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 5: Student Attendance Rate */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-primary uppercase">Completed Exams Student Attendance Rate %</h3>
              <div className="h-64">
                {data.charts.studentAttendanceRate.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                    No completed exam rosters to plot attendance rate.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.charts.studentAttendanceRate} margin={{ left: -20, bottom: -5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="exam" tick={{ fontSize: 8, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 600 }} unit="%" />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="rate" stroke="#8B5CF6" strokeWidth={2} name="Attendance %" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 6: Question Difficulty Distribution */}
            <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-primary uppercase">Question Bank Difficulty Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.difficultyDistribution} margin={{ left: -20, bottom: -5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="difficulty" tick={{ fontSize: 9, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                      {data.charts.difficultyDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.difficulty === 'Easy' ? '#10B981' : entry.difficulty === 'Medium' ? '#3B82F6' : '#EF4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="glass-panel p-5 rounded-[24px] border border-primary/5 bg-white shadow-sm space-y-5">
            <h3 className="text-xs font-bold font-mono text-primary uppercase">Recent Activity Logs</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold uppercase text-on-surface-variant border-b border-primary/5 pb-1">
                  Latest Operations
                </h4>

                <div className="space-y-2.5">
                  {/* Latest Exam */}
                  <div className="flex items-start gap-2.5 p-2 bg-surface-container-low/40 rounded-xl border border-primary/5">
                    <span className="material-symbols-outlined text-primary text-base">assignment</span>
                    <div>
                      <p className="text-[11px] text-on-surface font-bold">Latest Exam Paper Prepared</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        {data.recentActivities.latestExam
                          ? `"${data.recentActivities.latestExam.title}" (Prepared by ${data.recentActivities.latestExam.createdBy?.name || 'Staff'})`
                          : 'No exam preparation history.'}
                      </p>
                      {data.recentActivities.latestExam && (
                        <span className="text-[8px] text-on-surface-variant/40 block mt-1 font-mono">
                          {new Date(data.recentActivities.latestExam.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latest Result */}
                  <div className="flex items-start gap-2.5 p-2 bg-surface-container-low/40 rounded-xl border border-primary/5">
                    <span className="material-symbols-outlined text-green-600 text-base">workspace_premium</span>
                    <div>
                      <p className="text-[11px] text-on-surface font-bold">Latest Scorecard Released</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        {data.recentActivities.latestResult
                          ? `Student "${data.recentActivities.latestResult.student?.name}" for "${data.recentActivities.latestResult.exam?.title}"`
                          : 'No grade publication history.'}
                      </p>
                      {data.recentActivities.latestResult && (
                        <span className="text-[8px] text-on-surface-variant/40 block mt-1 font-mono">
                          {new Date(data.recentActivities.latestResult.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latest Submission */}
                  <div className="flex items-start gap-2.5 p-2 bg-surface-container-low/40 rounded-xl border border-primary/5">
                    <span className="material-symbols-outlined text-blue-600 text-base">upload_file</span>
                    <div>
                      <p className="text-[11px] text-on-surface font-bold">Latest Candidate Submission</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        {data.recentActivities.latestSubmission
                          ? `Candidate "${data.recentActivities.latestSubmission.student?.name}" submitted "${data.recentActivities.latestSubmission.exam?.title}"`
                          : 'No exam submission history.'}
                      </p>
                      {data.recentActivities.latestSubmission && (
                        <span className="text-[8px] text-on-surface-variant/40 block mt-1 font-mono">
                          {new Date(data.recentActivities.latestSubmission.submissionTime).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latest Staff Approval */}
                  <div className="flex items-start gap-2.5 p-2 bg-surface-container-low/40 rounded-xl border border-primary/5">
                    <span className="material-symbols-outlined text-purple-600 text-base">rule</span>
                    <div>
                      <p className="text-[11px] text-on-surface font-bold">Latest Question Bank Approval</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        {data.recentActivities.latestStaffApproval
                          ? `Question from "${data.recentActivities.latestStaffApproval.SubmittedBy?.name}" approved`
                          : 'No question submission approvals recorded.'}
                      </p>
                      {data.recentActivities.latestStaffApproval && (
                        <span className="text-[8px] text-on-surface-variant/40 block mt-1 font-mono">
                          {new Date(data.recentActivities.latestStaffApproval.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest notifications feed */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold uppercase text-on-surface-variant border-b border-primary/5 pb-1">
                  Alert Notifications Log
                </h4>

                <div className="space-y-2">
                  {data.recentActivities.latestNotifications.length === 0 ? (
                    <p className="text-[11px] text-on-surface-variant/60 font-semibold p-4 text-center">
                      No admin notifications received.
                    </p>
                  ) : (
                    data.recentActivities.latestNotifications.map((notif) => (
                      <div key={notif._id} className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[11px] font-bold text-primary leading-tight">{notif.title}</p>
                          <span className="text-[8px] text-on-surface-variant/50 font-mono shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
