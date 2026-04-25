import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

export default function Home() {
  const { account, role } = useWeb3();

  if (account && role) {
    if (role === 'Admin') return <Navigate to="/admin" replace />;
    if (role === 'Manufacturer') return <Navigate to="/manufacturer" replace />;
    if (role === 'Distributor') return <Navigate to="/distributor" replace />;
    if (role === 'Supplier') return <Navigate to="/supplier" replace />;
    if (role === 'Pharmacist') return <Navigate to="/pharmacist" replace />;
  }

  return (
    <div className="page-content animate-fade-in">
      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="container" style={styles.heroGrid}>
          <div style={styles.heroContent}>
            <span style={styles.badge}>Blockchain Powered Security</span>
            <h1 style={styles.heroTitle}>
              Restoring Trust in the <span className="gradient-text">Medicine</span> Supply Chain
            </h1>
            <p style={styles.heroSubtitle}>
              Our transparent ledger tracks pharmaceuticals from the factory floor to the pharmacy shelf, ensuring authenticity and protecting lives.
            </p>
            <div style={styles.heroActions}>
              <Link to="/verify" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                Trace Your Medicine
              </Link>
              <Link to="/about" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Learn How It Works
              </Link>
            </div>
          </div>
          <div className="hide-mobile" style={styles.heroImageContainer}>
             <div style={styles.heroGraphic}>
                <div style={styles.floatingCard1}>✓ Authenticity Verified</div>
                <div style={styles.floatingCard2}>🔒 Ledger Secured</div>
                <div style={styles.heroMainGraphic}>💊</div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section style={styles.statsSection}>
        <div className="container" style={styles.statsGrid}>
          <StatItem number="100%" label="Transparent" />
          <StatItem number="0.0s" label="Traceability Delay" />
          <StatItem number="∞" label="Immutable Records" />
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Why Choose MediChain?</h2>
            <p style={styles.sectionSubtitle}>We provide the most robust anti-counterfeit ecosystem for the pharmaceutical industry.</p>
          </div>
          <div style={styles.featuresGrid}>
            <FeatureCard 
              title="Real-Time Tracking" 
              desc="Monitor every hand-off in the supply chain with millisecond precision using distributed ledger technology."
              icon="📍"
            />
            <FeatureCard 
              title="Tamper-Proof" 
              desc="Once a batch is recorded on the blockchain, its history cannot be deleted or modified by anyone."
              icon="🛡️"
            />
            <FeatureCard 
              title="Public Verification" 
              desc="Empower patients to verify their own medicine via QR code without needing any complex software."
              icon="📱"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const StatItem = ({ number, label }) => (
  <div style={styles.statItem}>
    <div style={styles.statNumber} className="gradient-text">{number}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);

const FeatureCard = ({ title, desc, icon }) => (
  <div style={styles.featureCard}>
    <div style={styles.featureIcon}>{icon}</div>
    <h3 style={styles.featureCardTitle}>{title}</h3>
    <p style={styles.featureCardDesc}>{desc}</p>
  </div>
);

const styles = {
  hero: {
    padding: '6rem 0 4rem',
    background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05), transparent)',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    gap: '4rem',
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr', textAlign: 'center' }
  },
  heroContent: {
    maxWidth: '640px',
  },
  badge: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--accent-primary)',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
  },
  heroTitle: {
    fontSize: '4.5rem',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '1.5rem',
    '@media (max-width: 640px)': { fontSize: '3rem' }
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '2.5rem',
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    '@media (max-width: 640px)': { flexDirection: 'column' }
  },
  heroImageContainer: {
    position: 'relative',
    height: '400px',
  },
  heroGraphic: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMainGraphic: {
    fontSize: '8rem',
    filter: 'drop-shadow(0 20px 40px rgba(16, 185, 129, 0.2))',
    animation: 'float 6s ease-in-out infinite',
  },
  floatingCard1: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    background: 'white',
    padding: '1rem',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    fontWeight: 700,
    color: '#10b981',
    zIndex: 2,
  },
  floatingCard2: {
    position: 'absolute',
    bottom: '20%',
    left: '10%',
    background: 'white',
    padding: '1rem',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    fontWeight: 700,
    color: '#3b82f6',
    zIndex: 2,
  },
  statsSection: {
    padding: '4rem 0',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    background: 'white',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    textAlign: 'center',
    gap: '2rem',
  },
  statNumber: {
    fontSize: '3.5rem',
    fontWeight: 800,
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  featuresSection: {
    padding: '8rem 0',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 4rem',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  sectionSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  featureCard: {
    background: 'white',
    padding: '3rem 2rem',
    borderRadius: '24px',
    border: '1px solid #f1f5f9',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '1.5rem',
  },
  featureCardTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
  },
  featureCardDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.95rem',
  }
};
