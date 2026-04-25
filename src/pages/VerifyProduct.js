import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function VerifyProduct() {
  const { contracts } = useWeb3();
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const handleVerify = useCallback(async (e, manualBatch) => {
    if (e) e.preventDefault();
    const targetBatch = manualBatch || batchNumber;
    if (!targetBatch) return;
    if (!contracts.trace) {
      setError('Connecting to blockchain... Please wait or refresh.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      setHistory([]);
      
      const verificationData = await contracts.trace.verifyProduct(targetBatch);
      if (!verificationData.batchFound) {
        setError('❌ Batch not found on the blockchain.');
        return;
      }

      setResult(verificationData);
      const events = await contracts.trace.getFullHistory(targetBatch);
      setHistory(events);
    } catch (err) {
      console.error(err);
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  }, [contracts.trace, batchNumber]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchParam = params.get('batch');
    if (batchParam && contracts.trace) {
      setBatchNumber(batchParam);
      handleVerify(null, batchParam);
    }
  }, [contracts.trace, handleVerify]);

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  return (
    <div className="container page-content animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="gradient-text">Verify Authenticity</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Enter a medicine batch number to view its complete journey.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
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
              {loading ? 'Searching...' : 'Verify Product'}
            </button>
          </form>
          {error && <p style={{ color: 'var(--accent-danger)', marginTop: '1rem', fontWeight: 500 }}>{error}</p>}
        </div>

        {result && (
          <div className="animate-fade-in">
            {/* Authenticity Card */}
            <div style={{ 
              padding: '2rem', 
              borderRadius: '16px', 
              background: result.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.isActive ? '#22c55e' : '#ef4444'}`,
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0', color: result.isActive ? '#22c55e' : '#ef4444', fontSize: '2rem' }}>
                {result.isActive ? '✅ Authentic & Safe' : (result.isRecalled ? '⚠️ RECALLED' : (result.isExpired ? '⌛ EXPIRED' : '❌ NOT ACTIVE'))}
              </h2>
              <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.8 }}>
                {result.isActive ? 'This product is verified original and is currently active in the supply chain.' : 'This product should not be consumed.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
              {/* Product Info */}
              <div>
                <div className="glass-panel" style={{ height: '100%' }}>
                  <h3 style={{ marginTop: 0 }}>Product Details</h3>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <label>Product Name</label>
                      <span>{result.productName}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <label>Generic Name</label>
                      <span>{result.genericName}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <label>Manufacturer</label>
                      <span>{result.manufacturer}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <label>License #</label>
                      <span style={{ fontSize: '0.8rem' }}>{result.manufacturerLicense}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <label>Mfg Date</label>
                      <span>{formatDate(result.mfgDate)}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <label>Expiry Date</label>
                      <span>{formatDate(result.expiryDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="glass-panel">
                <h3 style={{ marginTop: 0 }}>Supply Chain Journey</h3>
                <div style={styles.timeline}>
                  {history.map((evt, idx) => (
                    <div key={idx} style={styles.timelineItem}>
                      <div style={styles.timelinePoint} />
                      <div style={styles.timelineDate}>
                        {new Date(Number(evt.timestamp) * 1000).toLocaleString()}
                      </div>
                      <strong style={styles.timelineAction}>{evt.action}</strong>
                      <div style={styles.timelineActor}>By: {evt.actor.substring(0, 15)}...</div>
                      {evt.note && <div style={styles.timelineNote}>{evt.note}</div>}
                    </div>
                  ))}
                  {history.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No history events recorded yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  timeline: {
    position: 'relative',
    borderLeft: '2px solid rgba(255,255,255,0.1)',
    paddingLeft: '1.5rem',
    marginLeft: '1rem',
    marginTop: '1.5rem',
  },
  timelineItem: {
    marginBottom: '2rem',
    position: 'relative',
  },
  timelinePoint: {
    position: 'absolute',
    left: '-1.9rem',
    top: '0.3rem',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    boxShadow: '0 0 10px var(--accent-primary)',
  },
  timelineDate: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  timelineAction: {
    display: 'block',
    fontSize: '1rem',
    marginBottom: '0.25rem',
  },
  timelineActor: {
    fontSize: '0.85rem',
    opacity: 0.7,
  },
  timelineNote: {
    fontSize: '0.85rem',
    fontStyle: 'italic',
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
  }
};
