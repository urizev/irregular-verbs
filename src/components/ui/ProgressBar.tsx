import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, className = '' }) => {
  const percentage = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

  return (
    <div className={`w-full flex items-center gap-3 ${className}`}>
      <div className="flex-1 bg-slate-200 rounded-full h-4 p-0.5 overflow-hidden shadow-inner border border-slate-300">
        <div
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="font-fun font-bold text-sm text-slate-600 min-w-10 text-right">
        {current} / {total}
      </span>
    </div>
  );
};
