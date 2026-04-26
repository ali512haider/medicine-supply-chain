import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import VerifyProduct from './pages/VerifyProduct';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { account, role, status } = useWeb3();

  if (status === 'idle' || status === 'connecting') {
    return (
      <div className="container page-content" style={{ textAlign: 'center', paddingTop: '10rem' }}>
        <div className="animate-fade-in">
          <h2>⌛ Connecting to Blockchain...</h2>
          <p style={{ color: '#64748b' }}>Please ensure your MetaMask wallet is connected.</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="container page-content">
        <div className="glass-panel" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ color: 'var(--accent-danger)' }}>🚫 Access Denied</h2>
          <p style={{ color: '#64748b' }}>You do not have the required permissions ({allowedRoles.join(', ')}) to view this dashboard.</p>
          <button onClick={() => window.history.back()} className="btn btn-outline" style={{ marginTop: '1.5rem' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return children;
};


function AppContent() {
  const location = useLocation();
  const dashboardRoutes = ['/admin', '/manufacturer', '/distributor', '/supplier', '/pharmacist'];
  const showNavbar = !dashboardRoutes.includes(location.pathname);

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/verify" element={<VerifyProduct />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Register should be public so users can sign up */}
        <Route path="/register" element={<Register />} />
        
        {/* Role-Based Private Routes */}
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

        <Route 
          path="/supplier" 
          element={
            <ProtectedRoute allowedRoles={['Supplier']}>
              <SupplierDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/pharmacist" 
          element={
            <ProtectedRoute allowedRoles={['Pharmacist']}>
              <PharmacistDashboard />
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
