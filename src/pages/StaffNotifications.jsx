import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const NOTIFICATION_TYPES = [
  'Question Approved',
  'Question Rejected',
  'Question Needs Revision',
  'Exam Approved',
  'Exam Rejected',
  'Exam Published',
  'Exam Scheduled',
  'Admin Announcement',
  'Account Notifications',
  'General System Notifications',
];

const getNotificationConfig = (type) => {
  switch (type) {
    case 'Question Approved':
      return { icon: 'check_circle', color: 'text-emerald-600 bg-emerald-100 border-emerald-200' };
    case 'Question Rejected':
      return { icon: 'cancel', color: 'text-rose-600 bg-rose-100 border-rose-200' };
    case 'Question Needs Revision':
      return { icon: 'edit_note', color: 'text-amber-600 bg-amber-100 border-amber-200' };
    case 'Exam Approved':
      return { icon: 'verified', color: 'text-emerald-600 bg-emerald-100 border-emerald-200' };
    case 'Exam Rejected':
      return { icon: 'block', color: 'text-rose-600 bg-rose-100 border-rose-200' };
    case 'Exam Published':
      return { icon: 'send', color: 'text-blue-600 bg-blue-100 border-blue-200' };
    case 'Exam Scheduled':
      return { icon: 'event', color: 'text-indigo-600 bg-indigo-100 border-indigo-200' };
    case 'Admin Announcement':
      return { icon: 'campaign', color: 'text-purple-600 bg-purple-100 border-purple-200' };
    case 'Account Notifications':
      return { icon: 'manage_accounts', color: 'text-teal-600 bg-teal-100 border-teal-200' };
    case 'General System Notifications':
    default:
      return { icon: 'info', color: 'text-primary bg-primary/10 border-primary/20' };
  }
};

const StaffNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState(''); // '', 'read', 'unread'

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.data || []);
      }
      const countRes = await api.get('/notifications/unread-count');
      if (countRes.data && countRes.data.success) {
        setUnreadCount(countRes.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filtered dataset
  const filteredData = notifications.filter((n) => {
    if (type && n.type !== type) return false;
    if (status === 'unread' && n.read) return false;
    if (status === 'read' && !n.read) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchMsg = n.message?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }
    return true;
  });

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data && res.data.success) {
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/unread`);
      if (res.data && res.data.success) {
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to mark notification as unread');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/notifications/mark-all-read');
      if (res.data && res.data.success) {
        toast.success('All notifications marked as read');
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data && res.data.success) {
        toast.success('Notification deleted');
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((n) => n._id));
    }
  };

  const questionUpdatesCount = notifications.filter(
    (n) => n.type && n.type.includes('Question')
  ).length;

  const examUpdatesCount = notifications.filter(
    (n) => n.type && n.type.includes('Exam')
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider">
            Faculty Communications
          </span>
          <h2 className="text-2xl font-bold text-primary mt-1">Staff Notification Center</h2>
          <p className="text-xs text-on-surface-variant">
            Track question approvals, exam status, announcements, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 rounded-xl border border-outline-variant/60 hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-primary/10 flex items-center gap-4 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">notifications</span>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-on-surface-variant/70 uppercase">Total Alerts</p>
            <h3 className="text-xl font-bold text-primary">{notifications.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 flex items-center gap-4 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">mark_email_unread</span>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-amber-800/70 uppercase">Unread</p>
            <h3 className="text-xl font-bold text-amber-900">{unreadCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-4 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">quiz</span>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-emerald-800/70 uppercase">Question Updates</p>
            <h3 className="text-xl font-bold text-emerald-900">{questionUpdatesCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-blue-500/20 flex items-center gap-4 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">assignment</span>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-blue-800/70 uppercase">Exam Updates</p>
            <h3 className="text-xl font-bold text-blue-900">{examUpdatesCount}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-primary/10 bg-white shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant/60 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-outline-variant/60 bg-white font-semibold text-on-surface focus:border-primary"
          >
            <option value="">All Notification Types</option>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-outline-variant/60 bg-white font-semibold text-on-surface focus:border-primary"
          >
            <option value="">All Read Status</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>

          {(search || type || status) && (
            <button
              onClick={() => {
                setSearch('');
                setType('');
                setStatus('');
              }}
              className="px-3 py-2 text-xs rounded-xl text-error hover:bg-error/10 font-bold transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="glass-panel rounded-2xl border border-primary/10 bg-white shadow-sm overflow-hidden">
        {/* List Header */}
        <div className="p-4 border-b border-primary/10 bg-surface-container-low/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
              onChange={toggleSelectAll}
              className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-primary">
              Showing {filteredData.length} Notifications
            </span>
          </div>

          {selectedIds.length > 0 && (
            <span className="text-xs font-mono font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
              {selectedIds.length} Selected
            </span>
          )}
        </div>

        {/* List Body */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-surface-container-low animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
              notifications_off
            </span>
            <h4 className="text-sm font-bold text-on-surface">No Notifications Found</h4>
            <p className="text-xs text-on-surface-variant/70">
              Try adjusting your search criteria or type filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-primary/5">
            {filteredData.map((item) => {
              const { icon, color } = getNotificationConfig(item.type);
              const isSelected = selectedIds.includes(item._id);

              return (
                <div
                  key={item._id}
                  className={`p-4 flex items-start gap-4 transition-colors hover:bg-surface-container-low/40 ${
                    !item.read ? 'bg-primary/5' : ''
                  } ${isSelected ? 'bg-primary/10' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item._id)}
                    className="mt-1 rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />

                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${color}`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={`text-sm ${!item.read ? 'font-bold text-primary' : 'font-semibold text-on-surface'}`}>
                        {item.title}
                      </h5>
                      <span className="text-[11px] font-mono text-on-surface-variant/60 shrink-0">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                        {item.type || 'General'}
                      </span>
                      {item.sender && (
                        <span className="text-[10px] font-mono text-on-surface-variant/70">
                          From: {item.sender}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.read ? (
                      <button
                        onClick={() => handleMarkAsUnread(item._id)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Mark as Unread"
                      >
                        <span className="material-symbols-outlined text-base">mark_email_unread</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Mark as Read"
                      >
                        <span className="material-symbols-outlined text-base">done</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      title="Delete Notification"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffNotifications;
