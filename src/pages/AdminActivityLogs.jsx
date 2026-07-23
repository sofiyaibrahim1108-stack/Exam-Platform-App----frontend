import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  ShieldAlert, Trash2, Download, FileText, Search, Settings, User, Terminal, Cpu, Info, X, ChevronLeft, ChevronRight, CheckCircle2, AlertOctagon, HelpCircle
} from 'lucide-react';
import api from '../services/api';

const MODULES = [
  'Authentication',
  'Academic',
  'Question Bank',
  'Exam',
  'Student',
  'Results',
  'Reports',
  'Notifications',
  'Support',
  'Settings',
  'Institution',
  'General',
];

const AdminActivityLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    todayActivities: 0,
    failedActivities: 0,
    activeUsersToday: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Dropdown lists
  const [departmentsList, setDepartmentsList] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const dropRes = await api.get('/staff/question-bank/dropdowns');
      if (dropRes.data && dropRes.data.success) {
        setDepartmentsList(dropRes.data.data.departments || []);
      }
    } catch (e) {
      console.error('Failed to load department dropdowns:', e);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audits', {
        params: {
          role: role || undefined,
          department: department || undefined,
          module: moduleName || undefined,
          action: action || undefined,
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined,
          sortOrder,
          page,
          limit,
        },
      });

      if (response.data && response.data.success) {
        setLogs(response.data.data.results || []);
        setStats(response.data.data.stats || { totalActivities: 0, todayActivities: 0, failedActivities: 0, activeUsersToday: 0 });
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchLogs();
  }, [role, department, moduleName, action, status, startDate, endDate, sortOrder]);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setSearch('');
    setRole('');
    setDepartment('');
    setModuleName('');
    setAction('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setPage(1);
    setTimeout(() => fetchLogs(), 50);
  };

  // EXPORT HANDLERS
  const formatLogsForExport = (dataList) => {
    return dataList.map((log) => ({
      'Date & Time': new Date(log.timestamp).toLocaleString(),
      'User Name': log.userName,
      'User Role': log.userRole,
      Department: log.department,
      Module: log.module,
      Action: log.action,
      Description: log.details,
      Status: log.status,
      'IP Address': log.ipAddress,
      Browser: log.browser,
      Device: log.device,
    }));
  };

  const handleExportExcel = () => {
    if (!logs || logs.length === 0) {
      toast.error('No activity logs available to export.');
      return;
    }
    const formatted = formatLogsForExport(logs);
    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ActivityLogs');
    XLSX.writeFile(workbook, `Activity_Logs_${Date.now()}.xlsx`);
    toast.success('Activity logs exported to Excel!');
  };

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) {
      toast.error('No activity logs available to export.');
      return;
    }
    const formatted = formatLogsForExport(logs);
    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Activity_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Activity logs exported to CSV!');
  };

  const handleExportPDF = () => {
    if (!logs || logs.length === 0) {
      toast.error('No activity logs available to export.');
      return;
    }
    const formattedRows = formatLogsForExport(logs);
    const keys = formattedRows.length > 0 ? Object.keys(formattedRows[0]) : [];

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SYSTEM ACTIVITY AUDIT LOG REPORT</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
            h2 { color: #4f46e5; margin: 0 0 4px 0; font-size: 20px; }
            p { font-size: 11px; color: #64748b; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 9px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            th { background-color: #f1f5f9; color: #1e293b; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>System Activity Audit Log Report</h2>
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

  // LOG RETENTION CLEANUP
  const handleDeleteOldLogs = async () => {
    const daysStr = window.prompt('Delete audit logs older than how many days?', '30');
    if (!daysStr) return;
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days < 1) {
      toast.error('Please enter a valid number of days.');
      return;
    }

    const delToast = toast.loading(`Cleaning audit logs older than ${days} days...`);
    try {
      const response = await api.delete('/audits/old-logs', { data: { days } });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Old logs deleted.', { id: delToast });
        fetchLogs();
      }
    } catch (error) {
      toast.error('Failed to clean old logs.', { id: delToast });
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner Header */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <Terminal size={12} />
              Immutable Audit Trails
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">System Activity Logs</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Track immutable audit trails, security login events, administrative actions, and system transactions.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleDeleteOldLogs}
              className="btn-secondary py-2 px-3 text-[11.5px] rounded-[10px] flex items-center gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              <Trash2 size={13} />
              Delete Old Logs
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-secondary py-2 px-3 text-[11.5px] rounded-[10px] flex items-center gap-1 text-red-700 border-red-200 hover:bg-red-50"
            >
              <FileText size={13} />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="btn-secondary py-2 px-3 text-[11.5px] rounded-[10px] flex items-center gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              <Download size={13} />
              Excel
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-secondary py-2 px-3 text-[11.5px] rounded-[10px] flex items-center gap-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Download size={13} />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Total Activities</span>
          <span className="block font-black text-2xl text-[#8B1E3F] font-mono mt-1">{stats.totalActivities}</span>
        </div>
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Today's Activities</span>
          <span className="block font-black text-2xl text-[#4F46E5] font-mono mt-1">{stats.todayActivities}</span>
        </div>
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Failed Actions</span>
          <span className="block font-black text-2xl text-[#DC2626] font-mono mt-1">{stats.failedActivities}</span>
        </div>
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Active Users Today</span>
          <span className="block font-black text-2xl text-[#059669] font-mono mt-1">{stats.activeUsersToday}</span>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}
      <div className="card-flat p-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end text-xs font-semibold font-sans">
          <div className="flex flex-col gap-1 lg:col-span-2">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Search Term</span>
            <div className="search-bar">
              <Search size={14} className="text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search user, action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">User Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="select"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Student">Student</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="select"
            >
              <option value="">All Depts</option>
              {departmentsList.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">System Module</span>
            <select
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="select"
            >
              <option value="">All Modules</option>
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Action Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select"
            >
              <option value="">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs text-[#111111]"
            />
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-white border border-primary/10 rounded-xl focus:outline-none text-xs text-[#111111]"
            />
          </div>

          <div className="flex gap-2 lg:col-span-2 lg:col-start-7">
            <button
              type="submit"
              className="btn-primary py-2 px-4 flex-1 text-[12.5px] rounded-[10px] flex items-center justify-center gap-1.5"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn-secondary py-2 px-3 text-[12.5px] rounded-[10px] flex items-center justify-center gap-1.5"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* ACTIVITY LOG TABLE */}
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Terminal size={24} />
            </div>
            <h4 className="text-base font-bold text-[#111111]">No Activity Logs Found</h4>
            <p className="text-[#6B7280] text-xs mt-1">
              There are no audit records matching your specified filter options.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User Name & Role</th>
                  <th>Department</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th className="text-center">Status</th>
                  <th>IP & Browser</th>
                  <th className="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="font-mono text-[10px] whitespace-nowrap text-[#6B7280]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <p className="font-bold text-[#8B1E3F]">{log.userName}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono">{log.userRole}</p>
                    </td>
                    <td className="text-[#6B7280] font-mono">{log.department}</td>
                    <td>
                      <span className="badge badge-wine">
                        {log.module}
                      </span>
                    </td>
                    <td className="font-bold text-[#111111]">{log.action}</td>
                    <td className="max-w-xs truncate text-[11px] text-[#6B7280]">
                      {log.details}
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          log.status === 'Success'
                            ? 'badge-green'
                            : 'badge-red'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="text-[10px] font-mono text-[#6B7280]">
                      <p>{log.ipAddress}</p>
                      <p className="opacity-60">{log.browser} ({log.device})</p>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-[#8B1E3F] hover:bg-[#FDF0F4] rounded-lg transition-colors inline-flex"
                        title="View Full Detail"
                      >
                        <Info size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-primary/5 text-xs text-[#6B7280]">
          <span className="font-mono text-xs">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, stats.totalActivities)} of {stats.totalActivities} events
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-[24px] p-6 space-y-4 shadow-2xl border border-[rgba(139,30,63,0.12)]"
            >
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FDF0F4] text-[#8B1E3F] text-[9px] font-bold uppercase font-mono border border-[rgba(139,30,63,0.12)]">
                    {selectedLog.module} Audit Record
                  </span>
                  <h3 className="text-base font-bold text-[#111111] mt-1">{selectedLog.action}</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-[#6B7280] hover:bg-gray-100 hover:text-[#111111] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#9CA3AF] block">Description</span>
                  <p className="text-[#111111] leading-relaxed">{selectedLog.details}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-[9px] uppercase text-[#9CA3AF] block">User Performer</span>
                    <span className="text-[#8B1E3F] font-bold">{selectedLog.userName} ({selectedLog.userRole})</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#9CA3AF] block">User Email</span>
                    <span className="text-[#8B1E3F] font-bold">{selectedLog.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#9CA3AF] block">Department</span>
                    <span className="text-[#8B1E3F] font-bold">{selectedLog.department}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#9CA3AF] block">Status</span>
                    <span className={`font-bold ${selectedLog.status === 'Success' ? 'text-green-700' : 'text-red-600'}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#9CA3AF] block">IP Address</span>
                    <span className="text-[#8B1E3F] font-bold">{selectedLog.ipAddress}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#9CA3AF] block">Browser & Device</span>
                    <span className="text-[#8B1E3F] font-bold">{selectedLog.browser} ({selectedLog.device})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase text-[#9CA3AF] block">Timestamp</span>
                    <span className="text-[#8B1E3F] font-bold">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end border-t border-gray-100">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="btn-secondary py-2 px-5 text-xs rounded-[10px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminActivityLogs;
