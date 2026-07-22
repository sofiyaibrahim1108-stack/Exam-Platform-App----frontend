import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data && response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to retrieve notification logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    const loadingToast = toast.loading('Marking alert as read...');
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data && response.data.success) {
        toast.success('Notification marked as read.', { id: loadingToast });
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to mark notification as read.', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary mb-1">Notification History</h2>
        <p className="text-on-surface-variant text-xs font-semibold">
          Check broadcast messages and schedule alerts pushed by your course administrators and faculty creators.
        </p>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-surface-container-high rounded-[20px]"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-16 text-center border-2 border-dashed border-primary/10 rounded-[28px] bg-primary/5 max-w-lg mx-auto"
        >
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">
            notifications_off
          </span>
          <h4 className="text-base font-bold text-on-surface">No Notifications</h4>
          <p className="text-on-surface-variant text-xs mt-1">
            You do not have any notification alerts in your mailbox. All caught up!
          </p>
        </motion.div>
      ) : (
        <div className="glass-panel rounded-[24px] border border-primary/5 divide-y divide-primary/5 overflow-hidden shadow-sm">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 flex gap-4 items-start text-xs transition-colors ${
                !n.read ? 'bg-primary/5' : 'bg-surface-container-lowest'
              }`}
            >
              <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">
                assignment_late
              </span>
              <div className="flex-1 space-y-0.5 text-left">
                <p className={`text-[11px] leading-snug text-on-surface ${!n.read ? 'font-bold' : 'font-medium'}`}>
                  {n.title}
                </p>
                <p className="text-[10px] text-on-surface-variant/85 leading-relaxed font-semibold">
                  {n.message}
                </p>
                <span className="text-[8px] font-mono text-on-surface-variant/50 block">
                  {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                </span>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="py-1 px-3 bg-primary text-white hover:bg-primary/95 text-[10px] font-bold rounded-lg shrink-0 transition-colors shadow-sm"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
