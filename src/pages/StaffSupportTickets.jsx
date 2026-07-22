import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const CATEGORIES = [
  'Technical Issue',
  'Question Bank',
  'AI Question Generator',
  'Exam Creation',
  'Exam Results',
  'Student Issue',
  'Login Problem',
  'System Bug',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const STATUSES = ['Open', 'In Progress', 'Waiting for Staff', 'Resolved', 'Closed'];

const StaffSupportTickets = () => {
  // Main Data States
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    waitingForStaffTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'Technical Issue',
    priority: 'Medium',
    description: '',
    attachmentUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Reply States
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/staff/support-tickets', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          category: categoryFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit,
        },
      });

      if (response.data && response.data.success) {
        setTickets(response.data.data.results || []);
        setStats(
          response.data.data.stats || {
            totalTickets: 0,
            openTickets: 0,
            inProgressTickets: 0,
            resolvedTickets: 0,
            closedTickets: 0,
            waitingForStaffTickets: 0,
          }
        );
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (id) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/staff/support-tickets/${id}`);
      if (response.data && response.data.success) {
        setTicketDetail(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load ticket details.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter, startDate, endDate]);

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
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => fetchTickets(), 50);
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) {
      toast.error('Title and description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const attachments = createForm.attachmentUrl.trim()
        ? [{ name: 'Attachment', url: createForm.attachmentUrl.trim() }]
        : [];

      const response = await api.post('/staff/support-tickets', {
        title: createForm.title.trim(),
        category: createForm.category,
        priority: createForm.priority,
        description: createForm.description.trim(),
        attachments,
      });

      if (response.data && response.data.success) {
        toast.success('Support ticket submitted successfully!');
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          category: 'Technical Issue',
          priority: 'Medium',
          description: '',
          attachmentUrl: '',
        });
        fetchTickets();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Reply message cannot be empty.');
      return;
    }

    setReplying(true);
    try {
      const response = await api.post(`/staff/support-tickets/${selectedTicketId}/reply`, {
        message: replyMessage.trim(),
        attachmentUrl: replyAttachmentUrl.trim(),
      });

      if (response.data && response.data.success) {
        toast.success('Reply sent successfully.');
        setReplyMessage('');
        setReplyAttachmentUrl('');
        fetchTicketDetail(selectedTicketId);
        fetchTickets();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to post reply.');
    } finally {
      setReplying(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Waiting for Staff':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Medium':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Urgent':
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Staff Support Portal</h2>
          <p className="text-on-surface-variant text-xs font-semibold">
            Submit technical, question bank, or exam queries directly to Institution Administrators.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add_comment</span>
          Create Support Ticket
        </button>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase block">Total Tickets</span>
          <span className="block font-bold text-2xl text-primary font-mono mt-1">{stats.totalTickets}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase block">Open Tickets</span>
          <span className="block font-bold text-2xl text-blue-600 font-mono mt-1">{stats.openTickets}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase block">In Progress</span>
          <span className="block font-bold text-2xl text-amber-600 font-mono mt-1">{stats.inProgressTickets}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase block">Resolved</span>
          <span className="block font-bold text-2xl text-emerald-600 font-mono mt-1">{stats.resolvedTickets}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase block">Closed</span>
          <span className="block font-bold text-2xl text-slate-600 font-mono mt-1">{stats.closedTickets}</span>
        </div>
      </div>

      {/* Filters & Search Section */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search</label>
            <input
              type="text"
              placeholder="Search Ticket ID or Title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
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
              className="py-2.5 px-3 rounded-xl border border-primary/10 text-on-surface-variant hover:bg-primary/5 text-xs font-bold transition-all"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Ticket List Table */}
      <div className="glass-panel rounded-[24px] border border-primary/5 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center border-t border-primary/5">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">support_agent</span>
            <h4 className="text-base font-bold text-on-surface">No Support Tickets Found</h4>
            <p className="text-on-surface-variant text-xs mt-1">
              You have not created any support tickets matching the specified filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{t.ticketId}</td>
                    <td className="p-4 font-bold text-on-surface max-w-xs truncate">{t.title}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-on-surface-variant">
                      {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-on-surface-variant">
                      {new Date(t.updatedAt).toLocaleDateString()} {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedTicketId(t._id)}
                        className="py-1.5 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold transition-all text-xs flex items-center gap-1 ml-auto"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-lg bg-white rounded-[24px] p-6 space-y-4 shadow-2xl border border-primary/10"
            >
              <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">add_comment</span>
                  </div>
                  <h3 className="text-base font-bold text-primary">Create Support Ticket</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-on-surface-variant uppercase mb-1">
                    Ticket Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of issue..."
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-on-surface-variant uppercase mb-1">
                      Category *
                    </label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-on-surface-variant uppercase mb-1">
                      Priority *
                    </label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                      className="w-full p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none"
                    >
                      {PRIORITIES.map((pr) => (
                        <option key={pr} value={pr}>
                          {pr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-on-surface-variant uppercase mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detailed explanation of the issue or query..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-on-surface-variant uppercase mb-1">
                    Attachment URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/screenshot.png"
                    value={createForm.attachmentUrl}
                    onChange={(e) => setCreateForm({ ...createForm, attachmentUrl: e.target.value })}
                    className="w-full p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2 justify-end border-t border-primary/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-primary/10 text-on-surface-variant hover:bg-primary/5 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW TICKET DRAWER */}
      <AnimatePresence>
        {selectedTicketId && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{ticketDetail?.ticketId || 'TCK-...'}</span>
                    {ticketDetail?.status && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(ticketDetail.status)}`}>
                        {ticketDetail.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-primary leading-tight">{ticketDetail?.title || 'Loading...'}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs font-semibold">
                {detailLoading ? (
                  <div className="p-8 space-y-4 animate-pulse">
                    <div className="h-6 bg-surface-container-high rounded w-1/2"></div>
                    <div className="h-20 bg-surface-container-high rounded w-full"></div>
                    <div className="h-32 bg-surface-container-high rounded w-full"></div>
                  </div>
                ) : ticketDetail ? (
                  <>
                    {/* Metadata Card */}
                    <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-[9px] uppercase text-on-surface-variant/60 block">Category</span>
                        <span className="text-primary font-bold">{ticketDetail.category}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-on-surface-variant/60 block">Priority</span>
                        <span className={`font-bold ${getPriorityBadgeClass(ticketDetail.priority)}`}>
                          {ticketDetail.priority}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-on-surface-variant/60 block">Created Date</span>
                        <span className="text-on-surface">{new Date(ticketDetail.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-on-surface-variant/60 block">Last Updated</span>
                        <span className="text-on-surface">{new Date(ticketDetail.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Description Box */}
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-primary font-bold block">
                        Original Ticket Description
                      </span>
                      <p className="text-on-surface leading-relaxed whitespace-pre-line text-xs font-normal">
                        {ticketDetail.description}
                      </p>

                      {ticketDetail.attachments && ticketDetail.attachments.length > 0 && (
                        <div className="pt-2 border-t border-primary/10 flex flex-wrap gap-2">
                          <span className="text-[9px] font-mono uppercase text-on-surface-variant block w-full">Attachments:</span>
                          {ticketDetail.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded-lg bg-white border border-primary/10 text-primary font-bold text-[10px] hover:bg-primary/5 transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">attach_file</span>
                              {att.name || `Attachment ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Conversation Timeline */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-primary text-xs uppercase font-mono border-b border-primary/10 pb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">forum</span>
                        Conversation History
                      </h4>

                      {!ticketDetail.responses || ticketDetail.responses.length === 0 ? (
                        <p className="text-on-surface-variant text-xs italic text-center py-4">
                          No replies posted yet. Admin will review your ticket shortly.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {ticketDetail.responses.map((resp, idx) => {
                            const isStaff = resp.sender?.role === 'Staff' || resp.sender?._id === ticketDetail.user?._id;
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl border ${
                                  isStaff
                                    ? 'bg-primary/5 border-primary/10 ml-4'
                                    : 'bg-emerald-50 border-emerald-200/60 mr-4'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1 text-[11px]">
                                  <span className="font-bold text-primary flex items-center gap-1">
                                    {resp.sender?.name || 'User'}
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border border-primary/10">
                                      {resp.sender?.role || 'Staff'}
                                    </span>
                                  </span>
                                  <span className="font-mono text-[9px] text-on-surface-variant">
                                    {new Date(resp.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-on-surface text-xs leading-relaxed whitespace-pre-line font-normal">
                                  {resp.message}
                                </p>
                                {resp.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-primary/10">
                                    <a
                                      href={resp.attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-xs">attach_file</span>
                                      View Reply Attachment
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Reply Section */}
              {ticketDetail && ['Open', 'In Progress', 'Waiting for Staff'].includes(ticketDetail.status) && (
                <div className="p-6 border-t border-primary/10 bg-surface-container-low">
                  <form onSubmit={handleReplySubmit} className="space-y-3">
                    <textarea
                      rows={3}
                      required
                      placeholder="Type your reply to Institution Admin..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full p-3 bg-white border border-primary/10 rounded-xl focus:outline-none focus:border-primary text-xs font-normal resize-none"
                    />
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      <input
                        type="url"
                        placeholder="Attachment URL (optional)"
                        value={replyAttachmentUrl}
                        onChange={(e) => setReplyAttachmentUrl(e.target.value)}
                        className="w-full sm:w-2/3 p-2 bg-white border border-primary/10 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={replying}
                        className="w-full sm:w-auto py-2 px-5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        {replying ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffSupportTickets;
