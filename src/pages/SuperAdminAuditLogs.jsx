import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search, History, Download, FileText, Calendar, Clock,
  Laptop, ShieldAlert, ArrowLeftRight, Activity, X
} from 'lucide-react';
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
      <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-[#8B1538]">Platform Audit Logs</h2>
          <p className="text-gray-500 text-xs mt-0.5 font-semibold">Audit events, configuration changes, password resets, and user entries.</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleExportCSV}
            className="border border-[#8B1538]/20 text-[#8B1538] hover:bg-[#FDF3F6] hover:border-[#8B1538] py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-[#8B1538] hover:bg-[#720F2B] text-white py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#8B1538]/10"
          >
            <FileText size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end no-print">
        {/* Search Input */}
        <div className="lg:col-span-2 space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Details Search</label>
          <div className="flex items-center bg-white border border-gray-150 rounded-xl px-4 py-2 shadow-xs">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search descriptions, IP addresses..."
              className="bg-transparent border-none focus:ring-0 text-xs font-semibold w-full placeholder:text-gray-400 outline-none ml-2 text-gray-800"
              type="text"
            />
          </div>
        </div>

        {/* Action Type Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Action Type</label>
          <div className="bg-white border border-gray-150 rounded-xl px-4 py-2 shadow-xs">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent border-none text-xs font-semibold text-gray-600 focus:ring-0 outline-none cursor-pointer"
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
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">User Performer</label>
          <div className="bg-white border border-gray-150 rounded-xl px-4 py-2 shadow-xs">
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent border-none text-xs font-semibold text-gray-600 focus:ring-0 outline-none cursor-pointer"
            >
              <option value="">All Performers</option>
              {usersList.map((user) => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start / End Date Picker */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Date Constraints</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-[#8B1538] focus:ring-0 cursor-pointer shadow-xs font-semibold"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-[#8B1538] focus:ring-0 cursor-pointer shadow-xs font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Main Print Wrapper */}
      <div id="print-section" className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)]">
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="h-8 bg-gray-100 animate-pulse rounded-lg w-full"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-gray-50 animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <History size={40} className="text-gray-300" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-800">No Event Records</h3>
              <p className="text-gray-500 text-xs max-w-sm font-semibold">No recorded action logs matches the active filters query variables.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 pb-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-3">Date & Time</th>
                  <th className="py-4 px-3">Performer</th>
                  <th className="py-4 px-3">Clearance Role</th>
                  <th className="py-4 px-3">Action Type</th>
                  <th className="py-4 px-3">Description Details</th>
                  <th className="py-4 px-3">IP Address</th>
                  <th className="py-4 px-3">Device Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Timestamp */}
                    <td className="py-4 px-3 font-mono text-[10px] text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* Performer */}
                    <td className="py-4 px-3 font-bold text-gray-850">
                      {log.user ? log.user.name : 'System Engine'}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-3">
                      {log.user ? (
                        <span className="bg-[#FDF3F6] border border-[#8B1538]/10 text-[#8B1538] px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase">
                          {log.user.role}
                        </span>
                      ) : (
                        <span className="bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase">
                          SYSTEM
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-3">
                      <span className="font-mono font-extrabold text-[#8B1538] uppercase text-[10px] tracking-wider">
                        {log.action}
                      </span>
                    </td>

                    {/* Details Description */}
                    <td className="py-4 px-3 text-gray-500 max-w-[250px] truncate leading-normal" title={log.details}>
                      {log.details}
                    </td>

                    {/* IP */}
                    <td className="py-4 px-3 font-mono text-[10px] text-gray-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    {/* User Agent */}
                    <td className="py-4 px-3 text-gray-400 font-mono text-[10px] max-w-[150px] truncate" title={log.userAgent}>
                      {log.userAgent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4 no-print">
              <span className="text-xs text-gray-400 font-mono font-bold">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none text-gray-600"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  className="px-3 py-1.5 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none text-gray-600"
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
