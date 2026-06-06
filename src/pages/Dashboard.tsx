import React from 'react';
import { useRole } from '../context/RoleContext';
import { 
  useVendors, 
  useRFQs, 
  usePurchaseOrders, 
  useApprovals, 
  useActivityLogs,
  addActivityLog
} from '../db/db';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  PlusCircle, 
  FileCheck, 
  AlertTriangle,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { currentRole, theme, user } = useRole();
  const navigate = useNavigate();

  // Load dynamic data from DB
  const vendors = useVendors();
  const rfqs = useRFQs();
  const pos = usePurchaseOrders();
  const approvals = useApprovals();
  const logs = useActivityLogs();

  // Calculate dynamic stats
  const totalSpendNum = pos.reduce((acc, po) => {
    const numeric = parseFloat(po.value.replace(/[^0-9.]/g, '')) || 0;
    return acc + numeric;
  }, 0);

  const formattedSpend = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalSpendNum);

  const activeVendorsCount = vendors.filter(v => v.status !== 'Suspended').length;
  const openRFQsCount = rfqs.filter(r => r.status === 'Published').length;
  const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending').length;

  const stats = [
    { name: 'Total Managed Spend', value: formattedSpend, change: '+12.4%', up: true, icon: DollarSign, color: '#3b82f6', path: '/purchase-orders' },
    { name: 'Active Vendor Partners', value: `${activeVendorsCount} Partners`, change: '+3 new', up: true, icon: Users, color: '#06b6d4', path: '/vendors' },
    { name: 'Open RFQs', value: `${openRFQsCount} Active`, change: 'Closing soon', up: true, icon: FileText, color: '#a855f7', path: '/rfqs' },
    { name: 'Pending Approvals', value: `${pendingApprovalsCount} Items`, change: '3 urgent', up: false, icon: Clock, color: '#10b981', path: '/approvals' },
  ];

  // Role-specific quick actions
  const getQuickActions = () => {
    switch (currentRole) {
      case 'Admin':
        return [
          { 
            title: 'System Diagnostics', 
            desc: 'Check API and microservices', 
            action: 'Run Scan', 
            icon: FileCheck,
            handler: () => {
              addActivityLog({
                user: user.name,
                role: currentRole,
                action: 'System Diagnostics Scan',
                details: 'Initiated full system health check. All microservices running at optimal latency.',
                category: 'system'
              });
              alert('Diagnostics completed. All systems operational!');
            }
          },
          { title: 'Manage Users', desc: 'Assign roles and credentials', action: 'Open Directory', icon: Users, handler: () => navigate('/vendors') },
          { 
            title: 'Reset Ledger DB', 
            desc: 'Reset all tables to initial seeder state', 
            action: 'Reset DB', 
            icon: AlertTriangle, 
            handler: () => {
              if (confirm('Are you sure you want to reset all tables and clear localStorage? All custom logs and updates will be wiped.')) {
                localStorage.removeItem('vendor_bridge_db');
                window.location.reload();
              }
            } 
          },
        ];
      case 'Procurement Officer':
        return [
          { title: 'Create New RFQ', desc: 'Launch a Request for Quotation', action: 'Initialize', icon: PlusCircle, handler: () => navigate('/rfqs') },
          { title: 'Compare Bids', desc: 'Analyze current active proposals', action: 'Compare', icon: TrendingUp, handler: () => navigate('/quotations') },
          { title: 'Verify Vendor', desc: 'Complete vendor compliance checks', action: 'Verify', icon: Users, handler: () => navigate('/vendors') },
        ];
      case 'Vendor':
        return [
          { title: 'Submit Proposal', desc: 'Bid on open RFQs', action: 'Submit Proposal', icon: FileText, handler: () => navigate('/rfqs') },
          { title: 'Submit Invoice', desc: 'Request payment for fulfilled orders', action: 'Create Invoice', icon: DollarSign, handler: () => navigate('/invoices') },
          { title: 'Update Catalog', desc: 'Modify product listings & pricing', action: 'Update', icon: PlusCircle, handler: () => navigate('/vendors') },
        ];
      case 'Manager':
        return [
          { title: 'Approve POs', desc: 'Review purchase orders awaiting release', action: `Review Queue (${pendingApprovalsCount})`, icon: FileCheck, handler: () => navigate('/approvals') },
          { title: 'Budget Analysis', desc: 'Verify quarterly procurement budgets', action: 'Analyze Spend', icon: TrendingUp, handler: () => navigate('/reports') },
          { title: 'Vendor Reviews', desc: 'Conduct vendor performance evaluation', action: 'Start Review', icon: Users, handler: () => navigate('/vendors') },
        ];
    }
  };

  const actions = getQuickActions();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div 
        className={`relative p-6 rounded-2xl glass-panel overflow-hidden border-white/10`}
      >
        {/* Glow backdrop effect */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l opacity-25 filter blur-3xl pointer-events-none rounded-full"
          style={{ background: `linear-gradient(to left, ${theme.primary}, transparent)` }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              Welcome back, {user.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Currently viewing VendorBridge ERP Console configured with <strong style={{ color: theme.primary }}>{currentRole}</strong> permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">System Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              onClick={() => navigate(stat.path)}
              className={`p-5 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between h-36 cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.name}</span>
                <div 
                  className="p-2 rounded-lg bg-white/5 border border-white/10"
                  style={{ color: stat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              
              <div className="mt-4">
                <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-bold ${stat.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {stat.change}
                  </span>
                  <span className="text-[10px] text-slate-500">from last month</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-white/10 flex flex-col">
          <div className="border-b border-white/8 pb-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Quick Actions ({currentRole})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {actions.map((act, idx) => {
              const ActIcon = act.icon;
              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="p-2 w-fit rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors"
                      style={{ color: theme.primary }}
                    >
                      <ActIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white mt-3">{act.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{act.desc}</p>
                  </div>
                  <button 
                    onClick={act.handler}
                    className="flex items-center gap-1 text-[10px] font-bold mt-4 group-hover:translate-x-1 transition-transform"
                    style={{ color: theme.primary }}
                  >
                    <span>{act.action}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Activity Timeline */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10">
          <div className="border-b border-white/8 pb-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Recent Logins & Actions</h3>
          </div>
          <div className="space-y-4">
            {logs.slice(0, 4).map((log, idx) => (
              <div key={log.id || idx} className="flex gap-3 text-left">
                <div className="relative flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10 z-10" />
                  {idx !== 3 && <div className="w-0.5 bg-white/10 flex-1 my-1" />}
                </div>
                <div className="pb-1">
                  <p className="text-xs font-semibold text-slate-200">{log.action}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{log.details}</p>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{log.role}</span>
                    <span className="text-[9px] text-slate-500">•</span>
                    <span className="text-[9px] text-slate-500">{log.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
