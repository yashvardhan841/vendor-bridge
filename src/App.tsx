import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider, useRole } from './context/RoleContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Import Pages
import { Dashboard } from './pages/Dashboard';
import { Vendors } from './pages/Vendors';
import { RFQs } from './pages/RFQs';
import { Quotations } from './pages/Quotations';
import { Approvals } from './pages/Approvals';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Invoices } from './pages/Invoices';
import { ActivityLogs } from './pages/ActivityLogs';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useRole();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated } = useRole();

  // If unauthenticated, render the children directly (Login page) without sidebar, header or switcher
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen transition-all duration-300">
        <Header setIsMobileOpen={setIsMobileOpen} />
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto z-10">
          {children}
        </main>
      </div>

    </div>
  );
};

function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <LayoutWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            <Route path="/rfqs" element={<ProtectedRoute><RFQs /></ProtectedRoute>} />
            <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
            <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutWrapper>
      </BrowserRouter>
    </RoleProvider>
  );
}

export default App;
