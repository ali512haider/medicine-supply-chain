import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import VerifyProduct from './pages/VerifyProduct';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { account, role, status } = useWeb3();

  if (status === 'idle' || status === 'connecting') {
    return <div className="container page-content">Loading... Please connect your wallet.</div>;
  }

  if (!account) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="container page-content">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-danger)' }}>Access Denied</h2>
          <p>You do not have the required role to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

function AppContent() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify" element={<VerifyProduct />} />
        
        <Route 
          path="/register" 
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manufacturer" 
          element={
            <ProtectedRoute allowedRoles={['Manufacturer']}>
              <ManufacturerDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/distributor" 
          element={
            <ProtectedRoute allowedRoles={['Distributor']}>
              <DistributorDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <Router>
        <AppContent />
      </Router>
    </Web3Provider>
  );
}
