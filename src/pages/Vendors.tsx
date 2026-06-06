import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { 
  useVendors, 
  addVendor, 
  updateVendor, 
  deleteVendor, 
  addActivityLog, 
  type Vendor 
} from '../db/db';
import { Search, Plus, ShieldAlert, CheckCircle, AlertCircle, Edit2, Trash2, X, Star } from 'lucide-react';

export const Vendors: React.FC = () => {
  const { theme, currentRole, user } = useRole();
  const vendors = useVendors();

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Combined Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetVendorId, setTargetVendorId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(4.0);
  const [status, setStatus] = useState<Vendor['status']>('Pending Review');

  const openCreateModal = () => {
    setIsEditing(false);
    setTargetVendorId(null);
    setName('');
    setCategory('');
    setGstNumber('');
    setEmail('');
    setPhone('');
    setRating(4.0);
    setStatus('Pending Review');
    setShowModal(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setIsEditing(true);
    setTargetVendorId(vendor.id);
    setName(vendor.name);
    setCategory(vendor.category);
    setGstNumber(vendor.gstNumber);
    setEmail(vendor.email);
    setPhone(vendor.phone);
    setRating(vendor.rating);
    setStatus(vendor.status);
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !gstNumber || !email || !phone) {
      alert('Please fill out all required fields.');
      return;
    }

    if (isEditing && targetVendorId) {
      // Edit Vendor
      updateVendor(targetVendorId, {
        name,
        category,
        gstNumber,
        email,
        phone,
        rating: Number(rating),
        status,
      });

      addActivityLog({
        user: user.name,
        role: currentRole,
        action: 'Vendor Profile Updated',
        details: `Updated registry details for vendor "${name}" (ID: ${targetVendorId}, Status: ${status}).`,
        category: 'procurement',
      });

      alert(`Vendor profile for ${name} updated.`);
    } else {
      // Add Vendor
      const newVendor = addVendor({
        name,
        category,
        gstNumber,
        email,
        phone,
        rating: Number(rating),
        status,
      });

      addActivityLog({
        user: user.name,
        role: currentRole,
        action: 'Vendor Registered',
        details: `Registered new vendor partner "${newVendor.name}" (ID: ${newVendor.id}, Category: ${newVendor.category}).`,
        category: 'procurement',
      });

      alert(`New vendor partner ${name} registered successfully.`);
    }

    setShowModal(false);
  };

  const handleDeleteVendor = (id: string, nameStr: string) => {
    if (confirm(`Are you sure you want to delete vendor "${nameStr}" (ID: ${id}) from the registry?`)) {
      deleteVendor(id);

      addActivityLog({
        user: user.name,
        role: currentRole,
        action: 'Vendor Deleted',
        details: `Removed vendor partner "${nameStr}" (ID: ${id}) from system registry.`,
        category: 'procurement',
      });

      alert(`Vendor ${nameStr} deleted.`);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.gstNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl glass-panel border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, category, GST, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg glass-input"
          />
        </div>
        
        {/* Only Admin, Procurement Officer or Manager can manage vendors */}
        {currentRole !== 'Vendor' ? (
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-lg hover:bg-white/10 border transition-all active:scale-95 cursor-pointer"
            style={{ 
              backgroundColor: `${theme.primary}20`,
              borderColor: `${theme.primary}40`
            }}
          >
            <Plus className="w-4 h-4" />
            Add New Vendor
          </button>
        ) : (
          <span className="text-[10px] text-slate-500 italic">Vendor console: Registry view only</span>
        )}
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl glass-panel border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Partner</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">GST Number</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Details</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Rating</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance</th>
                {currentRole !== 'Vendor' && (
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={currentRole !== 'Vendor' ? 7 : 6} className="p-8 text-center text-xs text-slate-500">
                    No vendors found matching search query.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor, idx) => (
                  <tr key={vendor.id || idx} className="hover:bg-white/2 transition-colors">
                    {/* Partner Name */}
                    <td className="p-4">
                      <span className="text-xs font-semibold text-white block">{vendor.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {vendor.id}</span>
                    </td>
                    {/* Category */}
                    <td className="p-4">
                      <span className="text-xs text-slate-300">{vendor.category}</span>
                    </td>
                    {/* GST Number */}
                    <td className="p-4 font-mono text-xs text-slate-300">
                      {vendor.gstNumber}
                    </td>
                    {/* Contact Details */}
                    <td className="p-4 text-xs space-y-0.5">
                      <span className="block text-slate-300 select-all">{vendor.email}</span>
                      <span className="block text-slate-500 font-mono">{vendor.phone}</span>
                    </td>
                    {/* Performance Rating */}
                    <td className="p-4">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-xs font-bold text-white">{vendor.rating.toFixed(1)}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.round(vendor.rating) ? 'fill-current' : 'opacity-25'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    {/* Compliance Status Badge */}
                    <td className="p-4">
                      <span 
                        className={`
                          inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold
                          ${vendor.status === 'Compliant' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}
                          ${vendor.status === 'Pending Review' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                          ${vendor.status === 'Suspended' && 'bg-red-500/10 text-red-400 border border-red-500/20'}
                        `}
                      >
                        {vendor.status === 'Compliant' && <CheckCircle className="w-3.5 h-3.5" />}
                        {vendor.status === 'Pending Review' && <AlertCircle className="w-3.5 h-3.5" />}
                        {vendor.status === 'Suspended' && <ShieldAlert className="w-3.5 h-3.5" />}
                        {vendor.status}
                      </span>
                    </td>
                    {/* Actions Panel */}
                    {currentRole !== 'Vendor' && (
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(vendor)}
                            title="Edit Profile"
                            className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                            title="Delete Vendor"
                            className="p-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Vendor Glassmorphic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-white/15 shadow-2xl relative flex flex-col text-left">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/8 pb-2 mb-4">
              {isEditing ? 'Edit Vendor Profile' : 'Register Vendor Partner'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Company Name*</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Acme Industries Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category / Domain*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Chemicals, Steel"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">GST Identification Number*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 27AAPCA8822A1Z5"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Contact Email*</label>
                  <input 
                    type="email" 
                    required
                    placeholder="vendor@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Contact Phone*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Compliance Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Vendor['status'])}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-indigo-500/50 transition-all cursor-pointer outline-none"
                  >
                    <option className="bg-slate-800 text-white" value="Compliant">Compliant</option>
                    <option className="bg-slate-800 text-white" value="Pending Review">Pending Review</option>
                    <option className="bg-slate-800 text-white" value="Suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rating Rating ({rating.toFixed(1)} / 5.0)</label>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="5.0"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full mt-2 accent-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
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
                  {isEditing ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
