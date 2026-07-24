import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bell, BellOff, Search, Trash2, AlertCircle,
  BookOpen, Award, AlertTriangle, Info, X, Filter, CheckCircle2, CheckSquare
} from 'lucide-react';
import api from '../services/api';

const CATEGORIES = [
  { key: 'all',     label: 'All Alerts', icon: Bell },
  { key: 'warning', label: 'Warnings',   icon: AlertTriangle },
  { key: 'general', label: 'General',    icon: Info },
];

const categoryIcon = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('warning')) return <AlertTriangle size={14} className="text-amber-600" />;
  if (t.includes('announcement') || t.includes('system')) return <AlertCircle size={14} className="text-[#8B1538]" />;
  return <Info size={14} className="text-blue-600" />;
};

const categoryBg = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('warning')) return 'bg-amber-50 border-amber-100';
  if (t.includes('announcement') || t.includes('system')) return 'bg-[#FDF3F6] border-[#F0D6DD]';
  return 'bg-blue-50 border-blue-100';
};

const SuperAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      toast.success('Alert marked as read.');
    } catch {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length === 0) {
        toast.error('No unread alerts.');
        return;
      }
      await Promise.all(unread.map((n) => api.patch(`/notifications/${n._id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All alerts marked as read.');
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
    const matchSearch = !search || 
      n.title?.toLowerCase().includes(search.toLowerCase()) || 
      n.message?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || 
      (n.type || n.category || '').toLowerCase().includes(category);
    return matchSearch && matchCategory;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header HERO */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">System Notification Streams</h2>
          <p className="text-on-surface-variant text-sm mt-1">Review alerts, announcement logs, and critical hardware indicators.</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="btn-wine text-xs flex items-center gap-1.5 shrink-0 self-start md:self-center"
        >
          <CheckSquare size={14} />
          Mark All Read
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notification contents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8B1538] focus:bg-white transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#8B1538] text-white'
                    : 'text-gray-500 hover:bg-[#8B1538]/5 hover:text-[#8B1538]'
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl border border-gray-200"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-150 rounded-2xl">
          <BellOff size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-sm">No Notifications Found</h3>
          <p className="text-xs text-gray-500 mt-1">There are no notification logs matching your active criteria.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item._id}
                variants={itemVariants}
                exit={{ opacity: 0, x: -20 }}
                className={`p-4 rounded-2xl border transition-colors flex items-start gap-4 ${
                  !item.read 
                    ? 'bg-[#FDF3F6] border-[#F0D6DD]' 
                    : 'bg-white border-gray-150'
                }`}
              >
                {/* Category Icon */}
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${categoryBg(item.type || item.category)}`}>
                  {categoryIcon(item.type || item.category)}
                </div>

                {/* Body Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h3 className={`text-xs font-extrabold truncate ${!item.read ? 'text-[#8B1538]' : 'text-gray-850'}`}>
                      {item.title}
                    </h3>
                    <span className="text-[9px] font-mono font-bold text-gray-400 shrink-0">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-normal font-semibold">
                    {item.message}
                  </p>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {!item.read && (
                    <button
                      onClick={() => handleMarkRead(item._id)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:border-[#8B1538]/20 bg-white hover:bg-[#FDF3F6] text-[#8B1538] transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  )}
                  <button
                    disabled={deletingId === item._id}
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:border-red-250 bg-white hover:bg-red-50 text-red-500 transition-colors"
                    title="Remove alert"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  );
};

export default SuperAdminNotifications;
