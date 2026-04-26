import React from 'react';

export default function Contact() {
  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: '1100px', paddingBottom: '8rem' }}>
        
        <header style={styles.header} className="animate-slide-up">
          <h1 style={styles.title}>Connect with <span className="gradient-text">Our Team</span></h1>
          <p style={styles.subtitle}>
            Have questions about MediTrace? Reach out to our lead architects and coordinators directly.
          </p>
        </header>

        <div style={styles.grid}>
          {/* Contact Cards */}
          <div style={styles.cardsCol}>
            {/* Ali Haider Aziz */}
            <div className="glass-panel card-hover" style={styles.contactCard} className="animate-slide-up delay-1">
              <div style={styles.cardHeader}>
                <div style={styles.iconBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h3 style={styles.name}>Ali Haider Aziz</h3>
                  <p style={styles.role}>Lead Blockchain Architect</p>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.infoLine}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>22-CS-07@students.uettaxila.edu.pk</span>
                </div>
                <div style={styles.infoLine}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>+92-325-8527293</span>
                </div>
              </div>
            </div>

            {/* Ali Raza */}
            <div className="glass-panel card-hover" style={styles.contactCard} className="animate-slide-up delay-2">
              <div style={styles.cardHeader}>
                <div style={styles.iconBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h3 style={styles.name}>Ali Raza</h3>
                  <p style={styles.role}>Chief Operations Officer</p>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.infoLine}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>22-CS-92@students.uettaxila.edu.pk</span>
                </div>
                <div style={styles.infoLine}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>+92-313-9506232</span>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="glass-panel" style={styles.locationCard} className="animate-slide-up delay-3">
              <div style={{ ...styles.iconBox, background: 'var(--text-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Headquarters</h4>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>UET Taxila, Rawalpindi, Pakistan</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-panel animate-slide-up delay-2" style={styles.formContainer}>
            <h3 style={styles.formTitle}>Send a Quick Message</h3>
            <form style={styles.form}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-input" placeholder="Partnership Inquiry" />
              </div>
              <div className="form-group">
                <label className="form-label">Your Email</label>
                <input type="email" className="form-input" placeholder="name@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" style={{ height: '150px' }} placeholder="Describe your inquiry..."></textarea>
              </div>
              <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Dispatch Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '5rem',
    marginTop: '4rem',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: 900,
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '3rem',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    }
  },
  cardsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  contactCard: {
    padding: '2rem',
    borderRadius: '24px',
    background: 'white',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  iconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 20px var(--accent-glow)',
  },
  name: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  role: {
    margin: '2px 0 0',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--accent-primary)',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingLeft: '0.5rem',
  },
  infoLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  locationCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.5rem 2rem',
    borderRadius: '24px',
    marginTop: '1rem',
  },
  formContainer: {
    padding: '3rem',
    borderRadius: '30px',
    background: 'white',
  },
  formTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    marginBottom: '2rem',
    marginTop: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }
};
