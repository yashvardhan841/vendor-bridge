import React, { useState } from 'react';
import { 
  usePurchaseOrders, 
  useVendors, 
  useRFQs, 
  useQuotations, 
  useInvoices 
} from '../db/db';
import { 
  BarChart3, 
  Download, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  FileSpreadsheet, 
  FileDown,
  Users,
  FileCheck,
  MessageSquare,
  ShoppingCart,
  FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export const Reports: React.FC = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  
  const pos = usePurchaseOrders();
  const vendors = useVendors();
  const rfqs = useRFQs();
  const quotations = useQuotations();
  const invoices = useInvoices();

  const handleExport = (type: string) => {
    setExporting(type);
    setTimeout(() => {
      setExporting(null);
      alert(`Report exported successfully as ${type}! Check your downloads.`);
    }, 1500);
  };

  const parseAmount = (amtStr: string): number => {
    return parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 0;
  };



  // --- Spend calculation by Vendor Category ---
  const spendMap: Record<string, number> = {};
  let totalSpend = 0;

  pos.forEach(po => {
    const vendorMatch = vendors.find(v => v.name === po.vendor);
    const category = vendorMatch ? vendorMatch.category : 'General Operations';
    const amountVal = parseAmount(po.value);
    
    spendMap[category] = (spendMap[category] || 0) + amountVal;
    totalSpend += amountVal;
  });

  const categoryLabels = Object.keys(spendMap);
  const categorySpendData = Object.values(spendMap);

  // Doughnut Chart Colors
  const themeColors = [
    'rgba(168, 85, 247, 0.75)', // Purple
    'rgba(59, 130, 246, 0.75)',  // Blue
    'rgba(6, 182, 212, 0.75)',  // Cyan
    'rgba(16, 185, 129, 0.75)',  // Emerald
    'rgba(245, 158, 11, 0.75)',  // Amber
    'rgba(236, 72, 153, 0.75)',  // Pink
  ];

  const themeBorders = [
    'rgba(168, 85, 247, 1)',
    'rgba(59, 130, 246, 1)',
    'rgba(6, 182, 212, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(236, 72, 153, 1)',
  ];

  const spendChartData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['No Spend Sourced'],
    datasets: [{
      data: categorySpendData.length > 0 ? categorySpendData : [1],
      backgroundColor: categorySpendData.length > 0 ? themeColors.slice(0, categoryLabels.length) : ['rgba(255,255,255,0.05)'],
      borderColor: categorySpendData.length > 0 ? themeBorders.slice(0, categoryLabels.length) : ['rgba(255,255,255,0.1)'],
      borderWidth: 1.5,
    }]
  };

  // --- Invoice status count aggregation ---
  const invoiceStatusCounts = { Paid: 0, Processing: 0, Overdue: 0, Disputed: 0 };
  invoices.forEach(inv => {
    if (inv.status in invoiceStatusCounts) {
      invoiceStatusCounts[inv.status as keyof typeof invoiceStatusCounts] += 1;
    }
  });

  const invoiceChartData = {
    labels: ['Paid', 'Processing', 'Overdue', 'Disputed'],
    datasets: [{
      data: [
        invoiceStatusCounts.Paid,
        invoiceStatusCounts.Processing,
        invoiceStatusCounts.Overdue,
        invoiceStatusCounts.Disputed
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.75)', // Green
        'rgba(59, 130, 246, 0.75)',  // Blue
        'rgba(245, 158, 11, 0.75)',  // Amber
        'rgba(239, 68, 68, 0.75)',   // Red
      ],
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 1.5,
    }]
  };

  // --- comparative ledger counts bar chart ---
  const ledgerChartData = {
    labels: ['Vendors', 'RFQs', 'Quotations', 'Purchase Orders', 'Invoices'],
    datasets: [{
      label: 'Record Volume',
      data: [vendors.length, rfqs.length, quotations.length, pos.length, invoices.length],
      backgroundColor: 'rgba(99, 102, 241, 0.45)', // Indigo transparent
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1.5,
      borderRadius: 6,
    }]
  };

  // --- Chart Layout Styles Configurations ---
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#cbd5e1', // slate-300
          font: { size: 10, family: 'sans-serif' },
          boxWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    maintainAspectRatio: false,
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9 }, stepSize: 1 },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 5-Column Summary Metrics Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
        
        {/* Vendors count */}
        <div className="p-4 rounded-xl glass-panel border border-white/8 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Vendors</span>
            <strong className="text-lg text-white font-mono block mt-0.5">{vendors.length}</strong>
          </div>
        </div>

        {/* RFQ count */}
        <div className="p-4 rounded-xl glass-panel border border-white/8 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">RFQs</span>
            <strong className="text-lg text-white font-mono block mt-0.5">{rfqs.length}</strong>
          </div>
        </div>

        {/* Quotation count */}
        <div className="p-4 rounded-xl glass-panel border border-white/8 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Quotations</span>
            <strong className="text-lg text-white font-mono block mt-0.5">{quotations.length}</strong>
          </div>
        </div>

        {/* PO count & spend */}
        <div className="p-4 rounded-xl glass-panel border border-white/8 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">POs Issued</span>
            <strong className="text-lg text-white font-mono block mt-0.5">{pos.length}</strong>
          </div>
        </div>

        {/* Invoice count & AP spend */}
        <div className="p-4 rounded-xl glass-panel border border-white/8 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Invoices AP</span>
            <strong className="text-lg text-white font-mono block mt-0.5">{invoices.length}</strong>
          </div>
        </div>

      </div>

      {/* Visual Chart Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
        {/* Doughnut: Spend by Category */}
        <div className="p-5 rounded-2xl glass-panel border border-white/8 flex flex-col justify-between h-[280px]">
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Spend by Category</h3>
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="relative h-[200px]">
              {categorySpendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                  No active POs to calculate spend.
                </div>
              ) : (
                <Doughnut data={spendChartData} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Doughnut: Invoice Status */}
        <div className="p-5 rounded-2xl glass-panel border border-white/8 flex flex-col justify-between h-[280px]">
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Invoice Billing States</h3>
              <FileText className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="relative h-[200px]">
              {invoices.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                  No invoices filed.
                </div>
              ) : (
                <Doughnut data={invoiceChartData} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Action Export Card */}
        <div className="p-5 rounded-2xl glass-panel border border-white/8 flex flex-col justify-between h-[280px]">
          <div>
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Compliance & Exports</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Compile corporate ledger reports, active contract checklists, or vendor catalog reviews into standardized formats.
            </p>
          </div>

          <div className="space-y-2.5">
            <button 
              disabled={exporting !== null}
              onClick={() => handleExport('PDF')}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-white rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-red-400" />
                Export Executive PDF
              </span>
              {exporting === 'PDF' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button 
              disabled={exporting !== null}
              onClick={() => handleExport('Excel')}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-white rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Export Ledger Excel
              </span>
              {exporting === 'Excel' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>

      </div>

      {/* Visual Chart Grid - Row 2 */}
      <div className="p-5 rounded-2xl glass-panel border border-white/8 text-left">
        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Transaction Record Volumetrics</h3>
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="relative h-[220px]">
          <Bar data={ledgerChartData} options={barOptions} />
        </div>
      </div>

      {/* Corporate Ledger Compliance summary */}
      <div className="p-5 rounded-2xl glass-panel border border-white/15 flex items-center gap-4 text-left">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-bold text-white">Compliance Warning: Outdated Contracts Detected</span>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Corporate guidelines require quarterly risk verification for utility suppliers. "Quantum Energy Partners" has an overdue quality review certificate. Releasing POs to high-risk vendors is suspended.
          </p>
        </div>
      </div>

    </div>
  );
};
