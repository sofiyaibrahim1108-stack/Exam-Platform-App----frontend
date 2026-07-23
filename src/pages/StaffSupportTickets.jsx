import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, X, Eye, FileText, Layers, CheckCircle2,
  Calendar, UserCheck, ShieldAlert, Sparkles, Filter, Database,
  Send, Paperclip, MessageCircle, AlertCircle, Clock, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
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
        return 'bg-blue-50 text-blue-700 border-blue-500/20';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-500/20';
      case 'Waiting for Staff':
        return 'bg-[#F8ECEF] text-[#8C1D40] border-[#8C1D40]/10';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-500/20';
      case 'Closed':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-500/20';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-750 border-blue-500/20';
      case 'High':
        return 'bg-amber-50 text-amber-750 border-amber-500/20';
      case 'Urgent':
      case 'Critical':
        return 'bg-red-50 text-red-750 border-red-500/20';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-[#1D1D1F] pb-10">
      {/* Page Header */}
      <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-xl font-extrabold text-[#1D1D1F] mb-1">Staff Support Portal</h2>
          <p className="text-[#6B7280] text-xs font-semibold">
            Submit technical, question bank, or exam queries directly to Institution Administrators.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8C1D40] to-[#C74B74] text-white font-bold hover:opacity-95 text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 active:scale-95 relative z-10"
        >
          <Plus size={14} />
          Create Support Ticket
        </button>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs">
          <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block tracking-wider">Total Tickets</span>
          <span className="block font-bold text-2xl text-[#8C1D40] font-mono mt-1">{stats.totalTickets}</span>
        </div>
        <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs">
          <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block tracking-wider">Open Tickets</span>
          <span className="block font-bold text-2xl text-blue-600 font-mono mt-1">{stats.openTickets}</span>
        </div>
        <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs">
          <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block tracking-wider">In Progress</span>
          <span className="block font-bold text-2xl text-amber-600 font-mono mt-1">{stats.inProgressTickets}</span>
        </div>
        <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs">
          <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block tracking-wider">Resolved</span>
          <span className="block font-bold text-2xl text-emerald-600 font-mono mt-1">{stats.resolvedTickets}</span>
        </div>
        <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase block tracking-wider">Closed</span>
          <span className="block font-bold text-2xl text-gray-500 font-mono mt-1">{stats.closedTickets}</span>
        </div>
      </div>

      {/* Filters & Search Section */}
      <div className="bg-white p-4 rounded-[20px] border border-[rgba(140,29,64,0.08)] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end text-xs font-bold text-[#6B7280]">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Search</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Ticket ID or Title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-250/80 rounded-xl focus:outline-none focus:border-[#8C1D40]/30 text-xs font-bold text-[#1D1D1F]"
              />
              <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 bg-white border border-gray-250/80 rounded-xl focus:outline-none text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Priority</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-2.5 bg-white border border-gray-250/80 rounded-xl focus:outline-none text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2.5 bg-white border border-gray-250/80 rounded-xl focus:outline-none text-xs font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30"
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
              className="flex-1 py-2.5 rounded-xl bg-[#8C1D40] text-white font-bold hover:opacity-95 text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Search size={13} />
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2.5 px-3 rounded-xl border border-gray-250/80 text-[#6B7280] hover:bg-gray-50 text-xs font-bold transition-all active:scale-95"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Ticket List Table */}
      <div className="bg-white rounded-[24px] border border-[rgba(140,29,64,0.08)] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-xl w-full border border-gray-100"></div>
            <div className="h-10 bg-gray-100 rounded-xl w-full border border-gray-100"></div>
            <div className="h-10 bg-gray-100 rounded-xl w-full border border-gray-100"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center border-t border-gray-100">
            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
            <h4 className="text-sm font-bold text-[#1D1D1F] font-sans">No Support Tickets Found</h4>
            <p className="text-[#6B7280] text-xs mt-1 leading-relaxed max-w-xs mx-auto">
              You have not created any support tickets matching the specified filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-gray-50 text-[#6B7280] border-b border-gray-100 font-mono text-[9px] font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-gray-150/40">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-[#F8ECEF]/10 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#8C1D40]">{t.ticketId}</td>
                    <td className="p-4 font-extrabold text-[#1D1D1F] max-w-xs truncate">{t.title}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#F8ECEF] text-[#8C1D40] text-[10px] font-bold border border-[#8C1D40]/5">
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
                    <td className="p-4 font-mono text-[10px] text-[#6B7280]">
                      {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-[#6B7280]">
                      {new Date(t.updatedAt).toLocaleDateString()} {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedTicketId(t._id)}
                        className="py-1.5 px-3 rounded-xl bg-gray-50 border border-gray-250/20 text-[#6B7280] font-bold hover:bg-[#8C1D40] hover:text-white hover:border-transparent transition-all text-xs flex items-center justify-center gap-1 ml-auto active:scale-95"
                      >
                        <Eye size={12} />
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
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-[#6B7280] disabled:opacity-40 transition-colors flex items-center gap-1 active:scale-95"
          >
            <ChevronLeft size={13} />
            Previous
          </button>
          <span className="text-[#6B7280] font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-[#6B7280] disabled:opacity-40 transition-colors flex items-center gap-1 active:scale-95"
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 space-y-4 shadow-2xl border border-gray-100 w-full max-w-lg animate-in duration-200"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F8ECEF] text-[#8C1D40] flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <h3 className="text-base font-extrabold text-[#1D1D1F]">Create Support Ticket</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-[#8C1D40] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs font-bold text-[#6B7280]">
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                    Ticket Title *
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of issue..."
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-250/80 rounded-xl focus:outline-none focus:border-[#8C1D40]/30 text-xs font-bold text-[#1D1D1F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                      Category *
                    </span>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full p-3 bg-white border border-gray-250/80 rounded-xl focus:outline-none text-xs font-bold text-[#1D1D1F]"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                      Priority *
                    </span>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                      className="w-full p-3 bg-white border border-gray-250/80 rounded-xl focus:outline-none text-xs font-bold text-[#1D1D1F]"
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
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                    Description *
                  </span>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detailed explanation of the issue or query..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-250/80 rounded-xl focus:outline-none focus:border-[#8C1D40]/30 text-xs font-bold text-[#1D1D1F] resize-none"
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                    Attachment URL (Optional)
                  </span>
                  <input
                    type="url"
                    placeholder="https://example.com/screenshot.png"
                    value={createForm.attachmentUrl}
                    onChange={(e) => setCreateForm({ ...createForm, attachmentUrl: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-250/80 rounded-xl focus:outline-none focus:border-[#8C1D40]/30 text-xs font-bold text-[#1D1D1F]"
                  />
                </div>

                <div className="pt-3 flex gap-2 justify-end border-t border-gray-150/40">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-gray-250/80 text-[#6B7280] hover:bg-gray-50 font-bold active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 rounded-xl bg-[#8C1D40] text-white font-bold hover:opacity-95 shadow-xs disabled:opacity-50 active:scale-95"
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
          <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketId(null)}
              className="fixed inset-0"
            ></motion.div>

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-gray-100 flex flex-col justify-between overflow-hidden z-10"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-150/40 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#8C1D40]">{ticketDetail?.ticketId || 'TCK-...'}</span>
                    {ticketDetail?.status && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(ticketDetail.status)}`}>
                        {ticketDetail.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-[#1D1D1F] leading-tight">{ticketDetail?.title || 'Loading...'}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs font-semibold text-[#6B7280]">
                {detailLoading ? (
                  <div className="p-8 space-y-4 animate-pulse">
                    <div className="h-6 bg-gray-100 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-100 rounded w-full"></div>
                    <div className="h-32 bg-gray-100 rounded w-full"></div>
                  </div>
                ) : ticketDetail ? (
                  <>
                    {/* Metadata Card */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-bold text-[#6B7280]">
                      <div>
                        <span className="text-[8px] uppercase text-[#9CA3AF] block font-mono">Category</span>
                        <span className="text-[#8C1D40] font-extrabold mt-0.5 block">{ticketDetail.category}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase text-[#9CA3AF] block font-mono">Priority</span>
                        <span className="mt-0.5 block">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadgeClass(ticketDetail.priority)}`}>
                            {ticketDetail.priority}
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase text-[#9CA3AF] block font-mono">Created Date</span>
                        <span className="text-[#1D1D1F] mt-0.5 block font-mono">{new Date(ticketDetail.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase text-[#9CA3AF] block font-mono">Last Updated</span>
                        <span className="text-[#1D1D1F] mt-0.5 block font-mono">{new Date(ticketDetail.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Description Box */}
                    <div className="p-4 bg-[#F8ECEF]/40 rounded-2xl border border-[#8C1D40]/10 space-y-2">
                      <span className="text-[9px] font-mono uppercase text-[#8C1D40] font-bold block">
                        Original Ticket Description
                      </span>
                      <p className="text-[#1D1D1F] leading-relaxed whitespace-pre-line text-xs font-normal">
                        {ticketDetail.description}
                      </p>

                      {ticketDetail.attachments && ticketDetail.attachments.length > 0 && (
                        <div className="pt-2 border-t border-[#8C1D40]/10 flex flex-wrap gap-2">
                          <span className="text-[8px] font-mono uppercase text-[#6B7280] block w-full">Attachments:</span>
                          {ticketDetail.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded-lg bg-white border border-[#8C1D40]/10 text-[#8C1D40] font-bold text-[10px] hover:bg-[#F8ECEF] transition-colors flex items-center gap-1"
                            >
                              <Paperclip size={10} />
                              {att.name || `Attachment ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Conversation Timeline */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-[#8C1D40] text-xs uppercase font-mono border-b border-gray-150/40 pb-2 flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        Conversation History
                      </h4>

                      {!ticketDetail.responses || ticketDetail.responses.length === 0 ? (
                        <p className="text-[#6B7280] text-xs italic text-center py-4">
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
                                    ? 'bg-[#F8ECEF]/30 border-[#8C1D40]/10 ml-4'
                                    : 'bg-emerald-50/50 border-emerald-500/20 mr-4'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1.5 text-[10px] font-bold text-[#6B7280]">
                                  <span className="text-[#1D1D1F] flex items-center gap-1">
                                    {resp.sender?.name || 'User'}
                                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-white border border-gray-200">
                                      {resp.sender?.role || 'Staff'}
                                    </span>
                                  </span>
                                  <span className="font-mono text-[9px]">
                                    {new Date(resp.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-[#1D1D1F] text-xs leading-relaxed whitespace-pre-line font-normal">
                                  {resp.message}
                                </p>
                                {resp.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <a
                                      href={resp.attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-[#8C1D40] font-bold hover:underline flex items-center gap-1"
                                    >
                                      <Paperclip size={10} />
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
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <form onSubmit={handleReplySubmit} className="space-y-3">
                    <textarea
                      rows={3}
                      required
                      placeholder="Type your reply to Institution Admin..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#8C1D40]/30 text-xs font-normal resize-none text-[#1D1D1F]"
                    />
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      <input
                        type="url"
                        placeholder="Attachment URL (optional)"
                        value={replyAttachmentUrl}
                        onChange={(e) => setReplyAttachmentUrl(e.target.value)}
                        className="w-full sm:w-2/3 p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none text-[#1D1D1F]"
                      />
                      <button
                        type="submit"
                        disabled={replying}
                        className="w-full sm:w-auto py-2 px-5 rounded-xl bg-[#8C1D40] text-white font-bold hover:opacity-95 text-xs shadow-xs disabled:opacity-50 flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Send size={12} />
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
