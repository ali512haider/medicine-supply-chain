import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function Register() {
  const { account, contracts } = useWeb3();
  const [roleToRequest, setRoleToRequest] = useState('2'); // Default: Manufacturer
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
      setMessage('Registry contract not connected. Please reconnect your wallet.');
      return;
    }

    try {
      setLoading(true);
      setIsError(false);
      setMessage('Sending request to blockchain...');
      // Contract signature: requestRegistration(Role _role, string _name, string _email, string _location)
      const tx = await contracts.registry.requestRegistration(roleToRequest, name, email, location);
      await tx.wait();
      setIsError(false);
      setMessage('✅ Registration request submitted! Please wait for admin approval.');
      // Reset form
      setName(''); setEmail(''); setLocation('');
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage(err.reason || err.message || 'Failed to submit registration request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content animate-fade-in">
      <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Request Registration</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Submit a registration request. The admin will review and approve your account.
        </p>

        {message && (
          <div style={{
            padding: '1rem',
            background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            color: isError ? 'var(--accent-danger)' : 'var(--accent-primary)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={roleToRequest}
              onChange={e => setRoleToRequest(e.target.value)}
            >
              <option value="2">Manufacturer</option>
              <option value="3">Distributor</option>
              <option value="4">Supplier</option>
              <option value="5">Pharmacist</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Company / Entity Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. PharmaCo Ltd."
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. contact@pharmaco.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Karachi, Pakistan"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading || !account}
          >
            {loading ? 'Submitting...' : 'Submit Registration Request'}
          </button>

          {!account && (
            <p style={{ textAlign: 'center', color: 'var(--accent-danger)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
              Please connect your wallet first.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
