import React from 'react';
import softwareImg from '../assets/software_mockup.png';
import founderImg from '../assets/founder.png';
import founderImg2 from '../assets/founder2.png';
import Footer from '../components/Footer';

export default function AboutUs() {
  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: '1100px', paddingBottom: '8rem' }}>

        {/* Software Description Section */}
        <section style={styles.section} className="animate-slide-up">
          <div style={styles.softwareGrid}>
            <div style={styles.textSide}>
              <h1 style={styles.mainTitle}>About the <span className="gradient-text">Software</span></h1>
              <p style={styles.description}>
                <strong>MediTrace</strong> is a state-of-the-art pharmaceutical supply chain management system built on Ethereum blockchain technology.
                Our platform addresses the critical global challenge of counterfeit medicines by providing an immutable, transparent,
                and real-time record of every pharmaceutical batch produced.
              </p>
              <p style={styles.description}>
                By leveraging smart contracts, MediTrace ensures that every handoff—from the manufacturer to the distributor,
                and finally to the pharmacist—is digitally signed and verified. This "Chain of Custody" creates a digital fortress
                around the medicine supply.
              </p>
            </div>
            <div style={styles.imageSide}>
              <div style={styles.imageDecor}></div>
              <img src={softwareImg} alt="MediTrace Software" style={styles.floatingImg} className="animate-float" />
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section style={styles.gridSection}>
          <div style={styles.visionCard} className="animate-slide-up delay-1">
            <div style={styles.iconCircle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
            </div>
            <h2 style={styles.cardTitle}>Our Mission</h2>
            <p style={styles.cardText}>
              To eliminate the global counterfeit medicine crisis by providing a secure, decentralized infrastructure
              that empowers manufacturers and protects patients.
            </p>
          </div>
          <div style={styles.visionCard} className="animate-slide-up delay-2">
            <div style={styles.iconCircle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <h2 style={styles.cardTitle}>Our Vision</h2>
            <p style={styles.cardText}>
              To become the global standard for pharmaceutical integrity, where "Verified by MediTrace" becomes
              the universal seal of trust for every patient worldwide.
            </p>
          </div>
        </section>

        {/* How to Use Section */}
        <section style={styles.section} className="animate-slide-up delay-3">
          <h2 style={styles.sectionTitle}>How to <span className="gradient-text">Use the Platform</span></h2>
          <div style={styles.stepsGrid}>
            <StepItem
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>}
              title="Registration"
              desc="Enterprises register their wallet address and company details for Admin verification."
            />
            <StepItem
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>}
              title="Production"
              desc="Manufacturers register new batches, generating a unique digital identity for each."
            />
            <StepItem
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
              title="Transfer"
              desc="As products move through the supply chain, each entity confirms receipt on the ledger."
            />
            <StepItem
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" /></svg>}
              title="Verification"
              desc="Patients scan the Batch ID to view the full journey and authenticity status instantly."
            />
          </div>
        </section>

        {/* Founders Section */}
        <section style={styles.founderSection} className="animate-slide-up delay-4">
          <h2 style={styles.sectionTitle}>Meet the <span className="gradient-text">Founders</span></h2>
          <div style={styles.foundersGrid}>
            {/* Founder 1 */}
            <div className="glass-panel" style={styles.founderCard}>
              <img src={founderImg} alt="Ali Haider Aziz" style={styles.founderImg} />
              <div style={styles.founderInfo}>
                <h3 style={styles.founderName}>Ali Haider Aziz</h3>
                <p style={styles.founderTitle}>Lead Blockchain Architect</p>
                <div style={styles.divider}></div>
                <p style={styles.founderBio}>
                  Specializing in decentralized systems and cryptography. Ali developed the core Ethereum protocols that power MediTrace's security.
                </p>
                <div style={styles.socialLinks}>
                  <a href="#" style={styles.socialIcon}>LinkedIn</a>
                  <a href="#" style={styles.socialIcon}>GitHub</a>
                </div>
              </div>
            </div>

            {/* Founder 2 */}
            <div className="glass-panel" style={styles.founderCard}>
              <img src={founderImg2} alt="Ali Raza" style={styles.founderImg} />
              <div style={styles.founderInfo}>
                <h3 style={styles.founderName}>Ali Raza</h3>
                <p style={styles.founderTitle}>Chief Operations Officer</p>
                <div style={styles.divider}></div>
                <p style={styles.founderBio}>
                  Expert in pharmaceutical logistics and global regulatory compliance. Ayesha leads the strategy for enterprise adoption and safety standards.
                </p>
                <div style={styles.socialLinks}>
                  <a href="#" style={styles.socialIcon}>LinkedIn</a>
                  <a href="#" style={styles.socialIcon}>Twitter</a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}

const StepItem = ({ icon, title, desc }) => (
  <div className="glass-panel" style={styles.stepItem}>
    <div style={styles.stepIconBox}>{icon}</div>
    <h3 style={styles.stepTitle}>{title}</h3>
    <p style={styles.stepDesc}>{desc}</p>
  </div>
);

const styles = {
  section: { marginTop: '6rem' },
  mainTitle: { fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem', color: 'var(--text-primary)' },
  softwareGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' },
  textSide: { textAlign: 'left' },
  description: { fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '1.5rem' },
  imageSide: { position: 'relative', display: 'flex', justifyContent: 'center' },
  floatingImg: { width: '100%', maxWidth: '500px', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', zIndex: 2, border: '8px solid white' },
  imageDecor: { position: 'absolute', top: '-20px', right: '-20px', width: '100%', height: '100%', background: 'var(--accent-glow)', borderRadius: '30px', zIndex: 1 },
  gridSection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginTop: '6rem' },
  visionCard: { padding: '3.5rem 3rem', borderRadius: '30px', background: 'white', boxShadow: 'var(--premium-shadow)', textAlign: 'center', border: '1px solid var(--border-color)' },
  iconCircle: { marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' },
  cardTitle: { fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' },
  cardText: { fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-secondary)' },
  sectionTitle: { fontSize: '2.8rem', fontWeight: 900, textAlign: 'center', marginBottom: '4rem', marginTop: '4rem' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' },
  stepItem: { padding: '2.5rem 2rem', textAlign: 'center', position: 'relative', transition: 'transform 0.3s ease' },
  stepIconBox: { width: '50px', height: '50px', background: 'var(--accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px var(--accent-glow)' },
  stepTitle: { fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' },
  stepDesc: { fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.6' },
  founderSection: { marginTop: '8rem' },
  foundersGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' },
  founderCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', borderRadius: '35px', background: 'white', textAlign: 'center' },
  founderImg: { width: '180px', height: '180px', objectFit: 'cover', borderRadius: '50%', marginBottom: '2rem', border: '4px solid white', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' },
  founderInfo: { width: '100%' },
  founderName: { fontSize: '2rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' },
  founderTitle: { fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: 700, marginTop: '0.5rem' },
  divider: { width: '40px', height: '4px', background: 'var(--accent-primary)', margin: '1.5rem auto', borderRadius: '2px' },
  founderBio: { fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '1.5rem' },
  socialLinks: { display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' },
  socialIcon: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px' }
};
