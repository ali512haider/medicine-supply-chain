import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function DistributorDashboard() {
  const { contracts, account } = useWeb3();
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchInbox = useCallback(async () => {
    if (!contracts.transfer || !account) return;
    setLoading(true);
    try {
      const requests = await contracts.transfer.getMyPendingInbox();
      setInbox(requests);
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
    }
  }, [contracts.transfer, account]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const handleAccept = async (id) => {
    try {
      setMessage('⌛ Accepting transfer...');
      const tx = await contracts.transfer.acceptTransfer(id, "Received at Distributor");
      await tx.wait();
      setMessage('✅ Transfer accepted successfully!');
      fetchInbox();
    } catch (err) {
      console.error(err);
      setMessage('❌ ' + (err.reason || err.message || 'Acceptance failed.'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    try {
      setMessage('⌛ Rejecting transfer...');
      const tx = await contracts.transfer.rejectTransfer(id, reason);
      await tx.wait();
      setMessage('✅ Transfer rejected.');
      fetchInbox();
    } catch (err) {
      console.error(err);
      setMessage('❌ ' + (err.reason || err.message || 'Rejection failed.'));
    }
  };

  return (
    <div className="container page-content animate-fade-in">
      <h1 className="gradient-text">Distributor Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Manage incoming medicine batches from manufacturers.</p>

      {message && (
        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      <div className="glass-panel">
        <h2>Incoming Transfers (Inbox)</h2>
        {loading ? <p>Loading...</p> : inbox.length === 0 ? <p>No pending transfers.</p> : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.8rem' }}>Batch #</th>
                  <th style={{ padding: '0.8rem' }}>From (Mfr)</th>
                  <th style={{ padding: '0.8rem' }}>Quantity</th>
                  <th style={{ padding: '0.8rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inbox.map((req) => (
                  <tr key={req.id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.8rem' }}>{req.batchNumber}</td>
                    <td style={{ padding: '0.8rem' }}>{req.sender.substring(0, 10)}...</td>
                    <td style={{ padding: '0.8rem' }}>{req.quantity.toString()} units</td>
                    <td style={{ padding: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleAccept(req.id)}>
                        Accept
                      </button>
                      <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} onClick={() => handleReject(req.id)}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
