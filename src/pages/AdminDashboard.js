import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const ROLE_NAMES = { 1: 'Admin', 2: 'Manufacturer', 3: 'Distributor', 4: 'Supplier', 5: 'Pharmacist' };

export default function AdminDashboard() {
  const { contracts, account } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState({ mfr: 0, dist: 0, supp: 0, pharm: 0, batches: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [entities, setEntities] = useState({ manufacturers: [], distributors: [], suppliers: [], pharmacists: [] });
  const [allBatches, setAllBatches] = useState([]);
  const [licenseInputs, setLicenseInputs] = useState({});
  const [actionMsg, setActionMsg] = useState('');
  const [traceBatch, setTraceBatch] = useState('');

  // Fetch Stats & Basic Data
  const fetchData = useCallback(async () => {
    if (!contracts.registry || !contracts.product) {
      console.warn("Contracts not initialized yet");
      return;
    }
    setLoading(true);
    try {
      console.log("Admin: Fetching data...");
      
      // 1. Get All Entities (Try new getter, fallback to events)
      let allAddresses = [];
      try {
        allAddresses = await contracts.registry.getAllEntities();
        console.log("Fetched entities via getter:", allAddresses.length);
      } catch (e) {
        console.log("Getter failed, falling back to events...");
        const filter = contracts.registry.filters.RegistrationRequested();
        const events = await contracts.registry.queryFilter(filter);
        allAddresses = [...new Set(events.map(ev => ev.args?.applicant || ev.args[0]))];
      }

      const pending = [];
      const mfrs = [];
      const dists = [];
      const supps = [];
      const pharms = [];

      for (let addr of allAddresses) {
        try {
          const entity = await contracts.registry.getEntity(addr);
          const data = {
            address: addr,
            role: Number(entity.role),
            name: entity.name,
            email: entity.email,
            location: entity.location,
            status: Number(entity.status),
            license: entity.licenseNumber
          };

          if (data.status === 1) pending.push(data); 
          else if (data.status === 2) { 
            if (data.role === 2) mfrs.push(data);
            else if (data.role === 3) dists.push(data);
            else if (data.role === 4) supps.push(data);
            else if (data.role === 5) pharms.push(data);
          }
        } catch (err) { console.error("Error fetching entity", addr, err); }
      }

      // 2. Fetch All Batches
      let batchIds = [];
      try {
        batchIds = await contracts.product.getAllBatches();
      } catch (e) {
        const bFilter = contracts.product.filters.BatchAdded();
        const bEvents = await contracts.product.queryFilter(bFilter);
        // Note: indexed strings are hashes, but maybe we can try queryFilter for other events
        // Better fallback: just use the ones we found via events if getter fails
        batchIds = bEvents.map(ev => ev.args?.batchNumber || ev.args[0]);
      }

      const batches = [];
      for (let bid of batchIds) {
        try {
          // If bid is a hash (from indexed string), getBatch might fail. 
          // This is why the contract change was important.
          const b = await contracts.product.getBatch(bid);
          batches.push(b);
        } catch (err) { console.error("Error fetching batch", bid, err); }
      }

      setPendingRequests(pending);
      setEntities({ manufacturers: mfrs, distributors: dists, suppliers: supps, pharmacists: pharms });
      setAllBatches(batches);
      setStats({
        mfr: mfrs.length, dist: dists.length, supp: supps.length, pharm: pharms.length, batches: batches.length
      });

    } catch (err) {
      console.error('Admin Dashboard Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [contracts.registry, contracts.product]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (address) => {
    const lic = licenseInputs[address]?.trim();
    if (!lic) { setActionMsg('❌ License required'); return; }
    try {
      setActionMsg('⏳ Approving...');
      const tx = await contracts.registry.approveEntity(address, lic);
      await tx.wait();
      setActionMsg('✅ Approved');
      fetchData();
    } catch (err) { setActionMsg('❌ Error: ' + err.message); }
  };

  const handleReject = async (address) => {
    try {
      setActionMsg('⏳ Rejecting...');
      const tx = await contracts.registry.rejectEntity(address);
      await tx.wait();
      setActionMsg('✅ Rejected');
      fetchData();
    } catch (err) { setActionMsg('❌ Error: ' + err.message); }
  };

  // --- RENDERING HELPERS ---

  const renderOverview = () => (
    <div style={styles.grid}>
      <StatCard title="Manufacturers" value={stats.mfr} icon="🏭" color="#10b981" />
      <StatCard title="Distributors" value={stats.dist} icon="🚚" color="#3b82f6" />
      <StatCard title="Suppliers" value={stats.supp} icon="📦" color="#f59e0b" />
      <StatCard title="Pharmacists" value={stats.pharm} icon="💊" color="#8b5cf6" />
      <StatCard title="Total Batches" value={stats.batches} icon="🔢" color="#06b6d4" />
      <StatCard title="Pending Requests" value={pendingRequests.length} icon="🔔" color="#ef4444" />
    </div>
  );

  const renderApprovals = () => (
    <div className="glass-panel" style={styles.lightPanel}>
      <h2 style={{color: '#1e293b'}}>Pending Registration Requests</h2>
      {pendingRequests.length === 0 ? <p>No pending requests.</p> : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Name</th>
                <th>Role</th>
                <th>Location</th>
                <th>License Input</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map(req => (
                <tr key={req.address} style={styles.tableRow}>
                  <td>{req.name}</td>
                  <td><span style={styles.badge}>{ROLE_NAMES[req.role]}</span></td>
                  <td>{req.location}</td>
                  <td>
                    <input 
                      style={styles.inlineInput} 
                      placeholder="License #" 
                      value={licenseInputs[req.address] || ''}
                      onChange={e => setLicenseInputs({...licenseInputs, [req.address]: e.target.value})}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleApprove(req.address)} style={styles.btnApprove}>Approve</button>
                    <button onClick={() => handleReject(req.address)} style={styles.btnReject}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderEntities = (type) => {
    const list = entities[type];
    return (
      <div className="glass-panel" style={styles.lightPanel}>
        <h2 style={{textTransform: 'capitalize', color: '#1e293b'}}>{type}</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Name</th>
                <th>Address</th>
                <th>License</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {list.map(e => (
                <tr key={e.address} style={styles.tableRow}>
                  <td>{e.name}</td>
                  <td style={{fontSize: '0.8rem', fontFamily: 'monospace'}}>{e.address.slice(0,10)}...</td>
                  <td>{e.license}</td>
                  <td>{e.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBatches = (filterType) => {
    let filtered = allBatches;
    if (filterType === 'expired') filtered = allBatches.filter(b => Number(b.status) === 1);
    if (filterType === 'recalled') filtered = allBatches.filter(b => Number(b.status) === 2);

    return (
      <div className="glass-panel" style={styles.lightPanel}>
        <h2 style={{textTransform: 'capitalize', color: '#1e293b'}}>{filterType} Batches</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Batch #</th>
                <th>Product</th>
                <th>Manufacturer</th>
                <th>Status</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.batchNumber} style={styles.tableRow}>
                  <td>{b.batchNumber}</td>
                  <td>{b.productName}</td>
                  <td>{b.manufacturer}</td>
                  <td><span style={{...styles.badge, background: b.status.toString() === '0' ? '#10b981' : '#ef4444'}}>{Number(b.status) === 0 ? 'Active' : (Number(b.status) === 1 ? 'Expired' : 'Recalled')}</span></td>
                  <td>{new Date(Number(b.expiryDate)*1000).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.adminWrapper}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarBrand}>MediChain Admin</div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="📊" label="Overview" />
          <NavItem active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} icon="🔔" label="Approvals" />
          <NavItem active={activeTab === 'manufacturers'} onClick={() => setActiveTab('manufacturers')} icon="🏭" label="Manufacturers" />
          <NavItem active={activeTab === 'distributors'} onClick={() => setActiveTab('distributors')} icon="🚚" label="Distributors" />
          <NavItem active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} icon="📦" label="Suppliers" />
          <NavItem active={activeTab === 'pharmacists'} onClick={() => setActiveTab('pharmacists')} icon="💊" label="Pharmacists" />
          <NavItem active={activeTab === 'expired'} onClick={() => setActiveTab('expired')} icon="⌛" label="Expired Goods" />
          <NavItem active={activeTab === 'recalled'} onClick={() => setActiveTab('recalled')} icon="⚠️" label="Recalled Batches" />
          <NavItem active={activeTab === 'trace'} onClick={() => setActiveTab('trace')} icon="🔍" label="Trace Product" />
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={{margin: 0, color: '#1e293b', fontSize: '1.5rem'}}>Administrator Panel</h1>
            <p style={{margin: 0, color: '#64748b', fontSize: '0.875rem'}}>Welcome back, {account?.slice(0,10)}...</p>
          </div>
          {actionMsg && <div style={styles.toast}>{actionMsg}</div>}
        </header>

        <div style={styles.content}>
          {loading ? <div style={{textAlign: 'center', padding: '3rem'}}>Loading dashboard data...</div> : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'approvals' && renderApprovals()}
              {activeTab === 'manufacturers' && renderEntities('manufacturers')}
              {activeTab === 'distributors' && renderEntities('distributors')}
              {activeTab === 'suppliers' && renderEntities('suppliers')}
              {activeTab === 'pharmacists' && renderEntities('pharmacists')}
              {activeTab === 'expired' && renderBatches('expired')}
              {activeTab === 'recalled' && renderBatches('recalled')}
              {activeTab === 'trace' && (
                <div className="glass-panel" style={styles.lightPanel}>
                  <h2 style={{color: '#1e293b'}}>Trace Medicine Batch</h2>
                  <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                    <input 
                      className="form-input" 
                      style={{...styles.inlineInput, width: '300px', background: '#fff', color: '#000'}} 
                      placeholder="Enter Batch Number..." 
                      value={traceBatch}
                      onChange={e => setTraceBatch(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={() => window.location.href=`/verify?batch=${traceBatch}`}>
                      🔍 Trace Journey
                    </button>
                  </div>
                  <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#64748b'}}>
                    This will take you to the public verification page with advanced tracing details.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <div style={{...styles.statCard, borderLeft: `4px solid ${color}`}}>
    <div style={styles.statIcon}>{icon}</div>
    <div style={styles.statInfo}>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  </div>
);

const NavItem = ({ active, onClick, icon, label }) => (
  <div onClick={onClick} style={{...styles.navItem, ...(active ? styles.navItemActive : {})}}>
    <span style={{marginRight: '0.75rem'}}>{icon}</span>
    {label}
  </div>
);

const styles = {
  adminWrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc', // Professional light gray background
    color: '#334155',
    fontFamily: 'inherit',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2000, // Cover the main app for admin
  },
  sidebar: {
    width: '260px',
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 0',
  },
  sidebarBrand: {
    fontSize: '1.25rem',
    fontWeight: 700,
    padding: '0 1.5rem 2rem 1.5rem',
    color: '#10b981', // Professional green
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  navItem: {
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '0.925rem',
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  navItemActive: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    borderRight: '3px solid #10b981',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    height: '80px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  content: {
    padding: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
  },
  statCard: {
    background: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIcon: {
    fontSize: '2rem',
  },
  statTitle: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  lightPanel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '1.5rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#f1f5f9',
    textAlign: 'left',
    color: '#475569',
    fontSize: '0.875rem',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.9rem',
  },
  badge: {
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    background: '#e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  inlineInput: {
    padding: '0.4rem 0.6rem',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    width: '120px',
  },
  btnApprove: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  btnReject: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  toast: {
    padding: '0.5rem 1rem',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '0.875rem',
  }
};
