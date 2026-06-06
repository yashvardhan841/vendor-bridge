import React from 'react';

interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
  label?: string;
}

export const AppSelect: React.FC<AppSelectProps> = ({
  children,
  className = '',
  containerClassName = '',
  label,
  ...props
}) => {
  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          {label}
        </label>
      )}
      <select
        className={`px-3 py-2 text-xs rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-indigo-500/50 transition-all cursor-pointer outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
