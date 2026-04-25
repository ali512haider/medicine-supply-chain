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
      setError('Connecting to blockchain network...');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      setHistory([]);
      
      const verificationData = await contracts.trace.verifyProduct(targetBatch);
      if (!verificationData.batchFound) {
        setError('❌ This Batch Number was not found in our secure ledger.');
        return;
      }

      setResult(verificationData);
      const events = await contracts.trace.getFullHistory(targetBatch);
      setHistory(events);
    } catch (err) {
      console.error(err);
      setError('An error occurred during verification.');
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
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: '1000px', paddingBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            Verify <span className="gradient-text">Authenticity</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Instantly trace the origin and journey of any medicine batch using blockchain technology.
          </p>
        </div>

        <div className="glass-panel" style={{ marginBottom: '3rem', padding: '1.5rem' }}>
          <form onSubmit={handleVerify} style={styles.searchForm}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Batch Number (e.g., MFR-2024-001)" 
              value={batchNumber} 
              onChange={e => setBatchNumber(e.target.value)} 
              required 
              style={styles.searchInput}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={styles.searchBtn}>
              {loading ? '🔍 Tracing...' : 'Verify Product'}
            </button>
          </form>
          {error && <div style={styles.errorMsg}>{error}</div>}
        </div>

        {result && (
          <div className="animate-fade-in">
            {/* Main Status Header */}
            <div style={{ 
              padding: '2.5rem', 
              borderRadius: '20px', 
              background: result.isActive ? '#f0fdf4' : '#fef2f2',
              border: `2px solid ${result.isActive ? '#10b981' : '#ef4444'}`,
              marginBottom: '3rem',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{result.isActive ? '🛡️' : '⚠️'}</div>
              <h2 style={{ margin: '0 0 0.75rem 0', color: result.isActive ? '#065f46' : '#991b1b', fontSize: '2.5rem', fontWeight: 800 }}>
                {result.isActive ? 'Authentic & Safe' : (result.isRecalled ? 'RECALLED' : (result.isExpired ? 'EXPIRED' : 'NOT ACTIVE'))}
              </h2>
              <p style={{ margin: 0, fontSize: '1.2rem', color: result.isActive ? '#047857' : '#b91c1c', fontWeight: 500 }}>
                {result.isActive ? 'This medicine is verified original and safe for consumption.' : 'This batch has been flagged as unsafe or inactive.'}
              </p>
            </div>

            <div style={styles.detailsGrid}>
              {/* Product Info Table */}
              <div className="glass-panel" style={{ border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Product Specification</h3>
                <div style={styles.specList}>
                  <SpecItem label="Product Name" value={result.productName} />
                  <SpecItem label="Generic Name" value={result.genericName} />
                  <SpecItem label="Manufacturer" value={result.manufacturer} />
                  <SpecItem label="License Number" value={result.manufacturerLicense} />
                  <SpecItem label="Manufacturing Date" value={formatDate(result.mfgDate)} />
                  <SpecItem label="Expiry Date" value={formatDate(result.expiryDate)} />
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="glass-panel" style={{ border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Chain of Custody</h3>
                <div style={styles.timeline}>
                  {history.map((evt, idx) => (
                    <div key={idx} style={styles.timelineItem}>
                      <div style={styles.timelineLine} />
                      <div style={styles.timelineMarker} />
                      <div style={styles.timelineContent}>
                        <div style={styles.tlDate}>{new Date(Number(evt.timestamp) * 1000).toLocaleString()}</div>
                        <div style={styles.tlAction}>{evt.action}</div>
                        <div style={styles.tlActor}>Actor: {evt.actor.substring(0, 12)}...</div>
                        {evt.note && <div style={styles.tlNote}>"{evt.note}"</div>}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No tracking data available.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SpecItem = ({ label, value }) => (
  <div style={styles.specItem}>
    <label style={styles.specLabel}>{label}</label>
    <div style={styles.specValue}>{value}</div>
  </div>
);

const styles = {
  searchForm: { display: 'flex', gap: '1rem', '@media (max-width: 640px)': { flexDirection: 'column' } },
  searchInput: { flex: 1, padding: '1rem 1.5rem', fontSize: '1.1rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '12px' },
  searchBtn: { padding: '0 2rem', fontSize: '1rem', height: 'auto' },
  errorMsg: { color: '#ef4444', marginTop: '1.5rem', fontWeight: 600, textAlign: 'center', padding: '1rem', background: '#fef2f2', borderRadius: '8px' },
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', '@media (max-width: 900px)': { gridTemplateColumns: '1fr' } },
  specList: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  specItem: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  specLabel: { fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  specValue: { fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' },
  timeline: { position: 'relative', paddingLeft: '1.5rem' },
  timelineItem: { position: 'relative', paddingBottom: '2.5rem' },
  timelineLine: { position: 'absolute', left: '0', top: '10px', bottom: '0', width: '2px', background: '#f1f5f9' },
  timelineMarker: { position: 'absolute', left: '-5px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '3px solid white', zIndex: 2 },
  timelineContent: { paddingLeft: '1rem' },
  tlDate: { fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.25rem' },
  tlAction: { fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' },
  tlActor: { fontSize: '0.85rem', color: '#64748b' },
  tlNote: { fontSize: '0.85rem', fontStyle: 'italic', color: '#10b981', marginTop: '0.5rem', background: '#f0fdf4', padding: '0.5rem', borderRadius: '6px' }
};
