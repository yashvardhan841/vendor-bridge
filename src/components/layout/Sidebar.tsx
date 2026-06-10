import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  FileText,
  CheckSquare,
  ShoppingBag,
  Receipt,
  History,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { theme, currentRole } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Vendors', path: '/vendors', icon: Users },
    { name: 'RFQs', path: '/rfqs', icon: FileQuestion },
    { name: 'Quotations', path: '/quotations', icon: FileText },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingBag },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Activity Logs', path: '/activity-logs', icon: History },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  const sidebarClasses = `
    fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out solid-sidebar
    ${isCollapsed ? 'w-20' : 'w-64'} 
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 solid-overlay md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/8">
          <div className="flex items-center gap-2 overflow-hidden">
            <div 
              className="flex items-center justify-center p-2.5 rounded-lg bg-white/5 border border-white/10"
              style={{ boxShadow: `0 0 15px -3px ${theme.primary}40` }}
            >
              <Shield className="w-5 h-5" style={{ color: theme.primary }} />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50">
                Vendor<span style={{ color: theme.primary }}>Bridge</span>
              </span>
            )}
          </div>
          
          {/* Collapse Button (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/5 text-slate-400 hover:text-white border border-white/5"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Role Badge */}
        <div className={`p-4 border-b border-white/8 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div 
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide
              ${theme.badgeClass}
            `}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {!isCollapsed && <span>{currentRole}</span>}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${isActive 
                    ? 'bg-white/10 text-white border-l-2' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}
                `}
                style={({ isActive }) => 
                  isActive ? { borderLeftColor: theme.primary } : {}
                }
              >
                <Icon 
                  className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" 
                  style={{ minWidth: '20px' }}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
