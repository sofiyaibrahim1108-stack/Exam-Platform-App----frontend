import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Notifications Control Center</h2>
          <p className="text-on-surface-variant text-xs font-semibold">
            Audit system notifications, dispatch targeted alerts, and manage institutional recipient broadcasts.
          </p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="py-2.5 px-5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-xs transition-all shadow-sm shrink-0 self-start md:self-center flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">send</span>
          Send Notification
        </button>
      </div>

      {/* SUMMARY DASHBOARD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Total Notifications</span>
          <span className="block font-bold text-2xl text-primary font-mono mt-1">{stats.total}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Unread Alerts</span>
          <span className="block font-bold text-2xl text-amber-600 font-mono mt-1">{stats.unread}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Read Audit Log</span>
          <span className="block font-bold text-2xl text-green-700 font-mono mt-1">{stats.read}</span>
        </div>
        <div className="glass-card p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm hover:translate-y-[-2px] transition-all">
          <span className="text-[9px] font-mono text-on-surface-variant/60 uppercase block">Today's Broadcasts</span>
          <span className="block font-bold text-2xl text-indigo-700 font-mono mt-1">{stats.today}</span>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}
      <div className="glass-panel p-4 rounded-[20px] border border-primary/5 bg-white shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs font-semibold">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Search Term</label>
            <input
              type="text"
              placeholder="Search title or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Notification Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Types --</option>
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Statuses --</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Target Role</label>
            <select
              value={recipientRole}
              onChange={(e) => setRecipientRole(e.target.value)}
              className="p-2.5 bg-surface-container-low border border-primary/10 rounded-xl focus:outline-none text-xs font-semibold"
            >
              <option value="">-- All Target Roles --</option>
              <option value="Student">Students Only</option>
              <option value="Staff">Staff Only</option>
              <option value="Admin">Admins Only</option>
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

      {/* BULK ACTIONS TOOLBAR */}
      <div className="flex items-center justify-between p-3 glass-panel rounded-[18px] border border-primary/5 bg-white shadow-sm text-xs font-semibold">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-primary">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={notifications.length > 0 && selectedIds.length === notifications.length}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
            Select All Page ({notifications.length})
          </label>
          {selectedIds.length > 0 && (
            <span className="text-[11px] font-mono text-on-surface-variant font-bold">
              ({selectedIds.length} Selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="py-1.5 px-3 rounded-xl border border-red-500/20 text-red-700 bg-red-50 hover:bg-red-100/60 text-xs font-bold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleMarkAllRead}
            className="py-1.5 px-3 rounded-xl border border-primary/10 text-primary hover:bg-primary/5 text-xs font-bold transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">done_all</span>
            Mark All Read
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS TABLE LIST */}
      <div className="glass-panel rounded-[24px] border border-primary/5 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
            <div className="h-10 bg-surface-container-high rounded-xl w-full"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center border-t border-primary/5">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
              notifications_off
            </span>
            <h4 className="text-base font-bold text-on-surface">No Notifications Found</h4>
            <p className="text-on-surface-variant text-xs mt-1">
              There are no notifications matching your current filter choices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-primary/5 text-primary border-b border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Notification Title & Message</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Sender</th>
                  <th className="p-4">Target Role / Dept</th>
                  <th className="p-4 text-center">Date & Time</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {notifications.map((n) => (
                  <tr
                    key={n._id}
                    className={`hover:bg-primary/[0.02] transition-colors ${
                      !n.read ? 'bg-primary/[0.015]' : ''
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(n._id)}
                        onChange={() => handleSelectOne(n._id)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <p className={`font-bold text-sm ${!n.read ? 'text-primary' : 'text-on-surface'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{n.message}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {n.type}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant font-mono">{n.sender}</td>
                    <td className="p-4">
                      <p className="font-bold text-on-surface">{n.recipientRole}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">{n.department}</p>
                    </td>
                    <td className="p-4 text-center font-mono text-[10px]">
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          n.read
                            ? 'bg-gray-100 text-gray-700 border border-gray-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {n.read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedNotification(n)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="View Notification"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                      </button>

                      {n.read ? (
                        <button
                          onClick={() => handleMarkAsUnread(n._id)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Mark as Unread"
                        >
                          <span className="material-symbols-outlined text-base">mark_email_unread</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsRead(n._id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as Read"
                        >
                          <span className="material-symbols-outlined text-base">done</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteOne(n._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
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
