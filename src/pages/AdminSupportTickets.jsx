import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../services/api';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Waiting for User', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const CATEGORY_OPTIONS = ['Technical', 'Exam Issue', 'Account / Login', 'Evaluation', 'General Query', 'Grading', 'General'];

const AdminSupportTickets = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal State
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'General Query',
    priority: 'Medium',
  });
  const [creating, setCreating] = useState(false);

  // Dropdown lists
  const [departmentsList, setDepartmentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const dropRes = await api.get('/staff/question-bank/dropdowns');
      if (dropRes.data && dropRes.data.success) {
        setDepartmentsList(dropRes.data.data.departments || []);
      }

      const usersRes = await api.get('/users?limit=200');
      if (usersRes.data && usersRes.data.success) {
        setUsersList(usersRes.data.data.results || usersRes.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load dropdowns:', e);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tickets', {
        params: {
          status: status || undefined,
          priority: priority || undefined,
          department: department || undefined,
          role: role || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined,
          page,
          limit,
        },
      });

      if (response.data && response.data.success) {
        setTickets(response.data.data.results || []);
        setStats(response.data.data.stats || {
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          closedTickets: 0,
          highPriorityTickets: 0,
        });
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (id) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/tickets/${id}`);
      if (response.data && response.data.success) {
        setTicketDetail(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load ticket details.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchTickets();
  }, [status, priority, department, role, startDate, endDate]);

  useEffect(() => {
    fetchTickets();
  }, [page]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetail(selectedTicketId);
    } else {
      setTicketDetail(null);
    }
  }, [selectedTicketId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setDepartment('');
    setRole('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => fetchTickets(), 50);
  };

  // EXPORT HANDLERS
  const formatTicketsForExport = (dataList) => {
    return dataList.map((t) => ({
      'Ticket ID': t.ticketId,
      Subject: t.title,
      Category: t.category,
      Priority: t.priority,
      Status: t.status,
      'Raised By': `${t.raisedByName} (${t.userRole})`,
      Email: t.raisedByEmail,
      Department: t.department,
      'Assigned Admin': t.assignedToName,
      'Created Date': new Date(t.createdAt).toLocaleString(),
      'Last Updated': new Date(t.updatedAt).toLocaleString(),
    }));
  };

  const handleExportExcel = () => {
    if (!tickets || tickets.length === 0) {
      toast.error('No tickets available to export.');
      return;
    }
    const formatted = formatTicketsForExport(tickets);
    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SupportTickets');
    XLSX.writeFile(workbook, `Support_Tickets_${Date.now()}.xlsx`);
    toast.success('Support tickets exported to Excel!');
  };

  const handleExportCSV = () => {
    if (!tickets || tickets.length === 0) {
      toast.error('No tickets available to export.');
      return;
    }
    const formatted = formatTicketsForExport(tickets);
    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Support_Tickets_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Support tickets exported to CSV!');
  };

  const handleExportPDF = () => {
    if (!tickets || tickets.length === 0) {
      toast.error('No tickets available to export.');
      return;
    }
    const formattedRows = formatTicketsForExport(tickets);
    const keys = formattedRows.length > 0 ? Object.keys(formattedRows[0]) : [];

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SUPPORT TICKETS AUDIT REPORT</title>
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
            <h2>Support Tickets Report</h2>
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

  // ACTIONS
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await api.patch(`/tickets/${id}/status`, { status: newStatus });
      if (response.data && response.data.success) {
        toast.success(`Ticket status set to ${newStatus}`);
        fetchTickets();
        if (ticketDetail && ticketDetail._id === id) {
          fetchTicketDetail(id);
        }
      }
    } catch (error) {
      toast.error('Failed to update ticket status.');
    }
  };

  const handleAssigneeChange = async (id, assignedToId) => {
    try {
      const response = await api.patch(`/tickets/${id}/assign`, { assignedToId });
      if (response.data && response.data.success) {
        toast.success('Ticket assigned successfully!');
        fetchTickets();
        if (ticketDetail && ticketDetail._id === id) {
          fetchTicketDetail(id);
        }
      }
    } catch (error) {
      toast.error('Failed to assign ticket.');
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to delete this support ticket?')) return;
    try {
      const response = await api.delete(`/tickets/${id}`);
      if (response.data && response.data.success) {
        toast.success('Support ticket deleted.');
        if (selectedTicketId === id) setSelectedTicketId(null);
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to delete support ticket.');
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmittingReply(true);
    const replyToast = toast.loading('Posting response...');
    try {
      const response = await api.post(`/tickets/${selectedTicketId}/reply`, {
        message: replyMessage,
        attachmentUrl: replyAttachment,
      });
      if (response.data && response.data.success) {
        toast.success('Reply posted & user notified!', { id: replyToast });
        setReplyMessage('');
        setReplyAttachment('');
        setTicketDetail(response.data.data);
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to post reply.', { id: replyToast });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;

    const noteToast = toast.loading('Saving internal note...');
    try {
      const response = await api.post(`/tickets/${selectedTicketId}/internal-note`, {
        note: internalNoteText,
      });
      if (response.data && response.data.success) {
        toast.success('Internal note added!', { id: noteToast });
        setInternalNoteText('');
        setTicketDetail(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to add internal note.', { id: noteToast });
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);
    const cToast = toast.loading('Creating support ticket...');
    try {
      const response = await api.post('/tickets', createForm);
      if (response.data && response.data.success) {
        toast.success('Support ticket created!', { id: cToast });
        setShowCreateModal(false);
        setCreateForm({ title: '', description: '', category: 'General Query', priority: 'Medium' });
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to create support ticket.', { id: cToast });
    } finally {
      setCreating(false);
    }
  };

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'Open': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Waiting for User': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Support Tickets Management</h2>
          <p className="text-on-surface-variant text-xs font-semibold">
            Monitor help requests, manage resolution workflows, reply to candidates, and track SLA priorities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create Ticket
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="glass-card p-3.5 rounded-[18px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Total Tickets</span>
          <span className="block font-bold text-xl text-primary font-mono mt-0.5">{stats.totalTickets}</span>
        </div>
        <div className="glass-card p-3.5 rounded-[18px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Open</span>
          <span className="block font-bold text-xl text-emerald-700 font-mono mt-0.5">{stats.openTickets}</span>
        </div>
        <div className="glass-card p-3.5 rounded-[18px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">In Progress</span>
          <span className="block font-bold text-xl text-indigo-700 font-mono mt-0.5">{stats.inProgressTickets}</span>
        </div>
        <div className="glass-card p-3.5 rounded-[18px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Resolved</span>
          <span className="block font-bold text-xl text-green-700 font-mono mt-0.5">{stats.resolvedTickets}</span>
        </div>
        <div className="glass-card p-3.5 rounded-[18px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Closed</span>
          <span className="block font-bold text-xl text-gray-600 font-mono mt-0.5">{stats.closedTickets}</span>
        </div>
        <div className="glass-card p-3.5 rounded-[18px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">High / Critical</span>
          <span className="block font-bold text-xl text-red-600 font-mono mt-0.5">{stats.highPriorityTickets}</span>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search Term</label>
            <input
              type="text"
              placeholder="Search Ticket ID, subject, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Statuses --</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Priorities --</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">User Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All User Roles --</option>
              <option value="Student">Student</option>
              <option value="Staff">Staff</option>
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

      {/* SUPPORT TICKETS TABLE */}
      <div className="glass-panel rounded-[24px] border border-primary/5 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center border-t border-primary/5">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
              confirmation_number
            </span>
            <h4 className="text-base font-bold text-on-surface">No Support Tickets Found</h4>
            <p className="text-on-surface-variant text-xs mt-1">
              There are no support tickets matching your current filter choices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Subject & Description</th>
                  <th className="p-4">Raised By & Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4 text-center">Last Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{t.ticketId}</td>
                    <td className="p-4">
                      <p className="font-bold text-on-surface text-xs">{t.title}</p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                        {t.descriptionPreview}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-primary">{t.raisedByName}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">{t.userRole}</p>
                    </td>
                    <td className="p-4 text-on-surface-variant font-mono">{t.department}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadgeClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border focus:outline-none cursor-pointer ${getStatusBadgeClass(t.status)}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-on-surface-variant">
                      {t.assignedToName}
                    </td>
                    <td className="p-4 text-center font-mono text-[10px]">
                      {new Date(t.updatedAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right space-x-1 shrink-0">
                      <button
                        onClick={() => setSelectedTicketId(t._id)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="View Ticket Details & Reply"
                      >
                        <span className="material-symbols-outlined text-base">forum</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(t._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Ticket"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
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

      {/* MODAL 1: TICKET DETAIL & CONVERSATION THREAD */}
      <AnimatePresence>
        {selectedTicketId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-3xl bg-white rounded-[24px] p-6 space-y-5 shadow-2xl border border-primary/10 max-h-[90vh] overflow-y-auto"
            >
              {detailLoading || !ticketDetail ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                  <p className="text-xs font-bold text-on-surface-variant mt-2">Loading ticket conversation...</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="flex justify-between items-start border-b border-primary/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-base">{ticketDetail.ticketId}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadgeClass(ticketDetail.priority)}`}>
                          {ticketDetail.priority}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadgeClass(ticketDetail.status)}`}>
                          {ticketDetail.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface mt-1">{ticketDetail.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedTicketId(null)}
                      className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-surface-container-low rounded-xl border border-primary/5 text-xs font-mono">
                    <div>
                      <span className="text-[9px] uppercase text-on-surface-variant/60 block font-sans">Raised By</span>
                      <span className="text-primary font-bold">{ticketDetail.user?.name} ({ticketDetail.user?.role})</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-on-surface-variant/60 block font-sans">Department</span>
                      <span className="text-primary font-bold">{ticketDetail.department?.name || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-on-surface-variant/60 block font-sans">Category</span>
                      <span className="text-primary font-bold">{ticketDetail.category}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-on-surface-variant/60 block font-sans">Created Date</span>
                      <span className="text-primary font-bold">{new Date(ticketDetail.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Assignee & Status Quick Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-mono uppercase text-primary font-bold">Assign Ticket:</label>
                      <select
                        value={ticketDetail.assignedTo?._id || ''}
                        onChange={(e) => handleAssigneeChange(ticketDetail._id, e.target.value)}
                        className="p-1.5 bg-white border border-primary/10 rounded-lg text-xs font-semibold"
                      >
                        <option value="">-- Unassigned --</option>
                        {usersList
                          .filter((u) => ['Admin', 'Staff', 'Super Admin'].includes(u.role))
                          .map((u) => (
                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                          ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-mono uppercase text-primary font-bold">Change Status:</label>
                      <select
                        value={ticketDetail.status}
                        onChange={(e) => handleStatusChange(ticketDetail._id, e.target.value)}
                        className={`p-1.5 bg-white border rounded-lg text-xs font-bold ${getStatusBadgeClass(ticketDetail.status)}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ticket Original Description */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">Original Issue Description</span>
                    <div className="p-4 bg-surface-container-low rounded-xl border border-primary/5 text-xs leading-relaxed text-on-surface">
                      {ticketDetail.description}
                    </div>
                  </div>

                  {/* Attachments */}
                  {ticketDetail.attachments && ticketDetail.attachments.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">Attachments</span>
                      <div className="flex flex-wrap gap-2">
                        {ticketDetail.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-xs text-primary font-bold hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-base">attachment</span>
                            {att.name || `Attachment ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CONVERSATION THREAD */}
                  <div className="space-y-3 pt-2 border-t border-primary/5">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">question_answer</span>
                      Conversation Thread ({ticketDetail.responses?.length || 0})
                    </h4>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {ticketDetail.responses && ticketDetail.responses.length > 0 ? (
                        ticketDetail.responses.map((resp, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                              ['Admin', 'Super Admin'].includes(resp.sender?.role)
                                ? 'bg-primary/5 border-primary/10 ml-6'
                                : 'bg-surface-container-low border-primary/5 mr-6'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                              <span className="font-bold text-primary">
                                {resp.sender?.name} ({resp.sender?.role})
                              </span>
                              <span>{new Date(resp.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-on-surface leading-relaxed">{resp.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-on-surface-variant italic font-semibold">
                          No replies posted yet. Be the first to respond to this candidate.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* INTERNAL NOTES (Admin Only) */}
                  <div className="space-y-3 pt-2 border-t border-primary/5">
                    <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 font-mono">
                      <span className="material-symbols-outlined text-base">lock</span>
                      Internal Admin Notes ({ticketDetail.internalNotes?.length || 0})
                    </h4>

                    {ticketDetail.internalNotes && ticketDetail.internalNotes.length > 0 && (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {ticketDetail.internalNotes.map((note, idx) => (
                          <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-xs space-y-0.5">
                            <div className="flex justify-between text-[9px] font-mono text-amber-900">
                              <span className="font-bold">{note.sender?.name}</span>
                              <span>{new Date(note.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-amber-950 font-sans">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleAddInternalNote} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add internal staff note (hidden from user)..."
                        value={internalNoteText}
                        onChange={(e) => setInternalNoteText(e.target.value)}
                        className="flex-1 p-2 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none text-xs font-semibold"
                      />
                      <button
                        type="submit"
                        className="py-2 px-3 rounded-xl bg-amber-700 text-white font-bold hover:bg-amber-800 text-xs transition-all shrink-0"
                      >
                        Add Note
                      </button>
                    </form>
                  </div>

                  {/* REPLY FORM */}
                  <form onSubmit={handlePostReply} className="space-y-3 pt-3 border-t border-primary/10">
                    <h4 className="text-xs font-bold text-primary uppercase font-mono">Post Admin Response</h4>
                    <textarea
                      rows={3}
                      placeholder="Write response message to candidate..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      required
                      className="w-full p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold resize-none"
                    ></textarea>

                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="url"
                        placeholder="Optional attachment URL (e.g. screenshot link)..."
                        value={replyAttachment}
                        onChange={(e) => setReplyAttachment(e.target.value)}
                        className="flex-1 p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                      />
                      <button
                        type="submit"
                        disabled={submittingReply}
                        className="py-2.5 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                      >
                        <span className="material-symbols-outlined text-base">send</span>
                        {submittingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CREATE SUPPORT TICKET */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md bg-white rounded-[24px] p-6 space-y-4 shadow-2xl border border-primary/10"
            >
              <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                <h3 className="text-base font-bold text-primary">Create Support Ticket</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of the problem..."
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    required
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Full Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide full details regarding the support issue..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    required
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-primary/10 text-on-surface-variant hover:bg-primary/5 font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    {creating ? 'Creating...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSupportTickets;
