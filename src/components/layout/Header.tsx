import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { Bell, Search, Menu, LogOut, User, ChevronDown } from 'lucide-react';

interface HeaderProps {
  setIsMobileOpen: (open: boolean) => void;
}

interface MockNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
}

const mockNotificationsByRole: Record<string, MockNotification[]> = {
  Admin: [
    { id: '1', title: 'System Backup Complete', desc: 'Full automated DB backup was successful.', time: '10m ago', type: 'success', read: false },
    { id: '2', title: 'High API Latency Alert', desc: 'Latency spike detected in Auth Gateway.', time: '1h ago', type: 'warning', read: false },
    { id: '3', title: 'New Registration Requested', desc: 'Vendor "Vertex Ltd" applied for portal access.', time: '3h ago', type: 'info', read: true },
  ],
  'Procurement Officer': [
    { id: '1', title: 'New Quotation Received', desc: 'Apex Solutions submitted a bid for RFQ-2026-089.', time: '5m ago', type: 'info', read: false },
    { id: '2', title: 'RFQ Deadline Tomorrow', desc: 'RFQ-2026-074 is closing in 24 hours.', time: '2h ago', type: 'warning', read: false },
    { id: '3', title: 'PO-2026-441 Approved', desc: 'Purchase Order has been approved by Elena.', time: '1d ago', type: 'success', read: true },
  ],
  Vendor: [
    { id: '1', title: 'RFQ Awarded!', desc: 'Congratulations! Your bid for RFQ-2026-062 has been accepted.', time: '15m ago', type: 'success', read: false },
    { id: '2', title: 'Invoice Paid', desc: 'Payment for Invoice INV-8822 has been processed.', time: '4h ago', type: 'info', read: false },
    { id: '3', title: 'Clarification Needed', desc: 'James requested details on RFQ-2026-089 line items.', time: '2d ago', type: 'warning', read: true },
  ],
  Manager: [
    { id: '1', title: 'Approval Required', desc: 'PO-2026-455 ($125,000) requires your signature.', time: '2m ago', type: 'warning', read: false },
    { id: '2', title: 'Quarterly Target Reached', desc: 'Procurement savings target hit 104% this month.', time: '3h ago', type: 'success', read: false },
    { id: '3', title: 'Contract Expiring', desc: 'Titan Group vendor agreement expires in 30 days.', time: '1d ago', type: 'info', read: true },
  ],
};

export const Header: React.FC<HeaderProps> = ({ setIsMobileOpen }) => {
  const { user, theme, currentRole, logout } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Guard to ensure user is non-null for subsequent renders
  if (!user) return null;
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load role-specific notifications
  useEffect(() => {
    setNotifications(mockNotificationsByRole[currentRole] || []);
  }, [currentRole]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Page Title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const formatted = path.substring(1).replace('-', ' ');
    return formatted.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b md:px-6 solid-header">
      {/* Left section: Drawer trigger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center justify-center p-2 text-slate-400 rounded-lg md:hidden hover:bg-white/5 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right section: Search, notifications, and profile */}
      <div className="flex items-center gap-4">
        {/* Search Bar - hidden on tiny mobile screen */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions, RFQs, invoices..."
            className="w-64 pl-9 pr-4 py-2 text-xs rounded-full glass-input"
          />
        </div>

        {/* Notifications Icon with dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 rounded-full hover:bg-white/5 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span 
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 border border-white"
                style={{ backgroundColor: theme.primary }}
              />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl solid-panel shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] hover:underline"
                    style={{ color: theme.primary }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="mt-1 space-y-1 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`
                        p-3 rounded-lg text-left transition-colors duration-150
                        ${notif.read ? 'opacity-60 hover:bg-white/5' : 'bg-white/5 hover:bg-white/10'}
                      `}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-xs font-semibold text-white ${!notif.read ? 'font-bold' : ''}`}>
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{notif.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative flex items-center" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
            }}
            className="flex items-center gap-3 p-1 px-2.5 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 text-left transition-all cursor-pointer"
          >
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shadow-lg"
            />
            <div className="hidden md:block pr-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white leading-none">{user.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${theme.badgeClass}`}>
                  {user.role}
                </span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1 leading-none">ID: {user.employeeId}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 mt-2 w-60 rounded-xl solid-panel shadow-2xl p-2.5 z-50 text-left">
              <div className="px-3 py-2 border-b border-white/8">
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[9px] font-mono text-slate-500 mt-0.5">Emp ID: {user.employeeId}</div>
                <div className="text-[10px] text-slate-400 truncate mt-1">{user.email}</div>
              </div>
              <div className="py-1 space-y-0.5">
                <button 
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  My Profile
                </button>
                
                 <div className="border-t border-white/8 my-1"></div>
                
                <button 
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
