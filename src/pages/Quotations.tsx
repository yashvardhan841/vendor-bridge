import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { 
  useQuotations, 
  useRFQs, 
  useVendors,
  updateQuotation, 
  addApproval, 
  addActivityLog, 
  type Quotation 
} from '../db/db';
import { ArrowLeftRight, Check, X, Star } from 'lucide-react';

export const Quotations: React.FC = () => {
  const { currentRole, user } = useRole();
  const quotations = useQuotations();
  const rfqs = useRFQs();
  const vendors = useVendors();

  // Sorting State
  const [sortBy, setSortBy] = useState<'compatibility' | 'price' | 'delivery'>('compatibility');

  // Find RFQs that have bids submitted
  const rfqsWithBids = rfqs.filter(r => r.count > 0);
  const [selectedRfqId, setSelectedRfqId] = useState(
    rfqsWithBids.length > 0 ? rfqsWithBids[0].id : 'RFQ-2026-089'
  );

  // Filter quotes for selected RFQ
  const currentRfqQuotes = quotations.filter(q => q.rfqId === selectedRfqId);

  // Parsers for sorting & highlights
  const parseAmount = (amtStr: string): number => {
    return parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 0;
  };

  const parseDeliveryDays = (leadStr: string): number => {
    return parseInt(leadStr.replace(/[^0-9]/g, '')) || 999;
  };

  const getVendorRating = (vendorName: string): number => {
    const v = vendors.find(vend => vend.name === vendorName);
    return v ? v.rating : 4.0; // default fallback
  };

  // Find lowest price and fastest delivery quotes among reviewable quotes
  const activeReviewQuotes = currentRfqQuotes.filter(q => q.status === 'Under Review');

  const lowestPriceQuoteId = activeReviewQuotes.reduce<string | null>((lowestId, curr) => {
    if (!lowestId) return curr.id;
    const lowestQuote = activeReviewQuotes.find(q => q.id === lowestId)!;
    return parseAmount(curr.amount) < parseAmount(lowestQuote.amount) ? curr.id : lowestId;
  }, null);

  const fastestDeliveryQuoteId = activeReviewQuotes.reduce<string | null>((fastestId, curr) => {
    if (!fastestId) return curr.id;
    const fastestQuote = activeReviewQuotes.find(q => q.id === fastestId)!;
    return parseDeliveryDays(curr.leadTime) < parseDeliveryDays(fastestQuote.leadTime) ? curr.id : fastestId;
  }, null);

  // Apply sorting dynamically
  const sortedQuotes = [...currentRfqQuotes].sort((a, b) => {
    if (sortBy === 'price') {
      return parseAmount(a.amount) - parseAmount(b.amount);
    }
    if (sortBy === 'delivery') {
      return parseDeliveryDays(a.leadTime) - parseDeliveryDays(b.leadTime);
    }
    
    // Default compatibility (descending)
    const compA = parseInt(a.compatibility.replace(/[^0-9]/g, '')) || 0;
    const compB = parseInt(b.compatibility.replace(/[^0-9]/g, '')) || 0;
    return compB - compA;
  });

  const handleDecision = (quote: Quotation, action: 'Accepted' | 'Declined') => {
    try {
      if (action === 'Accepted') {
        // 1. Set quotation status to Pending Approval
        updateQuotation(quote.id, { status: 'Pending Approval' });

        // 2. Create Approval Task for the Quotation
        addApproval({
          type: 'Quotation',
          target: `Quotation ${quote.id} (${quote.vendor}) for ${quote.rfqId}`,
          requestor: user.name,
          value: quote.amount,
          quoteId: quote.id,
        });

        // 3. Log activity
        addActivityLog({
          user: user.name,
          role: currentRole,
          action: 'Quotation Submitted for Approval',
          details: `Submitted bid ${quote.id} from ${quote.vendor} for ${quote.rfqId} to the Manager Approval queue.`,
          category: 'procurement'
        });

        alert(`Bid ${quote.id} submitted for approval! Routed to the Manager Approvals portal.`);
      } else {
        // Decline this quote
        updateQuotation(quote.id, { status: 'Declined' });

        addActivityLog({
          user: user.name,
          role: currentRole,
          action: 'Quotation Bid Declined',
          details: `Declined bid ${quote.id} from ${quote.vendor} for ${quote.rfqId}.`,
          category: 'procurement'
        });

        alert(`Bid ${quote.id} declined.`);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred processing the bid decision.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Comparison Panel (RFQ Bids Side-by-Side) */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Bid Comparison Board
              </h3>
            </div>

            {/* RFQ Selector Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 uppercase font-semibold">Select RFQ:</span>
              <select
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-indigo-500/50 transition-all cursor-pointer outline-none"
              >
                {rfqs.map(rfq => (
                  <option className="bg-slate-800 text-white" key={rfq.id} value={rfq.id}>
                    {rfq.id} - {rfq.title.slice(0, 20)}... ({rfq.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Controls Bar */}
          {currentRfqQuotes.length > 0 && (
            <div className="flex flex-wrap gap-3 items-center text-xs pt-1 border-t border-white/5">
              <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Sort Bids:</span>
              <div className="flex gap-1.5 font-medium">
                <button 
                  onClick={() => setSortBy('compatibility')}
                  className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all border cursor-pointer
                    ${sortBy === 'compatibility' 
                      ? 'bg-white/10 text-white border-white/20' 
                      : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  Compatibility
                </button>
                <button 
                  onClick={() => setSortBy('price')}
                  className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all border cursor-pointer
                    ${sortBy === 'price' 
                      ? 'bg-white/10 text-white border-white/20' 
                      : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  Price
                </button>
                <button 
                  onClick={() => setSortBy('delivery')}
                  className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all border cursor-pointer
                    ${sortBy === 'delivery' 
                      ? 'bg-white/10 text-white border-white/20' 
                      : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  Delivery Time
                </button>
              </div>
            </div>
          )}
        </div>

        {sortedQuotes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No bids submitted for this RFQ yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedQuotes.map((quote) => {
              const isBest = quote.id === lowestPriceQuoteId;
              const isFastest = quote.id === fastestDeliveryQuoteId;
              return (
                <div 
                  key={quote.id} 
                  className={`
                    relative p-4 rounded-xl flex flex-col justify-between transition-all duration-200 border text-left
                    ${isBest && quote.status === 'Under Review'
                      ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5 shadow-2xl' 
                      : isFastest && quote.status === 'Under Review'
                      ? 'bg-blue-500/5 border-blue-500/20 shadow-blue-500/5 shadow-2xl'
                      : 'bg-white/3 border-white/5 hover:border-white/10'}
                  `}
                >
                  {/* Dynamic Highlights Badges */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    {isBest && quote.status === 'Under Review' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase border border-emerald-500/30">
                        Lowest Price
                      </span>
                    )}
                    {isFastest && quote.status === 'Under Review' && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-bold uppercase border border-blue-500/30">
                        Fastest Delivery
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">{quote.id}</span>
                    <h4 className="text-xs font-bold text-white mt-1">{quote.vendor}</h4>
                    
                    {/* Rating Lookup Renders */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-300">Rating:</span>
                      <span className="font-bold text-white">{getVendorRating(quote.vendor).toFixed(1)}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-2.5 h-2.5 ${i < Math.round(getVendorRating(quote.vendor)) ? 'fill-current' : 'opacity-25'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs border-t border-white/5 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Proposal Value</span>
                        <strong className="text-white">{quote.amount}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lead Time</span>
                        <span className="text-slate-300">{quote.leadTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Compatibility Match</span>
                        <span className="font-semibold text-emerald-400">{quote.compatibility}</span>
                      </div>
                      <div className="text-left mt-3 p-2 rounded bg-white/3 border border-white/5 text-[10px] text-slate-300 italic">
                        <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Vendor Remarks:</span>
                        {quote.notes}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span 
                      className={`
                        text-[9px] uppercase font-bold px-2 py-0.5 rounded-full
                        ${quote.status === 'Accepted' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}
                        ${quote.status === 'Pending Approval' && 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}
                        ${quote.status === 'Under Review' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                        ${quote.status === 'Declined' && 'bg-red-500/10 text-red-400 border border-red-500/20'}
                      `}
                    >
                      {quote.status}
                    </span>
                    
                    {/* Decision controls if procurement, manager or admin */}
                    {(currentRole === 'Procurement Officer' || currentRole === 'Manager' || currentRole === 'Admin') && quote.status === 'Under Review' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDecision(quote, 'Accepted')}
                          title="Select Winning Bid"
                          className="p-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 cursor-pointer animate-pulse"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDecision(quote, 'Declined')}
                          title="Reject Bid"
                          className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-500 italic">No decision actions</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quote Submissions Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 bg-white/3 text-left">
          <span className="text-xs font-bold text-white uppercase tracking-wider">All Submitted Quotes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-white/2">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quote Reference</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">RFQ Target</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rating</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks / Notes</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Value</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Time</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {quotations.map((q, idx) => (
                <tr key={q.id || idx} className="hover:bg-white/2 transition-colors">
                  <td className="p-4">
                    <span className="text-xs font-semibold text-white block">{q.id}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-300 font-mono">{q.rfqId}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-300">{q.vendor}</span>
                  </td>
                  <td className="p-4 text-xs">
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="font-bold text-white">{getVendorRating(q.vendor).toFixed(1)}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </div>
                  </td>
                  <td className="p-4 max-w-xs truncate text-[11px] text-slate-400 italic font-sans" title={q.notes}>
                    {q.notes}
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs font-bold text-white">{q.amount}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-400">{q.leadTime}</span>
                  </td>
                  <td className="p-4">
                    <span 
                      className={`
                        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                        ${q.status === 'Accepted' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}
                        ${q.status === 'Pending Approval' && 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}
                        ${q.status === 'Under Review' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                        ${q.status === 'Declined' && 'bg-red-500/10 text-red-400 border border-red-500/20'}
                      `}
                    >
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
