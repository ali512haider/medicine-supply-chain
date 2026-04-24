import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function Register() {
  const { account, contracts } = useWeb3();
  const [roleToRequest, setRoleToRequest] = useState('2'); // Default: Manufacturer
  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contracts.registry) return;

    try {
      setLoading(true);
      setMessage('Sending request to blockchain...');
      const tx = await contracts.registry.requestRegistration(roleToRequest, name, license);
      await tx.wait();
      setMessage('Registration request submitted successfully! Please wait for admin approval.');
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.message || 'Failed to submit registration request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content animate-fade-in">
      <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>Request Registration</h2>
        
        {message && (
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', borderRadius: '8px', marginBottom: '1.5rem' }}>
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
            <label className="form-label">Company/Entity Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">License Number</label>
            <input 
              type="text" 
              className="form-input" 
              value={license} 
              onChange={e => setLicense(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !account}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
