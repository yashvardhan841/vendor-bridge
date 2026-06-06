import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { 
  useRFQs, 
  useVendors, 
  addRFQ, 
  updateRFQ, 
  deleteRFQ, 
  addQuotation, 
  addActivityLog, 
  type RFQ 
} from '../db/db';
import { FilePlus2, Search, Edit2, Trash2, Send, X, Globe, Filter } from 'lucide-react';

export const RFQs: React.FC = () => {
  const { theme, currentRole, user } = useRole();
  const rfqs = useRFQs();
  const vendors = useVendors();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Modal State for Create/Edit
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetRfqId, setTargetRfqId] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [due, setDue] = useState('');
  const [dept, setDept] = useState('');
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);
  const [status, setStatus] = useState<RFQ['status']>('Draft');

  // Submit Bid Proposal Form State
  const [showBidModal, setShowBidModal] = useState(false);
  const [activeRFQ, setActiveRFQ] = useState<RFQ | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [bidNotes, setBidNotes] = useState('');

  // Extract unique departments for filters
  const uniqueDepts = Array.from(new Set(rfqs.map(r => r.dept))).filter(Boolean);

  // Role visibility logic
  const roleFilteredRFQs = rfqs.filter(rfq => {
    if (currentRole === 'Vendor') {
      // Vendors only see Published or Closed RFQs that they are assigned to
      return (
        (rfq.status === 'Published' || rfq.status === 'Closed') &&
        rfq.assignedVendors.includes(user.name)
      );
    }
    return true; // Admin, Procurement Officer, and Manager see everything
  });

  // Apply search query, status, and department filters
  const filteredRFQs = roleFilteredRFQs.filter(rfq => {
    const matchesSearch = 
      rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || rfq.status === statusFilter;
    const matchesDept = deptFilter === 'All' || rfq.dept === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const openCreateModal = () => {
    setIsEditing(false);
    setTargetRfqId(null);
    setTitle('');
    setDescription('');
    setItemName('');
    setQuantity(1);
    setDue('');
    setDept('');
    setAssignedVendors([]);
    setStatus('Draft');
    setShowFormModal(true);
  };

  const openEditModal = (rfq: RFQ) => {
    setIsEditing(true);
    setTargetRfqId(rfq.id);
    setTitle(rfq.title);
    setDescription(rfq.description);
    setItemName(rfq.itemName);
    setQuantity(rfq.quantity);
    setDue(rfq.due);
    setDept(rfq.dept);
    setAssignedVendors(rfq.assignedVendors);
    setStatus(rfq.status);
    setShowFormModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !itemName || !due || !dept) {
      alert('Please fill out all required fields.');
      return;
    }

    if (isEditing && targetRfqId) {
      // Edit mode
      updateRFQ(targetRfqId, {
        title,
        description,
        itemName,
        quantity,
        due,
        dept,
        assignedVendors,
        status,
      });

      addActivityLog({
        user: user.name,
        role: currentRole,
        action: 'RFQ Updated',
        details: `Updated details for RFQ ${targetRfqId} - "${title}" (${status}).`,
        category: 'procurement',
      });

      alert(`RFQ ${targetRfqId} updated successfully.`);
    } else {
      // Create mode
      const newRFQ = addRFQ({
        title,
        description,
        itemName,
        quantity,
        due,
        dept,
        assignedVendors,
        status,
      });

      addActivityLog({
        user: user.name,
        role: currentRole,
        action: 'RFQ Created',
        details: `Created new RFQ ${newRFQ.id} - "${title}" in state ${status}.`,
        category: 'procurement',
      });

      alert(`RFQ ${newRFQ.id} created successfully.`);
    }

    setShowFormModal(false);
  };

  const handlePublishDirect = (rfq: RFQ) => {
    updateRFQ(rfq.id, { status: 'Published' });
    addActivityLog({
      user: user.name,
      role: currentRole,
      action: 'RFQ Published',
      details: `Published RFQ ${rfq.id} - "${rfq.title}" to assigned vendors: ${rfq.assignedVendors.join(', ')}.`,
      category: 'procurement',
    });
    alert(`RFQ ${rfq.id} is now published and visible to assigned vendors!`);
  };

  const handleDeleteRFQ = (id: string, titleStr: string) => {
    if (confirm(`Are you sure you want to delete RFQ ${id}? This will also delete any submitted quotes.`)) {
      deleteRFQ(id);
      addActivityLog({
        user: user.name,
        role: currentRole,
        action: 'RFQ Deleted',
        details: `Deleted RFQ ${id} - "${titleStr}" and all its bid quotes.`,
        category: 'procurement',
      });
      alert(`RFQ ${id} deleted.`);
    }
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRFQ || !bidAmount || !leadTime) {
      alert('Please fill out all fields.');
      return;
    }

    const formattedAmount = bidAmount.startsWith('$') ? bidAmount : `$${Number(bidAmount).toLocaleString()}`;
    const compatibilityMatch = `${Math.floor(Math.random() * (99 - 80 + 1)) + 80}%`;

    const newQtn = addQuotation({
      rfqId: activeRFQ.id,
      vendor: user.name,
      amount: formattedAmount,
      leadTime: `${leadTime} days`,
      notes: bidNotes || 'Standard bid proposal submission.',
      compatibility: compatibilityMatch,
      status: 'Under Review',
      isBestValue: false,
    });

    // Update RFQ status (keeps status as Published, indicating bids are ongoing)
    updateRFQ(activeRFQ.id, { status: 'Published' });

    addActivityLog({
      user: user.name,
      role: currentRole,
      action: 'Bid Proposal Submitted',
      details: `Vendor submitted bid proposal ${newQtn.id} value ${newQtn.amount} for RFQ ${activeRFQ.id}.`,
      category: 'transaction',
    });

    setActiveRFQ(null);
    setBidAmount('');
    setLeadTime('');
    setBidNotes('');
    setShowBidModal(false);
    alert('Bid proposal submitted successfully!');
  };

  const toggleVendorAssignment = (vendorName: string) => {
    if (assignedVendors.includes(vendorName)) {
      setAssignedVendors(prev => prev.filter(n => n !== vendorName));
    } else {
      setAssignedVendors(prev => [...prev, vendorName]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Header & Filters */}
      <div className="flex flex-col gap-4 p-4 rounded-xl glass-panel border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search RFQs by title, ID, item, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg glass-input"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {currentRole !== 'Vendor' && (
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-lg hover:bg-white/10 border transition-all active:scale-95 cursor-pointer"
                style={{ 
                  backgroundColor: `${theme.primary}20`,
                  borderColor: `${theme.primary}40`
                }}
              >
                <FilePlus2 className="w-4 h-4" />
                Create RFQ
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filters Row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Filters:</span>
          </div>

          {currentRole !== 'Vendor' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 text-[11px] rounded-md glass-input bg-slate-900 border-white/8 text-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2 py-1 text-[11px] rounded-md glass-input bg-slate-900 border-white/8 text-white focus:outline-none"
            >
              <option value="All">All Departments</option>
              {uniqueDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* RFQ Registry List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRFQs.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center rounded-2xl glass-panel border-white/8 text-slate-500 text-xs">
            No RFQs found matching search query and filters.
          </div>
        ) : (
          filteredRFQs.map((rfq) => (
            <div 
              key={rfq.id} 
              className="p-5 rounded-2xl glass-panel border-white/8 hover:border-white/12 transition-all flex flex-col justify-between"
            >
              <div className="text-left">
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{rfq.dept}</span>
                  <span 
                    className={`
                      px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                      ${rfq.status === 'Published' && 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}
                      ${rfq.status === 'Draft' && 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}
                      ${rfq.status === 'Closed' && 'bg-red-500/10 text-red-400 border border-red-500/20'}
                    `}
                  >
                    {rfq.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{rfq.title}</h3>
                <p className="text-[10px] text-slate-400 mt-1">ID: <strong className="text-slate-300 font-mono">{rfq.id}</strong></p>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">{rfq.description}</p>
                
                <div className="mt-4 p-3 rounded-lg bg-white/3 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Item Name:</span>
                    <span className="text-slate-200 font-semibold">{rfq.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Required Qty:</span>
                    <span className="text-slate-200 font-bold">{rfq.quantity.toLocaleString()} units</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5">
                <div className="grid grid-cols-2 gap-2 text-left mb-4 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold">Published</span>
                    <span className="text-[10px] font-semibold text-slate-300">{rfq.created}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold">Deadline</span>
                    <span className="text-[10px] font-semibold text-slate-300">{rfq.due}</span>
                  </div>
                </div>

                {/* Show Assigned Vendors list for Procurement Specialist/Managers */}
                {currentRole !== 'Vendor' && (
                  <div className="mb-4 text-left">
                    <span className="text-[9px] text-slate-500 block uppercase font-semibold mb-1">Assigned Vendors ({rfq.assignedVendors.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {rfq.assignedVendors.map((v, i) => (
                        <span key={i} className="text-[9px] bg-white/5 border border-white/8 text-slate-300 px-2 py-0.5 rounded">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons based on Role */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">{rfq.count} Bids submitted</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Actions for Procurement Specialists, Managers, and Admins */}
                    {currentRole !== 'Vendor' && (
                      <>
                        {rfq.status === 'Draft' && (
                          <button 
                            onClick={() => handlePublishDirect(rfq)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white rounded bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/35 transition-all cursor-pointer"
                          >
                            <Globe className="w-3 h-3" />
                            Publish
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(rfq)}
                          title="Edit RFQ"
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRFQ(rfq.id, rfq.title)}
                          title="Delete RFQ"
                          className="p-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* Actions for Vendors */}
                    {currentRole === 'Vendor' && rfq.status === 'Published' && (
                      <button 
                        onClick={() => {
                          setActiveRFQ(rfq);
                          setShowBidModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white rounded-lg hover:bg-white/10 border transition-all active:scale-95 cursor-pointer"
                        style={{ 
                          backgroundColor: `${theme.primary}20`,
                          borderColor: `${theme.primary}40`
                        }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit Proposal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit RFQ Glassmorphic Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-white/15 shadow-2xl relative flex flex-col text-left my-8">
            <button 
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/8 pb-2 mb-4">
              {isEditing ? 'Edit Request for Quotation' : 'Create Request for Quotation'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">RFQ Title*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Precision CNC Machined Components"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Department*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Operations, Production, IT"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description*</label>
                <textarea 
                  required
                  placeholder="Detailed requirement details, compliance demands, packaging notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Item Specification*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. CNC Aluminum Cast Grade A"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Required Quantity*</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    placeholder="e.g. 250"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Deadline Date*</label>
                  <input 
                    type="date" 
                    required
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Initial Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RFQ['status'])}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input bg-slate-900 border-white/10 text-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Assigned Vendors Multi-select checklist */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Assign Vendors ({assignedVendors.length} selected)</label>
                <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-white/5 border border-white/8">
                  {vendors.map(v => (
                    <label key={v.id} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={assignedVendors.includes(v.name)}
                        onChange={() => toggleVendorAssignment(v.name)}
                        className="rounded text-indigo-500 bg-slate-900 border-white/10"
                      />
                      <span>{v.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
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
                  {isEditing ? 'Save Changes' : 'Confirm & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Bid Proposal Modal (Vendor Role) */}
      {showBidModal && activeRFQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-white/15 shadow-2xl relative flex flex-col text-left">
            <button 
              onClick={() => {
                setActiveRFQ(null);
                setShowBidModal(false);
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/8 pb-2 mb-2">
              Submit Bid Proposal
            </h3>
            <p className="text-[10px] text-slate-400 mb-4 leading-normal">
              Bidding for: <strong className="text-slate-200">{activeRFQ.title}</strong> ({activeRFQ.id})
            </p>

            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Proposal Value ($ USD)</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 45000"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Estimated Lead Time (Days)</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 5"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Proposal Remarks / Notes</label>
                <textarea 
                  placeholder="Specify warranty terms, shipping rules, packing specs, etc..."
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setActiveRFQ(null);
                    setShowBidModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
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
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
