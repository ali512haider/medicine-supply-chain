import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

export default function Home() {
  const { account, role } = useWeb3();

  // Automatic redirect if already logged in
  if (account && role) {
    if (role === 'Admin') return <Navigate to="/admin" replace />;
    if (role === 'Manufacturer') return <Navigate to="/manufacturer" replace />;
    if (role === 'Distributor') return <Navigate to="/distributor" replace />;
  }

  return (
    <div className="container page-content animate-fade-in">
      <div style={styles.hero}>
        <h1 style={styles.title}>
          Secure the <span className="gradient-text">Medicine</span> Supply Chain
        </h1>
        <p style={styles.subtitle}>
          Track, verify, and trace pharmaceuticals from the manufacturer straight to the patient using transparent blockchain technology.
        </p>
        <div style={styles.actions}>
          <Link to="/verify" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Verify a Product
          </Link>
        </div>
      </div>
      
      <div style={styles.features} className="glass-panel">
        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Anti-Counterfeit</h3>
          <p style={styles.featureText}>Immutable ledger ensures that batches cannot be duplicated or faked.</p>
        </div>
        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>End-to-End Traceability</h3>
          <p style={styles.featureText}>See every hand that touched the medicine before it reached you.</p>
        </div>
        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Role-Based Access</h3>
          <p style={styles.featureText}>Strict verification for Manufacturers, Distributors, and Pharmacists.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  hero: {
    textAlign: 'center',
    padding: '4rem 0',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '4rem',
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: '1.5rem',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    marginBottom: '2.5rem',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginTop: '4rem',
  },
  feature: {
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
  },
  featureText: {
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  }
};
