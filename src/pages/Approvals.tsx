import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { 
  useApprovals, 
  updateApproval, 
  addActivityLog, 
  getQuotations, 
  updateQuotation, 
  updateRFQ 
} from '../db/db';
import { Check, X, ShieldAlert, FileCheck, CircleUser, DollarSign, MessageSquare } from 'lucide-react';

export const Approvals: React.FC = () => {
  const { currentRole, user } = useRole();
  const approvals = useApprovals();

  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const handleAction = (id: string, action: 'Approved' | 'Rejected') => {
    try {
      const item = approvals.find(a => a.id === id);
      if (!item) return;

      const remarks = remarksMap[id] || '';

      // Update approval item
      updateApproval(id, { status: action, remarks: remarks });

      // If item type is Quotation, resolve its status
      if (item.type === 'Quotation' && item.quoteId) {
        if (action === 'Approved') {
          // 1. Accept this quote
          updateQuotation(item.quoteId, { status: 'Accepted' });

          // 2. Decline other quotes for the same RFQ and close the RFQ
          const quotes = getQuotations();
          const targetQuote = quotes.find(q => q.id === item.quoteId);
          if (targetQuote) {
            quotes.forEach(q => {
              if (q.rfqId === targetQuote.rfqId && q.id !== targetQuote.id) {
                updateQuotation(q.id, { status: 'Declined' });
              }
            });
            updateRFQ(targetQuote.rfqId, { status: 'Closed' });
          }

          addActivityLog({
            user: user.name,
            role: currentRole,
            action: 'Quotation Approved',
            details: `Approved bid ${item.quoteId} for ${item.target}. Remarks: "${remarks || 'No remarks provided'}"`,
            category: 'procurement',
          });
        } else {
          // Reject Quote -> set its status back to Declined
          updateQuotation(item.quoteId, { status: 'Declined' });

          addActivityLog({
            user: user.name,
            role: currentRole,
            action: 'Quotation Rejected',
            details: `Rejected bid ${item.quoteId} for ${item.target}. Remarks: "${remarks || 'No remarks provided'}"`,
            category: 'procurement',
          });
        }
      } else {
        // Standard non-Quotation approvals (PO signoff, signup, etc.)
        addActivityLog({
          user: user.name,
          role: currentRole,
          action: `Governance ${action}`,
          details: `Governance Task ${id} (${item.type}: ${item.target}) was ${action.toLowerCase()} by ${user.name}. Remarks: "${remarks || 'No remarks'}"`,
          category: 'security',
        });
      }

      // Clear local remarks input
      setRemarksMap(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      alert(`Task ${id} has been ${action.toLowerCase()} successfully.`);
    } catch (e) {
      console.error(e);
      alert('Error updating approval task.');
    }
  };

  const isAuthorized = currentRole === 'Manager' || currentRole === 'Admin';

  if (currentRole === 'Vendor') {
    return (
      <div className="p-8 rounded-2xl glass-panel border border-red-500/20 text-center space-y-4 max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Access Restricted</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The approval portal contains internal governance workflows and PO releasing functions. Approval actions are restricted to internal corporate managers and administrators.
        </p>
      </div>
    );
  }

  const filteredApprovals = approvals.filter(i => i.status === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Informative top panel */}
      <div className="p-4 rounded-xl glass-panel border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div>
          <span className="text-xs font-semibold text-slate-400">Governance Portal</span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isAuthorized 
              ? 'Review pending corporate transactions, agreements, and vendor signups. Actions are logged to audit logs.' 
              : 'View mode active. Approvals require Manager or Admin signature permissions.'}
          </p>
        </div>
        {!isAuthorized && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Read-Only Mode
          </span>
        )}
      </div>

      {/* Tabs Filter Container */}
      <div className="flex gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
        {(['Pending', 'Approved', 'Rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border
              ${activeTab === tab 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
          >
            {tab} ({approvals.filter(a => a.status === tab).length})
          </button>
        ))}
      </div>

      {/* Approvals Queue */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border-white/8 text-slate-500 text-xs">
            No {activeTab.toLowerCase()} approvals found.
          </div>
        ) : (
          filteredApprovals.map((item) => (
            <div 
              key={item.id} 
              className="p-5 rounded-2xl glass-panel border border-white/8 flex flex-col gap-4 hover:border-white/12 transition-all text-left"
            >
              {/* Top row: Icon, Type, ID, target, and Value */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                    {item.type === 'Purchase Order' ? <DollarSign className="w-5 h-5" /> : 
                     item.type === 'Vendor Signup' ? <CircleUser className="w-5 h-5" /> : 
                     item.type === 'Quotation' ? <MessageSquare className="w-5 h-5" /> :
                     <FileCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.type}</span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                      
                      {/* Completed Badge */}
                      {item.status !== 'Pending' && (
                        <>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span 
                            className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border
                              ${item.status === 'Approved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                          >
                            {item.status}
                          </span>
                        </>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 mt-1">{item.target}</h4>
                    
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                      <span>Requested by: <strong className="text-slate-400">{item.requestor}</strong></span>
                      <span>Date: <strong className="text-slate-400">{item.date}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Cost */}
                <div className="text-left md:text-right md:min-w-[120px]">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Estimated Cost</span>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              </div>

              {/* Remarks rendering for Approved / Rejected */}
              {item.status !== 'Pending' && item.remarks && (
                <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-slate-300 italic">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Manager Remarks:</span>
                  "{item.remarks}"
                </div>
              )}

              {/* Remarks Input & Action Buttons for Pending items */}
              {item.status === 'Pending' && (
                <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 border-t border-white/5 pt-4 mt-2">
                  <div className="w-full md:flex-1 text-left">
                    <label className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                      Review remarks
                    </label>
                    <input
                      type="text"
                      placeholder="Add assessment remarks (optional)..."
                      value={remarksMap[item.id] || ''}
                      onChange={(e) => setRemarksMap({ ...remarksMap, [item.id]: e.target.value })}
                      className="w-full max-w-xl px-3 py-1.5 text-xs rounded-lg glass-input bg-slate-900 border border-white/10 text-white focus:border-indigo-500/50 outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    {isAuthorized ? (
                      <>
                        <button 
                          onClick={() => handleAction(item.id, 'Approved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer text-xs font-bold uppercase tracking-wider"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(item.id, 'Rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer text-xs font-bold uppercase tracking-wider"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic py-2">Awaiting Manager Release</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
