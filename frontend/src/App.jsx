import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyPending from './pages/VerifyPending';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';

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
          <Route path="/dashboard" element={<Dashboard />} />
          
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
