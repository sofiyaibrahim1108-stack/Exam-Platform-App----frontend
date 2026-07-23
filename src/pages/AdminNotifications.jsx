import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bell, Send, Trash2, Mail, MailWarning, Eye, EyeOff, Search, X, Check, CheckSquare, Settings, CheckCircle2, Info, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import api from '../services/api';

const NOTIFICATION_TYPES = [
  'Exam Published',
  'Exam Scheduled',
  'Exam Reminder',
  'Result Published',
  'Staff Registration',
  'Student Registration',
  'Question Approved',
  'Question Rejected',
  'Support Ticket',
  'System Announcement',
  'General Notification',
];

const TARGET_OPTIONS = [
  'All Students',
  'All Staff',
  'All Admins',
  'Department-wise Students',
  'Department-wise Staff',
  'Individual User',
];

const AdminNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0, today: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Selection for bulk operations
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Send Form State
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'General Notification',
    target: 'All Students',
    departmentId: '',
    recipientId: '',
    scheduledAt: '',
  });
  const [dispatching, setDispatching] = useState(false);

  // Lists for dropdowns & individual user search
  const [departmentsList, setDepartmentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const dropRes = await api.get('/staff/question-bank/dropdowns');
      if (dropRes.data && dropRes.data.success) {
        setDepartmentsList(dropRes.data.data.departments || []);
      }

      // Fetch users for individual search select
      const usersRes = await api.get('/users?limit=200');
      if (usersRes.data && usersRes.data.success) {
        setUsersList(usersRes.data.data.results || usersRes.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load dropdown options:', e);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/admin', {
        params: {
          type: type || undefined,
          status: status || undefined,
          recipientRole: recipientRole || undefined,
          department: department || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined,
          page,
          limit,
        },
      });

      if (response.data && response.data.success) {
        setNotifications(response.data.data.notifications || []);
        setStats(response.data.data.stats || { total: 0, unread: 0, read: 0, today: 0 });
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load notification audit list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchNotifications();
  }, [type, status, recipientRole, department, startDate, endDate]);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const handleClearFilters = () => {
    setSearch('');
    setType('');
    setStatus('');
    setRecipientRole('');
    setDepartment('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => fetchNotifications(), 50);
  };

  // Bulk Selection Checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(notifications.map((n) => n._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Actions
  const handleMarkAsRead = async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data && response.data.success) {
        toast.success('Marked as read.');
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/unread`);
      if (response.data && response.data.success) {
        toast.success('Marked as unread.');
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const handleMarkAllRead = async () => {
    const readToast = toast.loading('Marking all notifications as read...');
    try {
      const response = await api.patch('/notifications/mark-all-read');
      if (response.data && response.data.success) {
        toast.success('All notifications marked as read!', { id: readToast });
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to mark all as read.', { id: readToast });
    }
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.data && response.data.success) {
        toast.success('Notification deleted.');
        setSelectedIds(selectedIds.filter((i) => i !== id));
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to delete notification.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected notifications?`)) return;

    const delToast = toast.loading(`Deleting ${selectedIds.length} notifications...`);
    try {
      const response = await api.post('/notifications/delete-multiple', { ids: selectedIds });
      if (response.data && response.data.success) {
        toast.success(`${selectedIds.length} notifications deleted!`, { id: delToast });
        setSelectedIds([]);
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to delete selected notifications.', { id: delToast });
    }
  };

  // Dispatch Notification Handler
  const handleSendNotification = async (e) => {
    e.preventDefault();
    setDispatching(true);
    const sendToast = toast.loading('Dispatching notification...');

    try {
      const response = await api.post('/notifications/send', sendForm);
      if (response.data && response.data.success) {
        toast.success('Notification dispatched successfully!', { id: sendToast });
        setShowSendModal(false);
        setSendForm({
          title: '',
          message: '',
          type: 'General Notification',
          target: 'All Students',
          departmentId: '',
          recipientId: '',
          scheduledAt: '',
        });
        fetchNotifications();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send notification.', { id: sendToast });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans text-on-surface">
      {/* Dashboard Top Banner Header */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <Bell size={12} />
              Communications Panel
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Notifications Control Center</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">
              Audit system notifications, dispatch targeted alerts, and manage institutional recipient broadcasts.
            </p>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="btn-primary py-2.5 px-5 rounded-[12px] text-[12.5px] flex items-center gap-1.5"
          >
            <Send size={14} />
            Send Notification
          </button>
        </div>
      </div>

      {/* SUMMARY DASHBOARD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Total Notifications</span>
          <span className="block font-black text-2xl text-[#8B1E3F] font-mono mt-1">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Unread Alerts</span>
          <span className="block font-black text-2xl text-[#D97706] font-mono mt-1">{stats.unread}</span>
        </div>
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Read Audit Log</span>
          <span className="block font-black text-2xl text-[#059669] font-mono mt-1">{stats.read}</span>
        </div>
        <div className="stat-card">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Today's Broadcasts</span>
          <span className="block font-black text-2xl text-[#4F46E5] font-mono mt-1">{stats.today}</span>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}
      <div className="card-flat p-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1 lg:col-span-2">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Search Term</span>
            <div className="search-bar">
              <Search size={14} className="text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="select"
            >
              <option value="">All Types</option>
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select"
            >
              <option value="">All Statuses</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-1">
            <span className="text-[9px] font-mono font-bold text-[#9CA3AF] uppercase block mb-1">Target Role</span>
            <select
              value={recipientRole}
              onChange={(e) => setRecipientRole(e.target.value)}
              className="select"
            >
              <option value="">All Target Roles</option>
              <option value="Student">Students Only</option>
              <option value="Staff">Staff Only</option>
              <option value="Admin">Admins Only</option>
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

          <div className="flex gap-2 lg:col-span-2">
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

      {/* BULK ACTIONS TOOLBAR */}
      <div className="flex items-center justify-between p-3.5 card-flat bg-white text-xs font-semibold">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-[#8B1E3F]">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={notifications.length > 0 && selectedIds.length === notifications.length}
              className="checkbox-custom"
            />
            Select All Page ({notifications.length})
          </label>
          {selectedIds.length > 0 && (
            <span className="text-[11px] font-mono text-[#6B7280] font-bold">
              ({selectedIds.length} Selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="py-1.5 px-3 rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleMarkAllRead}
            className="py-1.5 px-3 rounded-[8px] bg-[#FDF0F4] text-[#8B1E3F] border border-[rgba(139,30,63,0.12)] hover:bg-[#8B1E3F] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <CheckSquare size={13} />
            Mark All Read
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS TABLE LIST */}
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={24} />
            </div>
            <h4 className="text-base font-bold text-[#111111]">No Notifications Found</h4>
            <p className="text-[#6B7280] text-xs mt-1">
              There are no notifications matching your current filter choices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th>Notification Title & Message</th>
                  <th>Type</th>
                  <th>Sender</th>
                  <th>Target Role / Dept</th>
                  <th className="text-center">Date & Time</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr
                    key={n._id}
                    className={!n.read ? 'bg-[#FAF8F7]' : ''}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(n._id)}
                        onChange={() => handleSelectOne(n._id)}
                        className="checkbox-custom"
                      />
                    </td>
                    <td>
                      <p className={`font-bold text-xs ${!n.read ? 'text-[#8B1E3F]' : 'text-[#111111]'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">{n.message}</p>
                    </td>
                    <td>
                      <span className="badge badge-wine">
                        {n.type}
                      </span>
                    </td>
                    <td className="font-mono text-[#6B7280]">{n.sender}</td>
                    <td>
                      <p className="font-bold text-[#111111]">{n.recipientRole}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono">{n.department}</p>
                    </td>
                    <td className="text-center font-mono text-[10px] text-[#6B7280]">
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          n.read
                            ? 'badge-gray'
                            : 'badge-blue'
                        }`}
                      >
                        {n.read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1 items-center">
                        <button
                          onClick={() => setSelectedNotification(n)}
                          className="p-1.5 text-[#8B1E3F] hover:bg-[#FDF0F4] rounded-lg transition-colors"
                          title="View Notification"
                        >
                          <Eye size={14} />
                        </button>

                        {n.read ? (
                          <button
                            onClick={() => handleMarkAsUnread(n._id)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Mark as Unread"
                          >
                            <Mail size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsRead(n._id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark as Read"
                          >
                            <Check size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOne(n._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, stats.total)} of {stats.total} alerts
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

      {/* MODAL 1: SEND NOTIFICATION */}
      <AnimatePresence>
        {showSendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-lg bg-white rounded-[24px] p-6 space-y-5 shadow-2xl border border-primary/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                <h3 className="text-base font-bold text-primary">Compose & Send Notification</h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Target Recipient Group
                  </label>
                  <select
                    value={sendForm.target}
                    onChange={(e) => setSendForm({ ...sendForm, target: e.target.value })}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                  >
                    {TARGET_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Show Department Dropdown for Dept Students/Staff */}
                {(sendForm.target === 'Department-wise Students' || sendForm.target === 'Department-wise Staff') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Select Target Department
                    </label>
                    <select
                      value={sendForm.departmentId}
                      onChange={(e) => setSendForm({ ...sendForm, departmentId: e.target.value })}
                      required
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                    >
                      <option value="">-- Choose Department --</option>
                      {departmentsList.map((d) => (
                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Show Individual User Selector */}
                {sendForm.target === 'Individual User' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                      Select Target Recipient User
                    </label>
                    <select
                      value={sendForm.recipientId}
                      onChange={(e) => setSendForm({ ...sendForm, recipientId: e.target.value })}
                      required
                      className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                    >
                      <option value="">-- Choose User --</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email} - {u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Notification Type
                  </label>
                  <select
                    value={sendForm.type}
                    onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                  >
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. End Semester Exam Timetable Released"
                    value={sendForm.title}
                    onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                    required
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Message Payload
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write detailed notification message here..."
                    value={sendForm.message}
                    onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                    required
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs resize-none"
                  ></textarea>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                    Schedule Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={sendForm.scheduledAt}
                    onChange={(e) => setSendForm({ ...sendForm, scheduledAt: e.target.value })}
                    className="p-3 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-primary/10 text-on-surface-variant hover:bg-primary/5 font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {dispatching ? 'Dispatching...' : 'Dispatch Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: NOTIFICATION DETAIL VIEW */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md bg-white rounded-[24px] p-6 space-y-4 shadow-2xl border border-primary/10"
            >
              <div className="flex justify-between items-start border-b border-primary/5 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase font-mono">
                    {selectedNotification.type}
                  </span>
                  <h3 className="text-base font-bold text-primary mt-1">{selectedNotification.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/5 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-on-surface-variant/60 block">Message Body</span>
                  <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Sender</span>
                    <span className="text-primary font-bold">{selectedNotification.sender}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Target Role</span>
                    <span className="text-primary font-bold">{selectedNotification.recipientRole}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Department</span>
                    <span className="text-primary font-bold">{selectedNotification.department}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-surface-variant/60 block">Dispatched Date</span>
                    <span className="text-primary font-bold">
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-primary/5">
                {selectedNotification.read ? (
                  <button
                    onClick={() => {
                      handleMarkAsUnread(selectedNotification._id);
                      setSelectedNotification(null);
                    }}
                    className="text-xs font-bold text-amber-600 hover:underline"
                  >
                    Mark as Unread
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleMarkAsRead(selectedNotification._id);
                      setSelectedNotification(null);
                    }}
                    className="text-xs font-bold text-green-700 hover:underline"
                  >
                    Mark as Read
                  </button>
                )}

                <button
                  onClick={() => setSelectedNotification(null)}
                  className="py-2 px-4 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95"
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

export default AdminNotifications;
