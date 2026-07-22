import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/audits/dashboard');
        if (response.data && response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard metrics data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Loading Skeletons */}
        <div className="h-28 bg-surface animate-pulse rounded-[24px] w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-surface animate-pulse rounded-[24px] w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const { counters, charts, recentActivities, recentLogins } = data;

  // Chart Custom Color Configurations (Primary Burgundy, Secondary Gold, Neutral Muted)
  const COLORS = ['#735c00', '#6b0f1a', '#b0a295'];

  return (
    <div className="space-y-8">
      {/* 1. Header Hero panel */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary">System Monitoring Console</h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Real-time aggregates of onboarded campus servers, active administrative users, and global platform events.
        </p>
      </div>

      {/* 2. Operational Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Institutions */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 hover:translate-y-[-2px] transition-all duration-300">
          <span className="material-symbols-outlined text-secondary text-3xl mb-2">domain</span>
          <p className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider">Total Institutions</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{counters.totalInstitutions}</h3>
          <p className="text-xs text-on-surface-variant mt-2 font-mono">{counters.activeInstitutions} Active Nodes</p>
        </div>

        {/* Total Admins */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 hover:translate-y-[-2px] transition-all duration-300">
          <span className="material-symbols-outlined text-secondary text-3xl mb-2">manage_accounts</span>
          <p className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider">Platform Admins</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{counters.totalAdmins}</h3>
          <p className="text-xs text-on-surface-variant mt-2 font-mono">{counters.activeAdmins} Active Clearances</p>
        </div>

        {/* Active Institutions */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 hover:translate-y-[-2px] transition-all duration-300">
          <span className="material-symbols-outlined text-secondary text-3xl mb-2">bolt</span>
          <p className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider">Active Campus Nodes</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{counters.activeInstitutions}</h3>
          <p className="text-xs text-secondary mt-2 font-mono font-semibold">ONLINE_NODES_STABLE</p>
        </div>

        {/* Suspended Admins */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 hover:translate-y-[-2px] transition-all duration-300">
          <span className="material-symbols-outlined text-secondary text-3xl mb-2">warning</span>
          <p className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider">Suspended Admins</p>
          <h3 className="text-3xl font-bold text-error mt-1">{counters.suspendedAdmins}</h3>
          <p className="text-xs text-error mt-2 font-mono font-semibold">BLOCK_LISTED_ACCOUNTS</p>
        </div>

      </div>

      {/* 3. Recharts Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth curve line chart */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-base font-bold text-primary">Institution Onboarding Growth</h3>
            <p className="text-on-surface-variant text-[11px]">Cumulative growth curve of universities onboarded to the network.</p>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.growthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#6b0f1a" opacity={0.6} />
                <YAxis stroke="#6b0f1a" opacity={0.6} />
                <Tooltip contentStyle={{ background: '#fdf8f7', border: '1px solid rgba(107,15,26,0.1)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="Institutions" stroke="#735c00" strokeWidth={2.5} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie ratio distribution active vs inactive */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Clearance Ratio</h3>
            <p className="text-on-surface-variant text-[11px]">Status distribution of campus nodes.</p>
          </div>
          <div className="h-48 w-full text-xs flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fdf8f7', border: '1px solid rgba(107,15,26,0.1)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span>Active ({counters.activeInstitutions})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span>Inactive ({counters.inactiveInstitutions})</span>
            </div>
          </div>
        </div>

        {/* Bar chart - admin distribution across codes */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 lg:col-span-3 space-y-4">
          <div>
            <h3 className="text-base font-bold text-primary">Admin Density</h3>
            <p className="text-on-surface-variant text-[11px]">Distribution of provisioned administrator roles per university code node.</p>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            {charts.adminDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-full text-on-surface-variant">No density mapping data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.adminDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" stroke="#6b0f1a" opacity={0.6} />
                  <YAxis stroke="#6b0f1a" opacity={0.6} />
                  <Tooltip contentStyle={{ background: '#fdf8f7', border: '1px solid rgba(107,15,26,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="admins" fill="#6b0f1a" radius={[6, 6, 0, 0]}>
                    {charts.adminDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6b0f1a' : '#735c00'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 4. Logs tables - Activities and Logins */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Recent Audit Activities */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-primary">Recent Global Activities</h3>
            <p className="text-on-surface-variant text-[11px]">Audit trail of recent configuration edits across nodes.</p>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-primary/10 pb-2 font-mono font-semibold text-primary uppercase">
                  <th className="py-2.5">Time</th>
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Action</th>
                  <th className="py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-[11px]">
                {recentActivities.map((log) => (
                  <tr key={log._id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-3 font-mono text-[10px] text-on-surface-variant">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 font-semibold text-on-surface">
                      {log.user ? log.user.name : 'System'}
                    </td>
                    <td className="py-3">
                      <span className="bg-primary/5 text-primary px-2 py-0.5 rounded font-mono font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-on-surface-variant max-w-[200px] truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Login History */}
        <div className="glass-panel p-6 rounded-[24px] border border-primary/5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-primary">Recent Login Events</h3>
            <p className="text-on-surface-variant text-[11px]">Security access history logs including IP Addresses and User Agents.</p>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-primary/10 pb-2 font-mono font-semibold text-primary uppercase">
                  <th className="py-2.5">Time</th>
                  <th className="py-2.5">User Name</th>
                  <th className="py-2.5">IP Address</th>
                  <th className="py-2.5">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-[11px]">
                {recentLogins.map((log) => (
                  <tr key={log._id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-3 font-mono text-[10px] text-on-surface-variant">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 font-semibold text-on-surface">
                      {log.user ? log.user.name : 'Unknown'}
                    </td>
                    <td className="py-3 font-mono text-[10px] text-on-surface-variant">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 text-on-surface-variant max-w-[150px] truncate" title={log.userAgent}>
                      {log.userAgent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SuperAdminDashboard;
