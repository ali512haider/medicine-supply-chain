import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import Modal from '../components/Modal';
import QRScanner from '../components/QRScanner';

// --- Professional Emerald SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  ),
  Medicine: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
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

  // Modal & Logic State
  const [modal, setModal] = useState({ isOpen: false, title: '', type: '', data: null });
  const [licenseInput, setLicenseInput] = useState('');

  // Data State
  const [stats, setStats] = useState({ manufacturers: 0, distributors: 0, suppliers: 0, pharmacists: 0, batches: 0, pending: 0, active: 0 });
  const [entities, setEntities] = useState([]);
  const [batches, setBatches] = useState([]);
  const [actionMsg, setActionMsg] = useState('');

  // Trace State
  const [traceBN, setTraceBN] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [traceHistory, setTraceHistory] = useState([]);
  const [traceError, setTraceError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
      const entityList = [];
      let m=0, d=0, s=0, p=0, pending=0, active=0;

      for (let addr of allAddrs) {
        const entity = await contracts.registry.getEntity(addr);
        const role = Number(entity.role);
        const status = Number(entity.status);

        entityList.push({ 
          address: addr, 
          name: entity.name,
          email: entity.email,
          location: entity.location,
          licenseNumber: entity.licenseNumber,
          role, 
          status 
        });

        if (status === 1) pending++;
        if (status === 2) {
          active++;
          if (role === 2) m++;
          if (role === 3) d++;
          if (role === 4) s++;
          if (role === 5) p++;
        }
      }
      setEntities(entityList);

      const bNos = await contracts.product.getAllBatchNumbers();
      setStats({ manufacturers: m, distributors: d, suppliers: s, pharmacists: p, batches: bNos.length, pending, active });

      const bList = [];
      for (let bn of bNos) {
        const b = await contracts.product.getBatch(bn);
        bList.push({ 
          batchNumber: bn, 
          productName: b.productName,
          manufacturer: b.manufacturer,
          expiryDate: Number(b.expiryDate)
        });
      }
      setBatches(bList.reverse());

    } catch (err) {
      console.error("Admin Sync Error:", err);
      setActionMsg('❌ Sync Error');
    } finally {
      setLoading(false);
    }
  }, [contracts.registry, contracts.product]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTrace = async (e, bn) => {
    if (e) e.preventDefault();
    const target = bn || traceBN;
    if (!target) return;
    try {
      setActionMsg('🔍 Tracing Journey...');
      setTraceError('');
      setTraceData(null);
      setTraceHistory([]);
      
      const data = await contracts.trace.verifyProduct(target);
      if (!data.batchFound) {
        setTraceError('❌ Batch Number not found in ledger.');
        return;
      }
      setTraceData(data);
      const history = await contracts.trace.getFullHistory(target);
      setTraceHistory(history);
      setActiveTab('trace');
      setTraceBN(target);
    } catch (err) {
      console.error(err);
      setTraceError('❌ Blockchain lookup failed.');
    } finally {
      setActionMsg('');
    }
  };

  const onScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    setTraceBN(decodedText.trim());
    handleTrace(null, decodedText.trim());
  };

  const openApproveModal = (entity) => {
    setLicenseInput('');
    setModal({ isOpen: true, title: `Approve ${entity.name}`, type: 'approve', data: entity });
  };

  const openRejectModal = (entity) => {
    setModal({ isOpen: true, title: `Reject ${entity.name}`, type: 'reject', data: entity });
  };

  const handleApprove = async () => {
    if (!licenseInput) return;
    try {
      const userAddr = modal.data.address;
      setActionMsg('⏳ Committing to Ledger...');
      setModal({ ...modal, isOpen: false });
      const tx = await contracts.registry.approveEntity(userAddr, licenseInput);
      await tx.wait();
      setActionMsg('✅ Approved!');
      fetchData();
    } catch (err) { setActionMsg('❌ Approval Failed'); }
  };

  const handleReject = async () => {
    try {
      const userAddr = modal.data.address;
      setActionMsg('⏳ Committing to Ledger...');
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

      <QRScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={onScanSuccess} 
        onScanError={() => {}} 
      />

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
          <NavItem active={activeTab === 'trace'} onClick={() => setActiveTab('trace')} Icon={Icons.Search} label="Trace Journey" />
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
                    <h3 style={styles.panelTitle}>Pending Approval Requests</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Entity</th><th>Role</th><th>Email</th><th>Location</th><th>Action</th></tr></thead>
                        <tbody>
                          {entities.filter(e => e.status === 1).map(e => (
                            <tr key={e.address} style={styles.tableRow}>
                              <td><div style={{fontWeight: 700}}>{e.name}</div><div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{e.address}</div></td>
                              <td><span style={styles.roleBadge}>{roleNames[e.role]}</span></td>
                              <td>{e.email}</td>
                              <td>{e.location}</td>
                              <td>
                                <div style={{display: 'flex', gap: '0.5rem'}}>
                                  <button onClick={() => openApproveModal(e)} className="btn btn-primary" style={{padding: '4px 12px', fontSize: '0.8rem'}}>Approve</button>
                                  <button onClick={() => openRejectModal(e)} className="btn btn-danger" style={{padding: '4px 12px', fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none'}}>Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {activeTab === 'users' && (
                  <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Registered Network Entities</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Name</th><th>Role</th><th>License</th><th>Status</th></tr></thead>
                        <tbody>
                          {entities.filter(e => e.status !== 1).map(e => (
                            <tr key={e.address} style={styles.tableRow}>
                              <td><div style={{fontWeight: 700}}>{e.name}</div><div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{e.address}</div></td>
                              <td>{roleNames[e.role]}</td>
                              <td>{e.licenseNumber || 'N/A'}</td>
                              <td>
                                <span style={{...styles.badge, background: e.status === 2 ? '#f0fdf4' : '#fee2e2', color: e.status === 2 ? '#10b981' : '#ef4444'}}>
                                  {e.status === 2 ? 'APPROVED' : 'REJECTED'}
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
                    <h3 style={styles.panelTitle}>Global Product Ledger</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Batch #</th><th>Product</th><th>Manufacturer</th><th>Expiry</th><th>Action</th></tr></thead>
                        <tbody>
                          {batches.map(b => (
                            <tr key={b.batchNumber} style={styles.tableRow}>
                              <td style={{fontWeight: 700}}>{b.batchNumber}</td>
                              <td>{b.productName}</td>
                              <td style={{fontSize: '0.8rem'}}>{b.manufacturer}</td>
                              <td>{new Date(Number(b.expiryDate)*1000).toLocaleDateString()}</td>
                              <td>
                                <button onClick={() => handleTrace(null, b.batchNumber)} className="btn btn-primary" style={{padding: '4px 12px', fontSize: '0.8rem'}}>Trace</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
               )}

               {activeTab === 'trace' && (
                 <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Blockchain Journey Tracer</h3>
                    <form onSubmit={handleTrace} style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter Batch Number to Trace..." 
                        value={traceBN}
                        onChange={(e) => setTraceBN(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="submit" className="btn btn-primary">Trace Batch</button>
                      <button type="button" onClick={() => setIsScannerOpen(true)} className="btn btn-outline" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#10b981', color: '#10b981'}}>
                        <Icons.Search /> Scan QR
                      </button>
                    </form>

                    {traceError && <div style={{ color: '#ef4444', background: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{traceError}</div>}

                    {traceData && (
                      <div style={styles.traceGrid}>
                        <div style={styles.traceInfoCard}>
                          <h4 style={styles.cardSubTitle}>Batch Specifications</h4>
                          <TraceItem label="Product" value={traceData.productName} />
                          <TraceItem label="Manufacturer" value={traceData.manufacturer} />
                          <TraceItem label="License" value={traceData.manufacturerLicense} />
                          <TraceItem label="Mfg Date" value={new Date(Number(traceData.mfgDate)*1000).toLocaleDateString()} />
                          <TraceItem label="Expiry Date" value={new Date(Number(traceData.expiryDate)*1000).toLocaleDateString()} />
                          <TraceItem label="Status" value={traceData.isActive ? 'ACTIVE' : 'INACTIVE'} color={traceData.isActive ? '#10b981' : '#ef4444'} />
                        </div>
                        <div style={styles.traceTimeline}>
                          <h4 style={styles.cardSubTitle}>Chain of Custody</h4>
                          {traceHistory.map((evt, idx) => (
                            <div key={idx} style={styles.tlItem}>
                              <div style={styles.tlMarker} />
                              <div style={styles.tlContent}>
                                <div style={styles.tlTime}>{new Date(Number(evt.timestamp)*1000).toLocaleString()}</div>
                                <div style={styles.tlAction}>{evt.action}</div>
                                <div style={styles.tlActor}>Actor: {evt.actor.slice(0,12)}...</div>
                                {evt.note && <div style={styles.tlNote}>{evt.note}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
               )}
             </>
           )}
        </div>
        <footer style={styles.dashboardFooter}>
          <p style={styles.footerText}>© 2026 MediTrace Blockchain. Developed at UET Taxila.</p>
          <p style={styles.footerStatus}>Network: <span style={{color: '#10b981', fontWeight: 700}}>Operational</span></p>
        </footer>
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

const TraceItem = ({ label, value, color }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '1rem', fontWeight: 600, color: color || '#0f172a' }}>{value}</div>
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
  main: { flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  header: { height: '80px', background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  headerTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  toast: { background: '#f0fdf4', color: '#059669', padding: '0.5rem 1.25rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #d1fae5' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  userName: { color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' },
  content: { padding: '2.5rem', flex: 1 },
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
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' },
  dashboardFooter: {
    padding: '1.5rem 2.5rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'white',
    marginTop: 'auto'
  },
  footerText: { margin: 0, color: '#94a3b8', fontSize: '0.8rem' },
  footerStatus: { margin: 0, color: '#64748b', fontSize: '0.8rem' },
  traceGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' },
  traceInfoCard: { background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' },
  cardSubTitle: { fontSize: '0.9rem', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '2px solid #10b981', display: 'inline-block' },
  traceTimeline: { paddingLeft: '1rem', borderLeft: '2px dashed #e2e8f0' },
  tlItem: { position: 'relative', paddingBottom: '2rem', paddingLeft: '1.5rem' },
  tlMarker: { position: 'absolute', left: '-25px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '3px solid white' },
  tlContent: { background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  tlTime: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' },
  tlAction: { fontSize: '1rem', fontWeight: 700, color: '#0f172a' },
  tlActor: { fontSize: '0.8rem', color: '#94a3b8' },
  tlNote: { fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem', fontStyle: 'italic' }
};
