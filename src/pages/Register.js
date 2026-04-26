import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

export default function Register() {
  const { contracts, account, status, connectWallet } = useWeb3();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    location: '', 
    role: '2' 
  }); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      setError('Please connect your wallet first.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Corrected function name and parameters according to RegistryContract.sol
      const tx = await contracts.registry.requestRegistration(
        parseInt(formData.role),
        formData.name,
        formData.email,
        formData.location
      );
      await tx.wait();
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.reason || 'Registration failed. Check if you are already registered or all fields are filled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content animate-fade-in" style={styles.page}>
      <Modal 
        isOpen={showSuccess} 
        onClose={() => navigate('/')} 
        title="Registration Submitted"
        footer={<button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>}
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <p>Your registration request has been successfully submitted to the blockchain.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Please wait for a system administrator to verify and approve your organization.
          </p>
        </div>
      </Modal>

      <div className="container" style={styles.container}>
        <div className="glass-panel" style={styles.card}>
          <div style={styles.header}>
            <div style={styles.icon}>🏢</div>
            <h1 style={styles.title}>Join the <span className="gradient-text">Network</span></h1>
            <p style={styles.subtitle}>Register your entity to participate in the secure medicine supply chain.</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Pharma Global Inc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. contact@pharma.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. New York, USA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Entity Role</label>
              <select 
                className="form-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="2">Manufacturer</option>
                <option value="3">Distributor</option>
                <option value="4">Supplier</option>
                <option value="5">Pharmacist</option>
              </select>
            </div>

            <div style={styles.walletInfo}>
              <div style={styles.walletLabel}>Connected Wallet</div>
              <div style={styles.walletAddr}>
                {account ? `${account.substring(0, 12)}...${account.substring(account.length - 8)}` : 'No Wallet Connected'}
              </div>
            </div>

            {status !== 'connected' ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={connectWallet}
                style={{ ...styles.submitBtn, background: 'var(--accent-secondary)' }}
              >
                Connect Wallet to Register
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
                style={styles.submitBtn}
              >
                {loading ? 'Processing Registration...' : 'Submit for Approval'}
              </button>
            )}
          </form>

          <p style={styles.footer}>
            Note: All registrations require verification by a system administrator before access is granted.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05), transparent)',
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  input: {
    padding: '0.875rem',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    fontSize: '1rem',
  },
  walletInfo: {
    background: '#f0fdf4',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid #d1fae5',
    marginBottom: '0.5rem',
  },
  walletLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  walletAddr: {
    fontSize: '0.9rem',
    fontFamily: 'monospace',
    color: '#047857',
    wordBreak: 'break-all',
  },
  submitBtn: {
    padding: '1rem',
    fontSize: '1.1rem',
    marginTop: '1rem',
  },
  error: {
    background: '#fef2f2',
    color: '#ef4444',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid #fee2e2',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    textAlign: 'center',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#94a3b8',
    lineHeight: 1.5,
  }
};
