import React, { useState } from 'react';
import { useActivityLogs } from '../db/db';
import { 
  Shield, 
  CheckCircle, 
  FileText, 
  Filter, 
  User, 
  Clock, 
  Database, 
  Key, 
  DollarSign, 
  ShoppingCart,
  UserPlus
} from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const logs = useActivityLogs();

  const getLogColors = (cat: string) => {
    switch (cat) {
      case 'security': 
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          timelineGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
          axisBg: 'bg-purple-500'
        };
      case 'transaction': 
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          timelineGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          axisBg: 'bg-emerald-500'
        };
      case 'procurement': 
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          timelineGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
          axisBg: 'bg-cyan-500'
        };
      case 'system':
      default: 
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          timelineGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
          axisBg: 'bg-blue-500'
        };
    }
  };

  const getLogIcon = (action: string, cat: string) => {
    const actLower = action.toLowerCase();
    
    // Check specific action types for more detailed icons
    if (actLower.includes('security') || actLower.includes('auth')) {
      return <Key className="w-4 h-4" />;
    }
    if (actLower.includes('invoice') || actLower.includes('settle')) {
      return <DollarSign className="w-4 h-4" />;
    }
    if (actLower.includes('po') || actLower.includes('purchase order')) {
      return <ShoppingCart className="w-4 h-4" />;
    }
    if (actLower.includes('registered') || actLower.includes('signup')) {
      return <UserPlus className="w-4 h-4" />;
    }

    switch (cat) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'transaction': return <CheckCircle className="w-4 h-4" />;
      case 'procurement': return <FileText className="w-4 h-4" />;
      case 'system':
      default: 
        return <Database className="w-4 h-4" />;
    }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.category === filter);

  // Helper to highlight key code references in details string (e.g. QTN-XXX, PO-XXX, RFQ-XXX)
  const formatDetails = (details: string) => {
    const regex = /(\b[A-Z]{2,4}-\d{4}-\d{3,4}\b)/g;
    const parts = details.split(regex);
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span key={index} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-indigo-300 font-bold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Filter Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/8">
        <div className="flex items-center gap-2 text-left">
          <Filter className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Audit Ledger Filters</span>
            <span className="text-[9px] text-slate-500">Filter security compliance and transaction trials</span>
          </div>
        </div>
        
        {/* Category selector pills */}
        <div className="flex flex-wrap gap-1.5 font-medium">
          {['all', 'security', 'transaction', 'procurement', 'system'].map((cat) => {
            const isActive = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`
                  px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer
                  ${isActive 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'}
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-10 text-left">
        
        {/* Vertical Timeline axis line */}
        <div className="absolute left-[29px] sm:left-[45px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-full" />

        <div className="space-y-6">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-panel border-white/8 text-slate-500 text-xs ml-4 sm:ml-6">
              No activity logs recorded in this category.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const styles = getLogColors(log.category);
              return (
                <div key={log.id} className="relative group transition-all duration-300">
                  
                  {/* Timeline Axis Node Button */}
                  <div className={`
                    absolute left-[-16px] sm:left-[-28px] top-1.5 z-10 p-2 rounded-full border bg-slate-950 transition-all duration-300 group-hover:scale-110
                    ${styles.border} ${styles.text} ${styles.timelineGlow}
                  `}>
                    {getLogIcon(log.action, log.category)}
                  </div>

                  {/* Log Details Card */}
                  <div className="ml-4 sm:ml-6 p-5 rounded-2xl glass-panel border border-white/8 bg-white/2 hover:border-white/12 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/2 space-y-3">
                    
                    {/* Log Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-wide">{log.action}</span>
                        <span className="text-[9px] text-slate-500 font-mono tracking-wider">{log.id}</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${styles.bg} ${styles.border} ${styles.text}`}>
                          {log.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {log.time}
                      </div>
                    </div>

                    {/* Details content */}
                    <div className="text-xs text-slate-300 leading-relaxed font-sans">
                      {formatDetails(log.details)}
                    </div>

                    {/* Actor footer details */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/3 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        <User className="w-3 h-3 text-slate-500" />
                        Actor: <span className="text-slate-200 ml-0.5">{log.user}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        Role: <span className="text-slate-300 font-semibold">{log.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
