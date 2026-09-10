import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyPending from './pages/VerifyPending';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SecurityAnalyticsDashboard from './pages/SecurityAnalyticsDashboard';
import ComingSoon from './pages/ComingSoon';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import SuspiciousActivity from './pages/SuspiciousActivity';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Base routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-pending" element={<VerifyPending />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Main dashboard = Security Analytics Overview */}
          <Route path="/dashboard" element={<SecurityAnalyticsDashboard />} />
          <Route path="/analytics" element={<SecurityAnalyticsDashboard />} />
          
          {/* Vault / Password Manager */}
          <Route path="/vault" element={<Dashboard />} />
          
          {/* Active Data Modules */}
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/suspicious-activity" element={<SuspiciousActivity />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Reports feature */}
          <Route path="/reports" element={<Reports />} />
          
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
