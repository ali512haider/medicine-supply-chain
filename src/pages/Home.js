import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import heroImage from '../assets/hero.png';

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
          <div style={styles.heroContent} className="animate-slide-up">
            <div style={styles.badgeContainer}>
              <span style={styles.badgePulse}></span>
              <span style={styles.badgeText}>Live Blockchain Network Active</span>
            </div>
            <h1 style={styles.heroTitle}>
              Securing the Future of <br />
              <span className="gradient-text">Pharmaceuticals</span>
            </h1>
            <p style={styles.heroSubtitle}>
              MediTrace leverages advanced distributed ledger technology to ensure every pill is authentic, every batch is tracked, and every life is protected.
            </p>
            <div style={styles.heroActions}>
              <Link to="/verify" className="btn btn-primary" style={{ padding: '1.2rem 2.5rem' }}>
                Verify Medicine 
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/about" className="btn btn-outline" style={{ padding: '1.2rem 2rem' }}>
                System Architecture
              </Link>
            </div>
            
            <div style={styles.trustIndicators}>
              <p style={styles.trustText}>Trusted by leading healthcare providers</p>
              <div style={styles.trustLogos}>
                <div style={styles.trustLogo}>FDA Compliant</div>
                <div style={styles.trustLogo}>GMP Certified</div>
                <div style={styles.trustLogo}>ISO 27001</div>
              </div>
            </div>
          </div>
          
          <div className="hide-mobile" style={styles.heroImageWrapper}>
            <div style={styles.imageBackgroundGlow}></div>
            <img src={heroImage} alt="Medical Supply Chain" style={styles.heroImg} className="animate-float" />
            <div style={styles.floatingStats}>
              <div style={styles.floatingCard}>
                <div style={styles.cardDot}></div>
                <div>
                  <div style={styles.cardLabel}>Network Status</div>
                  <div style={styles.cardValue}>100% Operational</div>
                </div>
              </div>
              <div style={styles.floatingCard2}>
                <div style={styles.cardDotBlue}></div>
                <div>
                  <div style={styles.cardLabel}>Real-time Tracking</div>
                  <div style={styles.cardValue}>Active Nodes: 1,248</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div className="container">
          <div style={styles.statsGrid}>
            <StatItem number="10M+" label="Units Verified" />
            <StatItem number="500+" label="Partners Globally" />
            <StatItem number="0.01s" label="Block Latency" />
            <StatItem number="99.9%" label="Security Rate" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div className="container">
          <div style={styles.sectionHeader} className="animate-slide-up">
            <h2 style={styles.sectionTitle}>Enterprise-Grade Integrity</h2>
            <p style={styles.sectionSubtitle}>Designed for the most rigorous regulatory environments in global medicine.</p>
          </div>
          <div style={styles.featuresGrid}>
            <FeatureCard 
              title="End-to-End Visibility" 
              desc="Real-time monitoring from chemical sourcing to patient delivery with complete chain of custody."
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              delay="0.1s"
            />
            <FeatureCard 
              title="Immutable Compliance" 
              desc="Automatic regulatory reporting and audit trails that are mathematically impossible to forge."
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              delay="0.2s"
            />
            <FeatureCard 
              title="Instant Verification" 
              desc="Patients and pharmacists can verify authenticity in seconds using any smartphone device."
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
              delay="0.3s"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div className="container">
          <div style={styles.ctaCard} className="glass-panel">
            <h2 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to secure your supply chain?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              Join the network of manufacturers and distributors committed to pharmaceutical transparency.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary" style={{ background: 'white', color: 'var(--accent-primary)' }}>
                Get Started Now
              </Link>
              <Link to="/contact" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', background: 'transparent' }}>
                Speak with an Expert
              </Link>
            </div>
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

const FeatureCard = ({ title, desc, icon, delay }) => (
  <div style={{ ...styles.featureCard, animationDelay: delay }} className="animate-slide-up feature-card">
    <div style={styles.featureIcon}>{icon}</div>
    <h3 style={styles.featureCardTitle}>{title}</h3>
    <p style={styles.featureCardDesc}>{desc}</p>
  </div>
);

const styles = {
  hero: {
    padding: '8rem 0 6rem',
    background: 'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.03) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(14, 165, 233, 0.03) 0%, transparent 50%)',
    overflow: 'hidden',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    alignItems: 'center',
    gap: '4rem',
  },
  heroContent: {
    maxWidth: '700px',
  },
  badgeContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 1.25rem',
    background: 'rgba(16, 185, 129, 0.08)',
    borderRadius: '100px',
    marginBottom: '2rem',
    border: '1px solid rgba(16, 185, 129, 0.1)',
  },
  badgePulse: {
    width: '8px',
    height: '8px',
    background: 'var(--accent-primary)',
    borderRadius: '50%',
    boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)',
    animation: 'pulse-glow 2s infinite',
  },
  badgeText: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  heroTitle: {
    fontSize: '5rem',
    lineHeight: 1.1,
    marginBottom: '1.5rem',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '3rem',
    maxWidth: '600px',
  },
  heroActions: {
    display: 'flex',
    gap: '1.25rem',
    marginBottom: '4rem',
  },
  trustIndicators: {
    paddingTop: '2rem',
    borderTop: '1px solid var(--border-color)',
  },
  trustText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
    fontWeight: 600,
  },
  trustLogos: {
    display: 'flex',
    gap: '2rem',
  },
  trustLogo: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    opacity: 0.7,
  },
  heroImageWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBackgroundGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
    zIndex: -1,
  },
  heroImg: {
    width: '100%',
    height: 'auto',
    borderRadius: '30px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  floatingStats: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  floatingCard: {
    position: 'absolute',
    top: '15%',
    right: '-5%',
    background: 'white',
    padding: '1.25rem',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    border: '1px solid #f1f5f9',
    pointerEvents: 'auto',
  },
  floatingCard2: {
    position: 'absolute',
    bottom: '10%',
    left: '-5%',
    background: 'white',
    padding: '1.25rem',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    border: '1px solid #f1f5f9',
    pointerEvents: 'auto',
  },
  cardDot: {
    width: '10px',
    height: '10px',
    background: '#10b981',
    borderRadius: '50%',
  },
  cardDotBlue: {
    width: '10px',
    height: '10px',
    background: '#3b82f6',
    borderRadius: '50%',
  },
  cardLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  cardValue: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  statsSection: {
    padding: '6rem 0',
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-color)',
    borderBottom: '1px solid var(--border-color)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2rem',
    textAlign: 'center',
  },
  statItem: {
    padding: '1rem',
  },
  statNumber: {
    fontSize: '3.5rem',
    fontWeight: 900,
    marginBottom: '0.5rem',
  },
  statLabel: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  featuresSection: {
    padding: '10rem 0',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto 6rem',
  },
  sectionTitle: {
    fontSize: '3.5rem',
    marginBottom: '1.5rem',
  },
  sectionSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3rem',
  },
  featureCard: {
    padding: '4rem 3rem',
    background: 'white',
    borderRadius: '32px',
    border: '1px solid #f1f5f9',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    background: 'var(--accent-glow)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  featureCardTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  featureCardDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    fontSize: '1.05rem',
  },
  ctaSection: {
    padding: '6rem 0 10rem',
  },
  ctaCard: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '6rem 4rem',
    textAlign: 'center',
    borderRadius: '40px',
    position: 'relative',
    overflow: 'hidden',
  }
};

