import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

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

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const groupNotificationsByDate = (notifs) => {
  const today = [];
  const yesterday = [];
  const older = [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  notifs.forEach((item) => {
    const itemTime = new Date(item.createdAt).getTime();
    if (itemTime >= todayStart) {
      today.push(item);
    } else if (itemTime >= yesterdayStart) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  });

  return { today, yesterday, older };
};

const StaffNotificationDrawer = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onRefresh,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Question Updates') return n.type && n.type.includes('Question');
    if (filter === 'Exam Updates') return n.type && n.type.includes('Exam');
    if (filter === 'Announcements') return n.type && n.type.includes('Announcement');
    return true;
  });

  const { today, yesterday, older } = groupNotificationsByDate(filteredNotifications);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data && res.data.success) {
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/notifications/mark-all-read');
      if (res.data && res.data.success) {
        toast.success('All notifications marked as read');
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data && res.data.success) {
        toast.success('Notification deleted');
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const renderSection = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant/70">
            {title}
          </span>
          <div className="flex-1 h-px bg-outline-variant/30"></div>
          <span className="text-[10px] font-mono font-semibold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const { icon, color } = getNotificationConfig(item.type);

            return (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => {
                  if (!item.read) handleMarkAsRead(item._id);
                  if (item.link) {
                    navigate(item.link);
                    onClose();
                  }
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  !item.read
                    ? 'bg-surface-container-lowest border-primary/20 shadow-md hover:border-primary/40'
                    : 'bg-surface-container-low/60 border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${color}`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h5 className={`text-xs truncate ${!item.read ? 'font-bold text-primary' : 'font-semibold text-on-surface'}`}>
                        {item.title}
                      </h5>
                      <span className="text-[10px] font-mono text-on-surface-variant/60 shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant">
                        {item.type || 'System Alert'}
                      </span>

                      {!item.read && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                          Unread
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (delete) */}
                  <button
                    onClick={(e) => handleDelete(item._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant/60 hover:text-error hover:bg-error/10 rounded-lg transition-all absolute top-3 right-3"
                    title="Delete Notification"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl border-l border-primary/10 flex flex-col z-50 overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-primary/10 bg-surface-container-low/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-2xl">notifications_active</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary">Staff Notifications</h3>
                    <p className="text-[10px] font-mono font-semibold text-on-surface-variant/70 uppercase tracking-wider">
                      Faculty Communication Center
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-on-surface">
                  {unreadCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold">
                      {unreadCount} Unread Alerts
                    </span>
                  ) : (
                    <span className="text-on-surface-variant/70 font-mono text-[11px]">All caught up</span>
                  )}
                </span>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
                {['All', 'Unread', 'Question Updates', 'Exam Updates', 'Announcements'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                      filter === tab
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-2xl border border-primary/5 bg-surface-container-low animate-pulse flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-primary/10 rounded w-3/4"></div>
                        <div className="h-2.5 bg-primary/5 rounded w-full"></div>
                        <div className="h-2.5 bg-primary/5 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 my-12">
                  <div className="w-16 h-16 rounded-full bg-primary/5 text-primary/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl">notifications_off</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">No Notifications Found</h4>
                    <p className="text-xs text-on-surface-variant/70 mt-1 max-w-xs">
                      {filter !== 'All'
                        ? `No notifications found matching '${filter}'.`
                        : 'You are completely up to date with all staff alerts and updates.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {renderSection('Today', today)}
                  {renderSection('Yesterday', yesterday)}
                  {renderSection('Older', older)}
                </>
              )}
            </div>

            {/* Footer View All Link */}
            <div className="p-4 border-t border-primary/10 bg-surface-container-low/50 flex items-center justify-center">
              <button
                onClick={() => {
                  onClose();
                  navigate('/staff/notifications');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">visibility</span>
                View All Staff Notifications Page
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StaffNotificationDrawer;
