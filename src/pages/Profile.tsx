import React, { useState, useRef } from 'react';
import { useRole } from '../context/RoleContext';
import { addActivityLog } from '../db/db';
import { 
  Mail, 
  Building, 
  Calendar, 
  Hash, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, theme, updateUserProfile } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states initialized from active user context
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');
  const [profileImage, setProfileImage] = useState(user.profileImage);
  
  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle local image file upload and conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (limit to 2MB for localStorage)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick validation
    if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
      setError('Please enter a valid phone number.');
      return;
    }
    setError(null);
    setIsSaving(true);

    // Simulate database write delay
    setTimeout(() => {
      // 1. Update session state and localStorage seeder profiles
      updateUserProfile({
        phone,
        address,
        profileImage
      });

      // 2. Audit Trail Logging
      addActivityLog({
        user: user.name,
        role: user.role,
        action: 'Profile Details Updated',
        details: `Updated profile contact information: phone: ${phone || 'N/A'}, address: ${address ? address.substring(0, 25) + '...' : 'N/A'}.`,
        category: 'security'
      });

      setIsSaving(false);
      setShowToast(true);

      // Auto-hide toast notification after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="text-left">
          <h2 className="text-xl font-bold text-white tracking-tight md:text-2xl">My Profile</h2>
          <p className="text-[11px] text-slate-500 mt-1">Manage user contact details, corporate identity card, and profile photo settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: ERP Identity Badge Summary */}
        <div className="lg:col-span-1 rounded-2xl glass-panel border border-white/8 p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Subtle background glow matching active theme */}
          <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ backgroundColor: theme.primary }} />
          
          <div className="space-y-6 w-full flex flex-col items-center z-10">
            {/* Avatar Frame with Hover Edit Overlay */}
            <div className="relative group cursor-pointer" onClick={triggerFileInput}>
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-white/20 transition-all duration-300 shadow-xl relative">
                <img 
                  src={profileImage} 
                  alt={user.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Hover overlay mask */}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change Photo</span>
                </div>
              </div>

              {/* Float badge camera trigger */}
              <button 
                type="button"
                className="absolute bottom-1 right-1 p-2 rounded-full bg-slate-900 border border-white/15 text-slate-300 group-hover:text-white transition-colors shadow-lg"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hidden native file upload input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Profile TitleStack */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white leading-tight">{user.name}</h3>
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${theme.badgeClass}`}>
                {user.role}
              </span>
            </div>

            <div className="border-t border-white/5 w-full my-4"></div>

            {/* Read-Only Corporate Fields */}
            <div className="w-full space-y-3.5 text-left text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Employee ID</span>
                </div>
                <span className="font-mono font-bold text-slate-200">{user.employeeId}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Corporate Email</span>
                </div>
                <span className="text-slate-200 select-all truncate max-w-[150px]">{user.email}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                  <span>Department</span>
                </div>
                <span className="text-slate-200 font-semibold">{user.department}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joining Date</span>
                </div>
                <span className="text-slate-200">{user.joiningDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Card Details */}
        <div className="lg:col-span-2 rounded-2xl glass-panel border border-white/8 p-6 text-left relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ backgroundColor: theme.primary }} />

          <form onSubmit={handleSave} className="space-y-6 z-10 relative">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Contact Details</h4>
              <p className="text-[10px] text-slate-500">Update your reachable contact details saved in the corporate employee directory</p>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Phone Number
                </label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full glass-input"
                />
              </div>

              {/* Address Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Physical Address
                </label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, Suite/Apartment, City, State, ZIP Code"
                  rows={4}
                  className="w-full glass-input resize-none py-3"
                />
              </div>
            </div>

            <div className="border-t border-white/5 pt-5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Last Synced with local storage cache</span>
              
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer disabled:opacity-50"
                style={{ 
                  backgroundColor: theme.primary,
                  boxShadow: `0 4px 14px rgba(${theme.primary.startsWith('#') ? parseInt(theme.primary.slice(1,3), 16) : 99}, ${theme.primary.startsWith('#') ? parseInt(theme.primary.slice(3,5), 16) : 102}, ${theme.primary.startsWith('#') ? parseInt(theme.primary.slice(5,7), 16) : 241}, 0.2)`
                }}
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Glassmorphic Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel border border-emerald-500/25 bg-slate-950/90 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white">Profile Saved Successfully</div>
            <div className="text-[10px] text-slate-400">Database synchronization complete.</div>
          </div>
        </div>
      )}
    </div>
  );
};
