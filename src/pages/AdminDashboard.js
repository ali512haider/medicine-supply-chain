import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function AdminDashboard() {
  const { contracts, account } = useWeb3();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!contracts.registry) return;
      try {
        // Fetch EntityRegistered events
        const filter = contracts.registry.filters.EntityRegistered();
        const events = await contracts.registry.queryFilter(filter);
        
        // We could filter for only pending, but we'd have to check each entity status
        // For simplicity in MVP, we check the status of each address
        const requests = [];
        for (let event of events) {
          const addr = event.args[0];
          const entity = await contracts.registry.getEntity(addr);
          // status 0 = Pending
          if (Number(entity.status) === 0) {
            requests.push({
              address: addr,
              role: Number(entity.role),
              name: entity.name,
              license: entity.license
            });
          }
        }
        setPendingRequests(requests);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [contracts.registry]);

  const handleApprove = async (address) => {
    try {
      const tx = await contracts.registry.approveEntity(address);
      await tx.wait();
      setPendingRequests(prev => prev.filter(req => req.address !== address));
      alert("Approved successfully!");
    } catch (err) {
      console.error(err);
      alert("Approval failed: " + (err.reason || err.message));
    }
  };

  const ROLE_NAMES = { 2: 'Manufacturer', 3: 'Distributor', 4: 'Supplier', 5: 'Pharmacist' };

  return (
    <div className="container page-content animate-fade-in">
      <h1 className="gradient-text">Admin Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Approve or reject registration requests.</p>

      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <h2>Pending Approvals</h2>
        {loading ? (
          <p>Loading requests...</p>
        ) : pendingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No pending requests found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingRequests.map(req => (
              <div key={req.address} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{req.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Role: {ROLE_NAMES[req.role]} | License: {req.license} <br/>
                    Address: {req.address}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => handleApprove(req.address)}>
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
