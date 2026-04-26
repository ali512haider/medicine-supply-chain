import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import QRScanner from '../components/QRScanner';

export default function VerifyProduct() {
  const { contracts } = useWeb3();
  const [batchNumber, setBatchNumber] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleVerify = async (bn) => {
    const targetBN = bn || batchNumber;
    if (!targetBN) return;
    setLoading(true);
    setError('');
    setProduct(null);

    try {
      const b = await contracts.product.getBatch(targetBN);
      if (!b.productName) {
        setError('Batch not found or invalid.');
        setLoading(false);
        return;
      }
      
      const formatDate = (ts) => {
        const d = new Date(Number(ts) * 1000);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
      };

      setProduct({
        name: b.productName,
        manufacturer: b.manufacturer,
        mfg: formatDate(b.mfgDate),
        exp: formatDate(b.expiryDate),
        status: Number(b.status)
      });

    } catch (err) {
      console.error(err);
      setError('Error connecting to blockchain. Please check batch number.');
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    setBatchNumber(decodedText.trim());
    handleVerify(decodedText.trim());
  };

  return (
    <div style={styles.container}>
      <QRScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={onScanSuccess} 
        onScanError={() => {}} 
      />

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Verify Medicine</h1>
          <p style={styles.subtitle}>Instant Blockchain Authenticity Check</p>
        </div>

        <div style={styles.searchSection}>
          <div style={styles.inputGroup}>
            <input 
              style={styles.input} 
              placeholder="Enter Batch Number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
            <button onClick={() => handleVerify()} className="btn btn-primary" disabled={loading} style={{padding: '0 2rem'}}>
              {loading ? '...' : 'Verify'}
            </button>
          </div>
          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>OR</span>
            <span style={styles.dividerLine}></span>
          </div>
          <button onClick={() => setIsScannerOpen(true)} className="btn btn-outline" style={styles.scannerBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><line x1="7" y1="12" x2="17" y2="12"></line></svg>
            Scan QR Code
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {product && (
          <div className="animate-fade-in" style={styles.results}>
            <div style={styles.statusBox}>
                <div style={{...styles.statusBadge, background: product.status === 0 ? '#10b981' : '#ef4444'}}>
                  {product.status === 0 ? '✓ VERIFIED AUTHENTIC' : '⚠ WARNING'}
                </div>
                {product.status !== 0 && (
                  <p style={styles.warningText}>
                    {product.status === 2 ? 'This batch has been RECALLED.' : 'This batch has EXPIRED.'}
                  </p>
                )}
            </div>

            <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Medicine Name</label>
                    <div style={styles.infoValue}>{product.name}</div>
                </div>
                <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Manufacturer</label>
                    <div style={styles.infoValue}>{product.manufacturer}</div>
                </div>
                <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Manufacturing Date</label>
                    <div style={styles.infoValue}>{product.mfg}</div>
                </div>
                <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Expiry Date</label>
                    <div style={{...styles.infoValue, color: product.status === 1 ? '#ef4444' : '#0f172a'}}>{product.exp}</div>
                </div>
            </div>
            
            <div style={styles.footerNote}>
                This data is pulled directly from the Blockchain Ledger. It cannot be tampered with or modified by third parties.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '4rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
  card: { background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b', fontSize: '0.9rem' },
  searchSection: { marginBottom: '2rem' },
  inputGroup: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  input: { flex: 1, padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', background: '#f8fafc', outline: 'none' },
  divider: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
  dividerLine: { flex: 1, height: '1px', background: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700 },
  scannerBtn: { width: '100%', borderColor: '#10b981', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem' },
  error: { padding: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 },
  results: { borderTop: '2px dashed #f1f5f9', paddingTop: '2rem' },
  statusBox: { textAlign: 'center', marginBottom: '2rem' },
  statusBadge: { display: 'inline-block', padding: '10px 24px', borderRadius: '99px', color: 'white', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.05em' },
  warningText: { color: '#ef4444', fontWeight: 700, marginTop: '10px', fontSize: '0.9rem' },
  infoGrid: { display: 'grid', gap: '1.5rem' },
  infoItem: { borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' },
  infoLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  infoValue: { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' },
  footerNote: { marginTop: '2.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', fontSize: '0.75rem', color: '#059669', lineHeight: '1.5', textAlign: 'center' }
};
