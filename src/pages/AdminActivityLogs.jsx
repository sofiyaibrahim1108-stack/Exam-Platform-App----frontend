import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
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
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">System Activity Logs</h2>
          <p className="text-on-surface-variant text-xs font-semibold">
            Track immutable audit trails, security login events, administrative actions, and system transactions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={handleDeleteOldLogs}
            className="py-2 px-3 rounded-xl border border-amber-500/20 text-amber-800 bg-amber-50 hover:bg-amber-100/60 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">auto_delete</span>
            Delete Old Logs
          </button>
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

      {/* DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Total Activities</span>
          <span className="block font-bold text-2xl text-primary font-mono mt-1">{stats.totalActivities}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Today's Activities</span>
          <span className="block font-bold text-2xl text-indigo-700 font-mono mt-1">{stats.todayActivities}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Failed Actions</span>
          <span className="block font-bold text-2xl text-red-600 font-mono mt-1">{stats.failedActivities}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Active Users Today</span>
          <span className="block font-bold text-2xl text-green-700 font-mono mt-1">{stats.activeUsersToday}</span>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search Term</label>
            <input
              type="text"
              placeholder="Search user, action, description, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">User Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Roles --</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Student">Student</option>
              <option value="Super Admin">Super Admin</option>
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
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">System Module</label>
            <select
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Modules --</option>
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Action Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Statuses --</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
            />
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

      {/* ACTIVITY LOG TABLE */}
      <div className="glass-panel rounded-[24px] border border-primary/5 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center border-t border-primary/5">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
              history_toggle_off
            </span>
            <h4 className="text-base font-bold text-on-surface">No Activity Logs Found</h4>
            <p className="text-on-surface-variant text-xs mt-1">
              There are no audit records matching your specified filter options.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">User Name & Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">IP & Browser</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4 font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-primary">{log.userName}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">{log.userRole}</p>
                    </td>
                    <td className="p-4 text-on-surface-variant font-mono">{log.department}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-on-surface">{log.action}</td>
                    <td className="p-4 max-w-xs truncate text-[11px] text-on-surface-variant">
                      {log.details}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          log.status === 'Success'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-[10px] font-mono">
                      <p>{log.ipAddress}</p>
                      <p className="text-on-surface-variant/60">{log.browser} ({log.device})</p>
                    </td>
                    <td className="p-4 text-right shrink-0">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="View Full Detail"
                      >
                        <span className="material-symbols-outlined text-base">info</span>
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

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-lg bg-white rounded-[24px] p-6 space-y-4 shadow-2xl border border-primary/10"
            >
              <div className="flex justify-between items-start border-b border-primary/5 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase font-mono">
                    {selectedLog.module} Audit Record
                  </span>
                  <h3 className="text-base font-bold text-primary mt-1">{selectedLog.action}</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Description</span>
                  <p className="text-on-surface leading-relaxed">{selectedLog.details}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">User Performer</span>
                    <span className="text-primary font-bold">{selectedLog.userName} ({selectedLog.userRole})</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">User Email</span>
                    <span className="text-primary font-bold">{selectedLog.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Department</span>
                    <span className="text-primary font-bold">{selectedLog.department}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Status</span>
                    <span className={`font-bold ${selectedLog.status === 'Success' ? 'text-green-700' : 'text-red-600'}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">IP Address</span>
                    <span className="text-primary font-bold">{selectedLog.ipAddress}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Browser & Device</span>
                    <span className="text-primary font-bold">{selectedLog.browser} ({selectedLog.device})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Timestamp</span>
                    <span className="text-primary font-bold">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-primary/5">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="py-2 px-5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95"
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
