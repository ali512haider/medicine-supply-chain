import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import logo from '../assets/logo.png';

export default function Navbar() {
  const { account, role, status, connectWallet, disconnectWallet } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardRoute = () => {
    switch (role) {
      case 'Admin': return '/admin';
      case 'Manufacturer': return '/manufacturer';
      case 'Distributor': return '/distributor';
      case 'Supplier': return '/supplier';
      case 'Pharmacist': return '/pharmacist';
      default: return '/register';
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Trace Medicine', path: '/verify' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav style={{
      ...styles.navbar,
      background: scrolled ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(226, 232, 240, 0.8)' : 'none'
    }}>
      <div className="container" style={styles.navContainer}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <img src={logo} alt="MediChain" style={styles.logoImg} />
        </Link>

        {/* Desktop Links */}
        <div style={styles.desktopNav}>
          {navLinks.map(link => (
            <Link 
              key={link.name} 
              to={link.path} 
              style={{
                ...styles.navLink,
                color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-primary)'
              }}
            >
              {link.name}
              {location.pathname === link.path && <div style={styles.activeIndicator} />}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div style={styles.authGroup}>
          {status === 'connected' && account ? (
            <div style={styles.userInfo}>
              <Link to={getDashboardRoute()} className="btn btn-primary" style={styles.dashboardBtn}>
                Dashboard
              </Link>
              <div style={styles.accountBadge} onClick={disconnectWallet}>
                <div style={styles.avatar}>{account.slice(2, 4).toUpperCase()}</div>
                <span className="hide-mobile" style={styles.accountAddr}>
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={connectWallet} className="btn btn-outline" style={{ border: 'none', background: 'transparent' }}>
                Login
              </button>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
                Register
              </Link>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <button style={styles.menuToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {navLinks.map(link => (
            <Link key={link.name} to={link.path} onClick={() => setMobileMenuOpen(false)} style={styles.mobileNavLink}>
              {link.name}
            </Link>
          ))}
          {!account && (
             <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={styles.mobileNavLink}>Register Now</Link>
          )}
        </div>
      )}
    </nav>
  );
}

const styles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--header-height)',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1000,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  logoImg: {
    height: '45px',
    width: 'auto',
    objectFit: 'contain',
  },
  desktopNav: {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'center',
  },
  navLink: {
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    position: 'relative',
    transition: 'color 0.2s ease',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '20px',
    height: '3px',
    background: 'var(--accent-primary)',
    borderRadius: '2px',
  },
  authGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  dashboardBtn: {
    fontSize: '0.85rem',
    padding: '0.5rem 1.25rem',
  },
  accountBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '4px',
    paddingRight: '12px',
    background: '#f8fafc',
    borderRadius: '99px',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  accountAddr: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
  },
  menuToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#0f172a',
    padding: '0.5rem',
  },
  mobileMenu: {
    position: 'absolute',
    top: 'var(--header-height)',
    left: 0,
    right: 0,
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  mobileNavLink: {
    textDecoration: 'none',
    color: '#0f172a',
    fontWeight: 600,
    padding: '0.5rem',
    borderBottom: '1px solid #f1f5f9',
  }
};

