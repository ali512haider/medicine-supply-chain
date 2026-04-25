import React from 'react';

export default function Contact() {
  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: '900px', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          Get in <span className="gradient-text">Touch</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '4rem', fontSize: '1.2rem' }}>
          Have questions about our blockchain solution? We're here to help.
        </p>

        <div style={styles.grid}>
          <div className="glass-panel">
            <h3 style={{ marginTop: 0 }}>Send us a Message</h3>
            <form style={styles.form}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" style={styles.input} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" style={styles.input} placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" style={{ ...styles.input, height: '120px' }} placeholder="How can we assist you?"></textarea>
              </div>
              <button type="button" className="btn btn-primary" style={{ width: '100%' }}>Send Message</button>
            </form>
          </div>

          <div style={styles.infoCol}>
            <div style={styles.infoCard}>
              <div style={styles.icon}>📍</div>
              <div>
                <h4 style={{ margin: 0 }}>Office Address</h4>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>123 Blockchain Ave, Tech City, 54000</p>
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.icon}>✉️</div>
              <div>
                <h4 style={{ margin: 0 }}>Email Us</h4>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>support@medichain.io</p>
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.icon}>📞</div>
              <div>
                <h4 style={{ margin: 0 }}>Call Support</h4>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>+1 (555) 000-1234</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '2rem',
    '@media (max-width: 800px)': { gridTemplateColumns: '1fr' }
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
  },
  infoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  infoCard: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    padding: '1.5rem',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #f1f5f9',
  },
  icon: {
    fontSize: '1.5rem',
  }
};
