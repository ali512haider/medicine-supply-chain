import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

const ROLE_NAMES = { 1: 'Admin', 2: 'Manufacturer', 3: 'Distributor', 4: 'Supplier', 5: 'Pharmacist' };

export default function AdminDashboard() {
  const { contracts, account } = useWeb3();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [licenseInputs, setLicenseInputs] = useState({});
  const [actionMsg, setActionMsg] = useState('');

  const fetchRequests = useCallback(async () => {
    if (!contracts.registry) return;
    setLoading(true);
    try {
      // ✅ FIX 1: Correct event name is 'RegistrationRequested', not 'EntityRegistered'
      const filter = contracts.registry.filters.RegistrationRequested();
      const events = await contracts.registry.queryFilter(filter);

      const requests = [];
      for (let event of events) {
        const addr = event.args.applicant || event.args[0];
        const entity = await contracts.registry.getEntity(addr);
        // ✅ FIX 2: Pending status is 1, not 0 (0 = None, 1 = Pending)
        if (Number(entity.status) === 1) {
          requests.push({
            address: addr,
            role: Number(entity.role),
            name: entity.name,
            email: entity.email,
            location: entity.location,
          });
        }
      }
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  }, [contracts.registry]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (address) => {
    // ✅ FIX 3: approveEntity requires (address, licenseNumber) — admin must supply license
    const licenseNo = licenseInputs[address]?.trim();
    if (!licenseNo) {
      setActionMsg(`❌ Please enter a license number for ${address.slice(0, 8)}... before approving.`);
      return;
    }
    try {
      setActionMsg('⏳ Submitting approval...');
      const tx = await contracts.registry.approveEntity(address, licenseNo);
      await tx.wait();
      setPendingRequests(prev => prev.filter(req => req.address !== address));
      setActionMsg(`✅ Approved successfully! License: ${licenseNo}`);
    } catch (err) {
      console.error(err);
      setActionMsg('❌ Approval failed: ' + (err.reason || err.message));
    }
  };

  const handleReject = async (address) => {
    try {
      setActionMsg('⏳ Submitting rejection...');
      const tx = await contracts.registry.rejectEntity(address);
      await tx.wait();
      setPendingRequests(prev => prev.filter(req => req.address !== address));
      setActionMsg('✅ Entity rejected.');
    } catch (err) {
      console.error(err);
      setActionMsg('❌ Rejection failed: ' + (err.reason || err.message));
    }
  };

  return (
    <div className="container page-content animate-fade-in">
      <h1 className="gradient-text">Admin Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Review and approve registration requests from entities.</p>

      {actionMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          background: actionMsg.startsWith('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
          color: actionMsg.startsWith('❌') ? 'var(--accent-danger)' : 'var(--accent-primary)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {actionMsg}
        </div>
      )}

      <div className="glass-panel" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Pending Approvals</h2>
          <button className="btn btn-primary" onClick={fetchRequests} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading requests...</p>
        ) : pendingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>✅ No pending requests found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {pendingRequests.map(req => (
              <div key={req.address} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{req.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Role:</strong> {ROLE_NAMES[req.role]} &nbsp;|&nbsp;
                      <strong>Email:</strong> {req.email} &nbsp;|&nbsp;
                      <strong>Location:</strong> {req.location}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {req.address}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Assign License No. (e.g. MFR-001)"
                    style={{ flex: 1, minWidth: '180px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    value={licenseInputs[req.address] || ''}
                    onChange={e => setLicenseInputs(prev => ({ ...prev, [req.address]: e.target.value }))}
                  />
                  <button className="btn btn-primary" onClick={() => handleApprove(req.address)}>
                    ✅ Approve
                  </button>
                  <button
                    className="btn"
                    style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-danger)', border: '1px solid var(--accent-danger)' }}
                    onClick={() => handleReject(req.address)}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
