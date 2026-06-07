import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { 
  usePurchaseOrders, 
  useQuotations, 
  useRFQs,
  useVendors,
  addPurchaseOrder, 
  addActivityLog,
  type PurchaseOrder
} from '../db/db';
import { Search, ExternalLink, Printer, Plus, FileSpreadsheet, X, Building, Mail, Phone, FileText, CheckCircle2 } from 'lucide-react';

export const PurchaseOrders: React.FC = () => {
  const { currentRole, user } = useRole();
  const pos = usePurchaseOrders();
  const quotations = useQuotations();
  const rfqs = useRFQs();
  const vendors = useVendors();
  const [searchQuery, setSearchQuery] = useState('');

  // Selected PO for preview modal
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Check if current role is an internal team member (not a vendor)
  const isInternal = currentRole === 'Admin' || currentRole === 'Procurement Officer' || currentRole === 'Manager';

  // Filter approved quotations that don't have a PO generated yet
  const approvedQuotesPendingPO = quotations.filter(q => {
    if (q.status !== 'Accepted') return false;
    // Check if PO exists with this quotation reference
    const poExists = pos.some(po => po.quoteId === q.id);
    return !poExists;
  });

  // Filter based on role (Vendors only see their own POs)
  const roleFilteredPOs = pos.filter(po => {
    if (currentRole === 'Vendor') {
      return po.vendor === user.name;
    }
    return true;
  });

  const filteredPOs = roleFilteredPOs.filter(
    (po) =>
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGeneratePO = (quote: typeof quotations[0]) => {
    try {
      // Find matching RFQ for item details
      const rfq = rfqs.find(r => r.id === quote.rfqId);

      const newPO = addPurchaseOrder({
        vendor: quote.vendor,
        value: quote.amount,
        delivery: 'Pending',
        billing: 'Unpaid',
        quoteId: quote.id,
        rfqId: quote.rfqId,
        itemName: rfq ? rfq.itemName : 'Procured Supplies',
        quantity: rfq ? rfq.quantity : 1,
        description: rfq ? rfq.description : 'Contract deliverables sourced through standard bid comparison.'
      });

      addActivityLog({
        user: user.name,
        role: currentRole,
        action: 'Purchase Order Issued',
        details: `Issued Purchase Order Contract ${newPO.id} for Approved Bid ${quote.id} (${quote.vendor}) value ${quote.amount}.`,
        category: 'transaction'
      });

      alert(`Purchase Order ${newPO.id} successfully generated for ${quote.vendor}!`);
    } catch (e) {
      console.error(e);
      alert('Error generating Purchase Order.');
    }
  };

  const handlePrintPO = (po: PurchaseOrder) => {
    // Lookup vendor details
    const vendorInfo = vendors.find(v => v.name === po.vendor);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups to print.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Purchase Order ${po.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: -0.5px; }
            .po-meta { text-align: right; font-size: 13px; color: #475569; }
            .po-meta strong { color: #0f172a; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.5px; }
            .address-info { font-size: 13px; color: #334155; line-height: 1.6; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .items-table th { background: #f8fafc; font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            .items-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .total-row { font-weight: bold; background: #f8fafc; }
            .footer { margin-top: 80px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 60px; font-size: 13px; }
            .sig-line { border-top: 1px dashed #cbd5e1; margin-top: 50px; padding-top: 8px; text-align: center; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">VENDORBRIDGE CORPORATE</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; letter-spacing: 0.3px;">Enterprise Resource Ledger</div>
            </div>
            <div class="po-meta">
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">PURCHASE ORDER</div>
              <div>PO Reference: <strong>${po.id}</strong></div>
              <div>Issue Date: <strong>${po.issued}</strong></div>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-title">Issued By (Buyer)</div>
              <div class="address-info">
                <strong>VendorBridge Corporate Ltd.</strong><br/>
                100 Corporate Parkway, Tech Suite 500<br/>
                San Francisco, CA 94105<br/>
                Email: procurement@vendorbridge.com
              </div>
            </div>
            <div>
              <div class="section-title">Supplier Partner</div>
              <div class="address-info">
                <strong>${po.vendor}</strong><br/>
                Email: ${vendorInfo?.email || 'contact@supplier.com'}<br/>
                Phone: ${vendorInfo?.phone || 'N/A'}<br/>
                GSTIN: ${vendorInfo?.gstNumber || 'N/A'}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description / Procurement Specification</th>
                <th style="text-align: right; width: 100px;">Quantity</th>
                <th style="text-align: right; width: 150px;">Total Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style="color: #0f172a;">${po.itemName || 'Industrial Procurement Materials'}</strong><br/>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${po.description || 'Standard contract deliverables.'}</div>
                </td>
                <td style="text-align: right; font-weight: 600;">${po.quantity || 1}</td>
                <td style="text-align: right; font-weight: bold; color: #0f172a;">${po.value}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">Total Amount Committed:</td>
                <td style="text-align: right; color: #0f172a; font-size: 14px; font-weight: 800;">${po.value}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #64748b; margin-top: 20px; line-height: 1.6;">
            <strong>Compliance Terms:</strong> Payment terms are Net 30 upon presentation of complying billing invoices matching the PO value. Deliveries must comply with item specifications detailed in RFQ requirements.
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">Prepared By (Procurement Rep)</div>
            </div>
            <div>
              <div class="sig-line">Authorized Signatory (Manager / VP)</div>
            </div>
          </div>

          <div class="footer">
            This is an automated governance document generated through VendorBridge ERP.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Find vendor details for selected PO modal
  const selectedPOVendor = selectedPO ? vendors.find(v => v.name === selectedPO.vendor) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl glass-panel border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter POs by number or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg glass-input"
          />
        </div>
        
        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
          {currentRole === 'Vendor' 
            ? `Vendor Portal: ${user.name} Contracts` 
            : 'ERP Ledger: Active PO Contracts'}
        </span>
      </div>

      {/* Bids Awaiting Contract Release (Pending PO Generation) - Only visible for internal roles */}
      {isInternal && approvedQuotesPendingPO.length > 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-indigo-500/20 bg-indigo-500/5 space-y-4 text-left">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Approved Bids Awaiting Contract Release
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                The following quotations have been signed off by management and are ready to be converted into active Purchase Order agreements.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse bg-slate-900/60">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bid Ref</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">RFQ Ref</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Partner</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Days</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Contract Value</th>
                  <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {approvedQuotesPendingPO.map((quote) => (
                  <tr key={quote.id} className="hover:bg-white/3 transition-colors">
                    <td className="p-3 text-xs font-mono text-white">{quote.id}</td>
                    <td className="p-3 text-xs font-mono text-slate-400">{quote.rfqId}</td>
                    <td className="p-3 text-xs text-slate-300 font-semibold">{quote.vendor}</td>
                    <td className="p-3 text-xs text-slate-400">{quote.leadTime}</td>
                    <td className="p-3 text-xs text-right text-emerald-400 font-bold">{quote.amount}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleGeneratePO(quote)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Generate PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO List Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Order</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Partner</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Order Value</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Issue Date</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fulfillment</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Billing</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po, idx) => (
                  <tr key={po.id || idx} className="hover:bg-white/2 transition-colors">
                    {/* PO ID */}
                    <td className="p-4">
                      <span className="text-xs font-semibold text-white block font-mono">{po.id}</span>
                      {po.quoteId && (
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Bid Ref: {po.quoteId}</span>
                      )}
                    </td>
                    {/* Vendor */}
                    <td className="p-4">
                      <span className="text-xs text-slate-300">{po.vendor}</span>
                    </td>
                    {/* Value */}
                    <td className="p-4">
                      <span className="text-xs font-bold text-white">{po.value}</span>
                    </td>
                    {/* Issued */}
                    <td className="p-4">
                      <span className="text-xs text-slate-400">{po.issued}</span>
                    </td>
                    {/* Delivery Status */}
                    <td className="p-4">
                      <span 
                        className={`
                          inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                          ${po.delivery === 'Delivered' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}
                          ${po.delivery === 'Shipped' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}
                          ${po.delivery === 'Pending' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                        `}
                      >
                        {po.delivery}
                      </span>
                    </td>
                    {/* Billing Status */}
                    <td className="p-4">
                      <span 
                        className={`
                          inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                          ${po.billing === 'Paid' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}
                          ${po.billing === 'Unpaid' && 'bg-red-500/10 text-red-400 border border-red-500/20'}
                        `}
                      >
                        {po.billing}
                      </span>
                    </td>
                    {/* Print / View */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handlePrintPO(po)}
                          title="Print PO Document"
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setSelectedPO(po)}
                          title="View PO Details"
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-3xl w-full rounded-2xl solid-panel shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono block">CONTRACT AGGREMENT</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Purchase Order: <span className="font-mono text-indigo-300">{selectedPO.id}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintPO(selectedPO)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-all text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedPO(null)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document States Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 rounded-xl bg-white/3 border border-white/5 text-xs">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Issue Date</span>
                <strong className="text-slate-200 mt-0.5 block">{selectedPO.issued}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Committed Value</span>
                <strong className="text-emerald-400 mt-0.5 block font-mono font-bold">{selectedPO.value}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Fulfillment</span>
                <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border
                  ${selectedPO.delivery === 'Delivered' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                  ${selectedPO.delivery === 'Shipped' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                  ${selectedPO.delivery === 'Pending' && 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}
                >
                  {selectedPO.delivery}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Billing Status</span>
                <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border
                  ${selectedPO.billing === 'Paid' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                  ${selectedPO.billing === 'Unpaid' && 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                >
                  {selectedPO.billing}
                </span>
              </div>
            </div>

            {/* Address Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-white/8 py-5">
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                  <Building className="w-3 h-3 text-indigo-400" /> Issued By (Buyer)
                </span>
                <div className="text-slate-300 space-y-1 bg-white/2 p-3 rounded-xl border border-white/5">
                  <strong className="text-white block">VendorBridge Corporate Ltd.</strong>
                  <div>100 Corporate Parkway, Tech Suite 500</div>
                  <div>San Francisco, CA 94105</div>
                  <div className="text-indigo-300 font-semibold mt-1">procurement@vendorbridge.com</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                  <Building className="w-3 h-3 text-indigo-400" /> Supplier Partner (Vendor)
                </span>
                <div className="text-slate-300 space-y-1 bg-white/2 p-3 rounded-xl border border-white/5">
                  <strong className="text-white block">{selectedPO.vendor}</strong>
                  {selectedPOVendor ? (
                    <>
                      <div className="flex items-center gap-1 text-[11px] mt-1 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {selectedPOVendor.email}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {selectedPOVendor.phone}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        GSTIN: <span className="text-slate-400">{selectedPOVendor.gstNumber}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 italic">No vendor info found in database</div>
                  )}
                </div>
              </div>
            </div>

            {/* Item specifications details */}
            <div className="space-y-3">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Procurement Deliverables
              </span>
              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/3 text-slate-400 font-bold uppercase">
                      <th className="p-3 text-left">Item Name / Description</th>
                      <th className="p-3 text-center w-[100px]">Qty</th>
                      <th className="p-3 text-right w-[150px]">Committed Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="p-3">
                        <strong className="text-white block">{selectedPO.itemName || 'Industrial Procurement Materials'}</strong>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed">
                          {selectedPO.description || 'Deliverables sourced through verified bidding and comparative compliance reviews.'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-300 font-bold">{selectedPO.quantity || 1}</td>
                      <td className="p-3 text-right text-emerald-400 font-mono font-bold">{selectedPO.value}</td>
                    </tr>
                    <tr className="bg-white/3 font-bold text-slate-300">
                      <td colSpan={2} className="p-3 text-right">Total Payable Amount:</td>
                      <td className="p-3 text-right text-white font-mono font-bold">{selectedPO.value}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms & compliance notes */}
            <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed border-t border-white/8 pt-4">
              <span className="font-bold text-slate-400 block uppercase tracking-wider">Terms & Legal Clauses:</span>
              <p>
                1. This contract is issued in accordance with VendorBridge ERP compliance regulations. Vendor agrees to fulfill the item specifications at the declared pricing.
              </p>
              <p>
                2. Payments are strictly scheduled on Net 30 conditions upon invoice clearance on the Accounts Payable ledger. Disputes log releases are monitored.
              </p>
            </div>

            {/* Footer Signoff */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified ERP Signature Released
              </div>
              <div>PO Ref: {selectedPO.id}</div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
