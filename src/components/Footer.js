import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container footer-content" style={styles.content}>
        
        {/* Brand & Mission */}
        <div style={styles.brandCol} className="footer-brand">
          <Link to="/" style={styles.logoLink}>
            <img src={logo} alt="MediTrace" style={styles.logoImg} />
            <span style={styles.logoText}>Medi<span className="gradient-text">Trace</span></span>
          </Link>
          <p style={styles.brandDesc}>
            Securing the global pharmaceutical supply chain through immutable blockchain technology. 
            Designed for trust, transparency, and patient safety.
          </p>
          <div style={styles.socials}>
            <SocialIcon icon="LN" />
            <SocialIcon icon="GH" />
            <SocialIcon icon="TW" />
          </div>
        </div>

        {/* Links Grid */}
        <div style={styles.linksGrid} className="footer-links-grid">
          <div style={styles.linkCol}>
            <h4 style={styles.colTitle}>Platform</h4>
            <Link to="/" style={styles.link}>Home</Link>
            <Link to="/verify" style={styles.link}>Trace Medicine</Link>
            <Link to="/register" style={styles.link}>Registration</Link>
          </div>
          <div style={styles.linkCol}>
            <h4 style={styles.colTitle}>Company</h4>
            <Link to="/about" style={styles.link}>About Us</Link>
            <Link to="/contact" style={styles.link}>Contact Team</Link>
            <Link to="#" style={styles.link}>Privacy Policy</Link>
          </div>
          <div style={styles.linkCol}>
            <h4 style={styles.colTitle}>Support</h4>
            <span style={styles.supportInfo}>UET Taxila, Pakistan</span>
            <span style={styles.supportInfo}>+92-325-8527293</span>
            <span style={styles.supportInfo}>support@meditrace.io</span>
          </div>
        </div>

      </div>

      <div style={styles.bottomBar}>
        <div className="container footer-bottom" style={styles.bottomContent}>
          <p style={styles.copyright}>© 2026 MediTrace Blockchain. Developed at UET Taxila.</p>
          <div style={styles.bottomLinks}>
            <span style={styles.status}>Network: <span style={{color: '#10b981', fontWeight: 700}}>Operational</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const SocialIcon = ({ icon }) => (
  <div style={styles.socialIcon}>{icon}</div>
);

const styles = {
  footer: {
    background: '#f8fafc',
    borderTop: '2px solid #e2e8f0',
    padding: '6rem 0 0',
    marginTop: '8rem',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.02)',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr',
    gap: '4rem',
    paddingBottom: '5rem',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
      gap: '3rem',
    }
  },
  brandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  logoImg: {
    height: '32px',
    width: 'auto',
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: '#0f172a',
    marginLeft: '10px',
  },
  brandDesc: {
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    maxWidth: '320px',
    margin: 0,
  },
  socials: {
    display: 'flex',
    gap: '0.75rem',
  },
  socialIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  linksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    }
  },
  linkCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  colTitle: {
    fontSize: '0.8rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#0f172a',
    marginBottom: '1rem',
  },
  link: {
    textDecoration: 'none',
    color: '#64748b',
    fontSize: '0.95rem',
    fontWeight: 500,
    transition: 'color 0.2s ease',
  },
  supportInfo: {
    color: '#64748b',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  bottomBar: {
    background: 'white',
    padding: '2rem 0',
    borderTop: '1px solid #f1f5f9',
  },
  bottomContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyright: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: 0,
  },
  status: {
    fontSize: '0.85rem',
    color: '#64748b',
  }
};
