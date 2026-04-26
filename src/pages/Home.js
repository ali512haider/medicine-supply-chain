import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import heroImage from '../assets/hero.png';
import Footer from '../components/Footer';

export default function Home() {
  const { account, role } = useWeb3();

  // Redirect if already logged in and has a role
  if (account && role) {
    if (role === 'Admin') return <Navigate to="/admin" replace />;
    if (role === 'Manufacturer') return <Navigate to="/manufacturer" replace />;
    if (role === 'Distributor') return <Navigate to="/distributor" replace />;
    if (role === 'Supplier') return <Navigate to="/supplier" replace />;
    if (role === 'Pharmacist') return <Navigate to="/pharmacist" replace />;
  }

  return (
    <div className="page-content animate-fade-in" style={{ padding: 0 }}>
      {/* Hero Section - The First Impression */}
      <section style={styles.hero}>
        <div className="container" style={styles.heroGrid}>
          <div style={styles.heroContent} className="animate-slide-up">
            <div style={styles.badge}>
              <span style={styles.badgeDot}></span>
              Next-Gen Blockchain Ledger
            </div>
            <h1 style={styles.heroTitle}>
              Securing the Global <br />
              <span className="gradient-text">Medicine Supply Chain</span>
            </h1>
            <p style={styles.heroSubtitle}>
              An enterprise-grade decentralized platform for pharmaceutical transparency, 
              authenticity, and real-time tracking across every medical handoff.
            </p>
            <div style={styles.heroActions}>
              <Link to="/register" className="btn btn-primary" style={styles.primaryBtn}>
                Get Started
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '8px'}}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
              <Link to="/verify" className="btn btn-outline" style={styles.secondaryBtn}>
                Verify Product
              </Link>
            </div>
            <div style={styles.heroTrust}>
              <div style={styles.trustItem}>
                <strong>10M+</strong> Verified Units
              </div>
              <div style={styles.trustDivider}></div>
              <div style={styles.trustItem}>
                <strong>Zero</strong> Fake Entries
              </div>
            </div>
          </div>
          
          <div className="hide-mobile" style={styles.heroImageWrapper}>
            <div style={styles.imageBackgroundGlow}></div>
            <img src={heroImage} alt="MediTrace Ecosystem" style={styles.heroImg} className="animate-float" />
            
            {/* Floating Visual Elements */}
            <div style={{...styles.floatingCard, top: '10%', right: '-5%'}} className="animate-float-delayed">
              <div style={styles.cardIconBox}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
              <div>
                <div style={styles.cardLabel}>Security</div>
                <div style={styles.cardValue}>AES-256 Encrypted</div>
              </div>
            </div>
            <div style={{...styles.floatingCard, bottom: '20%', left: '-10%'}} className="animate-float">
              <div style={{...styles.cardIconBox, background: '#3b82f6'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
              <div>
                <div style={styles.cardLabel}>Real-time</div>
                <div style={styles.cardValue}>Live Ledger Tracking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners/Marquee Section */}
      <section style={styles.marqueeSection}>
        <div className="container">
          <p style={styles.marqueeTitle}>POWERING THE FUTURE OF PHARMA WITH</p>
          <div style={styles.marquee}>
            <span style={styles.partnerName}>UET TAXILA</span>
            <span style={styles.partnerName}>ETHEREUM NETWORK</span>
            <span style={styles.partnerName}>GLOBAL HEALTH ORG</span>
            <span style={styles.partnerName}>BIO-TECH SOLUTIONS</span>
            <span style={styles.partnerName}>SECURE-LOGISTICS</span>
          </div>
        </div>
      </section>

      {/* Core Features - Why Us? */}
      <section style={styles.featuresSection}>
        <div className="container">
          <div style={styles.sectionHeader} className="animate-slide-up">
            <h2 style={styles.sectionTitle}>Enterprise Integrity by Design</h2>
            <p style={styles.sectionSubtitle}>
              A multi-layered security protocol designed for the most rigorous pharmaceutical environments.
            </p>
          </div>
          <div style={styles.featuresGrid}>
            <FeatureCard 
              title="Immutable Provenance" 
              desc="Every medicine batch is recorded on a distributed ledger, creating a permanent, untamperable birth certificate." 
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>}
            />
            <FeatureCard 
              title="Smart Contract Logistics" 
              desc="Automated verification of ownership transfers, ensuring products only move through authorized entities." 
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
            />
            <FeatureCard 
              title="Global Recall System" 
              desc="Instant, network-wide flagging of batches. Alert every pharmacist and patient in seconds if a quality issue arises." 
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
            />
          </div>
        </div>
      </section>

      {/* Live Network Pulse - Real Software Feel */}
      <section style={styles.pulseSection}>
        <div className="container" style={styles.pulseGrid}>
          <div style={styles.pulseTextSide}>
            <h2 style={{...styles.sectionTitle, textAlign: 'left', marginTop: 0}}>The Pulse of <br /><span className="gradient-text">Medicine Security</span></h2>
            <p style={styles.description}>
              Our network operates 24/7, validating thousands of data points every minute. 
              From the production floor in Rawalpindi to the pharmacy shelf in Karachi, 
              MediTrace is the invisible guardian of your health.
            </p>
            <div style={styles.pulseStats}>
              <div style={styles.pulseStatItem}>
                <div style={styles.pulseVal}>0.08s</div>
                <div style={styles.pulseLabel}>Transaction Speed</div>
              </div>
              <div style={styles.pulseStatItem}>
                <div style={styles.pulseVal}>99.9%</div>
                <div style={styles.pulseLabel}>Network Uptime</div>
              </div>
            </div>
          </div>
          <div style={styles.pulseVisualSide}>
             <div className="glass-panel" style={styles.liveLog}>
                <div style={styles.logHeader}><span style={styles.logDot}></span> LIVE LEDGER FEED</div>
                <div style={styles.logContent}>
                   <LogItem action="Batch Created" actor="BioLab MFR" hash="0x8a2f...1e3d" />
                   <LogItem action="Ownership Transfer" actor="Speed-Dist" hash="0x4c91...b82a" />
                   <LogItem action="Authenticity Scan" actor="Pharma-Plus" hash="0xf2e0...9c41" />
                   <LogItem action="New Batch Entry" actor="UET Pharma" hash="0x1b7e...5d33" />
                </div>
             </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const FeatureCard = ({ title, desc, icon }) => (
  <div className="glass-panel card-hover" style={styles.featureCard}>
    <div style={styles.featureIcon}>{icon}</div>
    <h3 style={styles.featureTitle}>{title}</h3>
    <p style={styles.featureDesc}>{desc}</p>
  </div>
);

const LogItem = ({ action, actor, hash }) => (
  <div style={styles.logItem}>
    <div style={{fontWeight: 700, fontSize: '0.9rem'}}>{action}</div>
    <div style={{color: '#64748b', fontSize: '0.8rem'}}>{actor} | <span style={{fontFamily: 'monospace'}}>{hash}</span></div>
  </div>
);

const styles = {
  hero: {
    padding: '8rem 0 10rem',
    background: 'linear-gradient(180deg, #f8fafc 0%, white 100%)',
    overflow: 'hidden',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '4rem',
    alignItems: 'center',
  },
  heroContent: {
    textAlign: 'left',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'var(--accent-glow)',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    marginBottom: '2rem',
    border: '1px solid var(--accent-primary)',
  },
  badgeDot: {
    width: '8px',
    height: '8px',
    background: 'var(--accent-primary)',
    borderRadius: '50%',
    boxShadow: '0 0 10px var(--accent-primary)',
  },
  heroTitle: {
    fontSize: '4.5rem',
    fontWeight: 900,
    lineHeight: '1.1',
    letterSpacing: '-0.03em',
    marginBottom: '2rem',
    color: '#0f172a',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    lineHeight: '1.7',
    color: '#475569',
    maxWidth: '550px',
    marginBottom: '3rem',
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
  },
  primaryBtn: {
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 20px 40px var(--accent-glow)',
  },
  secondaryBtn: {
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    background: 'white',
  },
  heroTrust: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginTop: '4rem',
  },
  trustItem: {
    fontSize: '1rem',
    color: '#64748b',
  },
  trustDivider: {
    width: '1px',
    height: '24px',
    background: '#e2e8f0',
  },
  heroImageWrapper: {
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    maxWidth: '600px',
    borderRadius: '40px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
    zIndex: 2,
    position: 'relative',
  },
  imageBackgroundGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120%',
    height: '120%',
    background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
    zIndex: 1,
  },
  floatingCard: {
    position: 'absolute',
    padding: '1rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    zIndex: 10,
    border: '1px solid white',
  },
  cardIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' },
  cardValue: { fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 },
  
  marqueeSection: { padding: '4rem 0', background: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' },
  marqueeTitle: { textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '2.5rem' },
  marquee: { display: 'flex', justifyContent: 'center', gap: '5rem', flexWrap: 'wrap', opacity: 0.6 },
  partnerName: { fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' },

  featuresSection: { padding: '10rem 0' },
  sectionHeader: { textAlign: 'center', marginBottom: '6rem' },
  sectionTitle: { fontSize: '3rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem' },
  sectionSubtitle: { fontSize: '1.2rem', color: '#64748b', maxWidth: '650px', margin: '0 auto' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' },
  featureCard: { padding: '4rem 3rem', borderRadius: '35px', textAlign: 'center' },
  featureIcon: { marginBottom: '2rem' },
  featureTitle: { fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' },
  featureDesc: { fontSize: '1.05rem', color: '#64748b', lineHeight: '1.6' },

  pulseSection: { padding: '10rem 0', background: '#f8fafc' },
  pulseGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' },
  description: { fontSize: '1.2rem', lineHeight: '1.8', color: '#475569', marginBottom: '2.5rem' },
  pulseStats: { display: 'flex', gap: '3rem' },
  pulseVal: { fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-primary)' },
  pulseLabel: { fontSize: '0.9rem', color: '#64748b', fontWeight: 600 },
  liveLog: { padding: '2rem', borderRadius: '24px', background: 'white' },
  logHeader: { fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
  logDot: { width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite' },
  logItem: { padding: '1rem 0', borderBottom: '1px solid #f1f5f9' },
};
