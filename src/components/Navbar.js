import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

export default function Navbar() {
  const { account, role, status, connectWallet, disconnectWallet } = useWeb3();
  const navigate = useNavigate();

  const getDashboardRoute = () => {
    switch (role) {
      case 'Admin': return '/admin';
      case 'Manufacturer': return '/manufacturer';
      default: return '/register';
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer} className="container">
        <Link to="/" style={styles.logo}>
          <span className="gradient-text" style={{ fontWeight: 700, fontSize: '1.5rem' }}>MediChain</span>
        </Link>

        <div style={styles.navLinks}>
          <Link to="/verify" style={styles.link}>Verify Product</Link>
          {account && role !== 'None' && (
            <Link to={getDashboardRoute()} style={styles.link}>Dashboard</Link>
          )}
        </div>

        <div style={styles.auth}>
          {status === 'connected' && account ? (
            <div style={styles.accountInfo}>
              <span style={styles.roleBadge}>{role}</span>
              <div style={styles.walletDropdown} onClick={disconnectWallet}>
                {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
              </div>
            </div>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={connectWallet}
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '80px',
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  },
  link: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s ease',
  },
  auth: {
    display: 'flex',
    alignItems: 'center',
  },
  accountInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  roleBadge: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 700,
  },
  walletDropdown: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'monospace',
  }
};
