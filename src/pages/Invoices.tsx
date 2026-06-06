import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { 
  useInvoices, 
  usePurchaseOrders, 
  useVendors,
  addInvoice, 
  updateInvoice, 
  updatePurchaseOrder, 
  addActivityLog,
  type Invoice
} from '../db/db';
import { 
  Plus, 
  ShieldAlert, 
  CircleDollarSign, 
  X, 
  Printer, 
  Download, 
  Mail, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  FileText,
  Phone,
  Building
} from 'lucide-react';

export const Invoices: React.FC = () => {
  const { theme, currentRole, user } = useRole();
  const invoices = useInvoices();
  const pos = usePurchaseOrders();
  const vendors = useVendors();

  // Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Selected Invoice for details overlay
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Email Stepper Simulator State
  const [simulatedEmailInvoice, setSimulatedEmailInvoice] = useState<Invoice | null>(null);
  const [emailStep, setEmailStep] = useState<number>(0); // 0 = idle, 1 = encrypt, 2 = smtp, 3 = transmit, 4 = complete

  // Filter based on role (Vendors only see their own Invoices)
  const roleFilteredInvoices = invoices.filter(inv => {
    if (currentRole === 'Vendor') {
      return inv.vendor === user.name;
    }
    return true;
  });

  // Calculate totals dynamically
  const parseAmount = (amtStr: string): number => {
    return parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 0;
  };

  const apTotal = roleFilteredInvoices
    .filter(inv => inv.status === 'Processing' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + parseAmount(inv.amount), 0);

  const disputedTotal = roleFilteredInvoices
    .filter(inv => inv.status === 'Disputed')
    .reduce((sum, inv) => sum + parseAmount(inv.amount), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Get unpaid POs for the vendor to select
  const vendorPOs = pos.filter(po => po.vendor === user.name && po.billing === 'Unpaid');

  // Selected PO details lookup for invoice calculation
  const selectedPO = pos.find(p => p.id === selectedPoId);
  const calculatedSubtotal = selectedPO ? parseAmount(selectedPO.value) : 0;
  const calculatedTax = calculatedSubtotal * 0.18; // 18% standard tax
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const handleUploadInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !dueDate) {
      alert('Please fill out all fields.');
      return;
    }

    if (!selectedPO) return;

    // Create the invoice
    const newInvoice = addInvoice({
      poId: selectedPoId,
      vendor: user.name,
      subtotal: formatCurrency(calculatedSubtotal),
      tax: formatCurrency(calculatedTax),
      amount: formatCurrency(calculatedTotal),
      due: dueDate,
      status: 'Processing',
    });

    addActivityLog({
      user: user.name,
      role: currentRole,
      action: 'Invoice Generated',
      details: `Generated invoice ${newInvoice.id} from PO ${selectedPoId}. Subtotal: ${newInvoice.subtotal}, Tax: ${newInvoice.tax}, Total: ${newInvoice.amount}.`,
      category: 'transaction',
    });

    // Reset Form
    setSelectedPoId('');
    setDueDate('');
    setShowUploadModal(false);

    // Launch email simulation for the newly created invoice
    triggerEmailSimulation(newInvoice);
  };

  const triggerEmailSimulation = (inv: Invoice) => {
    setSimulatedEmailInvoice(inv);
    setEmailStep(1);
    
    // Step 1: Encrypting
    setTimeout(() => {
      setEmailStep(2);
      // Step 2: SMTP connect
      setTimeout(() => {
        setEmailStep(3);
        // Step 3: Transmit
        setTimeout(() => {
          setEmailStep(4);
        }, 1500);
      }, 1200);
    }, 1000);
  };

  const handleSettlement = (invoiceId: string, action: 'Paid' | 'Processing') => {
    try {
      const inv = invoices.find(i => i.id === invoiceId);
      if (!inv) return;

      updateInvoice(invoiceId, { status: action });

      if (action === 'Paid') {
        updatePurchaseOrder(inv.poId, { billing: 'Paid', delivery: 'Delivered' });

        addActivityLog({
          user: user.name,
          role: currentRole,
          action: 'Invoice Paid',
          details: `Settled invoice ${invoiceId} value ${inv.amount}. Linked PO ${inv.poId} marked paid/delivered.`,
          category: 'transaction',
        });
        alert(`Invoice ${invoiceId} paid and PO ${inv.poId} marked as settled.`);
      } else if (action === 'Processing') {
        addActivityLog({
          user: user.name,
          role: currentRole,
          action: 'Invoice Dispute Resolved',
          details: `Resolved dispute for invoice ${invoiceId}. Returned to processing.`,
          category: 'transaction',
        });
        alert(`Dispute resolved. Invoice ${invoiceId} is now in processing.`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update invoice settlement.');
    }
  };

  const handlePrintInvoice = (inv: Invoice) => {
    const vendorInfo = vendors.find(v => v.name === inv.vendor);
    const linkedPO = pos.find(p => p.id === inv.poId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups to print.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Invoice ${inv.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: -0.5px; }
            .inv-meta { text-align: right; font-size: 13px; color: #475569; }
            .inv-meta strong { color: #0f172a; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.5px; }
            .address-info { font-size: 13px; color: #334155; line-height: 1.6; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .items-table th { background: #f8fafc; font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            .items-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .total-row { font-weight: bold; }
            .total-row td { border-bottom: none; padding-top: 8px; padding-bottom: 8px; }
            .footer { margin-top: 80px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 60px; font-size: 13px; }
            .sig-line { border-top: 1px dashed #cbd5e1; margin-top: 50px; padding-top: 8px; text-align: center; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${inv.vendor.toUpperCase()}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600;">Supplier Billing Document</div>
            </div>
            <div class="inv-meta">
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">TAX INVOICE</div>
              <div>Invoice ID: <strong>${inv.id}</strong></div>
              <div>Date Issued: <strong>${inv.date}</strong></div>
              <div>PO Link: <strong>${inv.poId}</strong></div>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-title">Invoiced From (Vendor)</div>
              <div class="address-info">
                <strong>${inv.vendor}</strong><br/>
                Email: ${vendorInfo?.email || 'contact@supplier.com'}<br/>
                Phone: ${vendorInfo?.phone || 'N/A'}<br/>
                GSTIN: ${vendorInfo?.gstNumber || 'N/A'}
              </div>
            </div>
            <div>
              <div class="section-title">Invoiced To (Buyer)</div>
              <div class="address-info">
                <strong>VendorBridge Corporate Ltd.</strong><br/>
                100 Corporate Parkway, Tech Suite 500<br/>
                San Francisco, CA 94105<br/>
                procurement@vendorbridge.com
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item Details & Description</th>
                <th style="text-align: right; width: 100px;">Quantity</th>
                <th style="text-align: right; width: 150px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style="color: #0f172a;">${linkedPO?.itemName || 'Industrial Supplies'}</strong><br/>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${linkedPO?.description || 'Standard corporate deliverables.'}</div>
                </td>
                <td style="text-align: right;">${linkedPO?.quantity || 1}</td>
                <td style="text-align: right; font-weight: 600;">${inv.subtotal || inv.amount}</td>
              </tr>
              <tr class="total-row" style="border-top: 2px solid #e2e8f0;">
                <td colspan="2" style="text-align: right; color: #64748b; font-size: 12px;">Subtotal:</td>
                <td style="text-align: right; color: #334155;">${inv.subtotal || inv.amount}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; color: #64748b; font-size: 12px;">Tax (GST 18%):</td>
                <td style="text-align: right; color: #334155;">${inv.tax || '$0'}</td>
              </tr>
              <tr class="total-row" style="background: #f8fafc; font-size: 14px;">
                <td colspan="2" style="text-align: right; color: #0f172a; font-weight: 800;">Total Payable (USD):</td>
                <td style="text-align: right; color: #0f172a; font-weight: 800;">${inv.amount}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #64748b; margin-top: 20px; line-height: 1.6;">
            <strong>Due Date:</strong> This invoice is due on or before <strong>${inv.due}</strong>. Please direct payment queries to accounting departments referencing PO ${inv.poId}.
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">Prepared By (Supplier Rep)</div>
            </div>
            <div>
              <div class="sig-line">Receipt Signoff (Authorized Auditor)</div>
            </div>
          </div>

          <div class="footer">
            This billing document has been registered securely inside VendorBridge ERP.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    return printWindow;
  };

  const handleTriggerPrint = (inv: Invoice) => {
    const win = handlePrintInvoice(inv);
    if (win) {
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 250);
    }
  };

  const handleDownloadPDF = (inv: Invoice) => {
    const vendorInfo = vendors.find(v => v.name === inv.vendor);
    const linkedPO = pos.find(p => p.id === inv.poId);

    const htmlContent = `
      <html>
        <head>
          <title>Invoice ${inv.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: -0.5px; }
            .inv-meta { text-align: right; font-size: 13px; color: #475569; }
            .inv-meta strong { color: #0f172a; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.5px; }
            .address-info { font-size: 13px; color: #334155; line-height: 1.6; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .items-table th { background: #f8fafc; font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            .items-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .total-row { font-weight: bold; }
            .total-row td { border-bottom: none; padding-top: 8px; padding-bottom: 8px; }
            .footer { margin-top: 80px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 60px; font-size: 13px; }
            .sig-line { border-top: 1px dashed #cbd5e1; margin-top: 50px; padding-top: 8px; text-align: center; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${inv.vendor.toUpperCase()}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600;">Supplier Billing Document</div>
            </div>
            <div class="inv-meta">
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">TAX INVOICE</div>
              <div>Invoice ID: <strong>${inv.id}</strong></div>
              <div>Date Issued: <strong>${inv.date}</strong></div>
              <div>PO Link: <strong>${inv.poId}</strong></div>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-title">Invoiced From (Supplier)</div>
              <div class="address-info">
                <strong>${inv.vendor}</strong><br/>
                Email: ${vendorInfo?.email || 'contact@supplier.com'}<br/>
                Phone: ${vendorInfo?.phone || 'N/A'}<br/>
                GSTIN: ${vendorInfo?.gstNumber || 'N/A'}
              </div>
            </div>
            <div>
              <div class="section-title">Invoiced To (Buyer)</div>
              <div class="address-info">
                <strong>VendorBridge Corporate Ltd.</strong><br/>
                100 Corporate Parkway, Tech Suite 500<br/>
                San Francisco, CA 94105<br/>
                procurement@vendorbridge.com
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item Details & Description</th>
                <th style="text-align: right; width: 100px;">Quantity</th>
                <th style="text-align: right; width: 150px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style="color: #0f172a;">${linkedPO?.itemName || 'Industrial Supplies'}</strong><br/>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${linkedPO?.description || 'Standard corporate deliverables.'}</div>
                </td>
                <td style="text-align: right;">${linkedPO?.quantity || 1}</td>
                <td style="text-align: right; font-weight: 600;">${inv.subtotal || inv.amount}</td>
              </tr>
              <tr class="total-row" style="border-top: 2px solid #e2e8f0;">
                <td colspan="2" style="text-align: right; color: #64748b; font-size: 12px;">Subtotal:</td>
                <td style="text-align: right; color: #334155;">${inv.subtotal || inv.amount}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; color: #64748b; font-size: 12px;">Tax (GST 18%):</td>
                <td style="text-align: right; color: #334155;">${inv.tax || '$0'}</td>
              </tr>
              <tr class="total-row" style="background: #f8fafc; font-size: 14px;">
                <td colspan="2" style="text-align: right; color: #0f172a; font-weight: 800;">Total Payable (USD):</td>
                <td style="text-align: right; color: #0f172a; font-weight: 800;">${inv.amount}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #64748b; margin-top: 20px; line-height: 1.6;">
            <strong>Due Date:</strong> This invoice is due on or before <strong>${inv.due}</strong>.
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">Prepared By (Supplier Rep)</div>
            </div>
            <div>
              <div class="sig-line">Receipt Signoff (Authorized Auditor)</div>
            </div>
          </div>

          <div class="footer">
            This document is valid as a print-to-PDF invoice contract.
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${inv.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedInvVendor = selectedInvoice ? vendors.find(v => v.name === selectedInvoice.vendor) : null;
  const selectedInvPO = selectedInvoice ? pos.find(p => p.id === selectedInvoice.poId) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass-panel border-white/5 flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Accounts Payable</span>
            <span className="text-lg font-bold text-white mt-1 block">{formatCurrency(apTotal)}</span>
          </div>
          <CircleDollarSign className="w-8 h-8 text-indigo-400 opacity-60" />
        </div>
        <div className="p-4 rounded-xl glass-panel border-white/5 flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Disputed Total</span>
            <span className="text-lg font-bold text-red-400 mt-1 block">{formatCurrency(disputedTotal)}</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-400 opacity-60" />
        </div>
        
        {/* Role action container */}
        <div className="p-4 rounded-xl glass-panel border-white/5 flex items-center justify-center">
          {currentRole === 'Vendor' ? (
            <button 
              onClick={() => {
                if (vendorPOs.length === 0) {
                  alert('You have no unpaid purchase orders to link an invoice to.');
                  return;
                }
                setShowUploadModal(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white rounded-lg shadow-lg hover:bg-white/10 border transition-all active:scale-95 cursor-pointer"
              style={{ 
                backgroundColor: `${theme.primary}20`,
                borderColor: `${theme.primary}40`
              }}
            >
              <Plus className="w-4 h-4" />
              Generate Invoice
            </button>
          ) : (
            <div className="text-center">
              <span className="text-xs text-slate-400 block font-semibold">Ledger Settlement System</span>
              <span className="text-[9px] text-slate-500">Internal finance controls enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Registry */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Code</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">PO Reference</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Tax Value</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Invoice Total</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {roleFilteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-500">
                    No invoices recorded.
                  </td>
                </tr>
              ) : (
                roleFilteredInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className={`hover:bg-white/2 transition-colors ${inv.status === 'Disputed' && 'bg-red-500/5 hover:bg-red-500/10'}`}>
                    <td className="p-4">
                      <span className="text-xs font-semibold text-white block font-mono">{inv.id}</span>
                      <span className="text-[9px] text-slate-500">Rec: {inv.date}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-300 font-mono">{inv.poId}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-300">{inv.vendor}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs text-slate-400 font-mono">{inv.tax || 'N/A'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-bold text-white font-mono">{inv.amount}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-400">{inv.due}</span>
                    </td>
                    <td className="p-4">
                      <span 
                        className={`
                          inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                          ${inv.status === 'Paid' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}
                          ${inv.status === 'Processing' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}
                          ${inv.status === 'Overdue' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                          ${inv.status === 'Disputed' && 'bg-red-500/15 text-red-400 border border-red-500/30'}
                        `}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Quick actions for all invoices */}
                        <button 
                          onClick={() => handleTriggerPrint(inv)}
                          title="Print Invoice"
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(inv)}
                          title="Download PDF Layout"
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => triggerEmailSimulation(inv)}
                          title="Resend Email Dispatch"
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Invoice Sheet"
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Internal payment actions */}
                        {currentRole !== 'Vendor' && (
                          <div className="ml-2 border-l border-white/10 pl-2">
                            {inv.status === 'Processing' && (currentRole === 'Manager' || currentRole === 'Admin') ? (
                              <button 
                                onClick={() => handleSettlement(inv.id, 'Paid')}
                                className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Settle AP
                              </button>
                            ) : inv.status === 'Disputed' && (currentRole === 'Manager' || currentRole === 'Admin') ? (
                              <button 
                                onClick={() => handleSettlement(inv.id, 'Processing')}
                                className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-600 font-mono">Closed</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Overlay Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full rounded-2xl glass-panel border border-white/12 bg-slate-900/95 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono block">LEDGER INVOICE FILE</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Invoice Code: <span className="font-mono text-indigo-300">{selectedInvoice.id}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerPrint(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-all text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download HTML
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* financial summary pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 rounded-xl bg-white/3 border border-white/5 text-xs">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Billing Date</span>
                <strong className="text-slate-200 mt-0.5 block">{selectedInvoice.date}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Due Date</span>
                <strong className="text-amber-400 mt-0.5 block">{selectedInvoice.due}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Tax Committed</span>
                <strong className="text-slate-300 mt-0.5 block font-mono">{selectedInvoice.tax || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Amount Payable</span>
                <strong className="text-emerald-400 mt-0.5 block font-mono font-bold">{selectedInvoice.amount}</strong>
              </div>
            </div>

            {/* Address Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-white/8 py-5">
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                  <Building className="w-3 h-3 text-indigo-400" /> Billed From (Supplier)
                </span>
                <div className="text-slate-300 space-y-1 bg-white/2 p-3 rounded-xl border border-white/5">
                  <strong className="text-white block">{selectedInvoice.vendor}</strong>
                  {selectedInvVendor ? (
                    <>
                      <div className="flex items-center gap-1 text-[11px] mt-1 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {selectedInvVendor.email}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {selectedInvVendor.phone}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        GSTIN: <span className="text-slate-400">{selectedInvVendor.gstNumber}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 italic">No supplier card in database</div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                  <Building className="w-3 h-3 text-indigo-400" /> Billed To (Buyer)
                </span>
                <div className="text-slate-300 space-y-1 bg-white/2 p-3 rounded-xl border border-white/5">
                  <strong className="text-white block">VendorBridge Corporate Ltd.</strong>
                  <div>100 Corporate Parkway, Tech Suite 500</div>
                  <div>San Francisco, CA 94105</div>
                  <div className="text-indigo-300 font-semibold mt-1">procurement@vendorbridge.com</div>
                </div>
              </div>
            </div>

            {/* Item Table Grid */}
            <div className="space-y-3 text-xs">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Linked Purchase Order Contract ({selectedInvoice.poId})
              </span>
              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/3 text-slate-400 font-bold uppercase">
                      <th className="p-3 text-left">Item Name / Description</th>
                      <th className="p-3 text-center w-[80px]">Qty</th>
                      <th className="p-3 text-right w-[120px]">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="p-3 text-left">
                        <strong className="text-white block">{selectedInvPO?.itemName || 'Procurement Deliverables'}</strong>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {selectedInvPO?.description || 'Deliverables catalog records.'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-300">{selectedInvPO?.quantity || 1}</td>
                      <td className="p-3 text-right text-slate-300 font-mono">{selectedInvoice.subtotal || selectedInvoice.amount}</td>
                    </tr>
                    <tr className="border-b border-white/5 font-semibold text-slate-400">
                      <td colSpan={2} className="p-2.5 text-right text-[11px]">Subtotal Value:</td>
                      <td className="p-2.5 text-right font-mono text-slate-300">{selectedInvoice.subtotal || selectedInvoice.amount}</td>
                    </tr>
                    <tr className="border-b border-white/5 font-semibold text-slate-400">
                      <td colSpan={2} className="p-2.5 text-right text-[11px]">Calculated Tax (GST 18%):</td>
                      <td className="p-2.5 text-right font-mono text-slate-300">{selectedInvoice.tax || '$0'}</td>
                    </tr>
                    <tr className="bg-white/3 font-bold text-slate-200">
                      <td colSpan={2} className="p-3 text-right text-[11px]">Grand Total Amount:</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">{selectedInvoice.amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Closing stamp */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="inline-flex items-center gap-1 text-indigo-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked & Verified Invoice Ledger Record
              </span>
              <span>Inv Link: {selectedInvoice.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* Auto Invoice Generation Glassmorphic Modal */}
      {showUploadModal && currentRole === 'Vendor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-white/15 shadow-2xl relative flex flex-col text-left">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/8 pb-2 mb-4 flex items-center gap-1.5">
              <CircleDollarSign className="w-4 h-4 text-indigo-400" />
              Generate Tax Invoice
            </h3>

            <form onSubmit={handleUploadInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Purchase Order Ref.</label>
                <select 
                  value={selectedPoId}
                  onChange={(e) => setSelectedPoId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input bg-slate-900 border-white/10 text-white"
                >
                  <option value="">-- Choose Contract --</option>
                  {vendorPOs.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.id} - Value: {po.value} (${po.itemName || 'Supplies'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPO && (
                <div className="p-3 rounded-lg bg-white/3 border border-white/5 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contract Subtotal:</span>
                    <strong className="text-slate-200 font-mono">{formatCurrency(calculatedSubtotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Calculated Tax (GST 18%):</span>
                    <span className="text-slate-400 font-mono">{formatCurrency(calculatedTax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 font-bold">
                    <span className="text-slate-400">Total Invoice Amount:</span>
                    <strong className="text-emerald-400 font-mono">{formatCurrency(calculatedTotal)}</strong>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Invoice Due Date</label>
                <input 
                  type="date" 
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors animate-pulse"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-all active:scale-95 cursor-pointer"
                  style={{ 
                    backgroundColor: theme.primary,
                    boxShadow: `0 0 10px ${theme.primary}40`
                  }}
                >
                  Generate & Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Email Sending Stepper Overlay */}
      {simulatedEmailInvoice && emailStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-white/15 bg-slate-900/95 shadow-2xl relative flex flex-col text-center space-y-4">
            
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              SMTP Invoice Dispatch Simulation
            </h4>
            <div className="text-xs text-slate-400 font-mono">
              Target ID: {simulatedEmailInvoice.id}
            </div>

            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              {emailStep < 4 ? (
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              )}

              <div className="w-full text-xs text-left bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-slate-300 space-y-2 h-[120px] overflow-y-auto">
                <div className={emailStep >= 1 ? "text-indigo-400" : "opacity-30"}>
                  [STEP 1] Packaging and encrypting invoice artifact... {emailStep >= 2 && "Done."}
                </div>
                <div className={emailStep >= 2 ? "text-indigo-400" : "opacity-30"}>
                  [STEP 2] Resolving smtp.vendorbridge.com mail server... {emailStep >= 3 && "Done."}
                </div>
                <div className={emailStep >= 3 ? "text-indigo-300" : "opacity-30"}>
                  [STEP 3] Dispatching mail to accounting & vendor... {emailStep >= 4 && "Sent."}
                </div>
                {emailStep >= 4 && (
                  <div className="text-emerald-400 font-bold animate-pulse">
                    [SUCCESS] Invoice successfully dispatched to accounting!
                  </div>
                )}
              </div>
            </div>

            {emailStep === 4 && (
              <button
                onClick={() => setSimulatedEmailInvoice(null)}
                className="w-full py-2 text-xs font-bold text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg transition-all cursor-pointer"
              >
                Close Simulation Screen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
