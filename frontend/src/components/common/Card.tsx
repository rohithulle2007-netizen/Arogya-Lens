import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm shadow-slate-200/40 p-5 ${className}`}>
    {children}
  </div>
);
