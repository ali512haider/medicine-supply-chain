import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

const Icons = {
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  )
};

export default function Register() {
  const { account, contracts } = useWeb3();
  const [roleToRequest, setRoleToRequest] = useState('2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contracts.registry) {
      setIsError(true);
      setMessage('Registry contract not connected.');
      return;
    }

    try {
      setLoading(true);
      setIsError(false);
      setMessage('⌛ Transaction pending... Please confirm in MetaMask.');
      
      // Contract signature: requestRegistration(Role _role, string _name, string _email, string _location)
      const tx = await contracts.registry.requestRegistration(
        roleToRequest, 
        name, 
        email, 
        location
      );
      
      await tx.wait();
      setIsError(false);
      setMessage('✅ Registration submitted! Wait for admin approval.');
      setName(''); setEmail(''); setLocation('');
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage(err.reason || 'Failed to submit registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}><Icons.User /></div>
          <h2 style={styles.title}>Partner Registration</h2>
          <p style={styles.subtitle}>Fill in your details to join the MediChain ecosystem.</p>
        </div>

        {message && (
          <div style={{...styles.alert, ...(isError ? styles.alertError : styles.alertSuccess)}}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Role</label>
              <select style={styles.input} value={roleToRequest} onChange={e => setRoleToRequest(e.target.value)}>
                <option value="2">Manufacturer</option>
                <option value="3">Distributor</option>
                <option value="4">Supplier</option>
                <option value="5">Pharmacist</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Full Entity Name</label>
              <input style={styles.input} placeholder="e.g. HealthCare Solutions" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input style={styles.input} type="email" placeholder="contact@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Physical Location</label>
              <input style={styles.input} placeholder="City, Country" value={location} onChange={e => setLocation(e.target.value)} required />
            </div>
          </div>

          <button type="submit" disabled={loading || !account} style={{...styles.submitBtn, ...(loading ? styles.btnDisabled : {})}}>
            {loading ? 'Processing...' : 'Submit Request'}
          </button>

          {!account && <p style={styles.warnText}>⚠️ Connect wallet to submit.</p>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card: { background: '#fff', width: '100%', maxWidth: '650px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '2.5rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  iconCircle: { width: '50px', height: '50px', borderRadius: '50%', background: '#f1fdf9', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' },
  subtitle: { color: '#64748b', fontSize: '0.9rem' },
  alert: { padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' },
  alertError: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' },
  alertSuccess: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#475569' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' },
  submitBtn: { padding: '1rem', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginTop: '1rem' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  warnText: { textAlign: 'center', color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }
};
