import React from 'react';

export default function AboutUs() {
  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          About <span className="gradient-text">MediChain</span>
        </h1>
        
        <div className="glass-panel" style={{ lineHeight: 1.8, fontSize: '1.1rem', color: '#475569' }}>
          <p>
            MediChain was founded with a single, critical mission: to eliminate counterfeit medicines from the global supply chain using the power of decentralized technology.
          </p>
          
          <h3 style={{ color: '#0f172a', marginTop: '2.5rem' }}>Our Vision</h3>
          <p>
            We envision a world where every patient can consume their prescribed medication with 100% confidence, knowing exactly when, where, and by whom it was produced. Counterfeit drugs are not just a business problem—they are a global health crisis that claims hundreds of thousands of lives every year.
          </p>

          <h3 style={{ color: '#0f172a', marginTop: '2.5rem' }}>How It Works</h3>
          <p>
            By leveraging the Ethereum blockchain, we create a digital twin for every physical batch of medicine. 
            From the Manufacturer's factory to the Distributor's warehouse, and finally to the Pharmacist's shelf, every hand-off is recorded as an immutable transaction.
          </p>
          
          <ul style={{ marginTop: '1.5rem', listStyleType: 'none', padding: 0 }}>
            <li style={styles.li}>✅ <strong>Transparency:</strong> Public ledger accessible to everyone.</li>
            <li style={styles.li}>✅ <strong>Security:</strong> Cryptographic verification of every node.</li>
            <li style={styles.li}>✅ <strong>Authenticity:</strong> QR-code based instant verification.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  li: {
    padding: '1rem',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    border: '1px solid #e2e8f0',
  }
};
