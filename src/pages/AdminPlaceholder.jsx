import React from 'react';
import { useLocation } from 'react-router-dom';

const AdminPlaceholder = () => {
  const location = useLocation();
  const moduleName = location.pathname.split('/').pop()?.replace('-', ' ') || 'Module';
  
  return (
    <div className="glass-panel p-12 rounded-[24px] text-center space-y-6 flex flex-col items-center justify-center min-h-[400px] border border-primary/10">
      <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center animate-pulse">
        <span className="material-symbols-outlined text-3xl">construction</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-primary capitalize">{moduleName} Module</h2>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto">
          The {moduleName} console is currently being configured. Features will include full auditing, reporting dashboards, and secure data sync.
        </p>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
