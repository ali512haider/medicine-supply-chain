import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import Footer from '../components/Footer';

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
      <div className="container" style={{ maxWidth: '1000px', paddingBottom: '6rem' }}>
        <div className="text-center mb-4 animate-slide-up">
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            Verify <span className="gradient-text">Authenticity</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Instantly trace the origin and journey of any medicine batch using secure blockchain technology.
          </p>
        </div>

        <div className="glass-panel mb-4 animate-slide-up delay-1" style={{ padding: '2rem' }}>
          <form onSubmit={handleVerify} style={styles.searchForm}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Batch Number (e.g., MFR-2024-001)" 
              value={batchNumber} 
              onChange={e => setBatchNumber(e.target.value)} 
              required 
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '180px' }}>
              {loading ? '🔍 Tracing...' : 'Verify Product'}
            </button>
          </form>
          {error && <div className="mt-2" style={styles.errorMsg}>{error}</div>}
        </div>

        {result && (
          <div className="animate-slide-up">
            {/* Main Status Header */}
            <div style={{ 
              padding: '3rem 2rem', 
              borderRadius: '24px', 
              background: result.isActive ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: `1px solid ${result.isActive ? '#10b981' : '#ef4444'}`,
              marginBottom: '3rem',
              textAlign: 'center',
              boxShadow: 'var(--premium-shadow)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>{result.isActive ? '🛡️' : '⚠️'}</div>
              <h2 style={{ margin: '0 0 1rem 0', color: result.isActive ? '#065f46' : '#991b1b', fontSize: '2.5rem' }}>
                {result.isActive ? 'Authentic & Safe' : (result.isRecalled ? 'RECALLED' : (result.isExpired ? 'EXPIRED' : 'NOT ACTIVE'))}
              </h2>
              <p style={{ margin: 0, fontSize: '1.25rem', color: result.isActive ? '#047857' : '#b91c1c', fontWeight: 600 }}>
                {result.isActive ? 'This medicine is verified original and safe for use.' : 'Warning: This batch has been flagged and is unsafe.'}
              </p>
            </div>

            <div style={styles.detailsGrid}>
              {/* Product Info */}
              <div className="glass-panel card-hover" style={{ padding: '2.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  Batch Specification
                </h3>
                <div style={styles.specList}>
                  <SpecItem label="Product Name" value={result.productName} />
                  <SpecItem label="Generic Name" value={result.genericName} />
                  <SpecItem label="Manufacturer" value={result.manufacturer} />
                  <SpecItem label="License Number" value={result.manufacturerLicense} />
                  <SpecItem label="Manufacturing Date" value={formatDate(result.mfgDate)} />
                  <SpecItem label="Expiry Date" value={formatDate(result.expiryDate)} />
                </div>
              </div>

              {/* Timeline */}
              <div className="glass-panel card-hover" style={{ padding: '2.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Chain of Custody
                </h3>
                <div style={styles.timeline}>
                  {history.map((evt, idx) => (
                    <div key={idx} style={styles.timelineItem}>
                      <div style={styles.timelineLine} />
                      <div style={styles.timelineMarker} />
                      <div style={styles.timelineContent}>
                        <div style={styles.tlDate}>{new Date(Number(evt.timestamp) * 1000).toLocaleString()}</div>
                        <div style={styles.tlAction}>{evt.action}</div>
                        <div style={styles.tlActor}>Actor: <span style={{ fontFamily: 'monospace' }}>{evt.actor.substring(0, 10)}...</span></div>
                        {evt.note && <div style={styles.tlNote}>"{evt.note}"</div>}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Fetching secure tracking data...</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
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
  searchForm: { display: 'flex', gap: '1rem', alignItems: 'center' },
  errorMsg: { color: '#ef4444', fontWeight: 600, textAlign: 'center', padding: '1rem', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' },
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' },
  specList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  specItem: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  specLabel: { fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  specValue: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' },
  timeline: { position: 'relative', paddingLeft: '1.5rem' },
  timelineItem: { position: 'relative', paddingBottom: '3rem' },
  timelineLine: { position: 'absolute', left: '0', top: '10px', bottom: '0', width: '2px', background: 'var(--border-color)' },
  timelineMarker: { position: 'absolute', left: '-5px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid white', zIndex: 2, boxShadow: '0 0 0 2px var(--accent-glow)' },
  timelineContent: { paddingLeft: '1.5rem' },
  tlDate: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' },
  tlAction: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  tlActor: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  tlNote: { fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--accent-primary)', marginTop: '0.75rem', background: 'var(--accent-glow)', padding: '0.75rem 1rem', borderRadius: '10px', borderLeft: '3px solid var(--accent-primary)' }
};

