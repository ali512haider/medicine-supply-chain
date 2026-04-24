import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function VerifyProduct() {
  const { contracts } = useWeb3();
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!contracts.trace) return;

    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      const [isValid, recallReason] = await contracts.trace.verifyProduct(batchNumber);
      const events = await contracts.trace.getBatchHistory(batchNumber);
      
      setResult({ isValid, recallReason });
      setHistory(events);
    } catch (err) {
      console.error(err);
      setError('Product not found or verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="gradient-text">Verify Authenticity</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Enter a medicine batch number to view its complete journey.</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g., MFR-2024-B001" 
            value={batchNumber} 
            onChange={e => setBatchNumber(e.target.value)} 
            required 
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Verify'}
          </button>
        </form>

        {error && <p style={{ color: 'var(--accent-danger)', marginTop: '1rem' }}>{error}</p>}

        {result && (
          <div style={{ marginTop: '2rem' }} className="animate-fade-in">
            <div style={{ 
              padding: '1.5rem', 
              borderRadius: '12px', 
              background: result.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.isValid ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
              marginBottom: '2rem'
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0', color: result.isValid ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {result.isValid ? '✅ Authentic Product' : '❌ Invalid or Recalled'}
              </h2>
              {!result.isValid && result.recallReason && <p>Reason: {result.recallReason}</p>}
            </div>

            <h3>Timeline</h3>
            <div style={{ position: 'relative', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem', marginLeft: '1rem' }}>
              {history.map((evt, idx) => (
                <div key={idx} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-1.9rem',
                    top: '0.2rem',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)'
                  }} />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(Number(evt.timestamp) * 1000).toLocaleString()}
                  </div>
                  <strong style={{ display: 'block', margin: '0.25rem 0' }}>{evt.action}</strong>
                  <div style={{ fontSize: '0.875rem' }}>By: {evt.actor}</div>
                  {evt.note && <div style={{ fontSize: '0.875rem', fontStyle: 'italic', marginTop: '0.25rem' }}>Note: {evt.note}</div>}
                </div>
              ))}
              {history.length === 0 && <p>No history found for this batch.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
