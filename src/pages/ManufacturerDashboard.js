import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

const STATUS_LABELS = { 0: 'Active', 1: 'Expired', 2: 'Recalled', 3: 'Depleted' };
const STATUS_COLORS = {
  0: '#22c55e',   // green
  1: '#f59e0b',   // amber
  2: '#ef4444',   // red
  3: '#6b7280',   // gray
};

const VIEWS = { ADD: 'add', DETAIL: 'detail' };

export default function ManufacturerDashboard() {
  const { contracts, account } = useWeb3();

  // ── Sidebar batches ──────────────────────────────────────────
  const [batches, setBatches]           = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // ── Main panel ───────────────────────────────────────────────
  const [view, setView]                 = useState(VIEWS.ADD);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // ── Recall ───────────────────────────────────────────────────
  const [recallReason, setRecallReason] = useState('');
  const [recallLoading, setRecallLoading] = useState(false);
  const [recallMsg, setRecallMsg]       = useState('');

  // ── Add-batch form ───────────────────────────────────────────
  const [loading, setLoading]           = useState(false);
  const [message, setMessage]           = useState('');
  const [formData, setFormData]         = useState({
    batchNumber: '', productName: '', genericName: '',
    dosageForm: 'Tablet', strength: '', manufacturerName: '',
    costPerUnit: '0', currency: 'PKR', mfgDate: '', expiryDate: '',
    totalQuantity: ''
  });

  // ── Fetch all batches for this manufacturer ──────────────────
  const fetchBatches = useCallback(async () => {
    if (!contracts.product || !account) return;
    setBatchesLoading(true);
    try {
      const batchNos = await contracts.product.getBatchesByManufacturer(account);
      const details = await Promise.all(
        batchNos.map(async (bn) => {
          const b = await contracts.product.getBatch(bn);
          return {
            batchNumber:     b.batchNumber,
            productName:     b.productName,
            genericName:     b.genericName,
            dosageForm:      b.dosageForm,
            strength:        b.strength,
            manufacturer:    b.manufacturer,
            costPerUnit:     b.costPerUnit.toString(),
            currency:        b.currency,
            mfgDate:         Number(b.mfgDate),
            expiryDate:      Number(b.expiryDate),
            totalQuantity:   b.totalQuantity.toString(),
            remainingAtSource: b.remainingAtSource.toString(),
            transferredOut:  b.transferredOut.toString(),
            status:          Number(b.status),
          };
        })
      );
      setBatches(details);
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setBatchesLoading(false);
    }
  }, [contracts.product, account]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!contracts.product) {
      setMessage('❌ ProductContract not connected. Please reconnect your wallet.');
      return;
    }
    try {
      setLoading(true);
      setMessage('⏳ Creating batch on blockchain...');
      const mfgUnix = Math.floor(new Date(formData.mfgDate).getTime() / 1000);
      const expUnix = Math.floor(new Date(formData.expiryDate).getTime() / 1000);

      const tx = await contracts.product.addBatch(
        formData.batchNumber,
        formData.productName,
        formData.genericName,
        formData.dosageForm,
        formData.strength,
        formData.manufacturerName,
        ['Active Ingredient X'],
        [100],
        ['mg'],
        formData.costPerUnit,
        formData.currency,
        mfgUnix,
        expUnix,
        formData.totalQuantity,
        '',  // qrCodeCID
        ''   // metadataCID
      );
      await tx.wait();
      setMessage('✅ Batch created successfully!');
      setFormData({
        batchNumber: '', productName: '', genericName: '',
        dosageForm: 'Tablet', strength: '', manufacturerName: '',
        costPerUnit: '0', currency: 'PKR', mfgDate: '', expiryDate: '',
        totalQuantity: ''
      });
      await fetchBatches(); // refresh sidebar
    } catch (err) {
      console.error(err);
      setMessage('❌ ' + (err.reason || err.message || 'Failed to create batch.'));
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (batch) => {
    setSelectedBatch(batch);
    setView(VIEWS.DETAIL);
    setRecallReason('');
    setRecallMsg('');
  };

  const handleRecall = async () => {
    if (!recallReason.trim()) {
      setRecallMsg('❌ Please enter a recall reason.');
      return;
    }
    if (!window.confirm(`Are you sure you want to RECALL batch "${selectedBatch.batchNumber}"? This cannot be undone.`)) return;
    try {
      setRecallLoading(true);
      setRecallMsg('⏳ Submitting recall to blockchain...');
      const tx = await contracts.product.recallBatch(selectedBatch.batchNumber, recallReason.trim());
      await tx.wait();
      setRecallMsg('✅ Batch recalled successfully. It is now marked as Recalled.');
      setRecallReason('');
      // Update local state to reflect new status
      setSelectedBatch(prev => ({ ...prev, status: 2 }));
      setBatches(prev => prev.map(b =>
        b.batchNumber === selectedBatch.batchNumber ? { ...b, status: 2 } : b
      ));
    } catch (err) {
      console.error(err);
      setRecallMsg('❌ ' + (err.reason || err.message || 'Recall failed.'));
    } finally {
      setRecallLoading(false);
    }
  };

  const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleDateString() : '-';

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', paddingTop: '80px' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '280px', minWidth: '280px',
        background: 'rgba(15,15,30,0.85)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: '70px',
        height: 'calc(100vh - 70px)', overflowY: 'auto'
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
            My Batches
          </h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} registered
          </p>
        </div>

        {/* Add Batch button */}
        <div style={{ padding: '0.75rem 1rem' }}>
          <button
            onClick={() => { setView(VIEWS.ADD); setMessage(''); }}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
          >
            + Add New Batch
          </button>
        </div>

        {/* Refresh */}
        <div style={{ padding: '0 1rem 0.5rem' }}>
          <button
            onClick={fetchBatches}
            style={{
              width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)', borderRadius: '8px', padding: '0.4rem',
              cursor: 'pointer', fontSize: '0.78rem'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Batch list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {batchesLoading ? (
            <p style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading...</p>
          ) : batches.length === 0 ? (
            <p style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No batches yet. Create your first one!
            </p>
          ) : (
            batches.map((b) => (
              <div
                key={b.batchNumber}
                onClick={() => openDetail(b)}
                style={{
                  padding: '0.85rem 1.25rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: selectedBatch?.batchNumber === b.batchNumber
                    ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderLeft: selectedBatch?.batchNumber === b.batchNumber
                    ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => {
                  if (selectedBatch?.batchNumber !== b.batchNumber)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={e => {
                  if (selectedBatch?.batchNumber !== b.batchNumber)
                    e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.productName}</span>
                  <span style={{
                    fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px',
                    background: STATUS_COLORS[b.status] + '22',
                    color: STATUS_COLORS[b.status], fontWeight: 600
                  }}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  #{b.batchNumber} &nbsp;·&nbsp; {b.totalQuantity} units
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── MAIN PANEL ── */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        {/* ── ADD BATCH VIEW ── */}
        {view === VIEWS.ADD && (
          <div className="animate-fade-in">
            <h1 className="gradient-text" style={{ marginTop: 0 }}>Add New Batch</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Register a new medicine batch on the blockchain.
            </p>

            {message && (
              <div style={{
                padding: '0.85rem 1rem',
                background: message.startsWith('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                color: message.startsWith('❌') ? 'var(--accent-danger)' : 'var(--accent-primary)',
                borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem'
              }}>
                {message}
              </div>
            )}

            <div className="glass-panel" style={{ maxWidth: '680px' }}>
              <form onSubmit={handleAddBatch}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Batch Number', name: 'batchNumber', type: 'text', placeholder: 'e.g. MFR-2024-B001' },
                    { label: 'Product Name', name: 'productName', type: 'text', placeholder: 'e.g. Panadol' },
                    { label: 'Generic Name', name: 'genericName', type: 'text', placeholder: 'e.g. Paracetamol' },
                    { label: 'Strength', name: 'strength', type: 'text', placeholder: 'e.g. 500mg' },
                    { label: 'Manufacturer Name', name: 'manufacturerName', type: 'text', placeholder: 'e.g. GSK' },
                    { label: 'Total Quantity (units)', name: 'totalQuantity', type: 'number', placeholder: 'e.g. 5000' },
                    { label: 'Cost Per Unit', name: 'costPerUnit', type: 'number', placeholder: 'e.g. 10' },
                    { label: 'Mfg Date', name: 'mfgDate', type: 'date' },
                    { label: 'Expiry Date', name: 'expiryDate', type: 'date' },
                  ].map(({ label, name, type, placeholder }) => (
                    <div className="form-group" key={name}>
                      <label className="form-label">{label}</label>
                      <input
                        type={type}
                        className="form-input"
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        required
                      />
                    </div>
                  ))}

                  <div className="form-group">
                    <label className="form-label">Dosage Form</label>
                    <select className="form-input" name="dosageForm" value={formData.dosageForm} onChange={handleChange}>
                      {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Powder'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-input" name="currency" value={formData.currency} onChange={handleChange}>
                      {['PKR', 'USD', 'EUR', 'GBP'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.5rem' }}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : '+ Create Batch'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── BATCH DETAIL VIEW ── */}
        {view === VIEWS.DETAIL && selectedBatch && (
          <div className="animate-fade-in">
            <button
              onClick={() => setView(VIEWS.ADD)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0
              }}
            >
              ← Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h1 className="gradient-text" style={{ margin: 0 }}>{selectedBatch.productName}</h1>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {selectedBatch.genericName} · {selectedBatch.dosageForm} · {selectedBatch.strength}
                </p>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: '0.8rem', padding: '4px 14px', borderRadius: '999px',
                background: STATUS_COLORS[selectedBatch.status] + '22',
                color: STATUS_COLORS[selectedBatch.status], fontWeight: 700
              }}>
                {STATUS_LABELS[selectedBatch.status]}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Batch Identity */}
              <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Batch Identity
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[
                    ['Batch Number', `#${selectedBatch.batchNumber}`],
                    ['Manufacturer', selectedBatch.manufacturer],
                    ['Currency', selectedBatch.currency],
                    ['Cost / Unit', selectedBatch.costPerUnit],
                    ['Mfg Date', fmt(selectedBatch.mfgDate)],
                    ['Expiry Date', fmt(selectedBatch.expiryDate)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Overview */}
              <div className="glass-panel">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Stock Overview
                </h3>
                {[
                  ['Total Produced', selectedBatch.totalQuantity],
                  ['Remaining at Source', selectedBatch.remainingAtSource],
                  ['Transferred Out', selectedBatch.transferredOut],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="glass-panel">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Distribution Progress
                </h3>
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Transferred Out</span>
                  <span style={{ fontWeight: 600 }}>
                    {selectedBatch.totalQuantity > 0
                      ? Math.round((Number(selectedBatch.transferredOut) / Number(selectedBatch.totalQuantity)) * 100)
                      : 0}%
                  </span>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: selectedBatch.totalQuantity > 0
                      ? `${(Number(selectedBatch.transferredOut) / Number(selectedBatch.totalQuantity)) * 100}%`
                      : '0%',
                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                    borderRadius: '99px',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                  {selectedBatch.remainingAtSource} units remaining at your facility
                </p>
              </div>

              {/* ── Recall Panel ── */}
              <div className="glass-panel" style={{
                gridColumn: '1 / -1',
                border: '1px solid rgba(239,68,68,0.25)',
                background: 'rgba(239,68,68,0.05)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef4444' }}>
                  ⚠️ Recall Batch
                </h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Blockchain data cannot be deleted. Recalling marks this batch as <strong>invalid</strong> — it can no longer be transferred or used in the supply chain. This action is <strong>permanent</strong>.
                </p>

                {recallMsg && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: recallMsg.startsWith('❌') ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.1)',
                    color: recallMsg.startsWith('❌') ? '#ef4444' : 'var(--accent-primary)',
                    borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem'
                  }}>
                    {recallMsg}
                  </div>
                )}

                {selectedBatch.status === 0 ? (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Reason for recall (e.g. contamination, quality issue)…"
                      style={{ flex: 1, minWidth: '220px' }}
                      value={recallReason}
                      onChange={e => setRecallReason(e.target.value)}
                      disabled={recallLoading}
                    />
                    <button
                      onClick={handleRecall}
                      disabled={recallLoading}
                      style={{
                        background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                        border: '1px solid #ef4444', borderRadius: '8px',
                        padding: '0.55rem 1.25rem', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.88rem',
                        opacity: recallLoading ? 0.6 : 1
                      }}
                    >
                      {recallLoading ? 'Recalling…' : '🗑️ Recall Batch'}
                    </button>
                  </div>
                ) : (
                  <p style={{ color: STATUS_COLORS[selectedBatch.status], fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                    This batch is already <strong>{STATUS_LABELS[selectedBatch.status]}</strong> — recall is not applicable.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
