import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bell, BellOff, Search, CheckCheck, Trash2, AlertCircle,
  BookOpen, Award, AlertTriangle, Info, X, Filter
} from 'lucide-react';
import api from '../services/api';

/* ── Category config ─────────────────────────────────────────────── */
const CATEGORIES = [
  { key: 'all',     label: 'All',     icon: Bell },
  { key: 'exam',    label: 'Exam',    icon: BookOpen },
  { key: 'result',  label: 'Result',  icon: Award },
  { key: 'warning', label: 'Warning', icon: AlertTriangle },
  { key: 'general', label: 'General', icon: Info },
];

const categoryIcon = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('exam'))    return <BookOpen size={14} className="text-blue-600" />;
  if (t.includes('result'))  return <Award size={14} className="text-green-600" />;
  if (t.includes('warning')) return <AlertTriangle size={14} className="text-amber-600" />;
  return <AlertCircle size={14} className="text-[#7A001F]" />;
};

const categoryBg = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('exam'))    return 'bg-blue-50 border-blue-100';
  if (t.includes('result'))  return 'bg-green-50 border-green-100';
  if (t.includes('warning')) return 'bg-amber-50 border-amber-100';
  return 'bg-[rgba(122,0,31,0.05)] border-[rgba(122,0,31,0.10)]';
};

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) setNotifications(res.data.data || []);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark each unread one individually (no bulk endpoint assumed)
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => api.patch(`/notifications/${n._id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification removed.');
    } catch {
      toast.error('Failed to delete notification.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter in memory
  const filtered = notifications.filter((n) => {
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || (n.type || n.category || '').toLowerCase().includes(category);
    return matchSearch && matchCategory;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-[#1D1D1F]">Notifications</h1>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#7A001F] text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#6B7280]">
              System alerts, exam updates, and result notifications.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-semibold text-[#7A001F] bg-[rgba(122,0,31,0.06)] border border-[rgba(122,0,31,0.12)] hover:bg-[rgba(122,0,31,0.10)] transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Search + Category Tabs */}
      <div className="bg-white rounded-[20px] border border-[rgba(122,0,31,0.09)] shadow-[0_4px_24px_rgba(122,0,31,0.05)] p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-[12px] text-[13px] bg-[#F9FAFB] border border-[rgba(122,0,31,0.08)] focus:outline-none focus:border-[rgba(122,0,31,0.25)] text-[#1D1D1F] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold whitespace-nowrap transition-all ${
                category === key
                  ? 'bg-[#7A001F] text-white shadow-sm'
                  : 'bg-[#F9FAFB] text-[#6B7280] border border-[rgba(122,0,31,0.08)] hover:bg-[rgba(122,0,31,0.05)] hover:text-[#7A001F]'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-[16px] border border-[rgba(122,0,31,0.07)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(122,0,31,0.06)] flex items-center justify-center mx-auto mb-4">
            <BellOff size={28} className="text-[#C4B5B8]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#1D1D1F]">No Notifications</h3>
          <p className="text-[12px] text-[#9CA3AF] mt-1">
            {search ? 'No notifications match your search.' : "You're all caught up!"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((n, idx) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`bg-white rounded-[16px] border border-[rgba(122,0,31,0.09)] shadow-[0_2px_12px_rgba(122,0,31,0.04)] hover:shadow-[0_4px_20px_rgba(122,0,31,0.07)] transition-all duration-200 overflow-hidden ${
                  !n.read ? 'border-l-[3px] border-l-[#7A001F]' : ''
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center border flex-shrink-0 mt-0.5 ${categoryBg(n.type || n.category || '')}`}>
                    {categoryIcon(n.type || n.category || '')}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] leading-snug text-[#1D1D1F] ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#7A001F] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                    <span className="text-[9px] text-[#9CA3AF] font-medium mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n._id)}
                        className="p-1.5 rounded-[7px] hover:bg-[rgba(122,0,31,0.08)] text-[#7A001F] transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n._id)}
                      disabled={deletingId === n._id}
                      className="p-1.5 rounded-[7px] hover:bg-red-50 text-[#D1D5DB] hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
