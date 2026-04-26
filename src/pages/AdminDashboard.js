import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import Modal from '../components/Modal';

// --- Professional Emerald SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  ),
  Medicine: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 21H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"></path><path d="M10 5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"></path><path d="M4 11h16"></path><path d="M8 15h.01"></path><path d="M16 15h.01"></path></svg>
  ),
  Activity: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  LogOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  )
};

export default function AdminDashboard() {
  const { contracts, account, disconnectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Modal & Input State
  const [modal, setModal] = useState({ isOpen: false, title: '', type: '', data: null });
  const [licenseInput, setLicenseInput] = useState('');

  // Data State
  const [allUsers, setAllUsers] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [stats, setStats] = useState({ 
    total: 0, pending: 0, active: 0, 
    manufacturers: 0, distributors: 0, suppliers: 0, pharmacists: 0,
    batches: 0
  });
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    if (!contracts.registry || !contracts.product) return;
    setLoading(true);
    try {
      const allAddrs = await contracts.registry.getAllRegistered();
      const list = [];
      let pCount = 0, aCount = 0, mCount = 0, dCount = 0, sCount = 0, phCount = 0;

      for (let addr of allAddrs) {
        const entity = await contracts.registry.getEntity(addr);
        const data = {
          address: addr,
          name: entity.name,
          email: entity.email,
          location: entity.location,
          role: Number(entity.role),
          status: Number(entity.status)
        };
        list.push(data);
        if (data.status === 1) pCount++;
        if (data.status === 2) {
          aCount++;
          if (data.role === 2) mCount++;
          if (data.role === 3) dCount++;
          if (data.role === 4) sCount++;
          if (data.role === 5) phCount++;
        }
      }
      setAllUsers(list);

      const allBatchNos = await contracts.product.getAllBatchNumbers();
      const batchesList = [];
      for (let bn of allBatchNos) {
        const b = await contracts.product.getBatch(bn);
        const s = await contracts.product.getBatchStatus(bn);
        batchesList.push({
          batchNumber: bn,
          productName: b.productName,
          manufacturer: b.manufacturer,
          status: Number(s)
        });
      }
      setAllBatches(batchesList.reverse());

      setStats({ 
        total: list.length, pending: pCount, active: aCount,
        manufacturers: mCount, distributors: dCount, suppliers: sCount, pharmacists: phCount,
        batches: allBatchNos.length
      });

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      setActionMsg('❌ Sync Error');
    } finally {
      setLoading(false);
    }
  }, [contracts.registry, contracts.product]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openApproveModal = (userAddr) => {
    setLicenseInput('');
    setModal({ isOpen: true, title: 'Approve Entity', type: 'approve', data: userAddr });
  };

  const openRejectModal = (userAddr) => {
    setModal({ isOpen: true, title: 'Confirm Rejection', type: 'reject', data: userAddr });
  };

  const handleApprove = async () => {
    if (!licenseInput) return;
    const userAddr = modal.data;
    try {
      setActionMsg('⏳ Approving...');
      setModal({ ...modal, isOpen: false });
      const tx = await contracts.registry.approveEntity(userAddr, licenseInput);
      await tx.wait();
      setActionMsg('✅ Approved!');
      fetchData();
    } catch (err) { setActionMsg('❌ Approval Failed'); }
  };

  const handleReject = async () => {
    const userAddr = modal.data;
    try {
      setActionMsg('⏳ Rejecting...');
      setModal({ ...modal, isOpen: false });
      const tx = await contracts.registry.rejectEntity(userAddr);
      await tx.wait();
      setActionMsg('✅ Rejected!');
      fetchData();
    } catch (err) { setActionMsg('❌ Rejection Failed'); }
  };

  const roleNames = ["None", "Admin", "Manufacturer", "Distributor", "Supplier", "Pharmacist"];

  return (
    <div style={styles.dashboardWrapper}>
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal({ ...modal, isOpen: false })}>Cancel</button>
            <button 
              className={`btn ${modal.type === 'reject' ? 'btn-danger' : 'btn-primary'}`} 
              onClick={modal.type === 'approve' ? handleApprove : handleReject}
              style={modal.type === 'reject' ? { background: '#ef4444', color: 'white', border: 'none' } : {}}
            >
              {modal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        {modal.type === 'approve' ? (
          <div className="form-group">
            <label className="form-label">Issue Business License Number</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. LIC-2024-MFR-001"
              value={licenseInput}
              onChange={(e) => setLicenseInput(e.target.value)}
              autoFocus
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              This license will be recorded on the blockchain for the entity.
            </p>
          </div>
        ) : (
          <p>Are you sure you want to reject this registration request? This action cannot be undone.</p>
        )}
      </Modal>

      {isMobile && sidebarOpen && <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      <div style={{ ...styles.sidebar, left: sidebarOpen ? '0' : '-280px' }}>
        <div style={styles.sidebarBrand}>
          <span style={{ color: 'var(--accent-primary)' }}>MediTrace</span>
          <span style={styles.roleTag}>System Admin</span>
        </div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Network Overview" />
          <NavItem active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} Icon={Icons.Shield} label="Approval Queue" count={stats.pending} />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} Icon={Icons.Users} label="Entity Management" />
          <NavItem active={activeTab === 'batches'} onClick={() => setActiveTab('batches')} Icon={Icons.Medicine} label="Medicine Tracking" />
          <div style={styles.navDivider}>Global Records</div>
          <NavItem active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} Icon={Icons.Activity} label="Transaction Audit" />
        </nav>
        <div style={styles.sidebarFooter}>
           <button onClick={disconnectWallet} style={styles.logoutBtn}><Icons.LogOut /> <span>Disconnect</span></button>
        </div>
      </div>

      <div style={{ ...styles.main, marginLeft: isMobile ? '0' : '280px' }}>
        <header style={styles.header}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.iconBtn}><Icons.Menu /></button>}
              <h1 style={styles.headerTitle}>{activeTab.replace('-', ' ').toUpperCase()}</h1>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {actionMsg && <div style={styles.toast}>{actionMsg}</div>}
              <div style={styles.userProfile}>
                 <div style={styles.avatar}>AD</div>
                 {!isMobile && <span style={styles.userName}>Super Admin</span>}
              </div>
           </div>
        </header>

        <div style={styles.content} className="animate-fade-in">
           {loading ? (
              <div style={styles.loadingContainer}>⌛ Connecting to Blockchain...</div>
           ) : (
             <>
               {activeTab === 'overview' && (
                 <>
                   <div style={styles.statsGrid}>
                     <StatCard title="Manufacturers" value={stats.manufacturers} Icon={Icons.Overview} color="#10b981" />
                     <StatCard title="Distributors" value={stats.distributors} Icon={Icons.Overview} color="#3b82f6" />
                     <StatCard title="Suppliers" value={stats.suppliers} Icon={Icons.Overview} color="#8b5cf6" />
                     <StatCard title="Pharmacists" value={stats.pharmacists} Icon={Icons.Overview} color="#f59e0b" />
                   </div>
                   <div style={{...styles.statsGrid, marginTop: '1.5rem'}}>
                     <StatCard title="Total Batches" value={stats.batches} Icon={Icons.Medicine} color="#10b981" />
                     <StatCard title="Approval Queue" value={stats.pending} Icon={Icons.Shield} color="#ef4444" />
                     <StatCard title="Active Users" value={stats.active} Icon={Icons.Activity} color="#10b981" />
                   </div>
                 </>
               )}

               {activeTab === 'pending' && (
                 <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Pending Approvals</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Organization</th><th>Contact/Location</th><th>Role</th><th>Wallet</th><th>Action</th></tr></thead>
                        <tbody>
                          {allUsers.filter(u => u.status === 1).map(user => (
                            <tr key={user.address} style={styles.tableRow}>
                              <td style={{padding: '1rem'}}>
                                <div style={{fontWeight: 700}}>{user.name}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{user.email}</div>
                              </td>
                              <td>
                                <div style={{fontSize: '0.85rem'}}>{user.location}</div>
                              </td>
                              <td><span style={styles.roleBadge}>{roleNames[user.role]}</span></td>
                              <td style={{fontFamily: 'monospace', fontSize: '0.8rem'}}>{user.address.slice(0,10)}...</td>
                              <td style={{display: 'flex', gap: '0.5rem', padding: '1rem'}}>
                                <button className="btn btn-primary" style={{padding: '0.4rem 0.75rem', fontSize: '0.75rem'}} onClick={() => openApproveModal(user.address)}>Approve</button>
                                <button className="btn btn-outline" style={{padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fee2e2'}} onClick={() => openRejectModal(user.address)}>Reject</button>
                              </td>
                            </tr>
                          ))}
                          {allUsers.filter(u => u.status === 1).length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No pending users.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {activeTab === 'users' && (
                 <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Network User Directory</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Organization</th><th>Details</th><th>Role</th><th>Status</th></tr></thead>
                        <tbody>
                          {allUsers.map(user => (
                            <tr key={user.address} style={styles.tableRow}>
                              <td style={{padding: '1rem'}}>
                                <div style={{fontWeight: 700}}>{user.name}</div>
                                <div style={{fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)'}}>{user.address}</div>
                              </td>
                              <td>
                                <div style={{fontSize: '0.85rem'}}>{user.email}</div>
                                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{user.location}</div>
                              </td>
                              <td>{roleNames[user.role]}</td>
                              <td>
                                <span style={{...styles.badge, 
                                  background: user.status === 2 ? '#f0fdf4' : (user.status === 1 ? '#fff7ed' : '#fee2e2'),
                                  color: user.status === 2 ? '#10b981' : (user.status === 1 ? '#f59e0b' : '#ef4444')
                                }}>
                                  {user.status === 2 ? 'ACTIVE' : (user.status === 1 ? 'PENDING' : 'REJECTED')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {activeTab === 'batches' && (
                 <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Global Medicine Batches</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Batch #</th><th>Product Name</th><th>Manufacturer</th><th>Status</th></tr></thead>
                        <tbody>
                          {allBatches.map((b, idx) => (
                            <tr key={idx} style={styles.tableRow}>
                              <td style={{fontWeight: 700}}>{b.batchNumber}</td>
                              <td>{b.productName}</td>
                              <td>{b.manufacturer.slice(0,12)}...</td>
                              <td>
                                <span style={{...styles.badge, background: b.status === 2 ? '#fee2e2' : (b.status === 1 ? '#fff7ed' : '#f0fdf4'), color: b.status === 2 ? '#ef4444' : (b.status === 1 ? '#f59e0b' : '#10b981')}}>
                                  {b.status === 2 ? 'RECALLED' : (b.status === 1 ? 'EXPIRED' : 'ACTIVE')}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {allBatches.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No batches found.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {activeTab === 'audit' && (
                 <div className="glass-panel" style={{textAlign: 'center', padding: '4rem'}}>
                    <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📋</div>
                    <h3>Global Transaction Audit</h3>
                    <p style={{color: '#64748b'}}>Centralized tracking of all blockchain handoffs.</p>
                 </div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  );
}

const NavItem = ({ active, onClick, Icon, label, count }) => (
  <div onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}><Icon /><span style={{ marginLeft: '12px', flex: 1 }}>{label}</span>{count > 0 && <span style={styles.navCount}>{count}</span>}</div>
);

const StatCard = ({ title, value, Icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
    <div style={{ ...styles.statIconContainer, color: color, background: `${color}10` }}><Icon /></div>
    <div><div style={styles.statTitle}>{title}</div><div style={styles.statValue}>{value}</div></div>
  </div>
);

const styles = {
  dashboardWrapper: { display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'fixed', inset: 0, zIndex: 10 },
  sidebar: { position: 'fixed', top: 0, bottom: 0, width: '280px', background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 100, transition: 'left 0.3s ease' },
  sidebarOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 },
  sidebarBrand: { padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  roleTag: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' },
  nav: { flex: 1, padding: '0 1rem' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.875rem 1.25rem', borderRadius: '10px', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s ease', marginBottom: '4px' },
  navItemActive: { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  navCount: { background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 },
  navDivider: { padding: '1.5rem 1.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' },
  sidebarFooter: { padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { width: '100%', padding: '0.75rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.9rem' },
  main: { flex: 1, height: '100vh', overflowY: 'auto' },
  header: { height: '80px', background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  headerTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  toast: { background: '#f0fdf4', color: '#059669', padding: '0.5rem 1.25rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #d1fae5' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  userName: { color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' },
  content: { padding: '2.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' },
  statCard: { background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' },
  statIconContainer: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statTitle: { color: '#64748b', fontSize: '0.8rem', fontWeight: 500 },
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' },
  panelTitle: { fontSize: '1.25rem', color: '#0f172a', marginBottom: '2rem', marginTop: 0 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  badge: { padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 },
  roleBadge: { background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' }
};
