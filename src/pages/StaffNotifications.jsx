import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, X, Info, Send, Calendar, Megaphone,
  Settings, UserCheck, ShieldAlert, Sparkles, RefreshCw, Trash2, MailOpen, Mail,  FileText,
  ListFilter, Search, CheckSquare
} from 'lucide-react';
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
      return { icon: <CheckCircle2 size={16} />, color: 'text-emerald-700 bg-emerald-50 border-emerald-500/20' };
    case 'Question Rejected':
      return { icon: <AlertCircle size={16} />, color: 'text-red-700 bg-red-50 border-red-500/20' };
    case 'Question Needs Revision':
      return { icon: <Settings size={16} />, color: 'text-amber-700 bg-amber-50 border-amber-500/20' };
    case 'Exam Approved':
      return { icon: <CheckCircle2 size={16} />, color: 'text-emerald-700 bg-emerald-50 border-emerald-500/20' };
    case 'Exam Rejected':
      return { icon: <AlertCircle size={16} />, color: 'text-red-700 bg-red-50 border-red-500/20' };
    case 'Exam Published':
      return { icon: <Send size={16} />, color: 'text-blue-700 bg-blue-50 border-blue-500/20' };
    case 'Exam Scheduled':
      return { icon: <Calendar size={16} />, color: 'text-indigo-700 bg-indigo-50 border-indigo-500/20' };
    case 'Admin Announcement':
      return { icon: <Megaphone size={16} />, color: 'text-purple-700 bg-purple-50 border-purple-500/20' };
    case 'Account Notifications':
      return { icon: <UserCheck size={16} />, color: 'text-teal-700 bg-teal-50 border-teal-500/20' };
    case 'General System Notifications':
    default:
      return { icon: <Info size={16} />, color: 'text-[#8C1D40] bg-[#F8ECEF] border-[#8C1D40]/10' };
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
    <div className="space-y-6 pb-12 font-sans text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#F8ECEF] text-[#8C1D40] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#8C1D40]/5">
            Faculty Communications
          </span>
          <h2 className="text-xl font-extrabold text-[#1D1D1F] mt-1.5 leading-tight">Staff Notification Center</h2>
          <p className="text-xs text-[#6B7280]">
            Track question approvals, exam status, announcements, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#6B7280] font-bold text-xs transition-all flex items-center gap-2 active:scale-95 shadow-xs"
          >
            <RefreshCw size={13} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-[#8C1D40] hover:opacity-95 text-white font-bold text-xs transition-all flex items-center gap-2 active:scale-95 shadow-xs"
            >
              <CheckSquare size={13} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#F8ECEF] text-[#8C1D40] flex items-center justify-center shrink-0 border border-[#8C1D40]/5">
            <Megaphone size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider block">Total Alerts</span>
            <h3 className="text-xl font-bold text-[#1D1D1F] font-mono mt-0.5">{notifications.length}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Mail size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider block">Unread</span>
            <h3 className="text-xl font-bold text-amber-900 font-mono mt-0.5">{unreadCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider block">Questions</span>
            <h3 className="text-xl font-bold text-emerald-900 font-mono mt-0.5">{questionUpdatesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-500/20">
            <FileText size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider block">Exam Updates</span>
            <h3 className="text-xl font-bold text-blue-900 font-mono mt-0.5">{examUpdatesCount}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[rgba(140,29,64,0.08)] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#8C1D40]/30 text-[#1D1D1F] font-semibold"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
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
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white font-bold text-[#1D1D1F] focus:border-[#8C1D40]/30 focus:outline-none"
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
              className="px-3 py-2 text-xs rounded-xl text-red-600 hover:bg-red-50 font-bold active:scale-95 transition-all border border-transparent"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-[24px] border border-[rgba(140,29,64,0.08)] shadow-xs overflow-hidden">
        {/* List Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
              onChange={toggleSelectAll}
              className="rounded text-[#8C1D40] focus:ring-[#8C1D40] h-4 w-4 cursor-pointer border-gray-300"
            />
            <span className="text-xs font-extrabold text-[#1D1D1F]">
              Showing {filteredData.length} Notifications
            </span>
          </div>

          {selectedIds.length > 0 && (
            <span className="text-[10px] font-mono font-bold px-3 py-1 bg-[#F8ECEF] text-[#8C1D40] rounded-full border border-[#8C1D40]/5 animate-pulse">
              {selectedIds.length} Selected
            </span>
          )}
        </div>

        {/* List Body */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-50 border border-gray-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle size={48} className="text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#1D1D1F]">No Notifications Found</h4>
            <p className="text-xs text-[#6B7280] font-semibold">
              Try adjusting your search criteria or type filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredData.map((item) => {
              const { icon, color } = getNotificationConfig(item.type);
              const isSelected = selectedIds.includes(item._id);

              return (
                <div
                  key={item._id}
                  className={`p-4 flex items-start gap-4 transition-colors hover:bg-gray-50/50 ${
                    !item.read ? 'bg-[#F8ECEF]/10' : ''
                  } ${isSelected ? 'bg-[#F8ECEF]/30' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item._id)}
                    className="mt-2.5 rounded text-[#8C1D40] focus:ring-[#8C1D40] h-4 w-4 cursor-pointer border-gray-300"
                  />

                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs mt-1 ${color}`}>
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={`text-xs ${!item.read ? 'font-black text-[#8C1D40]' : 'font-extrabold text-[#1D1D1F]'}`}>
                        {item.title}
                      </h5>
                      <span className="text-[10px] font-mono text-[#9CA3AF] shrink-0 font-bold">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed font-semibold">
                      {item.message}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-gray-50 border border-gray-150 text-[#6B7280]">
                        {item.type || 'General'}
                      </span>
                      {item.sender && (
                        <span className="text-[9px] font-mono text-[#9CA3AF] font-bold">
                          From: {item.sender}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {item.read ? (
                      <button
                        onClick={() => handleMarkAsUnread(item._id)}
                        className="p-1.5 text-gray-400 hover:text-[#8C1D40] hover:bg-[#F8ECEF] rounded-lg transition-all"
                        title="Mark as Unread"
                      >
                        <Mail size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        className="p-1.5 text-[#8C1D40] hover:bg-[#F8ECEF] rounded-lg transition-all"
                        title="Mark as Read"
                      >
                        <MailOpen size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent"
                      title="Delete Notification"
                    >
                      <Trash2 size={14} />
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
