import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutUs() {
  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: '900px', paddingBottom: '8rem' }}>
        <div className="text-center mb-4 animate-slide-up">
          <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            About <span className="gradient-text">MediChain</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Transforming global pharmaceutical integrity through decentralized innovation.
          </p>
        </div>
        
        <div className="glass-panel animate-slide-up delay-1" style={{ lineHeight: 1.8, fontSize: '1.15rem', color: 'var(--text-secondary)', padding: '3rem' }}>
          <p style={{ marginBottom: '2rem' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1.4rem' }}>MediChain</strong> was founded with a critical mission: to eliminate counterfeit medicines from the global supply chain. In an era where 1 in 10 medical products in developing countries is substandard or falsified, we provide a mathematical certainty of authenticity.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '4rem' }}>
            <div className="card-hover" style={styles.valueCard}>
              <div style={styles.valueIcon}>🛡️</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Our Vision</h3>
              <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                A world where every patient can consume medication with 100% confidence, knowing its entire journey is verified on an immutable ledger.
              </p>
            </div>
            
            <div className="card-hover" style={styles.valueCard}>
              <div style={styles.valueIcon}>🌐</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Global Impact</h3>
              <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                Counterfeit drugs claim over 250,000 lives annually. We are building the infrastructure to make these tragedies a thing of the past.
              </p>
            </div>
          </div>

          <h3 style={{ color: 'var(--text-primary)', marginTop: '4rem', marginBottom: '1.5rem', fontSize: '1.75rem' }}>The Technology</h3>
          <p>
            By leveraging the Ethereum blockchain, we create a <strong>Digital Twin</strong> for every physical batch of medicine. 
            From the manufacturer's facility to the patient's local pharmacy, every hand-off is recorded as a permanent, tamper-proof transaction.
          </p>
          
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={styles.li}>
               <span style={styles.check}>✓</span> 
               <div><strong>Full Transparency:</strong> A public, decentralized ledger accessible to all stakeholders.</div>
            </div>
            <div style={styles.li}>
               <span style={styles.check}>✓</span> 
               <div><strong>Cryptographic Security:</strong> Every node in the supply chain is verified using public-key infrastructure.</div>
            </div>
            <div style={styles.li}>
               <span style={styles.check}>✓</span> 
               <div><strong>Real-time Auditing:</strong> Regulators can monitor supply chains in real-time without manual intervention.</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 animate-slide-up delay-2">
          <h2 style={{ marginBottom: '1.5rem' }}>Ready to verify a product?</h2>
          <Link to="/verify" className="btn btn-primary" style={{ padding: '1.2rem 2.5rem' }}>
             Go to Verification Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  valueCard: {
    padding: '2rem',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
  },
  valueIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  li: {
    display: 'flex',
    gap: '1rem',
    padding: '1.25rem',
    background: 'rgba(16, 185, 129, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.1)',
    fontSize: '1.05rem',
  },
  check: {
    color: 'var(--accent-primary)',
    fontWeight: 800,
    fontSize: '1.2rem',
  }
};
