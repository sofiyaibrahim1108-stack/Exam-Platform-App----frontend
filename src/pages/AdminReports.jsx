import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../services/api';

const TABS = [
  { id: 'student-performance', label: 'Student Performance', icon: 'person_search' },
  { id: 'exam', label: 'Exam Report', icon: 'assignment' },
  { id: 'department', label: 'Department Report', icon: 'domain' },
  { id: 'subject', label: 'Subject Report', icon: 'menu_book' },
  { id: 'staff-activity', label: 'Staff Activity', icon: 'badge' },
  { id: 'question-bank', label: 'Question Bank', icon: 'quiz' },
  { id: 'result', label: 'Result Report', icon: 'workspace_premium' },
];

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('student-performance');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [exam, setExam] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Sorting & Pagination
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Dropdown lists
  const [departmentsList, setDepartmentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [semestersList, setSemestersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [examsList, setExamsList] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const dropRes = await api.get('/staff/question-bank/dropdowns');
      if (dropRes.data && dropRes.data.success) {
        const { departments, courses, semesters, subjects } = dropRes.data.data;
        setDepartmentsList(departments || []);
        setCoursesList(courses || []);
        setSemestersList(semesters || []);
        setSubjectsList(subjects || []);
      }

      const examRes = await api.get('/admin/exams', { params: { limit: 100 } });
      if (examRes.data && examRes.data.success) {
        setExamsList(examRes.data.data.results || []);
      }
    } catch (error) {
      console.error('Failed to load filter dropdowns:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/admin', {
        params: {
          type: activeTab,
          academicYear: academicYear || undefined,
          department: department || undefined,
          course: course || undefined,
          semester: semester || undefined,
          subject: subject || undefined,
          exam: exam || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined,
          sortField: sortField || undefined,
          sortOrder,
          page,
          limit,
        },
      });

      if (response.data && response.data.success) {
        setReportData(response.data.data.reportData || []);
        setTotalRecords(response.data.data.pagination?.total || 0);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchReportData();
  }, [activeTab, academicYear, department, course, semester, subject, exam, startDate, endDate, sortOrder]);

  useEffect(() => {
    fetchReportData();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReportData();
  };

  const handleClearFilters = () => {
    setAcademicYear('');
    setDepartment('');
    setCourse('');
    setSemester('');
    setSubject('');
    setExam('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
    setTimeout(() => fetchReportData(), 50);
  };

  // Helper to format JSON data for CSV / Excel / PDF exports
  const formatDataForExport = (dataList) => {
    if (activeTab === 'student-performance') {
      return dataList.map((row) => ({
        'Student Name': row.studentName,
        'Register Number': row.registerNumber,
        Department: row.department,
        Course: row.course,
        Semester: row.semester,
        'Exam Name': row.examName,
        'Marks Obtained': row.marksObtained,
        'Total Marks': row.totalMarks,
        'Percentage (%)': row.percentage,
        Grade: row.grade,
        'Pass / Fail': row.status,
        'Attempt Date': new Date(row.attemptDate).toLocaleDateString(),
      }));
    } else if (activeTab === 'exam') {
      return dataList.map((row) => ({
        'Exam Name': row.examName,
        Subject: row.subject,
        'Total Eligible': row.totalEligibleStudents,
        'Total Attended': row.totalAttended,
        'Total Absent': row.totalAbsent,
        'Attendance (%)': row.attendancePercentage,
        'Average Marks': row.averageMarks,
        'Highest Marks': row.highestMarks,
        'Lowest Marks': row.lowestMarks,
        'Pass Count': row.passCount,
        'Fail Count': row.failCount,
        'Pass (%)': row.passPercentage,
      }));
    } else if (activeTab === 'department') {
      return dataList.map((row) => ({
        Department: row.departmentName,
        'Total Students': row.totalStudents,
        'Total Exams': row.totalExams,
        'Average Score (%)': row.averageScore,
        'Pass (%)': row.passPercentage,
        'Fail (%)': row.failPercentage,
      }));
    } else if (activeTab === 'subject') {
      return dataList.map((row) => ({
        Subject: row.subjectName,
        'Total Exams': row.totalExams,
        'Average Score (%)': row.averageScore,
        'Highest Score (%)': row.highestScore,
        'Lowest Score (%)': row.lowestScore,
        'Pass (%)': row.passPercentage,
        'Fail (%)': row.failPercentage,
      }));
    } else if (activeTab === 'staff-activity') {
      return dataList.map((row) => ({
        'Staff Name': row.staffName,
        Department: row.department,
        'Questions Created': row.questionsCreated,
        'Questions Approved': row.questionsApproved,
        'Exams Created': row.examsCreated,
        'Pending Approvals': row.pendingQuestionApprovals,
      }));
    } else if (activeTab === 'question-bank') {
      return dataList.map((row) => ({
        'Total Questions': row.totalQuestions,
        'Approved Questions': row.approvedQuestions,
        'Pending Questions': row.pendingQuestions,
        'Rejected Questions': row.rejectedQuestions,
        'AI Generated': row.aiGeneratedQuestions,
        Manual: row.manualQuestions,
        'Easy Questions': row.difficultyDistribution?.easy || 0,
        'Medium Questions': row.difficultyDistribution?.medium || 0,
        'Hard Questions': row.difficultyDistribution?.hard || 0,
      }));
    } else if (activeTab === 'result') {
      return dataList.map((row) => ({
        'Total Results': row.totalResults,
        'Published Results': row.publishedResults,
        'Pending Results': row.pendingResults,
        'Pass Count': row.passCount,
        'Fail Count': row.failCount,
        'Grade O': row.gradeDistribution?.O || 0,
        'Grade A+': row.gradeDistribution?.['A+'] || 0,
        'Grade A': row.gradeDistribution?.A || 0,
        'Grade B': row.gradeDistribution?.B || 0,
        'Grade C': row.gradeDistribution?.C || 0,
        'Grade P': row.gradeDistribution?.P || 0,
        'Grade F': row.gradeDistribution?.F || 0,
      }));
    }
    return dataList;
  };

  // Export Handlers
  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No report data to export.');
      return;
    }
    const formatted = formatDataForExport(reportData);
    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `Report_${activeTab}_${Date.now()}.xlsx`);
    toast.success('Report exported to Excel successfully!');
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No report data to export.');
      return;
    }
    const formatted = formatDataForExport(reportData);
    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully!');
  };

  const handleExportPDF = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No report data to export.');
      return;
    }
    const formattedRows = formatDataForExport(reportData);
    const keys = formattedRows.length > 0 ? Object.keys(formattedRows[0]) : [];

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeTab.toUpperCase()} REPORT</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
            h2 { color: #4f46e5; margin: 0 0 4px 0; font-size: 20px; }
            p { font-size: 11px; color: #64748b; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; color: #1e293b; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Institutional ${activeTab.replace('-', ' ').toUpperCase()} Report</h2>
            <p>Generated on: ${new Date().toLocaleString()} | AI Examination Platform</p>
          </div>
          <table>
            <thead>
              <tr>${keys.map((k) => `<th>${k}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${formattedRows
                .map(
                  (row) =>
                    `<tr>${keys.map((k) => `<td>${row[k] !== undefined && row[k] !== null ? row[k] : ''}</td>`).join('')}</tr>`
                )
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Document ready for PDF export!');
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Institutional Reports Center</h2>
          <p className="text-on-surface-variant text-xs font-semibold">
            Query real-time database audits, examine departmental performances, and export compliance scorecards.
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={handleExportPDF}
            className="py-2 px-3 rounded-xl border border-red-500/20 text-red-700 bg-red-50 hover:bg-red-100/60 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="py-2 px-3 rounded-xl border border-green-500/20 text-green-700 bg-green-50 hover:bg-green-100/60 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">table_view</span>
            Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl border border-blue-500/20 text-blue-700 bg-blue-50 hover:bg-blue-100/60 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">csv</span>
            CSV
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 glass-panel rounded-[20px] border border-primary/5 bg-white shadow-sm scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-primary/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Common Filters Toolbar */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search Term</label>
            <input
              type="text"
              placeholder="Search title, name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Years --</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Departments --</option>
              {departmentsList.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Courses --</option>
              {coursesList.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Semesters --</option>
              {semestersList.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Subjects --</option>
              {subjectsList.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Exam Filter</label>
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold text-primary"
            >
              <option value="">-- All Exams --</option>
              {examsList.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.title}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2.5 px-4 rounded-xl border border-primary/10 text-on-surface-variant hover:bg-primary/5 text-xs font-bold transition-all"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Main Report Body / Tables */}
      <div className="glass-panel rounded-[24px] border border-primary/5 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-8 bg-surface-container-high rounded w-full"></div>
            <div className="h-8 bg-surface-container-high rounded w-full"></div>
            <div className="h-8 bg-surface-container-high rounded w-full"></div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-16 text-center border-t border-primary/5">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
              find_in_page
            </span>
            <h4 className="text-base font-bold text-on-surface">No Reports Available</h4>
            <p className="text-on-surface-variant text-xs mt-1">
              There are no audit records matching your specified filter options.
            </p>
          </div>
        ) : (
          <div>
            {/* TAB 1: Student Performance Report */}
            {activeTab === 'student-performance' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Register Number</th>
                      <th className="p-4">Department / Course</th>
                      <th className="p-4">Semester</th>
                      <th className="p-4">Exam Name</th>
                      <th className="p-4 text-center">Marks</th>
                      <th className="p-4 text-center">Percentage</th>
                      <th className="p-4 text-center">Grade</th>
                      <th className="p-4 text-center">Pass / Fail</th>
                      <th className="p-4 text-center">Attempt Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {reportData.map((row) => (
                      <tr key={row._id} className="hover:bg-primary/[0.02] transition-colors">
                        <td className="p-4 font-bold text-primary">{row.studentName}</td>
                        <td className="p-4 font-mono">{row.registerNumber}</td>
                        <td className="p-4">
                          <p>{row.department}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{row.course}</p>
                        </td>
                        <td className="p-4 font-mono">{row.semester}</td>
                        <td className="p-4 font-bold">{row.examName}</td>
                        <td className="p-4 text-center font-mono font-bold">
                          {row.marksObtained} / {row.totalMarks}
                        </td>
                        <td className="p-4 text-center font-mono font-bold">{row.percentage}%</td>
                        <td className="p-4 text-center font-mono font-extrabold">{row.grade}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              row.status === 'Pass'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-[10px]">
                          {new Date(row.attemptDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Exam Report */}
            {activeTab === 'exam' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Exam Name</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4 text-center">Eligible</th>
                      <th className="p-4 text-center">Attended</th>
                      <th className="p-4 text-center">Absent</th>
                      <th className="p-4 text-center">Attendance %</th>
                      <th className="p-4 text-center">Avg / High / Low</th>
                      <th className="p-4 text-center">Pass / Fail Count</th>
                      <th className="p-4 text-center">Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {reportData.map((row) => (
                      <tr key={row._id} className="hover:bg-primary/[0.02] transition-colors">
                        <td className="p-4 font-bold text-primary">{row.examName}</td>
                        <td className="p-4">{row.subject}</td>
                        <td className="p-4 text-center font-mono">{row.totalEligibleStudents}</td>
                        <td className="p-4 text-center font-mono text-green-700 font-bold">{row.totalAttended}</td>
                        <td className="p-4 text-center font-mono text-red-600 font-bold">{row.totalAbsent}</td>
                        <td className="p-4 text-center font-mono font-bold">{row.attendancePercentage}%</td>
                        <td className="p-4 text-center font-mono">
                          {row.averageMarks} / {row.highestMarks} / {row.lowestMarks}
                        </td>
                        <td className="p-4 text-center font-mono">
                          <span className="text-green-700 font-bold">{row.passCount}</span> /{' '}
                          <span className="text-red-600 font-bold">{row.failCount}</span>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-green-700">{row.passPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: Department Report */}
            {activeTab === 'department' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Department</th>
                      <th className="p-4 text-center">Total Students</th>
                      <th className="p-4 text-center">Total Exams</th>
                      <th className="p-4 text-center">Average Score (%)</th>
                      <th className="p-4 text-center">Pass %</th>
                      <th className="p-4 text-center">Fail %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {reportData.map((row) => (
                      <tr key={row._id} className="hover:bg-primary/[0.02] transition-colors">
                        <td className="p-4 font-bold text-primary">{row.departmentName}</td>
                        <td className="p-4 text-center font-mono font-bold">{row.totalStudents}</td>
                        <td className="p-4 text-center font-mono font-bold">{row.totalExams}</td>
                        <td className="p-4 text-center font-mono font-bold text-indigo-700">{row.averageScore}%</td>
                        <td className="p-4 text-center font-mono font-bold text-green-700">{row.passPercentage}%</td>
                        <td className="p-4 text-center font-mono font-bold text-red-600">{row.failPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: Subject Report */}
            {activeTab === 'subject' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Subject Name</th>
                      <th className="p-4 text-center">Total Exams</th>
                      <th className="p-4 text-center">Average Score (%)</th>
                      <th className="p-4 text-center">Highest Score (%)</th>
                      <th className="p-4 text-center">Lowest Score (%)</th>
                      <th className="p-4 text-center">Pass %</th>
                      <th className="p-4 text-center">Fail %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {reportData.map((row) => (
                      <tr key={row._id} className="hover:bg-primary/[0.02] transition-colors">
                        <td className="p-4 font-bold text-primary">{row.subjectName}</td>
                        <td className="p-4 text-center font-mono font-bold">{row.totalExams}</td>
                        <td className="p-4 text-center font-mono font-bold text-indigo-700">{row.averageScore}%</td>
                        <td className="p-4 text-center font-mono font-bold text-green-700">{row.highestScore}%</td>
                        <td className="p-4 text-center font-mono font-bold text-amber-600">{row.lowestScore}%</td>
                        <td className="p-4 text-center font-mono font-bold text-green-700">{row.passPercentage}%</td>
                        <td className="p-4 text-center font-mono font-bold text-red-600">{row.failPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 5: Staff Activity Report */}
            {activeTab === 'staff-activity' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Department</th>
                      <th className="p-4 text-center">Questions Created</th>
                      <th className="p-4 text-center">Questions Approved</th>
                      <th className="p-4 text-center">Pending Approvals</th>
                      <th className="p-4 text-center">Exams Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {reportData.map((row) => (
                      <tr key={row._id} className="hover:bg-primary/[0.02] transition-colors">
                        <td className="p-4 font-bold text-primary">{row.staffName}</td>
                        <td className="p-4 text-on-surface-variant font-mono">{row.department}</td>
                        <td className="p-4 text-center font-mono font-bold">{row.questionsCreated}</td>
                        <td className="p-4 text-center font-mono font-bold text-green-700">{row.questionsApproved}</td>
                        <td className="p-4 text-center font-mono font-bold text-amber-600">{row.pendingQuestionApprovals}</td>
                        <td className="p-4 text-center font-mono font-bold text-indigo-700">{row.examsCreated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 6: Question Bank Report */}
            {activeTab === 'question-bank' && reportData.length > 0 && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase block">Total Questions</span>
                    <span className="font-extrabold text-2xl text-primary font-mono mt-1 block">
                      {reportData[0].totalQuestions}
                    </span>
                  </div>
                  <div className="p-4 bg-green-50/50 rounded-2xl border border-green-500/10">
                    <span className="text-[10px] font-mono text-green-800 uppercase block">Approved Questions</span>
                    <span className="font-extrabold text-2xl text-green-700 font-mono mt-1 block">
                      {reportData[0].approvedQuestions}
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-500/10">
                    <span className="text-[10px] font-mono text-amber-800 uppercase block">Pending Questions</span>
                    <span className="font-extrabold text-2xl text-amber-700 font-mono mt-1 block">
                      {reportData[0].pendingQuestions}
                    </span>
                  </div>
                  <div className="p-4 bg-red-50/50 rounded-2xl border border-red-500/10">
                    <span className="text-[10px] font-mono text-red-800 uppercase block">Rejected Questions</span>
                    <span className="font-extrabold text-2xl text-red-700 font-mono mt-1 block">
                      {reportData[0].rejectedQuestions}
                    </span>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-500/10">
                    <span className="text-[10px] font-mono text-indigo-800 uppercase block">AI Generated</span>
                    <span className="font-extrabold text-2xl text-indigo-700 font-mono mt-1 block">
                      {reportData[0].aiGeneratedQuestions}
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-500/10">
                    <span className="text-[10px] font-mono text-blue-800 uppercase block">Manual Drafts</span>
                    <span className="font-extrabold text-2xl text-blue-700 font-mono mt-1 block">
                      {reportData[0].manualQuestions}
                    </span>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="p-5 bg-white border border-primary/5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-primary">Question Bank Difficulty Distribution</h4>
                  <div className="grid grid-cols-3 gap-3 font-mono text-center">
                    <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                      <span className="text-[9px] uppercase block text-green-700">Easy</span>
                      <span className="font-bold text-base text-green-700">{reportData[0].difficultyDistribution?.easy || 0}</span>
                    </div>
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                      <span className="text-[9px] uppercase block text-blue-700">Medium</span>
                      <span className="font-bold text-base text-blue-700">{reportData[0].difficultyDistribution?.medium || 0}</span>
                    </div>
                    <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                      <span className="text-[9px] uppercase block text-red-600">Hard</span>
                      <span className="font-bold text-base text-red-600">{reportData[0].difficultyDistribution?.hard || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: Result Report */}
            {activeTab === 'result' && reportData.length > 0 && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase block">Total Results</span>
                    <span className="font-extrabold text-2xl text-primary font-mono mt-1 block">
                      {reportData[0].totalResults}
                    </span>
                  </div>
                  <div className="p-4 bg-green-50/50 rounded-2xl border border-green-500/10">
                    <span className="text-[10px] font-mono text-green-800 uppercase block">Published Results</span>
                    <span className="font-extrabold text-2xl text-green-700 font-mono mt-1 block">
                      {reportData[0].publishedResults}
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-500/10">
                    <span className="text-[10px] font-mono text-amber-800 uppercase block">Pending Results (Draft)</span>
                    <span className="font-extrabold text-2xl text-amber-700 font-mono mt-1 block">
                      {reportData[0].pendingResults}
                    </span>
                  </div>
                  <div className="p-4 bg-green-50/50 rounded-2xl border border-green-500/10">
                    <span className="text-[10px] font-mono text-green-800 uppercase block">Total Candidates Passed</span>
                    <span className="font-extrabold text-2xl text-green-700 font-mono mt-1 block">
                      {reportData[0].passCount}
                    </span>
                  </div>
                  <div className="p-4 bg-red-50/50 rounded-2xl border border-red-500/10">
                    <span className="text-[10px] font-mono text-red-800 uppercase block">Total Candidates Failed</span>
                    <span className="font-extrabold text-2xl text-red-700 font-mono mt-1 block">
                      {reportData[0].failCount}
                    </span>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="p-5 bg-white border border-primary/5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-primary">Letter Grade Distribution Breakdown</h4>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2 font-mono text-center">
                    {['O', 'A+', 'A', 'B', 'C', 'P', 'F'].map((gradeKey) => (
                      <div key={gradeKey} className="p-2.5 bg-surface-container-low rounded-xl border border-primary/5">
                        <span className="text-[9px] uppercase block text-on-surface-variant font-bold">Grade {gradeKey}</span>
                        <span className="font-extrabold text-sm text-primary">
                          {reportData[0].gradeDistribution?.[gradeKey] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && activeTab !== 'question-bank' && activeTab !== 'result' && (
        <div className="flex justify-center items-center gap-4 text-xs font-bold pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-on-surface-variant font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-primary/10 rounded-xl hover:bg-primary/5 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
