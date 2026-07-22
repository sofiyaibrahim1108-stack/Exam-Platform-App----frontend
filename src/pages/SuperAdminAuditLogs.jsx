import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const SuperAdminAuditLogs = () => {
  // Lists & pagination state
  const [logs, setLogs] = useState([]);
  const [usersList, setUsersList] = useState([]); // To populate User Filter
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filter parameters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Enumerated list of standard action events to filter by
  const ACTIONS = [
    'Login',
    'Logout',
    'Institution Create',
    'Institution Update',
    'Institution Delete',
    'Institution Status Toggle',
    'Admin Create',
    'Admin Update',
    'Admin Delete',
    'Admin Status Toggle',
    'Admin Password Reset',
    'Settings Update',
  ];

  // Fetch audit logs matching query boundaries
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audits', {
        params: {
          search,
          action: actionFilter,
          user: userFilter,
          startDate,
          endDate,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setLogs(response.data.data.results);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to retrieve audit log files.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all admins/users to populate User Filter dropdown list
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admins', { params: { limit: 100 } });
      if (response.data && response.data.success) {
        setUsersList(response.data.data.results);
      }
    } catch (error) {
      console.error('Failed to populate users list:', error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [search, actionFilter, userFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // EXPORT CSV - Client Side String Compiler
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No log records available to export.');
      return;
    }

    const headers = ['Timestamp', 'Performer Name', 'Role', 'Action', 'Description Details', 'IP Address', 'User Agent'];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.user ? log.user.name : 'System',
      log.user ? log.user.role : 'System',
      log.action,
      `"${log.details.replace(/"/g, '""')}"`, // escape quotes for CSV
      log.ipAddress || '127.0.0.1',
      `"${(log.userAgent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit trail CSV downloaded successfully!');
  };

  // EXPORT PDF - Native Window Print Utility
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic CSS styles for clean PDF layout print triggers */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-[24px] border border-primary/5 no-print">
        <div>
          <h2 className="text-2xl font-bold text-primary">Platform Audit Logs</h2>
          <p className="text-on-surface-variant text-xs mt-1">Audit events, configuration changes, password resets, and user entries.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="border border-primary/15 text-primary py-3 px-5 rounded-xl font-semibold hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">csv</span>
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-primary text-white py-3 px-5 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2 text-sm shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end no-print">
        {/* Search Input */}
        <div className="md:col-span-2 space-y-1">
          <label className="block font-mono text-[9px] font-semibold text-on-surface-variant uppercase px-1">Details Search</label>
          <div className="flex items-center bg-surface rounded-xl px-4 py-2 border border-primary/5 shadow-sm">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search descriptions, IP addresses..."
              className="bg-transparent border-none focus:ring-0 text-xs w-full placeholder:text-on-surface-variant/50 outline-none ml-2"
              type="text"
            />
          </div>
        </div>

        {/* Action Type Filter */}
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-semibold text-on-surface-variant uppercase px-1">Action Type</label>
          <div className="bg-surface rounded-xl px-3 py-2 border border-primary/5 shadow-sm">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent border-none text-xs text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
            >
              <option value="">All Actions</option>
              {ACTIONS.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Performer User Filter */}
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-semibold text-on-surface-variant uppercase px-1">User Performer</label>
          <div className="bg-surface rounded-xl px-3 py-2 border border-primary/5 shadow-sm">
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent border-none text-xs text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
            >
              <option value="">All Performers</option>
              {usersList.map((user) => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start / End Date Picker */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block font-mono text-[9px] font-semibold text-on-surface-variant uppercase px-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface border border-primary/5 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block font-mono text-[9px] font-semibold text-on-surface-variant uppercase px-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface border border-primary/5 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Print Wrapper */}
      <div id="print-section" className="glass-panel p-6 rounded-[24px] shadow-sm">
        
        {loading ? (
          // Loading Skeletons
          <div className="space-y-4 py-4">
            <div className="h-8 bg-surface-container-high animate-pulse rounded-lg w-full"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-surface-container-low animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <span className="material-symbols-outlined text-primary/45 text-5xl">history_toggle_off</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">No Event Records</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">No recorded action logs matches the active filters query variables.</p>
            </div>
          </div>
        ) : (
          // Audits Data Table
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-primary/10 pb-4 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  <th className="py-4 px-3">Date & Time</th>
                  <th className="py-4 px-3">Performer</th>
                  <th className="py-4 px-3">Clearance Role</th>
                  <th className="py-4 px-3">Action Type</th>
                  <th className="py-4 px-3">Description Details</th>
                  <th className="py-4 px-3">IP Address</th>
                  <th className="py-4 px-3">Device Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-xs">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-primary/5 transition-colors">
                    {/* Timestamp */}
                    <td className="py-4 px-3 font-mono text-[11px] text-on-surface-variant">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* Performer */}
                    <td className="py-4 px-3 font-semibold text-on-surface">
                      {log.user ? log.user.name : 'System Engine'}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-3">
                      {log.user ? (
                        <span className="bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase">
                          {log.user.role}
                        </span>
                      ) : (
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase">
                          SYSTEM
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-3">
                      <span className="font-mono font-bold text-primary uppercase text-[10px] tracking-wider">
                        {log.action}
                      </span>
                    </td>

                    {/* Details Description */}
                    <td className="py-4 px-3 text-on-surface-variant font-medium max-w-[250px] truncate leading-normal" title={log.details}>
                      {log.details}
                    </td>

                    {/* IP */}
                    <td className="py-4 px-3 font-mono text-[10px] text-on-surface-variant">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    {/* User Agent */}
                    <td className="py-4 px-3 text-on-surface-variant font-medium max-w-[150px] truncate" title={log.userAgent}>
                      {log.userAgent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-primary/10 mt-6 pt-4 no-print">
              <span className="text-xs text-on-surface-variant font-mono">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default SuperAdminAuditLogs;
